"""FibonacciTopoNet v5.1 -- auditable causal local attention, stable recurrence,
per-sequence differentiable associative memory and explicit symbolic memory.

Scientific status: small untrained neural research prototype. The cyclic projector
is an exact representation-theoretic *optional* operation for S^3 harmonic inputs,
not a learned cosmological model or a general-purpose token topology.
"""
from __future__ import annotations
from collections import OrderedDict
from dataclasses import dataclass
from typing import Any
import math
import torch
from torch import nn
from torch.nn import functional as F


def fibonacci_scales(n: int) -> list[int]:
    vals=[1,2]
    while len(vals)<n:
        vals.append(vals[-1]+vals[-2])
    return vals[:max(0,n)]


class CausalLocalAttention(nn.Module):
    """O(B*H*T*W*D) attention without materializing a T by T score matrix."""
    def __init__(self,d_model: int,n_heads:int=4,scales=(1,2,3,5),dropout=0.):
        super().__init__()
        if d_model % n_heads: raise ValueError('d_model must be divisible by n_heads')
        self.heads=n_heads
        self.dim=d_model//n_heads
        self.scales=tuple(int(w) for w in scales)
        if not self.scales or min(self.scales)<1: raise ValueError('invalid windows')
        self.qkv=nn.Linear(d_model,3*d_model)
        self.proj=nn.Linear(d_model,d_model)
        self.scale_logits=nn.Parameter(torch.zeros(len(self.scales)))
        self.dropout=nn.Dropout(dropout)

    def forward(self,x:torch.Tensor,valid:torch.Tensor|None=None)->torch.Tensor:
        b,t,d=x.shape
        q,k,v=self.qkv(x).reshape(b,t,3,self.heads,self.dim).permute(2,0,3,1,4)
        if valid is None: valid=torch.ones(b,t,device=x.device,dtype=torch.bool)
        out=0.
        for scale,weight in zip(self.scales,self.scale_logits.softmax(0)):
            width=min(scale,t-1)+1
            # Window order: oldest -> current, strictly causal.
            time=torch.arange(t,device=x.device)[:,None]
            index=time-torch.arange(width-1,-1,-1,device=x.device)[None,:]
            mask=(index>=0)[None,None,:,:] & valid[:,None,index.clamp(min=0)]
            key=k[:,:,index.clamp(min=0),:]
            val=v[:,:,index.clamp(min=0),:]
            scores=(q.unsqueeze(-2)*key).sum(-1)/math.sqrt(self.dim)
            scores=scores.masked_fill(~mask,-1e9)
            attn=self.dropout(scores.softmax(-1))
            component=(attn.unsqueeze(-1)*val).sum(-2)
            out=out+weight*component
        out=self.proj(out.transpose(1,2).reshape(b,t,d))
        return out*valid[:,:,None].to(out.dtype)


class ContractivePhiMemory(nn.Module):
    """Fibonacci companion blocks with rigorously bounded operator norm.

    ||C_phi||_2=1, so ||W||_2 <= 0.85 + 0.08 = 0.93,
    using a spectrally normalized trainable residual. The gate/candidate update
    also keeps hidden coordinates within [-1,1] when starting at zero.
    """
    def __init__(self,d_model:int):
        super().__init__()
        if d_model%2: raise ValueError('d_model must be even')
        phi=(1+math.sqrt(5))/2
        block=torch.tensor([[1.,1.],[1.,0.]])/phi
        self.register_buffer('base',torch.block_diag(*([block]*(d_model//2))))
        self.residual=nn.Parameter(torch.zeros(d_model,d_model))
        self.input_proj=nn.Linear(d_model,d_model)
        self.gate_proj=nn.Linear(d_model,d_model)

    def weight_matrix(self):
        r=self.residual
        return 0.85*self.base+0.08*r/(1+torch.linalg.matrix_norm(r,ord=2))

    def forward(self,x:torch.Tensor,valid:torch.Tensor|None=None):
        b,t,d=x.shape
        h=x.new_zeros(b,d)
        W=self.weight_matrix()
        states=[]
        if valid is None:valid=torch.ones(b,t,device=x.device,dtype=torch.bool)
        for i in range(t):
            gate=torch.sigmoid(self.gate_proj(x[:,i]))
            cand=torch.tanh(F.linear(h,W)+self.input_proj(x[:,i]))
            next_h=gate*h+(1-gate)*cand
            h=torch.where(valid[:,i,None],next_h,h)
            states.append(h)
        return torch.stack(states,dim=1)


class CovarianceDiversityPenalty(nn.Module):
    """Avoid rank-one collapse using the spectrum of *centered* activations."""
    def __init__(self,strength=1e-3):
        super().__init__()
        self.strength=strength
    def forward(self,x:torch.Tensor,valid:torch.Tensor|None=None):
        flat=x.reshape(-1,x.shape[-1])
        if valid is not None:flat=flat[valid.reshape(-1)]
        if flat.shape[0]<2:return flat.new_tensor(0.)
        z=flat-flat.mean(0,keepdim=True)
        gram=z.T@z/(z.shape[0]-1)
        tr=gram.diagonal().sum()
        if tr.detach().item()<1e-12:return tr.new_tensor(self.strength)
        # trace(C^2)/trace(C)^2 is the inverse effective rank.
        participation=(gram.square().sum())/(tr.square()+1e-20)
        best=1/min(z.shape[-1],z.shape[0]-1)
        return self.strength*(participation-best).clamp_min(0)


class FunctionalDeltaMemory(nn.Module):
    """Fast weights are BxDxD state, not global model parameters or .data writes."""
    def __init__(self,dim:int):
        super().__init__()
        self.key=nn.Linear(dim,dim)
        self.value=nn.Linear(dim,dim)
        self.query=nn.Linear(dim,dim)
        self.beta=nn.Linear(dim,1)
        self.gain=nn.Parameter(torch.tensor(-1.))

    @staticmethod
    def update(W,k,v,beta):
        k=F.normalize(k,dim=-1,eps=1e-8)
        old=torch.bmm(W,k[...,None]).squeeze(-1)
        return W+beta[...,None]*(v-old)[...,None]*k[:,None,:]

    @staticmethod
    def read(W,q):
        return torch.bmm(W,F.normalize(q,dim=-1,eps=1e-8)[...,None]).squeeze(-1)

    def forward(self,x:torch.Tensor,valid:torch.Tensor|None=None):
        b,t,d=x.shape
        if valid is None:valid=torch.ones(b,t,dtype=torch.bool,device=x.device)
        W=x.new_zeros(b,d,d)
        for i in range(t):
            cur=x[:,i]
            k=self.key(cur); v=torch.tanh(self.value(cur))
            beta=torch.sigmoid(self.beta(cur))
            Wnext=self.update(W,k,v,beta)
            W=torch.where(valid[:,i,None,None],Wnext,W)
        q=self.query(x[:,-1]);out=self.read(W,q)
        return torch.tanh(self.gain)*out


@dataclass(frozen=True)
class MemoryAnswer:
    status:str
    value:Any
    version:int
    evidence:tuple[str,...]


@dataclass(frozen=True)
class MemoryLink:
    """Explicit reference to another key; plain strings are literal values."""
    target:str


class VersionedExactMemory:
    """Explicit deterministic, per-session last-write-wins store; not neural learning."""
    def __init__(self,capacity:int|None=None):
        self.capacity=capacity
        self.data=OrderedDict()
        self.version=0
        self.events=[]

    def write(self,key:str,value:Any):
        if not isinstance(key,str):raise TypeError('keys must be strings')
        if key not in self.data and self.capacity is not None and len(self.data)>=self.capacity:
            raise MemoryError('memory capacity exceeded; no silent eviction')
        self.version+=1
        self.data[key]=(value,self.version)
        self.data.move_to_end(key)
        self.events.append((self.version,'write',key))

    def delete(self,key:str):
        self.version+=1
        self.data.pop(key,None)
        self.events.append((self.version,'delete',key))

    def read(self,key:str)->MemoryAnswer:
        entry=self.data.get(key)
        if entry is None:return MemoryAnswer('unknown',None,self.version,())
        return MemoryAnswer('known',entry[0],entry[1],(f'{key}@{entry[1]}',))

    def follow(self,key:str,max_hops:int=128)->MemoryAnswer:
        seen=set();evidence=[];cur=key
        for _ in range(max_hops+1):
            if cur in seen:return MemoryAnswer('cycle',None,self.version,tuple(evidence))
            seen.add(cur)
            a=self.read(cur)
            if a.status!='known':return MemoryAnswer('unknown',None,self.version,tuple(evidence))
            evidence.extend(a.evidence)
            if not isinstance(a.value,MemoryLink):
                return MemoryAnswer('known',a.value,a.version,tuple(evidence))
            cur=a.value.target
        return MemoryAnswer('budget',None,self.version,tuple(evidence))


class CyclicS3Projector(nn.Module):
    """Selection for scalar degree-n harmonic coefficients in SU(2)_L weight basis.

    Basis order: w_L=-n,-n+2,...,n, each with (n+1) right copies.
    The quotient left action and phase convention must match the data basis.
    For an arbitrary text embedding this operator is not physically meaningful.
    """
    def __init__(self,n:int,p:int,character:int=0):
        super().__init__()
        if n<0 or p<2:raise ValueError('n>=0 and p>=2')
        self.n=n;self.p=p;self.character=character%p
        weights=torch.arange(-n,n+1,2).repeat_interleave(n+1)
        self.register_buffer('weights',weights)
        self.register_buffer('mask',((weights-character)%p==0))

    def forward(self,coeff:torch.Tensor):
        if coeff.shape[-1]!=(self.n+1)**2:raise ValueError('wrong S3 harmonic dimension')
        return coeff*self.mask.to(coeff.dtype)

    def group_average(self,coeff:torch.Tensor):
        complex_coeff=coeff.to(torch.complex128)
        phase=self.weights.to(torch.float64)
        avg=0.
        for k in range(self.p):
            angle=2*math.pi*k*(phase-self.character)/self.p
            avg=avg+complex_coeff*torch.polar(torch.ones_like(angle),angle)
        return avg/self.p


class FibonacciTopoNetV5_1(nn.Module):
    def __init__(self,vocab_size:int=128,d_model:int=48,n_layers:int=2,
                 n_heads:int=4,max_scales:int=4,num_classes:int=2,dropout:float=0.):
        super().__init__()
        if not d_model%2==0:raise ValueError('d_model must be even')
        self.embed=nn.Embedding(vocab_size,d_model)
        self.register_buffer('inv_freq',1/torch.pow(10000.,torch.arange(0,d_model,2).float()/d_model))
        self.layers=nn.ModuleList([nn.ModuleDict({
            'attn':CausalLocalAttention(d_model,n_heads,fibonacci_scales(max_scales),dropout),
            'norm1':nn.LayerNorm(d_model),
            'norm2':nn.LayerNorm(d_model),
            'ff':nn.Sequential(nn.Linear(d_model,2*d_model),nn.GELU(),nn.Linear(2*d_model,d_model))
        }) for _ in range(n_layers)])
        self.recurrent=ContractivePhiMemory(d_model)
        self.association=FunctionalDeltaMemory(d_model)
        self.association_gate=nn.Parameter(torch.tensor(-2.))
        self.classifier=nn.Linear(d_model,num_classes)
        self.reg=CovarianceDiversityPenalty()

    def positional(self,t:int,dtype,device):
        phases=torch.arange(t,device=device).float()[:,None]*self.inv_freq[None,:]
        out=torch.stack([phases.sin(),phases.cos()],dim=-1).reshape(t,-1)
        return out.to(dtype)

    def encode(self,tokens:torch.Tensor,valid:torch.Tensor|None=None):
        if valid is None:valid=torch.ones_like(tokens,dtype=torch.bool)
        x=self.embed(tokens)
        x=x+self.positional(tokens.shape[1],x.dtype,x.device)
        x=x*valid[...,None]
        for layer in self.layers:
            x=(x+layer['attn'](layer['norm1'](x),valid))*valid[...,None]
            x=(x+layer['ff'](layer['norm2'](x)))*valid[...,None]
        return x

    def forward(self,tokens:torch.Tensor,valid:torch.Tensor|None=None,return_aux=False):
        if valid is None:valid=torch.ones_like(tokens,dtype=torch.bool)
        if not valid[:,-1].all():raise ValueError('right padding not supported for final query; trim to last real token')
        x=self.encode(tokens,valid)
        series=self.recurrent(x,valid)
        summary=series[:,-1]
        mem=self.association(x,valid)
        logits=self.classifier(summary+torch.sigmoid(self.association_gate)*mem)
        if return_aux:return logits,{'regularizer':self.reg(x,valid),'final_state':summary.detach()}
        return logits


def create_exact_session(capacity:int|None=None)->VersionedExactMemory:
    return VersionedExactMemory(capacity)
