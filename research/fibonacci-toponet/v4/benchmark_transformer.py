#!/usr/bin/env python3
"""Two-seed small causal Transformer, same held-out 512 events as Delta/GRU."""
import json,torch,torch.nn.functional as F
from pathlib import Path
from benchmark_v4 import generate,train_one
from neural_kv import CausalTransformerKV
ROOT=Path(__file__).resolve().parent

def evaluate(model,length,batch=512,chunk=64):
    X,Y=generate(batch,length,seed=9000+77*length)
    correct=0; loss=0.
    model.eval()
    with torch.no_grad():
        for x,y in zip(X.split(chunk),Y.split(chunk)):
            pred=model(x)[:,-1];correct+=int((pred.argmax(-1)==y).sum())
            loss+=float(F.cross_entropy(pred,y,reduction='sum'))
    return correct/batch,loss/batch

if __name__=='__main__':
    torch.set_num_threads(1); rows=[]
    for seed in [17,29]:
        torch.manual_seed(seed); model=CausalTransformerKV()
        elapsed,last_loss=train_one(model,steps=450,seed=seed,batch=48)
        row={'model':'CausalTransformerKV','seed':seed,'train_steps':450,'params':sum(p.numel() for p in model.parameters()),
             'wall_training_s':elapsed,'last25_loss':last_loss}
        for length in [24,96,192]:
            a,l=evaluate(model,length)
            row[f'acc_len_{length}']=a;row[f'loss_len_{length}']=l
        rows.append(row)
        torch.save({'state_dict':model.state_dict(),'seed':seed},ROOT/f'transformer_checkpoint_seed{seed}.pt')
        print(row,flush=True)
    (ROOT/'TRANSFORMER_BENCHMARK.json').write_text(json.dumps(rows,indent=2))