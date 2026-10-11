"""Minimal reproducibility check for nonlinear causal closure certificates."""
import math
import random

def energy(q,p,omega):
    return (p*p+omega*omega*q*q)/2.0

def oscillator_state(E,phase,omega):
    return math.sqrt(2*E)*math.cos(phase)/omega, math.sqrt(2*E)*math.sin(phase)

def macro_drift(E,gamma):
    return -gamma*E

def closure_radius(E,gamma):
    return gamma*E

def run():
    random.seed(20261011)
    for i in range(1000):
        E=random.uniform(.01,5)
        gamma=random.uniform(.01,1)
        omega=random.uniform(.5,2)
        phi=random.uniform(0,2*math.pi)
        q,p=oscillator_state(E,phi,omega)
        assert math.isclose(energy(q,p,omega),E,abs_tol=1e-12)
        dE=-gamma*p*p
        assert abs(dE-macro_drift(E,gamma))<=closure_radius(E,gamma)+1e-12
    # Endpoint phases attain opposite extreme projected velocities:
    E=1;g=.5;w=1
    for phi,target in [(0,0),(math.pi/2,-1)]:
        q,p=oscillator_state(E,phi,w)
        assert abs(-g*p*p-target)<1e-12
    print('1000 finite examples and endpoint certificates passed')

if __name__=='__main__':
    run()
