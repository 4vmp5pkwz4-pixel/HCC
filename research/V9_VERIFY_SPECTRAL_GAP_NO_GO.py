#!/usr/bin/env python3
"""Exact positive spectral measures with identical finitely sampled Laplace data.
Source math theorem / clinical warning: this is NOT a Yang-Mills mass gap proof.
python -m pip install sympy
"""
from sympy import Matrix, Rational
for m in range(1,10):
    r=m+1
    q=[Rational(1,i+2) for i in range(r)]
    V=Matrix([[x**j for x in q] for j in range(r)])
    w=Matrix([Rational(1,r)]*r)
    qstar=Rational(1)
    v=Matrix([qstar**j for j in range(r)])
    b=V.inv()*v
    eps=min([Rational(1,10)]+[w[i]/(2*b[i]) for i in range(r) if b[i]>0])
    w2=w-eps*b
    assert eps>0 and all(z>0 for z in w2)
    assert V*w==V*w2+eps*v
    assert sum(w)==sum(w2)+eps==1
    assert sum(w[i]*q[i]**r for i in range(r))!=sum(w2[i]*q[i]**r for i in range(r))+eps
    print(f"m={m}: {r} samples match, positive weights, min rates ln(2) vs 0")
# Nonzero arbitrarily small gap example q*=999/1000:
m=5;r=m+1
q=[Rational(1,i+2) for i in range(r)]
V=Matrix([[x**j for x in q] for j in range(r)])
qstar=Rational(999,1000);v=Matrix([qstar**j for j in range(r)])
w=Matrix([Rational(1,r)]*r);b=V.inv()*v
eps=min([Rational(1,10)]+[w[i]/(2*b[i]) for i in range(r) if b[i]>0])
assert all(z>0 for z in w-eps*b) and V*w==V*(w-eps*b)+eps*v
print('PASS: 10 exact finite-data spectral-gap nonidentifiability constructions')
