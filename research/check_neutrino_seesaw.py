#!/usr/bin/env python3
"""Exact seesaw invariance under x -> -x.
Requirements: pip install sympy
The result tests algebraic identities, not the physics of cosmological washout.
"""
import sympy as s
x,y,m2,m3,M1,M2,v=s.symbols('x y m2 m3 M1 M2 v',real=True,positive=True)
z=x+s.I*y
c,t=s.cos(z),s.sin(z)
R=s.Matrix([[0,0],[c,t],[-t,c]])
D=s.diag(0,m2,m3)
G=s.diag(s.sqrt(M1),s.sqrt(M2))*(R.conjugate().T*D*R)*s.diag(s.sqrt(M1),s.sqrt(M2))/v**2
h11=s.simplify(s.expand_complex(G[0,0]))
h22=s.simplify(s.expand_complex(G[1,1]))
h12=s.simplify(s.expand_trig(s.expand_complex(G[0,1])))
expected=s.sqrt(M1*M2)/(2*v**2)*((m2-m3)*s.sin(2*x)+s.I*(m2+m3)*s.sinh(2*y))
J=s.simplify(s.im(s.expand_complex(h12**2)))
target=M1*M2*(m2**2-m3**2)*s.sin(2*x)*s.sinh(2*y)/(2*v**4)
assert R.T*R==s.eye(2)
assert s.simplify(h12-expected)==0
assert s.simplify(J-target)==0
assert s.simplify(h11-h11.subs(x,-x))==0
assert s.simplify(h22-h22.subs(x,-x))==0
assert s.simplify(s.re(h12)**2+s.im(h12)**2-(s.re(h12.subs(x,-x))**2+s.im(h12.subs(x,-x))**2))==0
assert s.simplify(J+J.subs(x,-x))==0
print('PASS: low-energy seesaw, CP-even heavy data unchanged, CP-odd source sign flips')
