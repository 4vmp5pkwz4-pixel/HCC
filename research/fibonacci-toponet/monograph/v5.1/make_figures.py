from pathlib import Path
import json,zipfile
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
BASE=Path(__file__).resolve().parent
source_report=BASE/'source/ORDER_BENCHMARK.json'
if not source_report.exists():
    source_report=BASE.parent.parent/'v5/ORDER_BENCHMARK.json'  # GitHub research project layout
if source_report.exists():
    report=json.loads(source_report.read_text())
else:
    from zipfile import ZipFile
    archive=BASE/'provenance/FibonacciTopoNet_V5_1_AUDITED_ORIGINAL.zip'
    with ZipFile(archive) as z:
        report=json.loads(z.read('fibonacci-toponet-v5/ORDER_BENCHMARK.json'))
models={'original_v5':[], 'corrected_v5_1':[]}
for q in report['results']:
    models[q['model']].append(q)
# paired 2-seed benchmark
fig,axs=plt.subplots(1,2,figsize=(10,4.1),sharey=True)
for ax,T in zip(axs,[12,24]):
    xs=np.arange(2)
    v=np.array([[x['accuracy'][str(T)] for x in models[k]] for k in models])
    for i in range(2):
        ax.bar(xs+(i-.5)*.34, v[:,i], width=.32, label=f'seed {models["original_v5"][i]["seed"]}')
    ax.set_xticks(xs);ax.set_xticklabels(['Original v5','Causal v5.1']);ax.set_ylim(0,1.08)
    ax.set_title(f'Sequence length {T}'+(' (trained)' if T==12 else ' (OOD)'))
    ax.grid(axis='y',alpha=.25);ax.set_axisbelow(True)
axs[0].set_ylabel('Held-out accuracy'); axs[1].legend(frameon=False,loc='upper center')
fig.suptitle('Paired marker-order classification: reported two-seed results')
fig.tight_layout();fig.savefig(BASE/'figures/marker_order.pdf',bbox_inches='tight');fig.savefig(BASE/'figures/marker_order.png',dpi=160,bbox_inches='tight');plt.close(fig)
phi=(1+5**0.5)/2
C=np.array([[1,1],[1,0]],dtype=float)/phi
fig,axs=plt.subplots(1,2,figsize=(9,3.4))
vals=np.linalg.eigvalsh(C)
axs[0].bar(['$-\\phi^{-2}$','1'],vals);axs[0].axhline(0,linewidth=.7);axs[0].set_ylim(-.6,1.2);axs[0].set_ylabel('Eigenvalue');axs[0].set_title('Normalized Fibonacci companion block')
for j,(n,p,a) in enumerate([(5,4,0),(5,4,1)]):
 w=np.repeat(np.arange(-n,n+1,2),n+1)
 axs[1].plot(np.arange(len(w)),(w-a)%p==0,marker='o',linestyle='none',alpha=.65,label=f'character {a}')
axs[1].set_yticks([0,1]);axs[1].set_title('Cyclic harmonic selection (n=5, p=4)');axs[1].set_xlabel('Harmonic coefficient index');axs[1].legend()
fig.tight_layout();fig.savefig(BASE/'figures/math_components.pdf',bbox_inches='tight');plt.close(fig)
print('figures generated',len(report['results']))
