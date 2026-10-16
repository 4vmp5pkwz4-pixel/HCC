#!/usr/bin/env python3
"""Deterministic numerical unit and property tests; NOT a formal proof.

Compares banded attention against an independent dense attention implementation,
checks causal prefix, padding invariance, group-average invariance, spectral
memory stability, nuisance-profiled Fisher, gradient continuity.
"""
import json,math,sys
from pathlib import Path
import torch
import torch.nn.functional as F
from fibonacci_topo_net_v3 import (
 CausalMultiScaleAttention, StableFibonacciMemory, FibTopoNetV3,
 OrbitAveraging, CovarianceConditioningPenalty, profiled_gaussian_fisher,PHI)

torch.set_num_threads(1)
torch.manual_seed(20261016)
counts={};issues=[]
def check(label,ok,info=''):
 counts[label]=counts.get(label,0)+1
 if not bool(ok): issues.append([label,info])

for rep in range(30):
 T=4+rep%7;B=1+rep%3;D=8
 layer=CausalMultiScaleAttention(D,heads=2,scales=(0,1,3,5))
 x=torch.randn(B,T,D)
 lengths=torch.randint(1,T+1,(B,)); valid=torch.arange(T)[None,:]<lengths[:,None]
 with torch.no_grad():
  a=layer(x,valid)
  q,k,v=layer.qkv(x).view(B,T,3,layer.heads,layer.dk).permute(2,0,3,1,4).unbind(0)
  outputs=[]
  for radius in layer.scales:
   out=torch.zeros_like(q)
   for t in range(T):
    for b in range(B):
     if not valid[b,t]:continue
     kk=[];vv=[];bb=[]
     for s in range(max(0,t-radius),t+1):
      if valid[b,s]:
       kk.append(k[b,:,s]);vv.append(v[b,:,s]);bb.append(layer.bias[:,layer.window-(t-s)])
     kk=torch.stack(kk,dim=1);vv=torch.stack(vv,dim=1);bb=torch.stack(bb,dim=1)
     score=(q[b,:,t,None,:]*kk).sum(-1)/math.sqrt(layer.dk)+bb
     p=score.softmax(-1)
     out[b,:,t]=(p[:,:,None]*vv).sum(1)
   outputs.append(out)
  mix=layer.mix_logits.softmax(0)
  dense=sum(mix[i]*out for i,out in enumerate(outputs))
  dense=layer.proj(dense.transpose(1,2).reshape(B,T,D))*valid[...,None]
  check('attention_matches_independent_dense',torch.allclose(a,dense,atol=2e-6,rtol=2e-6),f'{rep} {(a-dense).abs().max().item()}')

for rep in range(40):
 T=10+rep%8
 m=FibTopoNetV3(vocab_size=40,d_model=16,layers=2,heads=4,scales=(1,2,3),use_memory=bool(rep%2),dropout=0)
 m.eval()
 x=torch.randint(1,40,(2,T))
 x2=x.clone();x2[:,T//2:]=torch.randint(1,40,(2,T-T//2))
 with torch.no_grad():
  z=m(x,return_tokens=True);z2=m(x2,return_tokens=True)
  check('future_token_independence',torch.allclose(z[:,:T//2],z2[:,:T//2],atol=1e-5),str(rep))
  # Padding may not change prediction on last valid token.
  padded=F.pad(x,(0,6),value=0)
  pad_out=m(padded)
  check('right_padding_invariance',torch.allclose(m(x),pad_out,atol=2e-6),str(rep))
  if rep%2==0:
   alt=x.clone();alt[:,:2]=torch.randint(1,40,(2,2))
   # 2 layers x radius 3 => no reach back 7 or more steps.
   check('finite_local_receptive_field',torch.allclose(m(x),m(alt),atol=2e-6),str(rep))

for rep in range(32):
 m=FibTopoNetV3(vocab_size=40,d_model=16,layers=1,heads=4,scales=(1,2,4),use_memory=True,dropout=0).eval()
 x=torch.randint(1,40,(2,7))
 with torch.no_grad():
  rev=OrbitAveraging(m,'reversal')
  check('exact_reversal_orbit_invariance',torch.allclose(rev(x),rev(x.flip(1)),atol=1e-6))
  if rep<8:
   cyc=OrbitAveraging(m,'cyclic')
   check('exact_cyclic_orbit_invariance',torch.allclose(cyc(x),cyc(x.roll(3,1)),atol=1e-6))

# A deliberately imposed false symmetry makes antisymmetric labels unrecoverable.
for rep in range(20):
 model=FibTopoNetV3(vocab_size=40,d_model=16,layers=1,heads=4,scales=(1,2,4),use_memory=True,dropout=0).eval()
 orbit=OrbitAveraging(model,'reversal')
 x=torch.randint(1,40,(15,9))
 with torch.no_grad():
  a=orbit(x)
  b=orbit(x.flip(1))
  pred=torch.cat([a,b]).argmax(-1)
  truth=torch.cat([torch.zeros(15,dtype=torch.long),torch.ones(15,dtype=torch.long)])
  check('wrong_invariance_forces_50_percent_on_paired_antisymmetric_labels', abs(pred.eq(truth).float().mean().item()-.5)<1e-8)

for rep in range(30):
 d=8
 mem=StableFibonacciMemory(d)
 x=torch.randn(2,10,d)
 with torch.no_grad():
  inp=mem.in_proj(x)+.2*torch.tanh(mem.mix_strength)*F.linear(x,mem.companion)
  cand=inp.tanh();alpha=mem.max_retention*torch.sigmoid(mem.gate(x))
  st=torch.zeros(2,d)
  for j in range(10):
   st=alpha[:,j]*st+(1-alpha[:,j])*cand[:,j]
   check('state_stays_in_cube',st.abs().max()<=1.000001)
  check('companion_has_operator_norm_one',abs(torch.linalg.matrix_norm(mem.companion,ord=2).item()-1.)<1e-6)
  check('recurrence_contracts_previous_state',alpha.max()<mem.max_retention)

for rep in range(60):
 d=4
 A=torch.randn(d,d); C=A@A.T+torch.eye(d)
 D=torch.randn(d,d);D=(D+D.T)/2
 B=torch.randn(d,d);B=(B+B.T)/2
 f=profiled_gaussian_fisher(C,D,[B]);g=profiled_gaussian_fisher(C,D,[])
 check('profiled_fisher_nonnegative', f>=-1e-6)
 check('profiling_cannot_increase_fisher', f<=g+1e-5)
 check('nuisance_exact_span_gives_zero', abs(profiled_gaussian_fisher(C,B,[B]).item())<1e-8)

for rep in range(24):
 m=FibTopoNetV3(vocab_size=40,d_model=16,layers=1,heads=4,scales=(1,2,4),use_memory=True,spectral_strength=.0001)
 x=torch.randint(1,40,(4,12)); logits,reg=m(x,return_reg=True)
 loss=F.cross_entropy(logits,torch.randint(0,2,(4,)))+reg
 loss.backward()
 check('backprop_gradient_finite',all(torch.isfinite(p.grad).all() for p in m.parameters() if p.grad is not None))
 check('spectral_penalty_finite_nonnegative',bool(torch.isfinite(reg) and reg>=0))

report={'total':sum(counts.values()),'passed':sum(counts.values())-len(issues),'failures':issues,'groups':counts,'scope':'finite-dimensional numerical sanity checks, not Lean proofs'}
Path(__file__).with_name('VERIFICATION_REPORT.json').write_text(json.dumps(report,indent=2))
print(json.dumps(report,indent=2))
if issues: sys.exit(1)