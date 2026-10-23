"""FibonacciTopoNet v3 — experimental causal multi-scale sequence network.

Design principles (not physical discoveries):
* Causal O(B*H*T*W*D) local attention, Fibonacci windows optional, valid padding.
* Explicit stable input-dependent diagonal memory and normalized Fibonacci mixing.
* Exact optional finite-group orbit averaging on logits for actual task symmetries.
* Differentiable robust covariance dispersion penalty (not persistent homology).
* A score/Fisher utility to audit nuisance-orthogonal observability.

This is a small PyTorch model; it is NOT an LLM trained on natural language.
"""
from __future__ import annotations
import math
from typing import Iterable
import torch
from torch import nn
from torch.nn import functional as F

PHI = (1. + math.sqrt(5.)) / 2.


def fibonacci_scales(n: int) -> tuple[int, ...]:
    if n < 1:
        raise ValueError('n >= 1 required')
    vals = [1, 2]
    while len(vals) < n:
        vals.append(vals[-1] + vals[-2])
    return tuple(vals[:n])


class CausalMultiScaleAttention(nn.Module):
    """Causal, banded attention with learnable scale mixture; no T x T matrices."""
    def __init__(self, d_model=32, heads=4, scales=(1, 2, 3, 5, 8), dropout=0.):
        super().__init__()
        if d_model % heads:
            raise ValueError('d_model not divisible by heads')
        self.scales = tuple(int(s) for s in scales)
        if not self.scales or any(s < 0 for s in self.scales):
            raise ValueError('invalid scales')
        self.d_model, self.heads, self.dk = d_model, heads, d_model // heads
        self.window = max(self.scales)
        self.qkv = nn.Linear(d_model, 3*d_model)
        self.proj = nn.Linear(d_model, d_model)
        self.bias = nn.Parameter(torch.zeros(heads, self.window+1))
        self.mix_logits = nn.Parameter(torch.zeros(len(self.scales)))
        self.dropout = nn.Dropout(dropout)

    def forward(self, x: torch.Tensor, valid: torch.Tensor | None = None) -> torch.Tensor:
        B,T,D = x.shape
        if valid is None:
            valid = torch.ones((B,T), dtype=torch.bool, device=x.device)
        if valid.shape != (B,T):
            raise ValueError('valid shape mismatch')
        W = self.window
        q,k,v = self.qkv(x).view(B,T,3,self.heads,self.dk).permute(2,0,3,1,4).unbind(0)
        kpad = F.pad(k, (0,0,W,0))
        vpad = F.pad(v, (0,0,W,0))
        kw = kpad.unfold(2,W+1,1).permute(0,1,2,4,3)
        vw = vpad.unfold(2,W+1,1).permute(0,1,2,4,3)
        scores = (q.unsqueeze(-2)*kw).sum(-1) / math.sqrt(self.dk)
        scores = scores + self.bias[None,:,None,:]
        # The final index is the current token, earlier indices are past positions.
        history_valid = F.pad(valid, (W,0), value=False).unfold(1,W+1,1)
        offsets = torch.arange(W,-1,-1,device=x.device)
        mixtures=[]
        for radius in self.scales:
            allowed = history_valid & (offsets[None,None,:] <= radius)
            # Padding queries are never used by the classifier; permit zero-vector output.
            logits = scores.masked_fill(~allowed[:,None,:,:], -1.e9)
            probs = torch.softmax(logits,dim=-1) * allowed[:,None,:,:]
            probs = probs / probs.sum(dim=-1,keepdim=True).clamp_min(1.e-12)
            mixtures.append((self.dropout(probs).unsqueeze(-1)*vw).sum(-2))
        mix = torch.softmax(self.mix_logits,dim=0)
        output = sum(mix[i]*y for i,y in enumerate(mixtures))
        y = self.proj(output.transpose(1,2).reshape(B,T,D))
        return y*valid.unsqueeze(-1)


class StableFibonacciMemory(nn.Module):
    """Selective stable recurrence (not Mamba or Titans itself).

    h_t = a_t*h_{t-1} + (1-a_t)*tanh(Ux_t + beta*Cphi*x_t).
    For fixed x, the Jacobian w.r.t h_{t-1} is diagonal with norm <= max(a_t)<1.
    Bound on ||h_t||_infinity <=1 given h_0=0. Complexity O(T*D^2).
    """
    def __init__(self,d_model=32,max_retention=.995):
        super().__init__()
        if d_model%2: raise ValueError('even d_model needed for Fibonacci blocks')
        if not (0<max_retention<1): raise ValueError('retention must be <1')
        self.d_model=d_model
        self.max_retention=max_retention
        c=torch.tensor([[1.,1.],[1.,0.]],dtype=torch.float32)/PHI
        self.register_buffer('companion',torch.kron(torch.eye(d_model//2),c))
        self.in_proj=nn.Linear(d_model,d_model)
        self.gate=nn.Linear(d_model,d_model)
        nn.init.constant_(self.gate.bias, 2.0)
        self.mix_strength=nn.Parameter(torch.tensor(.1))
        self.out=nn.Linear(d_model,d_model)

    def forward(self,x:torch.Tensor,valid:torch.Tensor|None=None)->torch.Tensor:
        B,T,D=x.shape
        if valid is None: valid=torch.ones(B,T,dtype=torch.bool,device=x.device)
        fib=F.linear(x,self.companion)
        u=torch.tanh(self.in_proj(x)+.2*torch.tanh(self.mix_strength)*fib)
        a=self.max_retention*torch.sigmoid(self.gate(x))
        h=torch.zeros(B,D,device=x.device,dtype=x.dtype)
        states=[]
        for j in range(T):
            upd=a[:,j]*h+(1-a[:,j])*u[:,j]
            h=torch.where(valid[:,j,None],upd,h)
            states.append(h)
        return self.out(torch.stack(states,dim=1))


class CovarianceConditioningPenalty(nn.Module):
    """Soft penalty on normalized centered-covariance dispersion; not PH/TDA."""
    def __init__(self,strength=1.e-4):
        super().__init__()
        self.strength=float(strength)

    def forward(self,x:torch.Tensor,valid:torch.Tensor|None=None)->torch.Tensor:
        D=x.shape[-1]
        if valid is not None:
            x=x[valid]
        else:
            x=x.reshape(-1,D)
        if x.shape[0]<2: return x.new_zeros(())
        c=x-x.mean(0,keepdim=True)
        cov=c.T@c/(x.shape[0]-1)
        eig=torch.linalg.eigvalsh(cov.float()).clamp_min(0.)
        norm=eig/eig.mean().clamp_min(1.e-8)
        return self.strength*(norm.sub(1).square().mean())


class FibTopoNetV3(nn.Module):
    """Causal sequence model. ``return_tokens`` exposes tokenwise causal predictions.

    ``use_memory=False`` gives a proof-based length ceiling for finite local attention:
    the last token cannot depend on input more than layers*max(scales) in the past.
    """
    def __init__(self,vocab_size=32,d_model=32,layers=1,heads=4,
                 scales=(1,2,3,5,8),num_classes=2,use_memory=True,
                 dropout=0.,spectral_strength=1.e-4):
        super().__init__()
        self.embedding=nn.Embedding(vocab_size,d_model,padding_idx=0)
        self.pos_scale=nn.Parameter(torch.tensor(1.))
        self.layers=nn.ModuleList([nn.ModuleDict({
            'ln_a':nn.LayerNorm(d_model),
            'attn':CausalMultiScaleAttention(d_model,heads,scales,dropout),
            'ln_f':nn.LayerNorm(d_model),
            'ff':nn.Sequential(nn.Linear(d_model,2*d_model),nn.SiLU(),nn.Linear(2*d_model,d_model))
        }) for _ in range(layers)])
        self.mem=StableFibonacciMemory(d_model)
        self.use_memory=bool(use_memory)
        self.final_norm=nn.LayerNorm(d_model)
        self.token_head=nn.Linear(d_model,num_classes)
        self.reg=CovarianceConditioningPenalty(spectral_strength)
        self.d_model=d_model
        self.max_window=max(scales)
        self.depth=layers

    def positions(self,T,device,dtype):
        j=torch.arange(T,device=device,dtype=dtype)[:,None]
        f=torch.exp(torch.arange(0,self.d_model,2,device=device,dtype=dtype)*(-math.log(10000)/self.d_model))
        pos=torch.empty((T,self.d_model),device=device,dtype=dtype)
        pos[:,0::2]=torch.sin(j*f)
        pos[:,1::2]=torch.cos(j*f)
        return pos

    def forward(self,tokens:torch.Tensor,valid:torch.Tensor|None=None,
                return_tokens=False,return_reg=False):
        if tokens.ndim!=2: raise ValueError('tokens shape must be (B,T)')
        B,T=tokens.shape
        if T<1: raise ValueError('empty sequence')
        if valid is None: valid=tokens.ne(0)
        if valid.dtype!=torch.bool or valid.shape!=tokens.shape: raise ValueError('invalid padding mask')
        lengths=valid.long().sum(1)
        if (lengths==0).any() or not torch.equal(valid,torch.arange(T,device=tokens.device)[None,:]<lengths[:,None]):
            raise ValueError('right-padding only, each sample nonempty')
        x=self.embedding(tokens)+self.pos_scale*self.positions(T,tokens.device,self.embedding.weight.dtype)[None,:,:]
        x=x*valid.unsqueeze(-1)
        penalty=x.new_zeros(())
        for block in self.layers:
            x=x+block['attn'](block['ln_a'](x),valid)
            x=x+block['ff'](block['ln_f'](x))*valid[...,None]
            if return_reg: penalty=penalty+self.reg(x,valid)
        if self.use_memory: x=x+self.mem(x,valid)*valid[...,None]
        x=self.final_norm(x)
        outputs=self.token_head(x)
        if return_tokens: logits=outputs
        else: logits=outputs[torch.arange(B,device=tokens.device),lengths-1]
        return (logits,penalty) if return_reg else logits


class OrbitAveraging(nn.Module):
    """Exact finite-group averaging of classification logits in eval mode.

    Only use if the target label is invariant to the specified transformations.
    'reversal' is Z2; 'cyclic' is the cyclic group Z_T on fully valid sequences.
    """
    def __init__(self,model:nn.Module,group='reversal'):
        super().__init__()
        if group not in ('reversal','cyclic'):
            raise ValueError('group must be reversal or cyclic')
        self.model,self.group=model,group

    def forward(self,tokens:torch.Tensor):
        if (tokens==0).any(): raise ValueError('orbit averaging requires unpadded sequences')
        if self.group=='reversal':
            return (self.model(tokens)+self.model(tokens.flip(1)))/2
        return torch.stack([self.model(tokens.roll(i,1)) for i in range(tokens.shape[1])]).mean(0)


def profiled_gaussian_fisher(C:torch.Tensor,D:torch.Tensor,nuisance:Iterable[torch.Tensor]):
    """Gaussian local nuisance-profiled Fisher: 1/2 min_a ||L^-1(D-sum aB)L^-T||_F^2.
    Returns tensor scalar differentiable in D & C (not intended for huge CMB matrices).
    """
    L=torch.linalg.cholesky(C)
    def whiten(X):
        y=torch.linalg.solve_triangular(L,X,upper=False)
        return torch.linalg.solve_triangular(L,y.mT,upper=False).mT
    dw=whiten(D).reshape(-1)
    ns=[whiten(b).reshape(-1) for b in nuisance]
    if ns:
        A=torch.stack(ns,1)
        coeff=torch.linalg.lstsq(A,dw).solution
        res=dw-A@coeff
    else: res=dw
    return .5*torch.dot(res,res)
