#!/usr/bin/env python3
"""Deterministic unit/property/regression tests for experimental v4."""
import json,math,sys,random
from pathlib import Path
import numpy as np
import torch
from fibonacci_topo_net_v4 import (VersionedAssociativeMemory,MemoryCapacityError,
    DifferentiableDeltaMemory,FibonacciTopoNetV4)
ROOT=Path(__file__).resolve().parent
random.seed(20261016);np.random.seed(20261016);torch.manual_seed(20261016);torch.set_num_threads(1)
checks={}
def ok(name,cond):
    checks[name]=checks.get(name,0)+1
    if not bool(cond):raise AssertionError(f'FAIL {name} #{checks[name]}')

m=VersionedAssociativeMemory()
ok('unknown abstain',m.get(1).status=='unknown' and m.get(1).confidence is None)
m.set(1,2);a=m.get(1)
ok('versioned evidence',a.value==2 and m.check_evidence(a))
m.set(1,3)
ok('overwrite invalidates old trace',m.get(1).value==3 and not m.check_evidence(a))
m.delete(1)
ok('delete abstain',m.get(1).status=='unknown' and len(m)==0)
m.set(1,None)
ok('stored None distinct from missing',m.get(1).status=='known' and m.get(1).value is None)
c=VersionedAssociativeMemory(capacity=1);c.set(1,2)
try:c.set(3,4);ok('capacity raised',False)
except MemoryCapacityError:ok('capacity raised',c.get(1).value==2 and c.epoch==1)
try:c.get(1.0);ok('typed key enforcement',False)
except TypeError:ok('typed key enforcement',True)

# Random writes/deletes/queries, compared with a separate simple dict oracle.
for seed in range(32):
    rg=random.Random(seed+819);m=VersionedAssociativeMemory();oracle={}
    for t in range(300):
        k=rg.randrange(72)
        cmd=rg.randrange(5)
        if cmd<3:
            v=rg.randrange(100000);m.set(k,v);oracle[k]=v
        elif cmd==3:
            m.delete(k);oracle.pop(k,None)
        else:
            a=m.get(k)
            ok('random live oracle', (a.status=='known')==(k in oracle))
            if k in oracle:ok('random value oracle',a.value==oracle[k] and m.check_evidence(a))
    ok('random complete dictionary',len(m)==len(oracle))

# Graph traversal and forced abstentions.
for hops in (1,2,4,8,16,32):
    m=VersionedAssociativeMemory()
    for i in range(hops):m.set(i,i+1)
    a=m.follow(0,hops,max_steps=32)
    ok('multihop correctness',a.status=='known' and a.value==hops and len(a.evidence)==hops and m.check_evidence(a))
    if hops>1:
        m.set(0,-999)
        a2=m.follow(0,hops,max_steps=32)
        ok('updated link propagates',a2.status=='unknown' and a2.value is None)
    if hops>4:
        m=VersionedAssociativeMemory()
        for i in range(hops):m.set(i,i+1)
        m.set(3,1)
        ok('cycle abstention',m.follow(0,hops,max_steps=32).status=='cycle')
    ok('budget abstention',m.follow(0,hops,max_steps=hops-1).status=='budget')

# Fast weight delta-rule properties and interference.
mem=DifferentiableDeltaMemory(8,5)
M=mem.start(4)
K=torch.eye(8)[:4]
V=torch.eye(5)[:4]
for i in range(4):M=mem.step(M,K[i].expand(4,-1),V[i].expand(4,-1),eta=1)
for i in range(4):ok('orthogonal exact associative recall',torch.allclose(mem.read(M,K[i].expand(4,-1)),V[i].expand(4,-1),atol=1e-6))
M=mem.step(M,K[0].expand(4,-1),torch.ones(4,5),eta=1)
ok('orthogonal overwrite',torch.allclose(mem.read(M,K[0].expand(4,-1)),torch.ones(4,5),atol=1e-6))
ok('other orthogonal keys unchanged',torch.allclose(mem.read(M,K[1].expand(4,-1)),V[1].expand(4,-1),atol=1e-6))

k1=torch.tensor([[1.,0.]]);k2=torch.tensor([[1.,1.]])/math.sqrt(2)
mem2=DifferentiableDeltaMemory(2,1)
M=mem2.start(1)
M=mem2.step(M,k1,torch.tensor([[1.]]),eta=1)
M=mem2.step(M,k2,torch.tensor([[0.]]),eta=1)
ok('nonorthogonal interference detected',abs(mem2.read(M,k1).item()-1)>0.1)
for n in (2,4,8):
    ok('rank certificate orthogonal',DifferentiableDeltaMemory.identifiability(torch.eye(n))['certified_independent'])
    ok('rank certificate collision',not DifferentiableDeltaMemory.identifiability(torch.ones(n,2))['certified_independent'])

# Pure neural branch inherits v3 causal semantics and gradients.
net=FibonacciTopoNetV4(vocab_size=60,d_model=24,layers=1,heads=4,num_classes=6,fast_key_dim=8)
net.eval()
x=torch.randint(1,59,(2,25));y=x.clone();y[:,16:]=torch.randint(1,59,(2,9))
with torch.no_grad():
    a=net(x,return_tokens=True)
    b=net(y,return_tokens=True)
ok('v4 neural causal prefix',torch.allclose(a[:,:16],b[:,:16],atol=2e-6))
features=torch.randn(2,13,24,requires_grad=True)
mask=torch.zeros(2,13,dtype=torch.bool);mask[:,::3]=True
out=net.neural_memory_scan(features,mask)
loss=out.square().mean();loss.backward()
ok('differentiable fast weight branch',torch.isfinite(features.grad).all() and features.grad.abs().sum()>0)

# Forward integration of neural fast weights (not just a standalone utility).
wm=torch.zeros_like(x,dtype=torch.bool);wm[:,::4]=True
with torch.no_grad():
    fused_a=net(x,write_mask=wm,return_tokens=True)
    fused_b=net(y,write_mask=wm,return_tokens=True)
ok('fused v4 causal prefix',torch.allclose(fused_a[:,:16],fused_b[:,:16],atol=2e-6))
ok('fused read head shape',(fused_a.shape==(2,25,6)))

# Additional future causality in associative memory branch.
f2=features.detach().clone();f2[:,9:]+=10
with torch.no_grad():
    o1=net.neural_memory_scan(features.detach(),mask)
    o2=net.neural_memory_scan(f2,mask)
ok('fast weight future nonleak',torch.allclose(o1[:,:9],o2[:,:9],atol=1e-5))

report={'checks':sum(checks.values()),'categories':checks,'failures':0,'seed':20261016,'framework':torch.__version__,'scope':'finite property/regression checks, not proof of general intelligence'}
(ROOT/'VERIFICATION_V4.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
