"""V7: exact algebraic checks of heavy-sector CP discriminant.
pip install sympy
"""
import sympy as S
x,y,m2,m3,M1,M2,v=S.symbols("x y m2 m3 M1 M2 v",real=True,positive=True)
z=x+S.I*y
R=S.Matrix([[0,0],[S.cos(z),-S.sin(z)],[S.sin(z),S.cos(z)]])
h=S.diag(S.sqrt(M1),S.sqrt(M2))*R.conjugate().T*S.diag(0,m2,m3)*R*S.diag(S.sqrt(M1),S.sqrt(M2))/v**2
def zero(e):assert S.simplify(S.trigsimp(S.expand_complex(e)))==0,S.simplify(e)
assert (R.T*R-S.eye(2)).applyfunc(S.trigsimp)==S.zeros(2)
a=S.simplify(v**2*h[0,0]/M1)
b=S.simplify(v**2*h[1,1]/M2)
A=S.simplify(a+b);B=S.simplify(a-b)
zero(A-(m2+m3)*S.cosh(2*y))
zero(B-(m2-m3)*S.cos(2*x))
zero(h.det()-M1*M2*m2*m3/v**4)
h12=S.simplify(S.expand_trig(S.expand_complex(h[0,1])))
expected=S.sqrt(M1*M2)/(2*v**2)*((m3-m2)*S.sin(2*x)-S.I*(m2+m3)*S.sinh(2*y))
zero(h12-expected)
J=S.simplify(S.im(h12**2).expand(complex=True))
rhs=(M1*M2/(2*v**4))**2*((m3-m2)**2-B**2)*(A**2-(m2+m3)**2)
zero(J**2-rhs)
zero(J+J.subs(x,-x))
zero(S.simplify(h[0,0]-h[0,0].subs(x,-x)))
zero(S.simplify(h[1,1]-h[1,1].subs(x,-x)))
MM=S.diag(M1,M2)
WB=S.im(S.trace(h*(MM.conjugate().T*MM)*MM.conjugate()*h.conjugate()*MM))
zero(WB-M1*M2*(M2**2-M1**2)*J)
print("PASS: exact minimal-seesaw CP-even discriminant and weak-basis trace reduction")
