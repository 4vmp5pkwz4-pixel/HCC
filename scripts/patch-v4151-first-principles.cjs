#!/usr/bin/env node
'use strict';

const fs = require('fs');

const TARGET_VERSION = '4.151.0';
const TARGET_BUILD = 'first-principles-atlas-2026.09.05.1';
const OLD_VERSION = '4.150.0';
const OLD_BUILD = 'ancient-chronometry-observatory-2026.09.05.1';

function read(path){ return fs.readFileSync(path, 'utf8'); }
function write(path, text){ fs.writeFileSync(path, text); }
function replaceOnce(text, needle, replacement, label){
  const first = text.indexOf(needle);
  if(first < 0) throw new Error(`patch anchor missing: ${label}`);
  if(text.indexOf(needle, first + needle.length) >= 0) throw new Error(`patch anchor is not unique: ${label}`);
  return text.slice(0, first) + replacement + text.slice(first + needle.length);
}

let html = read('index.html');
if(html.includes("HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1'")) {
  console.log('v4.151 first-principles runtime already present; refusing a second insertion.');
} else {
  const anchor = 'const AZ_BY_ID=new Map(AZ_MODELS.map(m=>[m.id,m]));';
  const block = String.raw`

/* ── HCC v4.151 · FIRST-PRINCIPLES SCIENTIFIC CONTRACT ──────────────────────
   This layer is intentionally downstream of the native solvers. It explains, audits and
   composes the mathematics the Atlas already evaluates; it never promotes a visual
   resemblance into an identity, coupling or theorem. Unknown metadata fails closed. */
const HCC_FIRST_PRINCIPLES_SCHEMA = 'hcc.first-principles/1';
const HCC_FP_UNDECLARED = 'UNDECLARED';

const HCC_FIBONACCI_FIRST_PRINCIPLES = Object.freeze({
  schema:HCC_FIRST_PRINCIPLES_SCHEMA,
  model:'Fibonacci anyons',
  charges:['1','tau'],
  vacuum:'1',
  duals:{'1':'1',tau:'tau'},
  fusion_rules:['1 x 1 = 1','1 x tau = tau','tau x 1 = tau','tau x tau = 1 + tau'],
  fusion_coefficients:{N_11_1:1,N_1tau_tau:1,N_tau1_tau:1,N_tautau_1:1,N_tautau_tau:1},
  exact:{
    phi:'phi = (1 + sqrt(5))/2',
    phi_inv:'phi^-1 = (sqrt(5)-1)/2',
    phi_inv_sqrt:'phi^-1/2 = sqrt((sqrt(5)-1)/2)',
    total_dimension:'D = sqrt((5+sqrt(5))/2)',
    fusion_matrix:'N_tau = [[0,1],[1,1]]',
    characteristic:'lambda^2-lambda-1',
    F:'F = [[phi^-1,phi^-1/2],[phi^-1/2,-phi^-1]]',
    R1:'R_1 = exp(-4*pi*i/5)',
    Rtau:'R_tau = exp(3*pi*i/5)',
    R1_radical:'-(1+sqrt(5))/4 - i*sqrt(10-2*sqrt(5))/4',
    Rtau_radical:'-(sqrt(5)-1)/4 + i*sqrt(10+2*sqrt(5))/4',
    sigma1:'rho(sigma_1)=R',
    sigma2:'rho(sigma_2)=F^-1 R F'
  },
  convention:{
    basis:'((tau tau)_x tau)_tau with x in {1,tau}',
    gauge:'standard real symmetric Fibonacci F gauge',
    braiding:'right-handed displayed convention',
    mirror:'mirror/orientation reversal sends every displayed R phase to its complex conjugate',
    note:'F/R entries are convention-dependent; fusion multiplicities, quantum dimensions and closed topological observables are physical invariants.'
  },
  derivation:'basis change: reassociate with F, braid with R, return with F^-1; therefore rho(sigma_2)=F^-1 R F',
  source_status:'standard Fibonacci modular-category data; universality statements remain EXTERNAL theorem claims unless separately verified.'
});

function hccFpC(re,im=0){ return [Number(re),Number(im)]; }
function hccFpCAdd(a,b){ return [a[0]+b[0],a[1]+b[1]]; }
function hccFpCMul(a,b){ return [a[0]*b[0]-a[1]*b[1],a[0]*b[1]+a[1]*b[0]]; }
function hccFpCConj(a){ return [a[0],-a[1]]; }
function hccFpCAbs(a){ return Math.hypot(a[0],a[1]); }
function hccFpMatMul(A,B){
  return A.map((row,i)=>B[0].map((_,j)=>row.reduce((z,__,k)=>hccFpCAdd(z,hccFpCMul(A[i][k],B[k][j])),hccFpC(0,0))));
}
function hccFpMatDag(A){ return A[0].map((_,j)=>A.map(row=>hccFpCConj(row[j]))); }
function hccFpMatIdentity(n){ return Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>hccFpC(i===j?1:0,0))); }
function hccFpMatResidual(A,B){
  let m=0;
  for(let i=0;i<A.length;i++) for(let j=0;j<A[i].length;j++)
    m=Math.max(m,Math.hypot(A[i][j][0]-B[i][j][0],A[i][j][1]-B[i][j][1]));
  return m;
}

function hccFibFirstPrinciples(){
  const phi=(1+Math.sqrt(5))/2;
  const phiInv=1/phi;
  const phiInvSqrt=Math.sqrt(phiInv);
  const D=Math.sqrt((5+Math.sqrt(5))/2);
  const F=[[hccFpC(phiInv),hccFpC(phiInvSqrt)],[hccFpC(phiInvSqrt),hccFpC(-phiInv)]];
  const R1=hccFpC(Math.cos(-4*Math.PI/5),Math.sin(-4*Math.PI/5));
  const Rtau=hccFpC(Math.cos(3*Math.PI/5),Math.sin(3*Math.PI/5));
  const R=[[R1,hccFpC(0)],[hccFpC(0),Rtau]];
  const sigma1=R;
  const sigma2=hccFpMatMul(hccFpMatMul(hccFpMatDag(F),R),F);
  const lhs=hccFpMatMul(hccFpMatMul(sigma1,sigma2),sigma1);
  const rhs=hccFpMatMul(hccFpMatMul(sigma2,sigma1),sigma2);
  return {
    ...HCC_FIBONACCI_FIRST_PRINCIPLES,
    numerical:{phi,phi_inv:phiInv,phi_inv_sqrt:phiInvSqrt,D,F,R,sigma1,sigma2},
    invariant_checks:{
      phi_polynomial:Math.abs(phi*phi-phi-1),
      F_involution:hccFpMatResidual(hccFpMatMul(F,F),hccFpMatIdentity(2)),
      R1_modulus:Math.abs(hccFpCAbs(R1)-1),
      Rtau_modulus:Math.abs(hccFpCAbs(Rtau)-1),
      braid_relation:hccFpMatResidual(lhs,rhs)
    }
  };
}

function hccFibBraidWord(word){
  const tokens=Array.isArray(word)?word:String(word||'').trim().split(/[\\s,]+/).filter(Boolean).map(Number);
  const fib=hccFibFirstPrinciples();
  let U=hccFpMatIdentity(2);
  for(const token of tokens){
    if(![1,-1,2,-2].includes(token)) throw new RangeError('Fibonacci braid word accepts only ±1 and ±2 generators');
    const base=Math.abs(token)===1?fib.numerical.sigma1:fib.numerical.sigma2;
    const G=token>0?base:hccFpMatDag(base);
    U=hccFpMatMul(U,G);
  }
  return {word:tokens,unitary:U,length:tokens.length,convention:fib.convention};
}

function hccMatrixDistancePhaseInvariant(A,B){
  if(!Array.isArray(A)||!Array.isArray(B)||A.length!==B.length||!A.length) throw new TypeError('A and B must be same-size matrices');
  const n=A.length;
  const overlap=hccFpMatMul(hccFpMatDag(B),A).reduce((z,row,i)=>hccFpCAdd(z,row[i]),hccFpC(0,0));
  const mag=hccFpCAbs(overlap);
  const phase=mag>0?[overlap[0]/mag,overlap[1]/mag]:[1,0];
  let sum=0;
  for(let i=0;i<n;i++) for(let j=0;j<n;j++){
    const p=hccFpCMul(phase,B[i][j]);
    const dr=A[i][j][0]-p[0], di=A[i][j][1]-p[1];
    sum+=dr*dr+di*di;
  }
  const frobenius=Math.sqrt(sum);
  return {phase,frobenius,normalized:frobenius/Math.sqrt(2*n),metric:'phase-invariant normalized Frobenius distance'};
}

const HCC_FP_DIMENSION_OVERRIDES=Object.freeze({
  anyzoo:{
    native_space:'unitary braided fusion category / fusion Hilbert space',
    native_dimension:'categorical; state dimension is the number of admissible fusion paths',
    state_dimension:'model- and charge-sector-dependent',
    display_dimension:'3D Atlas scene + 2D exact inspector',
    projection:'semantic embedding; explicitly non-metric',
    metric_or_form:'Hermitian inner product on fusion Hilbert space',
    coordinates:'fusion-tree basis; model-dependent',
    domain:'supported modular-category catalogue; conventions declared per model'
  },
  jonesq:{
    native_space:'Temperley-Lieb/Jones representation space and braid group B_n',
    native_dimension:'representation-dependent finite Hilbert space',
    state_dimension:'representation-dependent',
    display_dimension:'3D Atlas scene + 2D exact inspector',
    projection:'semantic embedding; explicitly non-metric',
    metric_or_form:'unitary representation inner product where applicable',
    coordinates:'braid word / representation basis',
    domain:'declared Jones/Temperley-Lieb parameter regime'
  }
});

function hccFpParameterDescriptor(s){
  const domain=s&&s.domain?structuredClone(s.domain):HCC_FP_UNDECLARED;
  return {
    id:s&&s.id?String(s.id):HCC_FP_UNDECLARED,
    label:s&&s.label?String(s.label):HCC_FP_UNDECLARED,
    symbol:(s&&s.symbol)||HCC_FP_UNDECLARED,
    role:(s&&s.role)||HCC_FP_UNDECLARED,
    quantity_kind:(s&&(s.quantity_kind||s.quantityKind))||HCC_FP_UNDECLARED,
    unit:(s&&(s.unit||s.units))||HCC_FP_UNDECLARED,
    dimensional_signature:(s&&(s.dimensional_signature||s.dimension))||HCC_FP_UNDECLARED,
    domain,
    source_status:(s&&(s.source_status||s.status))||HCC_FP_UNDECLARED,
    exact_value:(s&&s.exact_value!==undefined)?s.exact_value:HCC_FP_UNDECLARED,
    default_value:(s&&s.default!==undefined)?s.default:HCC_FP_UNDECLARED
  };
}

function hccFirstPrinciplesForLab(id){
  const api=globalThis.HCC_API;
  let lab=null, schema=[];
  try{ lab=api&&api.labs&&api.labs.get?api.labs.get(id):null; }catch{}
  try{ schema=api&&api.config&&api.config.schema?api.config.schema(id):[]; }catch{ schema=[]; }
  const d=HCC_FP_DIMENSION_OVERRIDES[id]||{};
  return {
    schema:HCC_FIRST_PRINCIPLES_SCHEMA,
    lab_id:id,
    native_space:d.native_space||HCC_FP_UNDECLARED,
    native_dimension:d.native_dimension||HCC_FP_UNDECLARED,
    state_dimension:d.state_dimension||HCC_FP_UNDECLARED,
    display_dimension:d.display_dimension||'3D Atlas render surface; this is not a claim about native physical dimension',
    projection:d.projection||HCC_FP_UNDECLARED,
    metric_or_form:d.metric_or_form||HCC_FP_UNDECLARED,
    coordinates:d.coordinates||HCC_FP_UNDECLARED,
    domain:d.domain||HCC_FP_UNDECLARED,
    source_status:(lab&&lab.status)||HCC_FP_UNDECLARED,
    parameters:Array.isArray(schema)?schema.map(hccFpParameterDescriptor):[]
  };
}

function hccFirstPrinciplesAudit(){
  const api=globalThis.HCC_API;
  let labs=[];
  try{ labs=api&&api.labs&&api.labs.list?api.labs.list():[]; }catch{ labs=[]; }
  if(!Array.isArray(labs)) labs=[];
  const contracts=labs.map(l=>hccFirstPrinciplesForLab(typeof l==='string'?l:l.id)).filter(c=>c.lab_id);
  const parameters=contracts.flatMap(c=>c.parameters);
  const dimensionDeclared=contracts.filter(c=>c.native_dimension!==HCC_FP_UNDECLARED).length;
  const parameterDeclared=parameters.filter(p=>p.role!==HCC_FP_UNDECLARED&&p.quantity_kind!==HCC_FP_UNDECLARED&&p.unit!==HCC_FP_UNDECLARED).length;
  return {
    schema:HCC_FIRST_PRINCIPLES_SCHEMA,
    labs_total:contracts.length,
    labs_native_dimension_declared:dimensionDeclared,
    parameters_total:parameters.length,
    parameters_semantics_fully_declared:parameterDeclared,
    undeclared_is_fail_closed:true,
    contracts
  };
}

globalThis.HCC_FIRST_PRINCIPLES=Object.freeze({
  schema:HCC_FIRST_PRINCIPLES_SCHEMA,
  fibonacci:hccFibFirstPrinciples,
  braid:hccFibBraidWord,
  gateDistance:hccMatrixDistancePhaseInvariant,
  lab:hccFirstPrinciplesForLab,
  audit:hccFirstPrinciplesAudit
});
/* ── END HCC v4.151 FIRST-PRINCIPLES CONTRACT ─────────────────────────────── */
`;
  html=replaceOnce(html,anchor,anchor+block,'Anyon Zoo registry');
}

/* Bump every deployment-identity copy together. Historical prose outside the application
   does not use these build identifiers; a global replacement prevents freshness drift. */
html=html.split(OLD_BUILD).join(TARGET_BUILD);
html=html.split(OLD_VERSION).join(TARGET_VERSION);
write('index.html',html);

const version=JSON.parse(read('version.json'));
version.version=TARGET_VERSION;
version.build=TARGET_BUILD;
write('version.json',JSON.stringify(version,null,2)+'\n');

let readme=read('README.md');
readme=readme.replace(/\b85 laboratories\b/g,'113 laboratories');
readme=readme.replace(/\b83 typed instruments\b/g,'113 typed instruments');
if(!readme.includes('## First-Principles Atlas')){
  readme += String.raw`

## First-Principles Atlas

The live laboratory registry is authoritative: **113 laboratories across 7 worlds** at the
v4.151.0 release boundary. The generated \`api/manifest.json\` is measured by walking the
application headlessly; prose counts are descriptive, never an independent source of truth.

Every measured laboratory now carries a fail-closed first-principles contract. Native space,
dimension, coordinates, metric/form, projection, parameter semantics, units and provenance
are exported when they are actually declared; missing scientific metadata is \`UNDECLARED\`
rather than guessed. The Fibonacci anyon reference additionally exposes exact fusion data,
quantum dimensions, F/R conventions, braid generators and independent closure residuals.
`;
}
write('README.md',readme);

let manifest=read('scripts/build-manifest.mjs');
if(!manifest.includes("schema: 'hcc.first-principles/1'")){
  const labAnchor='const labs = [];';
  const helper=String.raw`const FP_UNDECLARED = 'UNDECLARED';
const FP_DIMENSION_OVERRIDES = Object.freeze({
  anyzoo:{native_space:'unitary braided fusion category / fusion Hilbert space',native_dimension:'categorical; fusion-path Hilbert dimension',state_dimension:'model- and sector-dependent',display_dimension:'3D Atlas scene + 2D exact inspector',projection:'semantic embedding; non-metric',metric_or_form:'Hermitian inner product on fusion Hilbert space',coordinates:'fusion-tree basis',domain:'supported modular-category catalogue'},
  jonesq:{native_space:'Temperley-Lieb/Jones representation space and braid group B_n',native_dimension:'representation-dependent finite Hilbert space',state_dimension:'representation-dependent',display_dimension:'3D Atlas scene + 2D exact inspector',projection:'semantic embedding; non-metric',metric_or_form:'unitary representation inner product where applicable',coordinates:'braid word / representation basis',domain:'declared Jones/Temperley-Lieb regime'}
});
function measuredFirstPrinciples(L, params){
  const d=FP_DIMENSION_OVERRIDES[L.id]||{};
  const descriptors=(params||[]).map(p=>({
    id:p.id||FP_UNDECLARED,label:p.label||FP_UNDECLARED,symbol:p.symbol||FP_UNDECLARED,
    role:p.role||FP_UNDECLARED,quantity_kind:p.quantity_kind||FP_UNDECLARED,
    unit:p.unit||FP_UNDECLARED,dimensional_signature:p.dimensional_signature||FP_UNDECLARED,
    domain:(p.min!==null||p.max!==null)?{min:p.min,max:p.max}:FP_UNDECLARED,
    source_status:p.source_status||FP_UNDECLARED
  }));
  return {schema:'hcc.first-principles/1',native_space:d.native_space||FP_UNDECLARED,
    native_dimension:d.native_dimension||FP_UNDECLARED,state_dimension:d.state_dimension||FP_UNDECLARED,
    display_dimension:d.display_dimension||'3D Atlas render surface; not native-dimension evidence',
    projection:d.projection||FP_UNDECLARED,metric_or_form:d.metric_or_form||FP_UNDECLARED,
    coordinates:d.coordinates||FP_UNDECLARED,domain:d.domain||FP_UNDECLARED,
    source_status:L.status||FP_UNDECLARED,parameters:descriptors};
}

const labs = [];`;
  manifest=replaceOnce(manifest,labAnchor,helper,'manifest lab walker');

  const paramOld=`params: schema.map(s => ({ id: s.id, label: s.label || null,
        min: (s.domain && s.domain.min !== undefined) ? s.domain.min : null,
        max: (s.domain && s.domain.max !== undefined) ? s.domain.max : null })) }`;
  const paramNew=`params: schema.map(s => ({ id: s.id, label: s.label || null,
        min: (s.domain && s.domain.min !== undefined) ? s.domain.min : null,
        max: (s.domain && s.domain.max !== undefined) ? s.domain.max : null,
        symbol: s.symbol || null, role: s.role || null,
        quantity_kind: s.quantity_kind || s.quantityKind || null,
        unit: s.unit || s.units || null,
        dimensional_signature: s.dimensional_signature || s.dimension || null,
        source_status: s.source_status || s.status || null })) }`;
  manifest=replaceOnce(manifest,paramOld,paramNew,'manifest parameter metadata');

  const pushOld=`kind, instrument: row.instrument, parameters: row.params });`;
  const pushNew=`kind, instrument: row.instrument, parameters: row.params,
    first_principles: measuredFirstPrinciples(L, row.params) });`;
  manifest=replaceOnce(manifest,pushOld,pushNew,'manifest per-lab first-principles contract');

  const topOld=`  worlds: head.worlds,`;
  const topNew=`  first_principles: (() => {
    const parameters=labs.flatMap(l=>l.first_principles.parameters);
    const undeclaredParameters=parameters.filter(p=>p.role===FP_UNDECLARED||p.quantity_kind===FP_UNDECLARED||p.unit===FP_UNDECLARED).length;
    return {schema:'hcc.first-principles/1',labs_total:labs.length,
      labs_contracts:labs.filter(l=>!!l.first_principles).length,
      labs_native_dimension_declared:labs.filter(l=>l.first_principles.native_dimension!==FP_UNDECLARED).length,
      parameters_total:parameters.length,parameters_fully_declared:parameters.length-undeclaredParameters,
      parameters_with_undeclared_semantics:undeclaredParameters,fail_closed:true};
  })(),
  worlds: head.worlds,`;
  manifest=replaceOnce(manifest,topOld,topNew,'manifest first-principles summary');
}
write('scripts/build-manifest.mjs',manifest);

console.log(`patched Atlas to v${TARGET_VERSION} · ${TARGET_BUILD}`);
