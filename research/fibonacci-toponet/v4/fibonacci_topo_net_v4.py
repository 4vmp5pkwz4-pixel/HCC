"""FibonacciTopoNet v4: a *hybrid* learned network with auditable algorithmic memory.

The algorithmic memory is intentionally NOT claimed to be a learned capability.
It has explicit finite-state semantics, provenance and abstention; the separate
neural fast-weight memory is differentiable but lossy when keys are nonorthogonal.
Research prototype, not a pretrained LLM and not SOTA on public benchmarks.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Hashable, Any, Literal
from collections import OrderedDict
import hashlib
import json
import math
import torch
from torch import nn

try:
    from fibonacci_topo_net_v3 import FibTopoNetV3, OrbitAveraging
except ImportError:
    from provenance_v3.fibonacci_topo_net_v3 import FibTopoNetV3, OrbitAveraging


class MemoryCapacityError(RuntimeError): pass

@dataclass(frozen=True)
class AuditEvent:
    epoch: int
    operation: str
    key: str
    value: str | None

@dataclass(frozen=True)
class Answer:
    status: Literal['known','unknown','cycle','budget','nonkey']
    value: Any | None
    confidence: float | None
    evidence: tuple[tuple[str,str,int], ...]
    steps: int

class VersionedAssociativeMemory:
    """Exact session memory, last-write-wins (NOT a trainable neural network).

    - zero silent eviction: optional capacity raises an explicit error.
    - deleted / absent keys return unknown; unknown is not confused with 0.
    - graph traversal is bounded and comes with exact read provenance.
    - keys must be int/str to guarantee typed, serializable evidence.
    - values may be int/str or None, but None is a valid stored value and
      distinguished from absence by membership.
    - no disk/network I/O, no state shared between sessions.
    """
    def __init__(self, capacity: int | None = None):
        if capacity is not None and capacity < 1: raise ValueError('capacity must be >=1')
        self.capacity=capacity
        self._data: OrderedDict[Hashable,tuple[Any,int]] = OrderedDict()
        self._events: list[AuditEvent] = []
        self.epoch=0

    @staticmethod
    def _key(k):
        if type(k) not in (int,str): raise TypeError('key must be exact int or str')
        return k

    def __len__(self): return len(self._data)

    def set(self,key,value):
        key=self._key(key)
        if key not in self._data and self.capacity is not None and len(self._data)>=self.capacity:
            raise MemoryCapacityError('memory full; no silent overwrite/eviction')
        self.epoch+=1
        self._data[key]=(value,self.epoch)
        self._events.append(AuditEvent(self.epoch,'set',str(key),repr(value)))

    def delete(self,key):
        key=self._key(key)
        self.epoch+=1
        existed=key in self._data
        self._data.pop(key,None)
        self._events.append(AuditEvent(self.epoch,'delete',str(key),None))
        return existed

    def get(self,key)->Answer:
        key=self._key(key)
        if key not in self._data:
            return Answer('unknown',None,None,(),1)
        value,version=self._data[key]
        return Answer('known',value,1.0,((str(key),repr(value),version),),1)

    def follow(self,key,hops:int,max_steps:int=64)->Answer:
        """Exactly `hops` directed edges; detect cycles only if re-entering before finish.

        If hops==0 no memory access, return initial key. Budget is a declared
        hard upper bound; do not silently supply partially followed answers.
        """
        self._key(key)
        if hops<0 or max_steps<0: raise ValueError('nonnegative hops/budget needed')
        if hops>max_steps: return Answer('budget',None,None,(),0)
        cur=key; seen={key}; trace=[]
        for j in range(hops):
            ans=self.get(cur)
            if ans.status!='known': return Answer('unknown',None,None,tuple(trace),j+1)
            trace.extend(ans.evidence)
            cur=ans.value
            if j+1<hops:
                if type(cur) not in (int,str): return Answer('nonkey',None,None,tuple(trace),j+1)
                if cur in seen: return Answer('cycle',None,None,tuple(trace),j+1)
                seen.add(cur)
        return Answer('known',cur,1.0,tuple(trace),hops)

    def check_evidence(self,answer:Answer)->bool:
        """Proof trace replay verifies version *and* value still present."""
        for k_str,v_repr,version in answer.evidence:
            hits=[(k,v,ver) for k,(v,ver) in self._data.items()
                  if str(k)==k_str and repr(v)==v_repr and ver==version]
            if len(hits)!=1: return False
        return True

    def digest(self)->str:
        records=[(type(k).__name__,str(k),repr(v),ver)
                 for k,(v,ver) in self._data.items()]
        records.sort()
        return hashlib.sha256(json.dumps(records,ensure_ascii=False).encode('utf-8')).hexdigest()

    def events(self): return tuple(self._events)

class DifferentiableDeltaMemory(nn.Module):
    """Low-rank associative fast weights: no implicit global semantic memory.

    Update for normalized k: M <- M + eta (v - Mk) k^T.
    At eta=1, the *just written* key is retrieved exactly in real arithmetic.
    For nonorthogonal keys, updating a key alters others; the overlap is
    bounded by |k_i^T k_j|*||delta||, and collisions remain possible.
    """
    def __init__(self,key_dim:int,value_dim:int,limit:float=32.0):
        super().__init__()
        if key_dim<1 or value_dim<1 or limit<=0: raise ValueError('invalid dims/bound')
        self.key_dim=key_dim;self.value_dim=value_dim;self.limit=float(limit)
        self.write_logit=nn.Parameter(torch.tensor(2.0))

    def start(self,batch:int,device=None,dtype=torch.float32):
        return torch.zeros(batch,self.value_dim,self.key_dim,device=device,dtype=dtype)

    def step(self,M,k,v,eta:torch.Tensor|float|None=None,clip=False):
        k=torch.nn.functional.normalize(k,dim=-1)
        if eta is None: eta=torch.sigmoid(self.write_logit)
        if not isinstance(eta,torch.Tensor): eta=torch.tensor(eta,dtype=M.dtype,device=M.device)
        if torch.any(eta<0) or torch.any(eta>1):raise ValueError('eta must be [0,1]')
        error=v-torch.einsum('bvk,bk->bv',M,k)
        while eta.ndim<error.ndim: eta=eta.unsqueeze(-1)
        new=M+torch.einsum('bv,bk->bvk',eta*error,k)
        if clip:
            norms=torch.linalg.matrix_norm(new,ord='fro',dim=(-2,-1)).clamp_min(1e-12)
            new=new*(self.limit/norms).clamp(max=1)[:,None,None]
        return new

    def read(self,M,k):
        k=torch.nn.functional.normalize(k,dim=-1)
        return torch.einsum('bvk,bk->bv',M,k)

    @staticmethod
    def identifiability(keys:torch.Tensor,tol:float=1e-6):
        """For m keys K (m,d), return rank, Gram eigenmin and condition number.
        A full-rank Gram (m<=d) is needed for arbitrary lossless linear
        association. Do not interpret this as a generalization guarantee.
        """
        if keys.ndim!=2: raise ValueError('keys must be 2D')
        s=torch.linalg.svdvals(keys.float())
        rank=int((s>tol*s[0]).sum()) if len(s)>0 and s[0]>0 else 0
        smallest=float(s[-1]) if len(s)>0 else 0.
        cond=(float(s[0]/s[-1]) if len(s)>0 and s[-1]>tol*s[0] else math.inf)
        return {'rank':rank,'rows':keys.shape[0],'dimension':keys.shape[1],
                'min_singular':smallest,'condition':cond,'certified_independent':rank==keys.shape[0]}

class FibonacciTopoNetV4(nn.Module):
    """Neural v3 encoder + differentiable associative memory.

    Structured `symbolic_session` provides *optional* exact retrieval. It is
    NOT trained and must not be benchmarked as an unaided neural capability.
    """
    def __init__(self,vocab_size=32,d_model=32,layers=1,heads=4,
                 scales=(1,2,3,5,8),num_classes=2,fast_key_dim=16):
        super().__init__()
        self.encoder=FibTopoNetV3(vocab_size=vocab_size,d_model=d_model,
            layers=layers,heads=heads,scales=scales,num_classes=num_classes,use_memory=True)
        self.key_proj=nn.Linear(d_model,fast_key_dim)
        self.value_proj=nn.Linear(d_model,d_model)
        self.fast=DifferentiableDeltaMemory(fast_key_dim,d_model)
        self.retrieve_gate=nn.Linear(d_model,d_model)
        self.read_head=nn.Linear(d_model,num_classes)

    def _encode_hidden(self,tokens:torch.Tensor,valid:torch.Tensor):
        """Recompute v3 hidden states (not logits) for optional neural retrieval.
        Uses the same causal components, explicitly preserving the token order.
        """
        B,T=tokens.shape
        x=self.encoder.embedding(tokens)
        x=x+self.encoder.pos_scale*self.encoder.positions(
            T,tokens.device,self.encoder.embedding.weight.dtype)[None,:,:]
        x=x*valid[...,None]
        for block in self.encoder.layers:
            x=x+block['attn'](block['ln_a'](x),valid)
            x=x+block['ff'](block['ln_f'](x))*valid[...,None]
        if self.encoder.use_memory:
            x=x+self.encoder.mem(x,valid)*valid[...,None]
        return self.encoder.final_norm(x)

    def forward(self,tokens:torch.Tensor,valid=None,return_tokens=False,
                write_mask:torch.Tensor|None=None):
        """Without a write mask, exactly the v3 path. With a mask, explicit
        fast-weight integration into logits. This mode requires training:
        random initialization is NOT a valid associative-recall result.
        """
        if write_mask is None:
            return self.encoder(tokens,valid,return_tokens=return_tokens)
        if tokens.ndim!=2 or tokens.shape[1]<1: raise ValueError('tokens (B,T) nonempty')
        if valid is None: valid=tokens.ne(0)
        B,T=tokens.shape
        lengths=valid.long().sum(1)
        if valid.shape!=tokens.shape or not torch.equal(
                valid,torch.arange(T,device=tokens.device)[None,:]<lengths[:,None]) or (lengths==0).any():
            raise ValueError('valid must be nonempty right padding')
        if write_mask.shape!=tokens.shape or (write_mask & ~valid).any():
            raise ValueError('write_mask must be valid token positions')
        hidden=self._encode_hidden(tokens,valid)
        mixed=self.neural_memory_scan(hidden,write_mask)
        logits=self.read_head(mixed)
        return logits if return_tokens else logits[torch.arange(B,device=tokens.device),lengths-1]

    def neural_memory_scan(self,features:torch.Tensor,write_mask:torch.Tensor,
                           read_mask:torch.Tensor|None=None):
        """Demo differentiable stream; features shape (B,T,D), key AND value
        projections from the same token. No symbolic routing or answer leak.
        """
        B,T,D=features.shape
        if write_mask.shape!=(B,T):raise ValueError('write mask shape')
        if read_mask is None:read_mask=~write_mask
        state=self.fast.start(B,features.device,features.dtype)
        outputs=[]
        for t in range(T):
            key=self.key_proj(features[:,t,:]); val=torch.tanh(self.value_proj(features[:,t,:]))
            read=self.fast.read(state,key)
            gate=torch.sigmoid(self.retrieve_gate(features[:,t,:]))
            outputs.append(gate*read+(1-gate)*features[:,t,:])
            updated=self.fast.step(state,key,val,clip=True)
            state=torch.where(write_mask[:,t,None,None],updated,state)
        return torch.stack(outputs,dim=1)

    @staticmethod
    def symbolic_session(capacity:int|None=None):
        return VersionedAssociativeMemory(capacity)