#!/usr/bin/env python3
"""Reproducible algebraic and numerical tests (not proof of learning superiority)."""
import sys, json, math, time
from pathlib import Path
import torch
import torch.nn.functional as F
sys.path.insert(0, str(Path(__file__).resolve().parent))
from fibonacci_topo_net import FibonacciTopoNet, TopoSpectralRegularizer
from fibonacci_topo_net_v2 import (FibonacciTopoNetV2, LocalMultiScaleAttention,
                                  ReversalInvariantWrapper, ContractiveFibonacciCell,
                                  CovarianceSpectralPenalty, PHI, fibonacci_scales)

torch.set_num_threads(1)
torch.manual_seed(20261016)
checks={}
def check(topic, ok):
    checks[topic] = checks.get(topic, 0) + 1
    if not ok: raise AssertionError(f'{topic} test number {checks[topic]}')

orig = FibonacciTopoNet(vocab_size=31,d_model=32,n_layers=2,n_heads=4,max_scales=4,num_classes=2).eval()
v2 = FibonacciTopoNetV2(vocab_size=31,d_model=32,n_layers=2,n_heads=4,scales=(1,2,3,5),num_classes=2).eval()
wrapped = ReversalInvariantWrapper(v2).eval()
for t in (3,5,11,20,31,55):
    for _ in range(10):
        x=torch.randint(0,31,(6,t))
        with torch.no_grad():
            a,b=orig(x),orig(x.flip(1))
            d,e=wrapped(x),wrapped(x.flip(1))
        check('original reversal equivariance', torch.allclose(a,b,atol=1e-6,rtol=1e-6))
        check('projected Z2 exact invariance',torch.allclose(d,e,atol=1e-6,rtol=1e-6))

with torch.no_grad():
    x=torch.randint(0,31,(15,22))
    v2_difference=(v2(x)-v2(x.flip(1))).abs().max().item()
check('v2 direction is representable',v2_difference>1e-5)
check('original not Fibonacci companion',torch.allclose(orig.recur.base, torch.eye(32)*.5))
check('Fibonacci scales unique',fibonacci_scales(7)==[1,2,3,5,8,13,21])

for dim in (2,4,12,32,48):
    cell=ContractiveFibonacciCell(dim)
    w=cell.transition()
    check('contractive real Fibonacci',torch.linalg.matrix_norm(w,2).item()<=0.900001)
    comp=torch.tensor([[1.,1.],[1.,0.]])/PHI
    check('Fibonacci blocks',torch.allclose(cell.companion[:2,:2],comp))

orig_reg=TopoSpectralRegularizer(1.).eval()
with torch.no_grad():
    reg_spread=orig_reg(torch.diag(torch.tensor([3.,0.,0.])))
    reg_balanced=orig_reg(torch.diag(torch.tensor([1.,1.,1.])))
check('original does not test rank collapse',torch.isclose(reg_spread,reg_balanced,atol=1e-6))
reg=CovarianceSpectralPenalty(strength=1.)
for d in (4,8,16):
    z=torch.randn(128,d)
    collapsed=z.clone()
    collapsed[:,:]=z[:,[0]]
    check('centered covariance penalizes collapse',reg(collapsed).item()>reg(z).item())
    check('scale invariant spectral dispersion',abs(reg(3*z).item()-reg(z).item())<1e-5)

# Cross-check local attention against a separately constructed dense reference,
# including asymmetric learned relative biases.
def dense_attention_reference(mod,x):
    b,t,d=x.shape; h=mod.n_heads;dh=mod.head_dim
    q,k,v=mod.qkv(x).reshape(b,t,3,h,dh).permute(2,0,3,1,4).unbind(0)
    scr=(q@k.transpose(-1,-2))/math.sqrt(dh)
    diff=torch.arange(t)[:,None]-torch.arange(t)[None,:]
    offsets=-diff
    valid=(offsets.abs()<=mod.max_window)
    biases=torch.zeros(h,t,t)
    for i in range(t):
        for j in range(t):
            if abs(j-i)<=mod.max_window:
                biases[:,i,j]=mod.rel_bias[:,j-i+mod.max_window]
    scr=scr+biases[None]
    out=[]
    for win in mod.scales:
        mask=(offsets.abs()<=win)
        alpha=torch.softmax(scr.masked_fill(~mask[None,None],-torch.inf),dim=-1)
        out.append(alpha@v)
    coeff=mod.scale_logits.softmax(0)
    y=sum(coeff[i]*val for i,val in enumerate(out))
    return mod.out(y.transpose(1,2).reshape(b,t,d))

for t in (1,2,5,12,24):
    for _ in range(10):
        att=LocalMultiScaleAttention(16,4,scales=(1,2,3,5)).eval()
        with torch.no_grad(): att.rel_bias.normal_(0,.2)
        x=torch.randn(3,t,16)
        with torch.no_grad(): a=att(x); b=dense_attention_reference(att,x)
        check('sparse vs dense attention numerical equivalence',torch.allclose(a,b,atol=2e-6,rtol=2e-6))

# Trainability check independent of the downstream benchmark.
for mod in (v2,):
    mod.train()
    x=torch.randint(0,31,(8,17)); labels=torch.randint(0,2,(8,))
    logits,regularizer=mod(x,return_reg=True)
    (F.cross_entropy(logits,labels)+regularizer).backward()
    check('finite gradients',all(p.grad is None or torch.isfinite(p.grad).all() for p in mod.parameters()))
    check('recurrence receives gradient',mod.recur.delta.grad is not None and mod.recur.delta.grad.abs().sum().item()>0)
    check('regularizer backpropagates',float(regularizer.item())>0)

report={'total_checks':sum(checks.values()),'checks_by_topic':checks,
        'max_original_reversal_difference_atol':1e-6,
        'v2_untrained_max_reversal_difference':v2_difference,
        'original_regularizer_balanced':float(reg_balanced.item()),
        'original_regularizer_collapsed':float(reg_spread.item()),
        'status':'passed',
        'limits':'Finite tests only; do not assert physical laws or learning superiority'}
path=Path(__file__).with_name('verification_report.json')
path.write_text(json.dumps(report,indent=2,ensure_ascii=False))
print(json.dumps(report,indent=2,ensure_ascii=False))
