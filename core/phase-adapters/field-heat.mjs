import { definePhaseSpace, defineInvariant, defineConstraint } from '../phase/contract.mjs';
import { phaseRefusal } from '../phase/refusals.mjs';

const STABILITY_FACTOR=6;
const l2=field=>field.reduce((s,x)=>s+x*x,0)/Math.max(1,field.length);

function validateHeatState(state){
  if('field' in state && (!Array.isArray(state.field)||state.field.length===0||state.field.some(x=>!Number.isFinite(x))))
    return phaseRefusal('INVALID_STATE','heat field must be a non-empty finite numeric array',{coordinate:'field'});
  if('alpha' in state && (!(state.alpha>0)||!Number.isFinite(state.alpha)))
    return phaseRefusal('OUT_OF_DOMAIN','heat diffusivity alpha must be finite and positive',{alpha:state.alpha});
  if('dt' in state && (!(state.dt>0)||!Number.isFinite(state.dt)))
    return phaseRefusal('OUT_OF_DOMAIN','heat timestep dt must be finite and positive',{dt:state.dt});
  if('alpha' in state && 'dt' in state){const cfl=STABILITY_FACTOR*state.alpha*state.dt;
    if(cfl>1+1e-12) return phaseRefusal('OUT_OF_DOMAIN','explicit 3D heat step exceeds alpha*dt*6 <= 1 stability domain',{alpha:state.alpha,dt:state.dt,cfl,limit:1});}
  return true;
}

export function heatPhaseAdapter(){
  return definePhaseSpace({
    id:'heat',
    title:'Field Lab — Heat diffusion',
    carrier:{kind:'discrete-periodic-or-dirichlet-field-grid',dimension:'discretized',compact:'grid-dependent'},
    coordinates:[
      {id:'field',type:'array',role:'native',quantity_kind:'scalar-field',unit:'solver-unit',dimension:'field'},
      {id:'alpha',type:'number',role:'native',quantity_kind:'diffusivity',unit:'grid^2/time',dimension:'L^2/T'},
      {id:'dt',type:'number',role:'native',quantity_kind:'solver-timestep',unit:'solver-time',dimension:'T'},
      {id:'visual_scale',type:'number',role:'display-only',quantity_kind:'display-scale',unit:null,dimension:'1'}
    ],
    time:{kind:'model-time',unit:'solver-time',orientation:'forward'},
    dynamics:{kind:'continuous',numerical_method:'explicit Euler discretization of heat equation',authoritative_solver:'index.html FIELD.advance'},
    geometry:[{kind:'discrete-field-grid'}],
    constraints:[defineConstraint({id:'explicit_euler_stability',kind:'numerical-domain',status:'alpha*dt*6 <= 1 for the 3D 7-point stencil worst mode'})],
    invariants:[defineInvariant({
      id:'field_l2',kind:'balance',direction:'nonincreasing',quantity_kind:'field-L2-density',unit:'solver-unit^2',dimension:'field^2',
      evaluator:s=>l2(s.field),coordinates:['field'],status:'dissipative monotone/balance diagnostic; not conserved',
      provenance:'diagnostic over state supplied by authoritative index.html heat solver; solver itself is not reimplemented here'
    })],
    projections:[],
    domain:{stability:'6*alpha*dt <= 1',boundary_semantics:'owned by Field Lab solver'},
    epistemic:{status:'simulated/reference-model',caveat:'The phase adapter evaluates diagnostics on the real solver state; it does not duplicate FIELD.advance in Node.'},
    state_validator:validateHeatState,
    adapter:Object.freeze({stabilityFactor:STABILITY_FACTOR,l2})
  });
}
