#!/usr/bin/env python3
"""Exact, finite rational checks. Analytic theorem is in META_CAUSAL_FOUNDATIONS_EXTENDED_2026_10_11.md.
Prerequisite: SymPy. This is not a proof of historical scientific priority.
"""
import sympy as s

def family(n, a=s.Rational(2,3)):
    P,Q=s.zeros(n),s.eye(n)
    P[0,0]=a; P[1,0]=1-a
    for j in range(1,n-1): P[j+1,j]=1
    P[1,n-1]=1
    Q[0,1]=1; Q[1,1]=0
    out=s.Matrix([[1]+[0]*(n-1)])
    seed=s.Matrix([1]+[0]*(n-1))
    return P,Q,out,seed

for n in range(2,14):
    P,Q,out,seed=family(n)
    assert all(sum(P[:,i])==sum(Q[:,i])==1 for i in range(n))
    assert all((out*P**k*seed)[0]==s.Rational(2,3)**k for k in range(2*n))
    assert all((out*Q**k*seed)[0]==1 for k in range(2*n))
    Obs=s.Matrix.vstack(out,*[out*Q*P**k for k in range(n-1)])
    Reach=s.Matrix.hstack(*[P**k*seed for k in range(n)])
    H=Obs*Reach
    assert H.rank()==n
    assert abs(H.det())==(s.Rational(1,3))**(n-1)
print("PASS 12 exact rational stochastic synergistic rank instances (n=2...13)")
