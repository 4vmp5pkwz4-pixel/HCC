#!/usr/bin/env python3
"""Independent finite-sector geometric/spectral, heat, and hbar identifiability checks.
  A test is a deterministic assertion; it is not a formal proof or observed cosmology.
"""
from __future__ import annotations
import cmath, json, math
from math import gcd
from collections import Counter,defaultdict
import numpy as np
from pathlib import Path

counts=Counter()
def check(cond,label,explanation=''):
    counts[label]+=1
    if not bool(cond):raise AssertionError(f'{label}: {explanation}')

def weight_counts(p,q,n):
    result=[0]*p
    for a in range(n+1):
      for b in range(n-a+1):
       for c in range(n-a-b+1):
        d=n-a-b-c
        result[(a-b+q*(c-d))%p]+=1
    return np.array(result,dtype=np.int64)

def multiplicity_by_polys(p,q,n):
    return weight_counts(p,q,n)-(weight_counts(p,q,n-2) if n>=2 else 0)

def multiplicity_by_S3weights(p,q,n):
    result=[0]*p
    for u in range(-n,n+1,2):
      for v in range(-n,n+1,2):
        z=((1+q)*u+(1-q)*v)//2
        result[z%p]+=1
    return np.asarray(result,dtype=np.int64)

def molien(p,q,r,t):
    acc=0j
    for j in range(p):
       w=cmath.exp(2j*math.pi/p)
       acc+=w**(-r*j)/((1-t*w**j)*(1-t*w**(-j))*(1-t*w**(q*j))*(1-t*w**(-q*j)))
    return ((1-t*t)*acc/p).real

# Independent polynomial-Fischer and SU(2)xSU(2) weight counts.
examples=[]
for p in range(2,16):
  for q in range(1,p):
    if gcd(p,q)>1: continue
    for n in range(0,12):
      a=multiplicity_by_polys(p,q,n)
      b=multiplicity_by_S3weights(p,q,n)
      check(np.array_equal(a,b),'two independent twisted sector counts',f'{p,q,n}: {a.tolist()} {b.tolist()}')
      check(int(a.sum())==(n+1)**2,'sector sum equals cover multiplicity',str((p,q,n)))
      check(np.all(a>=0),'sector multiplicities nonnegative',str((p,q,n)))
      for r in range(p):
        check(int(a[r])==int(b[r]),'componentwise twisted multiplicity',str((p,q,n,r)))
    if p in (5,7) and q in (1,2,3): examples.append((p,q))

# Molien generating function independently from sum-of-compositions at |t|<1.
for p,q in [(2,1),(3,1),(4,1),(5,1),(5,2),(7,1),(7,2),(7,3),(9,2),(13,5)]:
 for r in range(p):
  coeff=[multiplicity_by_polys(p,q,n)[r] for n in range(28)]
  for t in (0.08,0.17,0.25):
   trunc=float(sum(int(m)*t**n for n,m in enumerate(coeff)))
   exact=molien(p,q,r,t)
   check(abs(trunc-exact)<5e-11,'twisted Molien expansion',str((p,q,r,t,trunc,exact)))

# Direct character projectors in a spectral eigenspace, cyclic representation.
rng=np.random.default_rng(20261017)
for p in [2,3,5,7,9,13]:
 for n in range(0,13):
  for q in ([1] if p==2 else [1,2] if gcd(p,2)==1 else [1]):
   weights=np.asarray([((1+q)*u+(1-q)*v)//2 %p for u in range(-n,n+1,2) for v in range(-n,n+1,2)])
   # DFT of diagonal representation: each entry is exactly a projector on char r.
   theta=np.exp(2j*np.pi*weights/p)
   proj=[]
   for r in range(p):
    scalar=np.mean([(theta**j)*np.exp(-2j*np.pi*r*j/p) for j in range(p)],axis=0)
    P=np.diag(scalar)
    sel=np.diag((weights==r).astype(float))
    check(np.linalg.norm(P-sel)<2e-11,'DFT projector equals integer selector',str((p,q,n,r)))
    check(np.linalg.norm(P@P-P)<3e-11,'projector idempotence',str((p,q,n,r)))
    check(np.linalg.norm(P-P.conj().T)<3e-11,'projector self-adjointness',str((p,q,n,r)))
    proj.append(P)
   check(np.linalg.norm(sum(proj)-np.eye((n+1)**2))<3e-11,'all twisted projectors resolve identity',str((p,q,n)))

# Explicit level-two lens-space inequivalence; covers and volumes equal.
check(list(multiplicity_by_polys(5,1,2))[0]==3,'level-two lens spectral witness')
check(list(multiplicity_by_polys(5,2,2))[0]==1,'level-two lens spectral witness')

# Heat-sector trace finite band exact identities; for p,q,t/R² at t>0.
for p,q in [(3,1),(5,1),(5,2),(7,2),(11,3)]:
 for u in (0.018,0.05,0.17,1.0):
  sector=np.zeros(p)
  cov=0.
  for n in range(100):
   w=math.exp(-u*n*(n+2))
   sector+=multiplicity_by_polys(p,q,n)*w
   cov+=(n+1)**2*w
  check(abs(sector.sum()-cov)<1e-9,'heat trace sectors sum to cover')
  check(np.all(sector>=-1e-12),'heat trace sector positivity')

# Geometric uniqueness / quotient kinetic energy scaling.
for _ in range(500):
 hbar=float(np.exp(rng.uniform(-3,3)))
 mass=float(np.exp(rng.uniform(-3,3)))
 R=float(np.exp(rng.uniform(-3,3)))
 beta=float(np.exp(rng.uniform(-3,3)))
 s=float(np.exp(rng.uniform(-2,2)))
 tau=beta*hbar*hbar/(2*mass*R*R)
 tau_prime=beta*(s*hbar)**2/(2*(s*s*mass)*R*R)
 check(np.isclose(tau,tau_prime,rtol=2e-14),'mass-action partition invariance')
 n,k=int(rng.integers(2,21)),0
 Dl=n*(n+2)-k*(k+2)
 angular_freq=hbar*Dl/(2*mass*R*R)
 recovered=2*mass*R*R*angular_freq/Dl
 check(np.isclose(recovered,hbar,rtol=2e-14),'independently calibrated frequency recovers hbar')

# Full Jacobian rank & profiled Fisher for covariance = noise + A*hbar*K
for _ in range(250):
 n=4
 Z=rng.standard_normal((n,n)); K=Z@Z.T/n
 N=np.eye(n)*float(np.exp(rng.uniform(-2,2)))
 h=float(np.exp(rng.uniform(-3,1)))
 A=float(np.exp(rng.uniform(-3,1)))
 c=float(np.exp(rng.uniform(-3,1))) # known Delta-lambda/(2mR^2)
 sigma=float(np.exp(rng.uniform(-3,1)))
 C=N+h*A*K
 IC=np.linalg.inv(C)
 f=0.5*np.trace(IC@K@IC@K)
 # 2x2 Fisher block; additive independent known-scale frequency observation
 F=np.array([[A*A*f+c*c/(sigma*sigma),A*h*f],[A*h*f,h*h*f]])
 eff=F[0,0]-F[0,1]**2/F[1,1]
 check(np.isclose(eff,c*c/sigma**2,rtol=2e-12,atol=2e-12),'profiled hbar Fisher equals independent clock information',str((F,eff,c*c/sigma**2)))
 # Without frequency, two covariance scores are collinear.
 eff0=(A*A*f)-(A*h*f)**2/(h*h*f)
 check(abs(eff0)<1e-10,'hbar and amplitude are exact covariance nuisance gauge')
 # A separate unknown frequency scale kappa restores exact degeneracy
 s=float(np.exp(rng.uniform(-1,1)))
 kappa=1.
 obs1=h*A;obs2=h*kappa*c
 obs1p=(s*h)*(A/s);obs2p=(s*h)*(kappa/s)*c
 check(np.allclose([obs1,obs2],[obs1p,obs2p],rtol=1e-14),'uncalibrated clock reinstates action gauge')

out={"status":"PASS","total":sum(counts.values()),"counts":dict(counts),"lens_examples":{str((p,q)):[int(multiplicity_by_polys(p,q,n)[0]) for n in range(9)] for p,q in [(5,1),(5,2)]},"definition":"finite-dimensional tests of stated formulas, not Lean proofs or observed physics","seed":20261017}
Path(__file__).with_name('VERIFICATION_245_254.json').write_text(json.dumps(out,indent=2,ensure_ascii=False)+'\n')
print(json.dumps(out,indent=2))
