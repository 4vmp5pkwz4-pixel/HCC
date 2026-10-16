#!/usr/bin/env python3
"""Controlled held-out dynamic key-value retrieval, with train/test generation separated.

Models receive SAME typed events and random content. NeuralDeltaKV has a strong
key-binding inductive bias, so it is not parameter-/compute-matched to GRU.
Oracle uses a Python dictionary, not a learned neural network.
"""
import random, time, json, math, argparse
from pathlib import Path
import numpy as np
import torch
import torch.nn.functional as F
from neural_kv import NeuralDeltaKV,GRUKV
from fibonacci_topo_net_v4 import VersionedAssociativeMemory
ROOT=Path(__file__).resolve().parent

def generate(batch,length,nkeys=12,nvalues=6,seed=0):
    rng=np.random.default_rng(seed)
    ops=np.zeros((batch,length,3),dtype=np.int64)
    target=np.zeros(batch,dtype=np.int64)
    for b in range(batch):
        # Writes are random with replacement, yielding key overwrites.
        keys=rng.integers(0,nkeys,size=length-1)
        vals=rng.integers(0,nvalues,size=length-1)
        ops[b,:-1,0]=1;ops[b,:-1,1]=keys;ops[b,:-1,2]=vals
        q=int(rng.choice(keys))
        ops[b,-1,0]=2;ops[b,-1,1]=q;ops[b,-1,2]=0
        matches=np.flatnonzero(keys==q)
        target[b]=vals[matches[-1]]
    return torch.from_numpy(ops),torch.from_numpy(target)

def accuracy(model,length,seed,batch=512):
    model.eval();X,Y=generate(batch,length,seed=seed)
    with torch.no_grad():
        logits=model(X)[:,-1]
        return float((logits.argmax(-1)==Y).float().mean()),float(F.cross_entropy(logits,Y))

def train_one(model,steps=240,seed=1,train_len=24,batch=64):
    torch.manual_seed(seed)
    model.train();opt=torch.optim.AdamW(model.parameters(),lr=0.003,weight_decay=0.001)
    start=time.perf_counter()
    losses=[]
    for step in range(steps):
        X,Y=generate(batch,train_len,seed=seed*100000+step)
        logits=model(X)[:,-1]
        loss=F.cross_entropy(logits,Y)
        if isinstance(model,NeuralDeltaKV): loss=loss+0.01*model.orthogonality_error()
        opt.zero_grad();loss.backward();torch.nn.utils.clip_grad_norm_(model.parameters(),1.)
        opt.step();losses.append(float(loss.detach()))
    return round(time.perf_counter()-start,2),float(np.mean(losses[-25:]))

def symbolic_oracle(length,seed,batch=512):
    X,Y=generate(batch,length,seed=seed)
    ys=[]
    for sample in X.numpy():
        memory=VersionedAssociativeMemory()
        for op,key,val in sample:
            if op==1:memory.set(int(key),int(val))
            if op==2:ys.append(memory.get(int(key)).value)
    return float(np.mean(np.asarray(ys)==Y.numpy()))

if __name__=='__main__':
    ap=argparse.ArgumentParser();ap.add_argument('--steps',type=int,default=240)
    args=ap.parse_args()
    torch.set_num_threads(1)
    rows=[]
    for name,model_cls in [('neural_delta',NeuralDeltaKV),('gru',GRUKV)]:
        for seed in [17,29]:
            torch.manual_seed(seed)
            model=model_cls()
            elapsed,loss=train_one(model,steps=args.steps,seed=seed)
            row={'model':name,'seed':seed,'train_steps':args.steps,'params':sum(p.numel() for p in model.parameters()),'wall_training_s':elapsed,'last25_loss':loss}
            for n in [24,96,192]:
                ac,l=accuracy(model,n,seed=9000+77*n,batch=512)
                row[f'acc_len_{n}']=round(ac,6);row[f'loss_len_{n}']=round(l,5)
            if name=='neural_delta':
                row['orthogonality_error']=float(model.orthogonality_error().detach())
                torch.save({'state_dict':model.state_dict(),'config':{'nkeys':12,'nvalues':6,'key_dim':16,'value_dim':12},'seed':seed},ROOT/f'neural_delta_checkpoint_seed{seed}.pt')
            rows.append(row);print(json.dumps(row),flush=True)
    for n in [24,96,192]:
        rows.append({'model':'symbolic_oracle','params':'external storage, variable size','acc_len_'+str(n):symbolic_oracle(n,9000+77*n)})
    output={'task':'last write wins: typed random SET operations then QUERY; 12 keys, 6 values','training_length':24,
      'test_lengths':[24,96,192],'test_examples_per_length':512,'fresh_generators':'test seed 9000+77*length, disjoint from train; never reuse labels',
      'baselines':'GRU not parameter matched; symbolic oracle uses external dictionary; Delta has strong key/value inductive bias',
      'models':rows,'framework':torch.__version__,'limitations':['synthetic task','only 2 seeds','no published SOTA model benchmark','algorithmic cache is not learned']}
    (ROOT/'BENCHMARK_V4.json').write_text(json.dumps(output,indent=2,ensure_ascii=False))
    print('DONE',flush=True)