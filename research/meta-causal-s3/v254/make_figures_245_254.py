#!/usr/bin/env python3
from pathlib import Path
import importlib.util
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
HERE=Path(__file__).parent
spec=importlib.util.spec_from_file_location('checks',HERE/'verify_245_254.py')
# Avoid importing the tests as a module: implement only the polynomial counts needed for plot.
def monomials(p,q,n,r=0):
 def W(m):
  if m<0:return 0
  z=0
  for a in range(m+1):
   for b in range(m-a+1):
    for c in range(m-a-b+1):
     d=m-a-b-c
     if (a-b+q*(c-d)-r)%p==0:z+=1
  return z
 return W(n)-W(n-2)
ns=np.arange(0,23)
fig,ax=plt.subplots(figsize=(9,4.5))
for q in (1,2):
 ax.step(ns,[monomials(5,q,int(n)) for n in ns],where='mid',label=f'L(5,{q}) untwisted')
ax.set(xlabel='Cover harmonic level n',ylabel='Scalar Laplacian eigenmode multiplicity',title='Equal-volume lens spaces: distinct low eigenmode multiplicities')
ax.axvline(2,linestyle=':',alpha=.4)
ax.legend();ax.grid(alpha=.2);fig.tight_layout();fig.savefig(HERE/'figure_twisted_lens_multiplicity.pdf');fig.savefig(HERE/'figure_twisted_lens_multiplicity.png',dpi=180);plt.close(fig)

fig,ax=plt.subplots(figsize=(8.5,4.7))
hs=np.linspace(.25,3.5,250)
ax.plot(hs,1/hs,label='Covariance-only exact degeneracy: $A\\hbar=1$')
ax.axvline(1.0,linestyle='--',label='Known-scale clock: $\\hbar=1$')
ax.plot([1],[1],'o')
ax.set(xlabel='Quantum-action parameter $\\hbar$ (dimensionless demo)',ylabel='Unknown covariance amplitude A',title='Independent clock calibration breaks an exact scale degeneracy',xlim=(.25,3.5),ylim=(0,3.6))
ax.legend();ax.grid(alpha=.2);fig.tight_layout();fig.savefig(HERE/'figure_action_calibration.pdf');fig.savefig(HERE/'figure_action_calibration.png',dpi=180);plt.close(fig)
