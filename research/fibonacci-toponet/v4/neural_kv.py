"""Controlled learned associative memory vs recurrent baseline.

Input representation is typed: each (op,key,value), op=1 means WRITE,
op=2 means READ; this is not natural-language understanding. Both models get
exactly the same typed input and supervision. No symbolic-memory oracle here.
"""
from __future__ import annotations
import math
import torch
from torch import nn
from torch.nn import functional as F

class NeuralDeltaKV(nn.Module):
    def __init__(self,nkeys=12,nvalues=6,key_dim=16,value_dim=12):
        super().__init__()
        if nkeys>key_dim: raise ValueError('key_dim must cover nkeys for this controlled model')
        self.key=nn.Embedding(nkeys,key_dim)
        self.val=nn.Embedding(nvalues,value_dim)
        self.decode=nn.Linear(value_dim,nvalues)
        nn.init.orthogonal_(self.key.weight)
        nn.init.orthogonal_(self.val.weight)
        self.nkeys=nkeys;self.nvalues=nvalues;self.key_dim=key_dim;self.value_dim=value_dim

    def forward(self,ops:torch.Tensor):
        B,T,_=ops.shape
        M=self.key.weight.new_zeros(B,self.value_dim,self.key_dim)
        keys=F.normalize(self.key(ops[...,1]),dim=-1)
        vals=self.val(ops[...,2])
        output=[]
        for t in range(T):
            k=keys[:,t]
            pred=torch.bmm(M,k.unsqueeze(-1)).squeeze(-1)
            output.append(self.decode(pred))
            # Exact delta write on an isolated key; cross-key interference
            # proportional to key overlap, which is tracked in the audit.
            M_update=M+((vals[:,t]-pred).unsqueeze(-1)*k.unsqueeze(-2))
            M=torch.where(ops[:,t,0,None,None]==1,M_update,M)
        return torch.stack(output,dim=1)

    def orthogonality_error(self):
        K=F.normalize(self.key.weight,dim=-1)
        G=K@K.T
        return (G-torch.eye(self.nkeys,device=G.device)).square().mean()

class GRUKV(nn.Module):
    def __init__(self,nkeys=12,nvalues=6,d_model=48):
        super().__init__()
        self.op=nn.Embedding(3,d_model)
        self.key=nn.Embedding(nkeys,d_model)
        self.val=nn.Embedding(nvalues,d_model)
        self.gru=nn.GRU(d_model,d_model,batch_first=True)
        self.head=nn.Linear(d_model,nvalues)
    def forward(self,ops):
        x=self.op(ops[...,0])+self.key(ops[...,1])+self.val(ops[...,2])*(ops[...,0]==1)[...,None]
        y,_=self.gru(x)
        return self.head(y)

class CausalTransformerKV(nn.Module):
    """Small full-context causal Transformer comparator, NOT a production LLM."""
    def __init__(self,nkeys=12,nvalues=6,d_model=48,nheads=4,layers=2):
        super().__init__()
        self.op=nn.Embedding(3,d_model)
        self.key=nn.Embedding(nkeys,d_model)
        self.val=nn.Embedding(nvalues,d_model)
        layer=nn.TransformerEncoderLayer(d_model=d_model,nhead=nheads,
            dim_feedforward=96,batch_first=True,dropout=0.0,activation='gelu',norm_first=True)
        self.encoder=nn.TransformerEncoder(layer,num_layers=layers,enable_nested_tensor=False)
        self.norm=nn.LayerNorm(d_model)
        self.head=nn.Linear(d_model,nvalues)
        self.d_model=d_model
    def forward(self,ops):
        B,T,_=ops.shape
        x=self.op(ops[...,0])+self.key(ops[...,1])+self.val(ops[...,2])*(ops[...,0]==1)[...,None]
        position=torch.arange(T,device=x.device,dtype=x.dtype)[:,None]
        inv=torch.exp(torch.arange(0,self.d_model,2,device=x.device,dtype=x.dtype)*(-math.log(10000)/self.d_model))
        pe=torch.zeros((T,self.d_model),device=x.device,dtype=x.dtype)
        pe[:,0::2]=torch.sin(position*inv)
        pe[:,1::2]=torch.cos(position*inv)
        x=x+pe[None,:,:]
        mask=torch.triu(torch.ones(T,T,device=x.device,dtype=torch.bool),diagonal=1)
        y=self.encoder(x,mask=mask)
        return self.head(self.norm(y))