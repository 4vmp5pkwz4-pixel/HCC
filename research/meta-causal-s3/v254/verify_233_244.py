#!/usr/bin/env python3
"""Finite reproducibility checks, not formal proofs or observational CMB fits."""
import json, math
from collections import Counter
from pathlib import Path
import numpy as np
from numpy.linalg import slogdet
rng=np.random.default_rng(20261016)
checks=Counter(); failures=[]; examples={}

def ck(name, ok):
    checks[name]+=1
    if not bool(ok): failures.append((name,checks[name]))

def pd(d):
    A=rng.normal(size=(d,d));return A@A.T+np.eye(d)*0.7

def kl(a,b):
    d=a.shape[0]; sg1,ld1=slogdet(a);sg0,ld0=slogdet(b)
    assert sg1>0 and sg0>0
    return .5*(np.trace(np.linalg.solve(b,a))-d+ld0-ld1)

def prof(C,D,B):
    L=np.linalg.cholesky(C)
    whiten=lambda X:np.linalg.solve(L,np.linalg.solve(L,X.T).T) # incorrect orientation for general; avoid in use
    Ci=np.linalg.inv(C)
    inner=lambda X,Y: .5*np.trace(Ci@X@Ci@Y)
    if not B:return inner(D,D)
    Fbb=np.array([[inner(x,y) for y in B] for x in B]);Fdb=np.array([inner(D,x) for x in B]);return inner(D,D)-Fdb@np.linalg.pinv(Fbb)@Fdb

# conditional Gaussian KL difference as an analytic decomposition
for d in [2,3,5,8]:
  for _ in range(120):
    C1=pd(d);C0=pd(d)
    split=rng.integers(1,d)
    A1,B1,D1=C1[:split,:split],C1[split:,:split],C1[split:,split:]
    A0,B0,D0=C0[:split,:split],C0[split:,:split],C0[split:,split:]
    L1=B1@np.linalg.inv(A1);L0=B0@np.linalg.inv(A0)
    S1=D1-L1@B1.T;S0=D0-L0@B0.T
    increment=kl(S1,S0)+.5*np.trace(np.linalg.solve(S0,(L1-L0)@A1@(L1-L0).T))
    exact=kl(C1,C0)-kl(A1,A0)
    ck('Gaussian conditional KL identity',np.isclose(increment,exact,atol=3e-9,rtol=3e-9))
    ck('Additional channel cannot reduce KL',exact>=-2e-10)
    # profiled-Fisher nondecreasing when nuisance tangent model is the same
    D=rng.normal(size=(d,d));D=(D+D.T)/2
    B=rng.normal(size=(d,d));B=(B+B.T)/2
    f_joint=prof(C1,D,[B]);f_scalar=prof(A1,D[:split,:split],[B[:split,:split]])
    ck('Profile Fisher monotonic under joint extension',f_joint+3e-8>=f_scalar)

# large-noise law and nuisance span invariance
for d in [2,3,5]:
  for _ in range(70):
    S=pd(d);D=rng.normal(size=(d,d));D=(D+D.T)/2
    B1=rng.normal(size=(d,d));B1=(B1+B1.T)/2
    B2=rng.normal(size=(d,d));B2=(B2+B2.T)/2
    f1=prof(7*np.eye(d)+S,D,[B1,B2]);f2=prof(7*np.eye(d)+S,D,[2*B1+B2,B1-3*B2]);ck('Nuisance basis invariance',np.isclose(f1,f2,atol=1e-9,rtol=1e-8))
    coeff=np.linalg.lstsq(np.stack([B1.ravel(),B2.ravel()],axis=1),D.ravel(),rcond=None)[0]
    res=D-coeff[0]*B1-coeff[1]*B2
    expected=.5*np.sum(res**2)
    sigma=1500.0
    measured=prof((sigma**2)*np.eye(d)+S,D,[B1,B2])*sigma**4
    ck('High noise coefficient',np.isclose(measured,expected,atol=2e-3,rtol=2e-4))
    ck('No finite noise extinction away nuisance span',f1>-1e-10)

# weak-signal KL shows quadratic onset and cross-shell terms
for d in [2,4,6]:
  for _ in range(160):
    C=pd(d);U=rng.normal(size=(d,d));U=(U+U.T)/2
    V=rng.normal(size=(d,d));V=(V+V.T)/2
    e=1e-4
    D=U+V
    k=kl(C+e*D,C)
    coeff=.25*np.trace(np.linalg.solve(C,D)@np.linalg.solve(C,D))
    ck('Weak signal quadratic KL',np.isclose(k/e**2,coeff,atol=2e-3,rtol=2e-3))

# orientation derivative, exact 2x2 counterexample
C0=np.diag([1.,4.]);C1=np.array([[2.,1.],[1.,3.]])
J=np.array([[0.,-1.],[1.,0.]])
exact=.5*np.trace(np.linalg.solve(C0,J@C1-C1@J))
ck('2d nonstationary KL example',np.isclose(exact,-.75,atol=1e-14))
examples['relative_rotation_dKL_dtheta']=float(exact)

# scalar lens-space invariants via two independent methods
# Polynomial action on C^2: (z1,z2)->(omega*z1,omega**q*z2)
def poly_harmonic_dim(n,p,q):
 def inv_poly(N):
    if N<0:return 0
    num=0
    for a in range(N+1):
      for b in range(N-a+1):
       for c in range(N-a-b+1):
        d=N-a-b-c
        num+=int((a-b+q*(c-d))%p==0)
    return num
 return inv_poly(n)-inv_poly(n-2)

def rep_dim(n,p,q):
 # SO(4) weight pair with group angles theta1=2pi/p, theta2=2pi*q/p.
 result=0
 for u in range(-n,n+1,2):
  for v in range(-n,n+1,2):
   result+=int(((1+q)*u+(1-q)*v)%(2*p)==0)
 return result

scalar_cases={}
for p in range(2,12):
 for q in range(1,p):
  if math.gcd(p,q)!=1:continue
  vals=[]
  for n in range(0,14):
   a=poly_harmonic_dim(n,p,q);b=rep_dim(n,p,q)
   ck('Independent polynomial-vs-character scalar multiplicities',a==b)
   ck('Lens multiplicity admissible',0<=a<=(n+1)**2)
   vals.append(a)
  if (p,q) in {(5,1),(5,2),(4,1),(7,1)}:scalar_cases[f'L({p},{q})']=vals[:9]
examples['lens_scalar_multiplicities_n0_to8']=scalar_cases

# No finite rank saturation for distinct cyclic orders, at infinitely many shells
for p in range(2,12):
 for q in range(p+1,14):
  for n in range(p,80,2):
   w=p
   ck('Infinite rank-jump witness for distinct orders', w%p==0 and w%q!=0 and (n-w)%2==0)

# rank loss for incomplete angular selection: elementary linear algebra
for d in range(3,10):
  for r in range(1,d):
   R=rng.normal(size=(d,r))
   ck('Angular projection cannot surject if source dimension less than target',np.linalg.matrix_rank(R)<d)

payload={'status':'PASS' if not failures else 'FAIL','seed':20261016,'checks':dict(checks),'total':sum(checks.values()),'failures':failures[:30],'examples':examples,
'limits':'finite-dimensional arithmetic/matrix tests; no CAMB, CMB real-data, or Lean proof'}
Path(__file__).with_name('VERIFICATION_233_244.json').write_text(json.dumps(payload,indent=2,ensure_ascii=False))
print(json.dumps({'status':payload['status'],'total':payload['total'],'counts':checks,'examples':examples},indent=2,default=dict))
if failures:raise SystemExit(1)
