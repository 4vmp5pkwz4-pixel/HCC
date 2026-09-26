import { definePhaseSpace, defineInvariant, defineConstraint } from '../phase/contract.mjs';
import { phaseRefusal } from '../phase/refusals.mjs';
import {
  ACT_TAU, actDot, actNorm, actScale, actJ, actAlpha, actDAlpha,
  actContactResidual, actReebPath, actEllipsoidPath, actLegendrianPath
} from '../atlas/extracted.mjs';

const UNIT_TOL=1e-10;
function validateUnitS3(state){
  if(!('u' in state)) return true;
  if(!Array.isArray(state.u)||state.u.length!==4) return phaseRefusal('CONSTRAINT_VIOLATION','contact state u must be a four-component point on S3',{coordinate:'u'});
  const n2=state.u.reduce((s,x)=>s+x*x,0);
  if(Math.abs(n2-1)>UNIT_TOL) return phaseRefusal('CONSTRAINT_VIOLATION','contact state must satisfy |u| = 1',{norm_squared:n2,tolerance:UNIT_TOL});
  return true;
}

export function contactActionPhaseAdapter(){
  return definePhaseSpace({
    id:'act',
    title:'Contact & Action Observatory',
    carrier:{kind:'contact-S3-and-return-orbits',dimension:3,compact:true},
    coordinates:[
      {id:'u',type:'array',role:'native',quantity_kind:'contact-state',unit:null,dimension:'1'},
      {id:'period',type:'number',role:'auxiliary',quantity_kind:'return-period',unit:'flow-unit',dimension:'T'}
    ],
    time:{kind:'flow-parameter',unit:'flow-unit'},
    dynamics:{kind:'continuous',subtype:'Reeb/contact flow with explicit return paths'},
    geometry:[{kind:'contact-form'},{kind:'Reeb-vector-field'}],
    constraints:[
      defineConstraint({id:'unit_s3',kind:'normalization',status:'exact-by-construction'}),
      defineConstraint({id:'reeb_contact_equations',kind:'contact',status:'exact identity checked numerically'})
    ],
    invariants:[
      defineInvariant({
        id:'contact_residual',kind:'constraint',quantity_kind:'contact-equation-residual',unit:null,dimension:'1',
        evaluator:s=>{const r=actContactResidual(s.u);return Math.max(r.norm,r.alphaR,r.contraction);},
        normalization:1,tolerance:1e-12,coordinates:['u'],status:'exact identity / numerical residual',provenance:'core/atlas/extracted.mjs: actContactResidual'
      }),
      defineInvariant({
        id:'reeb_action',kind:'return',quantity_kind:'contact-action',unit:'flow-unit',dimension:'T',
        evaluator:s=>s.period,coordinates:['period'],status:'for normalized Reeb flow alpha(R)=1, closed-orbit action equals declared return period',
        provenance:'contact identity alpha(R)=1 together with the declared return period'
      })
    ],
    projections:[],
    domain:{assumptions:['standard contact form on the declared S3 model carrier','declared Reeb/ellipsoid/Legendrian constructions']},
    epistemic:{status:'derived',caveat:'Contact structure is not silently promoted to symplectic structure; cross-lab equivalence requires an explicit map.'},
    metadata:{metaplectic_double_cover:{two_pi:-1,four_pi:1,status:'representation',cross_domain_status:'analogy',source_relation:'act↔su2 Nexus edge'}},
    state_validator:validateUnitS3,
    adapter:Object.freeze({tau:ACT_TAU,dot:actDot,norm:actNorm,scale:actScale,J:actJ,alpha:actAlpha,dAlpha:actDAlpha,contactResidual:actContactResidual,reebPath:actReebPath,ellipsoidPath:actEllipsoidPath,legendrianPath:actLegendrianPath})
  });
}
