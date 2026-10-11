#!/usr/bin/env python3
"""META–CAUSAL SCIENCE III: exact polynomial causal-jet sanity checks."""
import sympy as s

q,p,g,w,u=s.symbols("q p gamma omega u")
F=(p,-w*w*q-g*p)
def L(h,F):
    return s.expand(s.diff(h,q)*F[0]+s.diff(h,p)*F[1])
E=(p*p+w*w*q*q)/2
d1=L(E,F);d2=L(d1,F);d3=L(d2,F)
assert s.simplify((d2+2*g*d1)**2+4*w*w*d1*(2*g*E+d1))==0
assert s.simplify(d3+3*g*d2+(2*g*g+4*w*w)*d1+4*g*w*w*E)==0
B,D,T=s.symbols("B D T")
C=w*w*T*T-D*(2*B-D)
Cdot=s.diff(C,B)*(-g*D)+s.diff(C,D)*(-2*g*D-2*w*w*T)+s.diff(C,T)*(2*(D-B)-g*T)
assert s.simplify(Cdot+2*g*C)==0
F_u=(p,-w*w*q-g*p+u)
dE_u=L(E,F_u);ddE_u=L(dE_u,F_u)
assert s.simplify(s.diff(dE_u,u).subs(u,0)-p)==0
assert s.simplify(s.diff(ddE_u,u).subs(u,0)+(w*w*q+3*g*p))==0
Y0,Y1,Y2=s.symbols("Y0 Y1 Y2")
G=s.groebner([Y0-E,Y1-d1,Y2-d2],q,p,Y0,Y1,Y2,order="lex")
elims=[a.as_expr() for a in G.polys if not ({q,p} & a.as_expr().free_symbols)]
P=(Y2+2*g*Y1)**2+4*w*w*Y1*(2*g*Y0+Y1)
assert any(s.simplify(f/P).is_number and s.simplify(f/P)!=0 for f in elims)
print("PASS: exact eliminant, linear energy ODE, invariant cone, intervention recovery.")
