#!/usr/bin/env python3
"""Small paired order task. Does not establish broad generalization/SOTA."""
import json,time,sys,torch
from torch.nn import functional as F
from fibonacci_topo_net_v5_1 import FibonacciTopoNetV5_1
from FibonacciTopoNet_v5_ORIGINAL import FibonacciTopoNetV5

torch.set_num_threads(2)
def make(n_pairs,seq_len,seed):
    gen=torch.Generator().manual_seed(seed)
    x=torch.randint(3,16,(n_pairs,seq_len),generator=gen)
    positions=torch.argsort(torch.rand(n_pairs,seq_len,generator=gen),dim=1)[:,:2]
    r=torch.arange(n_pairs)
    x[r,positions[:,0]]=1;x[r,positions[:,1]]=2
    labels=(positions[:,0]<positions[:,1]).long()
    # Every sample has its reversed partner with the *opposite* label.
    return torch.cat((x,x.flip(-1)),0),torch.cat((labels,1-labels),0)

def run(which,seed,steps=220):
    torch.manual_seed(seed)
    if which=='original_v5':model=FibonacciTopoNetV5(vocab_size=16,d_model=24,n_layers=1,n_heads=4,max_scales=4,num_classes=2)
    else:model=FibonacciTopoNetV5_1(vocab_size=16,d_model=24,n_layers=1,n_heads=4,max_scales=4,num_classes=2)
    model.train();optim=torch.optim.AdamW(model.parameters(),lr=0.003)
    start=time.perf_counter()
    for t in range(steps):
        x,y=make(32,12,seed*100000+t)
        logits=model(x)
        loss=F.cross_entropy(logits,y)
        optim.zero_grad();loss.backward();optim.step()
    runtime=round(time.perf_counter()-start,2)
    from pathlib import Path
    cp=Path('checkpoints');cp.mkdir(exist_ok=True)
    torch.save(model.state_dict(),cp / f'{which}_seed{seed}.pt')
    model.eval()
    scores={}
    with torch.no_grad():
        for length in (12,24):
            x,y=make(256,length,seed*9999+length)
            pred=model(x).argmax(1)
            scores[str(length)]=round((pred==y).float().mean().item(),6)
        x,y=make(8,12,seed+889)
        reversaldiff=float((model(x)-model(x.flip(1))).abs().max())
    return dict(model=which,seed=seed,steps=steps,training_seconds=runtime,params=sum(p.numel() for p in model.parameters()),accuracy=scores,reversal_logit_difference=reversaldiff)

if __name__=='__main__':
    results=[run(k,s) for k in ('original_v5','corrected_v5_1') for s in (17,29)]
    print(json.dumps(results,indent=2))
    open('ORDER_BENCHMARK.json','w').write(json.dumps({'task':'paired marker order with reversal-opposite labels','results':results},indent=2)+'\n')
