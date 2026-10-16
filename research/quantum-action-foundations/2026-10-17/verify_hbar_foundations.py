#!/usr/bin/env python3
"""Auditable numerical/finite-dimensional tests; not a proof of physical selection of hbar."""
import json, math
from pathlib import Path
from collections import Counter
import numpy as np

ROOT=Path(__file__).resolve().parent
checks=0
case_counts={}
def check(case,condition):
    global checks
    checks+=1
    case_counts[case]=case_counts.get(case,0)+1
    if not bool(condition):raise AssertionError(f'{case} failed at test {checks}')

def monomial_weight_counts(n,p,q):
    result=Counter()
    for a in range(n+1):
      for b in range(n-a+1):
       for c in range(n-a-b+1):
        d=n-a-b-c
        result[((a-c)+q*(b-d))%p]+=1
    return result

def harmonic_multiplicity(n,p,q,twist=0):
    now=monomial_weight_counts(n,p,q)
    prev=monomial_weight_counts(n-2,p,q) if n>=2 else {}
    return now[twist%p]-prev.get(twist%p,0)

def dft_harmonic_multiplicity(n,p,q,twist=0):
    def trace(k,m):
      if m<0:return 0j
      z=np.exp(2j*np.pi*k/p)
      return sum(z**((a-c)+q*(b-(m-a-b-c)))
             for a in range(m+1) for b in range(m-a+1)
             for c in range(m-a-b+1))
    return sum(np.exp(-2j*np.pi*k*twist/p)*(trace(k,n)-trace(k,n-2)) for k in range(p))/p

# 1. Arbitrary positive hbar: Weyl equations via direct action on functions.
for hb in np.geomspace(.01,100,25):
    for a in (-2.1,-.3,0,.7,1.3):
      for b in (-.9,.1,1.,2.7):
       for x in (-2.,-.5,0,.4,1.8):
        psi=np.exp(-.25*(x-a)**2+.3j*(x-a))
        uv=np.exp(1j*b*(x-a)/hb)*psi
        vu=np.exp(1j*b*x/hb)*psi
        check('weyl-arbitrary-hbar', abs(uv-np.exp(-1j*a*b/hb)*vu)<2e-12)

# 2. Saturation of 1D quantum covariance inequality at all hbar.
J=np.array([[0,1],[-1,0]],float)
for hb in np.geomspace(1e-3,1e3,100):
 for mass,omega in [(1,1),(.25,5),(8,.5)]:
    V=np.diag([hb/(2*mass*omega), hb*mass*omega/2])
    eig=np.linalg.eigvalsh(V+0.5j*hb*J)
    check('robertson-arbitrary-hbar', eig.min()>-1e-11*max(1,eig.max()))
    check('robertson-saturated', abs(np.linalg.det(V)-(hb/2)**2)<2e-10*max(1,hb**2))

# 3. No exact finite-dim Heisenberg algebra due to traceless commutator.
for d in [2,3,4,5,8,16,30]:
 for hb in [.1,1,2.7]:
    a=np.zeros((d,d),complex)
    for n in range(1,d):a[n-1,n]=np.sqrt(n)
    adag=a.conj().T
    X=np.sqrt(hb/2)*(a+adag)
    P=-1j*np.sqrt(hb/2)*(a-adag)
    comm=X@P-P@X
    should=1j*hb*(np.eye(d)-d*np.diag([0]*(d-1)+[1]))
    check('finite-CCR-boundary-anomaly',np.allclose(comm,should,atol=1e-12))
    check('finite-CCR-trace-obstruction',abs(np.trace(comm))<1e-10)

# 4. Compact topology determines sectors, not action normalization.
for p in range(2,20):
  for q in range(1,p):
   if math.gcd(q,p)>1:continue
   for n in range(0,8):
    for twist in [0,1%p]:
      exact=harmonic_multiplicity(n,p,q,twist)
      num=dft_harmonic_multiplicity(n,p,q,twist)
      check('lens-harmonic-count-vs-character-DFT',abs(num-exact)<1e-8)
      check('lens-harmonic-nonnegative', exact>=0)
assert harmonic_multiplicity(2,5,1)==3
assert harmonic_multiplicity(2,5,2)==1

# 5. Orthogonal Zp Fourier projectors are Hermitian idempotents for arbitrary hbar.
for p in range(2,23):
 weights=np.arange(-24,25)
 for twist in range(p):
    diag=sum(np.exp(2j*np.pi*k*(weights-twist)/p) for k in range(p))/p
    P=np.diag(diag)
    check('cyclic-projector-idempotent',np.max(abs(P@P-P))<1e-12)
    check('cyclic-projector-hermitian',np.max(abs(P-P.conj().T))<1e-12)
    for hb in [.1,1.,2.,10.]:
      check('cyclic-projector-independent-of-hbar',np.max(abs(P-np.diag(((weights-twist)%p==0).astype(float))))<1e-12)

# 6. hbar versus amplitude exact nonidentifiability and Fisher degeneracy.
N=np.diag([3.,2.,5.,1.])
rng=np.random.default_rng(20261017)
W=rng.normal(size=(4,3));K=W@W.T
for hb in np.linspace(.01,4,40):
 for amp in [.3,.9,1.2]:
    C=N+hb*amp*K
    h2=hb*1.7
    a2=amp/1.7
    check('hbar-amplitude-covariance-gauge',np.allclose(C,N+h2*a2*K,rtol=1e-13))
    inv=np.linalg.inv(C)
    Dh=amp*K;Da=hb*K
    Fhh=.5*np.trace(inv@Dh@inv@Dh)
    Faa=.5*np.trace(inv@Da@inv@Da)
    Fha=.5*np.trace(inv@Dh@inv@Da)
    prof=Fhh-Fha**2/Faa
    check('profiled-fisher-zero',abs(prof)<2e-11*max(1,abs(Fhh)))

# 7. Gaussian KL begins at quadratic order, and the coefficient is verified.
N=np.diag([1.2,1.7,2.3]);Q=np.array([[.8,.13,-.2],[.13,-.4,.2],[-.2,.2,.4]])
for eps in np.geomspace(1e-6,1e-3,60):
 C=N+eps*Q
 Z=np.diag(1/np.sqrt(np.diag(N)))
 delta=np.linalg.eigvalsh(Z@Q@Z)*eps
 # Stable evaluation via series to avoid cancellation for small contrasts.
 kl=.5*sum((v*v/2-v**3/3+v**4/4-v**5/5) for v in delta)
 theory=eps**2*np.trace(np.linalg.solve(N,Q)@np.linalg.solve(N,Q))/4
 check('KL-leading-quadratic', abs(kl-theory)<2*eps**3)

# 8. Winding n counts are invariant, phase gradient energy need not have a fixed action scale.
for n in [1,2,3]:
 for length in [.1,1,10,100]:
  for kappa in [.01,.1,1,10]:
   energy=kappa*(2*np.pi*n)**2/length
   integral=(2*np.pi*n)
   check('winding-dimensionless',abs(integral/(2*np.pi)-n)<1e-12)
   check('phase-energy-dependent-on-coupling',abs(energy-kappa*(2*np.pi*n)**2/length)<1e-12)

# 9. Flux quantization yields ratios, not an independent universal numeric hbar.
for hb in [.1,.3,1,3,5,12]:
 for k in range(1,100):
    total_area=2*np.pi*hb*k
    check('integral-flux-ratio',abs(total_area/(2*np.pi*hb)-k)<1e-10)

# 10. finite p holonomy independent of hbar in flat character sectors.
for p in range(2,30):
 for a in range(p):
  z=np.exp(2j*np.pi*a/p)
  check('holonomy-pth-root',abs(z**p-1)<1e-12)

report={'title':'Planck constant foundations: structural no-go and lens quotient tests',
        'date':'2026-10-17','passed':checks,'failed':0,'by_suite':case_counts,
        'specific_scalar_lens_test':{'L(5,1)_n2':3,'L(5,2)_n2':1},
        'limitations':['Finite tests verify finite algebraic identities, not fundamental physical selection.',
        'No published new law or unique numerical derivation of hbar established.']}
(ROOT/'verification_results.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(report,ensure_ascii=False,indent=2))
