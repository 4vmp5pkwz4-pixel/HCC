#!/usr/bin/env python3
"""Independent, dependency-free smoke test of the exact V6 Jordan formula.
Full arbitrary-dimensional NumPy/SymPy verifier is in the research ZIP.
"""
import math
import random
random.seed(20261011)

def energy(lam, kap, t):
    return math.exp(-2*lam*t)*(1+kap*t+(kap*t)**2/2)

n=1200
largest_error=0.
for _ in range(n):
    lam=random.uniform(.2,2.0)
    kap=random.uniform(.03,1.8*lam)
    h=random.uniform(.03,1.9)
    f0=1.
    f1=energy(lam,kap,h)
    f2=energy(lam,kap,2*h)
    observed=f0*f2-f1**2
    expected=-math.exp(-4*lam*h)*(kap*h)**3*(kap*h+4)/4
    largest_error=max(largest_error,abs(observed-expected))
    assert observed<0
    assert abs(observed-expected)<5e-13

    # Positive sum of real exponential decays gives nonnegative Hankel.
    a,b=random.uniform(.05,2.),random.uniform(.05,2.)
    s,t=random.uniform(.01,2.),random.uniform(.01,2.)
    norm=lambda z:a*math.exp(-s*z)+b*math.exp(-t*z)
    det=norm(0)*norm(2*h)-norm(h)**2
    assert det>=-1e-12
print("PASS",n,"strictly dissipative Jordan and normal-mixture cases;",largest_error)
