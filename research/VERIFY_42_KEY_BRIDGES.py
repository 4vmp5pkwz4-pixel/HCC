#!/usr/bin/env python3
"""OpenAI Math -> Meta-Causal IX: independent exact core checks.
This proves sample identities only. Full 42-check suite is in the downloadable companion ZIP.
Needs: pip install sympy.
"""
import sympy as s
for n in range(2,9):
    P,Q=s.zeros(n),s.eye(n)
    P[1,0]=1
    for j in range(1,n-1):P[j+1,j]=1
    P[1,n-1]=1;Q[0,1]=1;Q[1,1]=0
    e=s.eye(n)[:,0];a=e.T
    H=s.Matrix.vstack(a,*[a*Q*P**k for k in range(n-1)])*s.Matrix.hstack(*[P**k*e for k in range(n)])
    assert abs(H.det())==1
    assert all((a*P**k*e)[0]==int(k==0) for k in range(n))
    assert all((a*Q**k*e)[0]==1 for k in range(n))
    if n>=3:
        import itertools
        assert max(sum(abs(t) for t in H.inv()*s.Matrix(bits)) for bits in itertools.product([-1,1],repeat=n))==n+2
# Two exact positive spectral measures with identical first four moments and distinct lowest rates.
nodes=[s.Rational(1,k+2) for k in range(4)];V=s.Matrix([[q**k for q in nodes] for k in range(4)])
w=s.Matrix([s.Rational(1,4)]*4);new=s.Rational(99,100)
correction=V.inv()*s.Matrix([new**k for k in range(4)])
eta=min([s.Rational(1,100)]+[w[i]/(2*correction[i]) for i in range(4) if correction[i]>0])
v=w-eta*correction
assert all(t>0 for t in v)
assert all(sum(w[i]*nodes[i]**k for i in range(4))==sum(v[i]*nodes[i]**k for i in range(4))+eta*new**k for k in range(4))
print("PASS: deterministic synergy, sharp max-entry robustness, finite moment gap ambiguity")
