#!/usr/bin/env python3
"""Deterministic structural verification, not proof of general AI performance."""
import json, math, torch
from torch.nn import functional as F
from fibonacci_topo_net_v5_1 import *

torch.set_num_threads(2)
torch.manual_seed(20261016)
checks={}
def check(label,cond):
    checks[label]=checks.get(label,0)+1
    if not bool(cond):raise AssertionError(f'{label}: case {checks[label]}')

# Fibonacci windows
check('fib_windows',fibonacci_scales(6)==[1,2,3,5,8,13])
# Causal sparse attention versus explicit dense score-and-mask reference
for d in (8,16):
 for scale in (1,2,4):
  for t in (2,3,6,11):
   att=CausalLocalAttention(d,n_heads=2,scales=(scale,),dropout=0).eval()
   x=torch.randn(3,t,d)
   valid=torch.ones(3,t,dtype=torch.bool)
   valid[0,0]=False
   with torch.no_grad():
    got=att(x,valid)
    qkv=att.qkv(x).reshape(3,t,3,2,d//2).permute(2,0,3,1,4)
    q,k,v=qkv
    scores=(q@k.transpose(-2,-1))/math.sqrt(d//2)
    ids=torch.arange(t)
    M=(ids[None,:]<=ids[:,None]) & ((ids[:,None]-ids[None,:])<=scale)
    M=M[None,None,:,:]&valid[:,None,None,:]
    scores=scores.masked_fill(~M,-1e9)
    direct=(scores.softmax(-1)@v).transpose(1,2).reshape(3,t,d)
    direct=att.proj(direct)*valid[...,None]
    check('dense_sparse_equivalence',(direct-got).abs().max()<2e-6)

for _ in range(14):
 m=FibonacciTopoNetV5_1(vocab_size=32,d_model=16,n_layers=1,n_heads=4).eval()
 tok=torch.randint(0,32,(2,16))
 change=tok.clone();change[:,9:]=torch.randint(0,32,(2,7))
 with torch.no_grad():
  a=m.encode(tok)[:,:9]
  b=m.encode(change)[:,:9]
  check('causal_no_future',(a-b).abs().max()<1e-6)
  padding=torch.ones(2,16,dtype=torch.bool);padding[1,1]=False
  ap=m.encode(tok,padding)
  changed=tok.clone();changed[1,1]=int(tok[1,1].item()+1)%32
  bp=m.encode(changed,padding)
  check('padding_independence',(ap-bp).abs().max()<1e-6)
  check('position_sensitive',(m(tok)-m(tok.flip(1))).abs().max()>1e-5)

# True operator bound and coordinate stability
for d in (8,16,32):
 s=ContractivePhiMemory(d)
 for _ in range(15):
  with torch.no_grad():s.residual.normal_(0,0.4)
  w=s.weight_matrix()
  check('contractive_opnorm',torch.linalg.matrix_norm(w,ord=2)<.931)
  h=s(torch.randn(2,12,d))
  check('bounded_recurrence',h.abs().max()<=1.000001)

reg=CovarianceDiversityPenalty(strength=1.)
ortho=torch.cat((torch.eye(3),-torch.eye(3)),dim=0)
collapsed=torch.cat((math.sqrt(3)*torch.ones(3,1),-math.sqrt(3)*torch.ones(3,1)),dim=0)
collapsed=torch.cat((collapsed,torch.zeros(6,2)),dim=1)
check('detect_rank_collapse',reg(collapsed)>reg(ortho)+0.3)
for d in (5,11):
 z=torch.randn(32,d)
 check('spectral_no_negative',reg(z).item()>=0)
 check('spectral_center_shift',abs(reg(z)-reg(z+100))<2e-5)

mem=VersionedExactMemory(capacity=4)
check('exact_unknown',mem.read('A').status=='unknown')
mem.write('A',7);mem.write('A',8)
check('last_write_wins',mem.read('A').value==8)
mem.write('B',MemoryLink('A'))
check('multihop_trace',mem.follow('B').value==8 and len(mem.follow('B').evidence)==2)
mem.write('A',MemoryLink('B'))
check('cycle_abstention',mem.follow('B').status=='cycle')
mem.delete('A');check('delete_unknown',mem.follow('B').status=='unknown')
mem.write('C',1);mem.write('D',2)
mem.write('E',3)
try:mem.write('F',4);raise AssertionError('missing capacity error')
except MemoryError:check('explicit_capacity_error',True)

# Per-example fully differentiable delta state; distinct batch slots cannot leak
fm=FunctionalDeltaMemory(4)
W=torch.zeros(2,4,4)
keys=torch.tensor([[1.,0,0,0],[0,1,0,0]])
values=torch.tensor([[3.,0,0,0],[0,4,0,0]])
w=fm.update(W,keys,values,torch.ones(2,1))
check('delta_exact_orthogonal',(fm.read(w,keys)-values).abs().max()<1e-6)
check('delta_batch_isolation',fm.read(w,keys.flip(0)).abs().max()<1e-6)
w2=fm.update(w,keys,values+1,torch.ones(2,1))
check('delta_overwrite',(fm.read(w2,keys)-(values+1)).abs().max()<1e-6)
net=FibonacciTopoNetV5_1(vocab_size=32,d_model=16,n_layers=1,n_heads=4)
y,aux=net(torch.randint(0,32,(3,12)),return_aux=True)
(y.square().mean()+aux['regularizer']).backward()
check('fast_memory_gradient',net.association.key.weight.grad.abs().sum()>0)
check('attention_gradient',net.layers[0]['attn'].qkv.weight.grad.abs().sum()>0)

# Genuine S3 cyclic character selection, not a generic token embedding mask
for p in range(2,14):
 for n in range(0,13):
  y=torch.randn(3,(n+1)**2,dtype=torch.complex128)
  partial=torch.zeros_like(y)
  for a in range(p):
   op=CyclicS3Projector(n,p,a)
   got=op(y)
   check('projector_idempotence',(op(got)-got).abs().max()<1e-12)
   check('group_average_equivalence',(op.group_average(y)-got).abs().max()<2e-13)
   partial+=got
  check('character_resolution',(partial-y).abs().max()<1e-12)
  op=CyclicS3Projector(n,p)
  expected=int(sum((w%p)==0 for w in range(-n,n+1,2))*(n+1))
  check('S3_rank',int(op.mask.sum())==expected)

report={'total_checks':sum(checks.values()),'failures':0,'categories':checks,
        'limitations':'finite numerical tests only, not Lean proofs or generalization evaluation'}
print(json.dumps(report,indent=2,ensure_ascii=False))
with open('VERIFICATION_REPORT.json','w') as f:json.dump(report,f,indent=2)
