#!/usr/bin/env python3
"""Matched-size reversal-paired synthetic benchmark. Not real language data."""
import json, sys, time
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F
sys.path.insert(0,str(Path(__file__).resolve().parent))
from fibonacci_topo_net import FibonacciTopoNet
from fibonacci_topo_net_v2 import FibonacciTopoNetV2,ReversalInvariantWrapper

torch.set_num_threads(1)
T=16; VOCAB=24

def pairs(n,seed):
    rng=np.random.default_rng(seed)
    xs=[]; ys=[]
    for k in range(n):
        x=rng.integers(3,VOCAB,size=T)
        # Distinct markers in variable positions, min distance >=2
        while True:
            i,j=rng.choice(T,size=2,replace=False)
            if abs(i-j)>=2: break
        x[i],x[j]=1,2
        label=int(i<j)
        xs.extend([x.copy(),x[::-1].copy()])
        ys.extend([label,1-label])
    return torch.tensor(np.array(xs),dtype=torch.long),torch.tensor(ys,dtype=torch.long)

trainx, trainy=pairs(700,20261016)
valx,valy=pairs(240,20261017)


def run(variant, seed, steps=250):
    torch.manual_seed(seed)
    if variant=='original':
        model=FibonacciTopoNet(vocab_size=VOCAB,d_model=32,n_layers=2,n_heads=4,max_scales=4,num_classes=2)
    elif variant=='fibonacci_v2':
        model=FibonacciTopoNetV2(vocab_size=VOCAB,d_model=32,n_layers=2,n_heads=4,scales=(1,2,3,5),num_classes=2)
    elif variant=='control_v2':
        model=FibonacciTopoNetV2(vocab_size=VOCAB,d_model=32,n_layers=2,n_heads=4,scales=(1,2,4,5),num_classes=2)
    else:
        raise ValueError(variant)
    opt=torch.optim.AdamW(model.parameters(),lr=.002,weight_decay=.01)
    gen=torch.Generator().manual_seed(seed+5)
    started=time.time(); evaluations=[]
    for step in range(steps):
        # Paired mini-batch: symmetry cannot be cheated by sampling imbalance.
        idx=torch.randint(0,700,(32,),generator=gen)*2
        ii=torch.stack([idx,idx+1],dim=1).reshape(-1)
        bx,by=trainx[ii],trainy[ii]
        model.train(); opt.zero_grad()
        logits=model(bx)
        loss=F.cross_entropy(logits,by)
        loss.backward(); torch.nn.utils.clip_grad_norm_(model.parameters(),1.)
        opt.step()
        if step+1 in (1,50,100,150,200,steps):
            model.eval()
            with torch.inference_mode():
                pred=model(valx).argmax(-1)
                accuracy=(pred==valy).float().mean().item()
                reversal_diff=(model(valx[:80])-model(valx[:80].flip(1))).abs().max().item()
            evaluations.append({'step':step+1,'val_accuracy':round(accuracy,4),'max_reversal_difference':round(reversal_diff,8)})
    return {'variant':variant,'seed':seed,'parameters':sum(p.numel() for p in model.parameters()),
            'train_steps':steps,'elapsed_sec':round(time.time()-started,2),'evaluation':evaluations,
            'final_val_accuracy':evaluations[-1]['val_accuracy']}

if __name__ == "__main__":
    results=[]
    for name in ('original','fibonacci_v2','control_v2'):
        x=run(name,1337)
        results.append(x)
        print(name,'accuracy=',x['final_val_accuracy'],'sec=',x['elapsed_sec'],flush=True)
    report={'task':'token A before token B vs reversal, balanced reversal pairs','train_pairs':700,'validation_pairs':240,
            'token_length':T,'matched_control':'(1,2,4,5) vs Fibonacci (1,2,3,5), same max window and parameter count',
            'results':results,'caveat':'One seed, finite synthetic dataset, short optimization; not evidence of generalized Fibonacci superiority'}
    p=Path(__file__).with_name('benchmark_report.json')
    p.write_text(json.dumps(report,indent=2,ensure_ascii=False))
    print('saved',p)
