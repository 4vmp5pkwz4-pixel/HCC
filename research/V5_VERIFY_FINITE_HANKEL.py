#!/usr/bin/env python3
"""META–CAUSAL V: self-contained finite-sample smoke test.
Needs only Python standard library. The full SymPy/NumPy verifier is
included in the accompanying downloadable research archive.
"""
import math
import random

def E(t, gamma, omega, q0, p0):
    Om=math.sqrt(omega*omega-gamma*gamma/4)
    b=(p0+gamma*q0/2)/Om
    ef=math.exp(-gamma*t/2)
    q=ef*(q0*math.cos(Om*t)+b*math.sin(Om*t))
    p=ef*(p0*math.cos(Om*t)+(-gamma*b/2-Om*q0)*math.sin(Om*t))
    return (p*p+omega*omega*q*q)/2

def det3(A):
    (a,b,c),(d,e,f),(g,h,i)=A
    return a*(e*i-f*h)-b*(d*i-f*g)+c*(d*h-e*g)

def hankel_det(y, offset=0):
    return det3([[y[offset+i+j] for j in range(3)] for i in range(3)])

def exact_det(t,h,gamma,omega,q0,p0):
    Om=math.sqrt(omega*omega-gamma*gamma/4)
    Q=p0*p0+gamma*p0*q0+omega*omega*q0*q0
    return -(gamma**2*omega**4/(2*Om**6))*Q**3 * math.exp(-3*gamma*(t+2*h)) * math.sin(Om*h)**4 * math.sin(2*Om*h)**2

random.seed(20261011)
for _ in range(200):
    gamma=random.uniform(.18,.8)
    omega=random.uniform(.9,1.8)
    q0,p0=random.uniform(-1,1),random.uniform(-1,1)
    if q0*q0+p0*p0<.1:q0+=1
    t=random.uniform(0,1)
    h=random.uniform(.3,.9)
    y=[E(t+j*h,gamma,omega,q0,p0) for j in range(7)]
    d=hankel_det(y)
    target=exact_det(t,h,gamma,omega,q0,p0)
    assert abs(d-target)<=1e-8*(1+abs(target))
    assert d<0
    recovered=-math.log(hankel_det(y,1)/d)/(3*h)
    assert abs(recovered-gamma)<3e-7
    alpha=random.uniform(.25,2);beta=random.uniform(-2,2)
    Y=[alpha*z+beta for z in y]
    dif=[Y[k]-Y[k+1] for k in range(6)]
    diffdet=hankel_det(dif)
    om=math.sqrt(omega*omega-gamma*gamma/4)
    a=math.exp(-gamma*h);theta=2*om*h
    assert abs(diffdet-alpha**3*(1-a)*(1+a*a-2*a*math.cos(theta))*d)<1e-8*(1+abs(d))
    recovered2=-math.log(hankel_det(dif,1)/diffdet)/(3*h)
    assert abs(recovered2-gamma)<3e-7
print("PASS: 200 oscillator/affine-calibration/shift-law tests")
