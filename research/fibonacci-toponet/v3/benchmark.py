#!/usr/bin/env python3
"""Fixed-seed synthetic diagnostic of long-distance causal memory and scale ablations.
Do not interpret as general natural-language or AGI benchmark.
"""
import argparse,json,sys,time
from pathlib import Path
import torch
import torch.nn.functional as F
from fibonacci_topo_net_v3 import FibTopoNetV3

p=argparse.ArgumentParser()
p.add_argument('--steps',type=int,default=180)
p.add_argument('--seeds',type=int,nargs='+',default=[19,29])
p.add_argument('--length',type=int,default=48)
p.add_argument('--tasks',nargs='+',default=['fibonacci_memory','no_memory','non_fib_memory'])
a=p.parse_args()
torch.set_num_threads(1)


def sample(n,seed,T):
    g=torch.Generator().manual_seed(seed)
    # Label = 0/1 determined solely by first position. All remaining positions
    # independent of label, and local attention cannot access token zero at end.
    x=torch.randint(3,32,(n,T),generator=g)
    y=torch.randint(0,2,(n,),generator=g)
    x[:,0]=y+1
    x[:,-1]=32  # query token
    return x,y

trainx,trainy=sample(2048,20261016,a.length)
valx,valy=sample(512,20261017,a.length)
testx,testy=sample(512,20261018,a.length)
report={'task':'first-token delayed recall, one final query, random independent distractors', 'train_examples':2048,'validation_examples':512,'test_examples':512,'length':a.length,'steps':a.steps,'results':[],'hardware':'CPU','note':'Synthetic task; no claim of superior general intelligence or distinct Fibonacci advantage'}
for task in a.tasks:
    for seed in a.seeds:
        torch.manual_seed(seed)
        scales=(1,2,3,5,8) if task!='non_fib_memory' else (1,2,4,6,8)
        model=FibTopoNetV3(vocab_size=33,d_model=24,layers=1,heads=4,scales=scales,use_memory=(task!='no_memory'),spectral_strength=0)
        opt=torch.optim.AdamW(model.parameters(),lr=.004,weight_decay=.001)
        gen=torch.Generator().manual_seed(4000+seed)
        started=time.time()
        evaluations=[]
        for step in range(1,a.steps+1):
            ids=torch.randint(0,len(trainx),(64,),generator=gen)
            model.train();opt.zero_grad()
            logits=model(trainx[ids]);loss=F.cross_entropy(logits,trainy[ids])
            loss.backward();torch.nn.utils.clip_grad_norm_(model.parameters(),1.)
            opt.step()
            if step in (1,50,100,150,a.steps):
                model.eval()
                with torch.inference_mode():
                    v=model(valx).argmax(-1).eq(valy).float().mean().item()
                evaluations.append({'step':step,'train_loss':round(float(loss.detach()),4),'val_accuracy':round(v,4)})
        with torch.inference_mode():
            model.eval()
            prob=model(testx).softmax(-1)
            pred=prob.argmax(-1)
            accuracy=pred.eq(testy).float().mean().item()
            nll=F.nll_loss(prob.clamp_min(1e-12).log(),testy).item()
            conf=prob.max(-1).values
            bins=torch.linspace(0,1,11)
            ece=0.
            for i in range(10):
                sel=(conf>=bins[i])&(conf<(bins[i+1] if i<9 else 1.000001))
                if sel.any():
                    ece+=sel.float().mean().item()*abs(pred[sel].eq(testy[sel]).float().mean().item()-conf[sel].mean().item())
        long_tests={}
        for length in (a.length*2, a.length*4):
            longx,longy=sample(512,20261018+length,length)
            with torch.inference_mode():
                long_acc=model(longx).argmax(-1).eq(longy).float().mean().item()
            long_tests[str(length)]=round(long_acc,5)
        result={'length_extrapolation':long_tests,'model':task,'seed':seed,'parameters':sum(p.numel() for p in model.parameters()),'test_accuracy':round(accuracy,5),'test_nll':round(nll,5),'test_ECE_10bins':round(ece,5),'seconds':round(time.time()-started,2),'curve':evaluations}
        report['results'].append(result)
        if task=='fibonacci_memory' and seed==a.seeds[0]:
            torch.save({'state_dict':model.state_dict(),'model_args':{'vocab_size':33,'d_model':24,'layers':1,'heads':4,'scales':scales,'use_memory':True,'spectral_strength':0.},'trained_steps':a.steps,'seed':seed,'task':'first-token delayed recall'},Path(__file__).with_name('toy_checkpoint.pt'))
        print(result['model'],seed,'accuracy',result['test_accuracy'],'sec',result['seconds'],flush=True)
        Path(__file__).with_name('BENCHMARK_REPORT.json').write_text(json.dumps(report,indent=2))
print('saved',Path(__file__).with_name('BENCHMARK_REPORT.json'))
