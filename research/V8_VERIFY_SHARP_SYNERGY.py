#!/usr/bin/env python3
"""Meta-causal VIII exact deterministic synergy and finite-shot check.
Requires sympy and numpy. General-n mathematical proof in companion markdown.
"""
import math
import sympy as s
import numpy as np

for n in range(2,16):
    P=s.zeros(n);Q=s.eye(n);P[1,0]=1
    for j in range(1,n-1):P[j+1,j]=1
    P[1,n-1]=1
    Q[0,1]=1;Q[1,1]=0
    alpha=s.Matrix([[1]+[0]*(n-1)])
    seed=s.eye(n)[:,0]
    O=s.Matrix.vstack(alpha,*[alpha*Q*P**k for k in range(n-1)])
    V=s.Matrix.hstack(*[P**k*seed for k in range(n)])
    H=O*V
    assert abs(H.det())==1
    assert all((alpha*P**k*seed)[0]==int(k==0) for k in range(1,2*n))
    assert all((alpha*Q**k*seed)[0]==1 for k in range(2*n))
    singular_values=np.linalg.svd(np.asarray(H.tolist(),dtype=float),compute_uv=False)
    expected=(math.sqrt(2+math.sqrt(3)) if n>=3 else math.sqrt((3+math.sqrt(5))/2))
    assert abs(singular_values[0]-expected)<1e-11
    assert abs(singular_values[-1]-(math.sqrt(2-math.sqrt(3)) if n>=3 else math.sqrt((3-math.sqrt(5))/2)))<1e-11

    # Explicit signed perturbation at the maximal-entry distance to singularity.
    y=s.Matrix([1,-1] if n==2 else ([1,-1,-1]+[1]*(n-3)))
    x=H.inv()*y
    norm1=sum(abs(v) for v in x)
    assert norm1==(3 if n==2 else n+2)
    E=-y*s.Matrix([[s.sign(v) for v in x]])/norm1
    assert (H+E)*x==s.zeros(n,1)
    assert max(abs(z) for z in E)==s.Rational(1,norm1)

for n in [3,5,10,20,100]:
    dn=1/(n+2)
    N=math.ceil(math.log(100)/-math.log1p(-dn))
    assert (1-dn)**N<=.01
    print(n, 'margin',dn,'N per history',N,'total',n*n*N)
print('PASS: 14 exact rank, spectrum, sharpness and finite-shot checks')
