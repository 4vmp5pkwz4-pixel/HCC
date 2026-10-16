from pathlib import Path
import numpy as np
import matplotlib.pyplot as plt
from verify_hbar_foundations import harmonic_multiplicity
# Prior import runs tests by design and writes report: reproducible, no external dependence.
root=Path(__file__).resolve().parent
h=np.linspace(.35,3.,200)
fig,ax=plt.subplots(figsize=(6.5,3.5))
for product in [.5,1.,1.5]:
 ax.plot(h,product/h,label=rf'$\hbar A={product:g}$')
ax.set(xlabel=r'Quantum-action parameter $\hbar$ (arbitrary units)',ylabel=r'Unknown source amplitude $A$',title='Exact covariance degeneracy: only the product is observable',ylim=(0,4.5))
ax.legend();fig.tight_layout();fig.savefig(root/'figures'/'hbar_amplitude_degeneracy.pdf');plt.close(fig)

n=np.arange(0,13)
fig,ax=plt.subplots(figsize=(6.8,3.8))
for p,q in [(5,1),(5,2)]:
 y=[harmonic_multiplicity(int(j),p,q) for j in n]
 ax.plot(n,y,marker='o',label=fr'$L({p},{q})$')
ax.set(xlabel=r'Scalar harmonic degree $n$',ylabel='Invariant harmonic multiplicity',title='Topology changes mode counts, not the quantum-action scale')
ax.grid(True,alpha=.25);ax.legend();fig.tight_layout();fig.savefig(root/'figures'/'lens_scalar_multiplicities.pdf');plt.close(fig)

fig,ax=plt.subplots(figsize=(6.7,3.8))
sigma=np.logspace(-2,2,200)
# A single arbitrary normalized example: C=sigma^2+1, D=1, no nuisance.
F=0.5/(sigma**2+1.)**2
ax.loglog(sigma,F,label=r'$F=1/[2(1+\sigma^2)^2]$')
ax.loglog(sigma,.5*sigma**(-4),'--',label=r'large-noise $\sigma^{-4}/2$')
ax.set(xlabel=r'Added noise standard deviation $\sigma$',ylabel='Fisher information (arbitrary units)',title='No finite sharp noise cutoff in identifiable Gaussian models')
ax.legend();ax.grid(True,which='both',alpha=.2);fig.tight_layout();fig.savefig(root/'figures'/'finite_noise_fisher.pdf');plt.close(fig)
print('Created 3 vector figures')
