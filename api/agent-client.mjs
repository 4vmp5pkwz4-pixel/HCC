/** Static Atlas SDK. Import locally in Node 18+ or by URL in a browser.
 * No server discovery side effects, code evaluation, UI mutation or WebGL.
 */
import {forecastReach,listReachControls,validateReachArtifact} from '../core/prediction/reach-forecast.mjs';
import {auditForecast,AUDIT_INPUT_SCHEMA} from '../core/prediction/forecast-audit.mjs';
import {measureS3,stereographicToS3,s3ToStereographic,hopfBase} from '../core/math/s3-geometry.mjs';
import * as researchGeometry from '../core/research/geometry.mjs';
import {CATALOG} from '../core/research/catalog.mjs';
export {flrw,geometryAudit,curvatureDiagnostic,constantCurvatureFit,scalarMode,lensingKernel,delensingResidual} from '../core/research/geometry.mjs';
export {capObservability,capVolumeFraction,radialGram,scalarBandCount} from '../core/math/s3-cap-observability.mjs';
export {searchMathCatalog,bridgeVerdict} from '../core/research/math-bridges.mjs';
export const researchCatalog=()=>structuredClone(CATALOG);
export {auditForecast,AUDIT_INPUT_SCHEMA};
export {measureS3,stereographicToS3,s3ToStereographic,hopfBase};
const copy = value => JSON.parse(JSON.stringify(value));

export async function auditWithProvenance(input) {
  // Hash the exact UTF-8 JSON representation supplied to this call; keep it for replay.
  const input_json=JSON.stringify(input);
  const result=auditForecast(input);
  const cryptoAPI=globalThis.crypto?.subtle ? globalThis.crypto :
    typeof process!=='undefined' && process.versions?.node ? (await import('node:crypto')).webcrypto : null;
  if(!cryptoAPI) throw new Error('SHA-256 export requires a secure browser context (HTTPS) or Node.js');
  const digest=await cryptoAPI.subtle.digest('SHA-256',new TextEncoder().encode(input_json));
  return {...result,reproducibility:{algorithm:'SHA-256',
    input_sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join(''),input_json}};
}

/* ── THE INSTRUMENTS ──────────────────────────────────────────────────────────
   Every laboratory of the atlas whose evaluate() is pure mathematics, lifted verbatim out of
   index.html by scripts/extract-kernels.mjs — the same lines the page runs, with no browser,
   no WebGL and no server. The module is ~1.3 MB, so it is imported only when first asked for.
   An input outside its declared range is REFUSED, never clamped; an instrument that needs the
   page is reported with its reason rather than answered with a guess. */
let instrumentModule=null;
const loadInstruments=()=>instrumentModule||(instrumentModule=import('../core/atlas/instruments.mjs'));
export async function listInstruments({query=''}={}) {
  const M=await loadInstruments(),q=String(query).trim().toLocaleLowerCase();
  const rows=Object.entries(M.INSTRUMENT_META).map(([id,m])=>({id,lab:m.lab,runnable:true,inputs:m.inputs,outputs:m.outputs}))
    .concat(Object.entries(M.PAGE_ONLY).map(([id,reason])=>({id,runnable:false,reason,page:'index.html?render=0 → HCC_API.evaluate'})));
  return copy(q?rows.filter(r=>JSON.stringify(r).toLocaleLowerCase().includes(q)):rows);
}
export async function evaluateInstrument(id,input={}) {
  const M=await loadInstruments(),meta=M.INSTRUMENT_META[id],fn=M.INSTRUMENTS[id];
  if(!meta||typeof fn!=='function') {
    if(M.PAGE_ONLY[id]) throw Object.assign(new Error(`Instrument "${id}" needs the page: ${M.PAGE_ONLY[id]}`),{code:'PAGE_ONLY'});
    throw Object.assign(new Error('Unknown instrument: '+String(id)),{code:'NOT_FOUND'});
  }
  if(input===null||typeof input!=='object'||Array.isArray(input)) throw Object.assign(new TypeError('input must be an object'),{code:'INVALID_INPUT'});
  const known=new Map(meta.inputs.map(i=>[i.name,i])),full={};
  for(const k of Object.keys(input)) if(!known.has(k))
    throw Object.assign(new RangeError(`"${id}" has no input "${k}"; it takes: ${[...known.keys()].join(', ')||'nothing'}`),{code:'INVALID_INPUT'});
  for(const i of meta.inputs) {
    const v=Object.hasOwn(input,i.name)?input[i.name]:i.default;
    if(typeof i.default==='number') {
      if(typeof v!=='number'||!Number.isFinite(v)) throw Object.assign(new RangeError(`${id}.${i.name} must be a finite number`),{code:'INVALID_INPUT'});
      if((i.min!=null&&v<i.min)||(i.max!=null&&v>i.max))
        throw Object.assign(new RangeError(`${id}.${i.name} = ${v} is outside [${i.min??'−∞'}, ${i.max??'+∞'}] — refused, not clamped`),{code:'OUT_OF_DOMAIN'});
    }
    full[i.name]=v;
  }
  const output=fn(full);
  return copy({schema:'hcc.instrument-result/1',id,lab:meta.lab,input:full,output,units:Object.fromEntries(meta.outputs.map(o=>[o.name,o.unit??null])),
    source:{file:'index.html',sha256_16:M.SOURCE_SHA16,atlas_version:M.ATLAS_VERSION,extraction:'verbatim'}});
}

export async function connectAtlas(baseURL=new URL('../',import.meta.url).href,{timeout_ms=15000}={}) {
  const base=new URL(baseURL);
  if(!['http:','https:'].includes(base.protocol)) throw new Error('Atlas baseURL must be an HTTP(S) directory URL');
  if(!base.pathname.endsWith('/')) base.pathname+='/';
  base.search=''; base.hash='';
  if(!Number.isFinite(timeout_ms)||timeout_ms<1||timeout_ms>120000) throw new RangeError('timeout_ms must be 1..120000');
  async function read(path) {
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout_ms);
    try {
      const r=await fetch(new URL(path,base),{cache:'no-store',signal:controller.signal});
      if(!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return await r.json();
    } finally {clearTimeout(timer);}
  }
  const [identity,manifest,reach]=await Promise.all([read('version.json'),read('api/manifest.json'),read('api/reach.json')]);
  if(typeof identity.version!=='string'||!identity.version||typeof identity.build!=='string'||!identity.build)
    throw new Error('Invalid Atlas release identity');
  if(manifest.schema!=='hcc.manifest/2'||!Array.isArray(manifest.instruments)) throw new Error('Invalid Atlas manifest schema');
  if(manifest.version!==identity.version||manifest.build!==identity.build) throw new Error('Atlas release mismatch: manifest; reload after deployment completes');
  const verdict=validateReachArtifact(reach,identity);
  if(!verdict.ok) throw new Error('Atlas release mismatch: '+verdict.error);
  const instruments=manifest.instruments;
  return Object.freeze({
    research:Object.freeze({...researchGeometry,catalog:researchCatalog}),
    geometry:Object.freeze({measureS3,stereographicToS3,s3ToStereographic,hopfBase}),
    discover:()=>copy({schema:'hcc.agent-session/1',...identity,base_url:base.href,counts:manifest.counts,
      access:{static_catalogue:true,static_scaling:true,static_forecast_audit:true,public_http_compute:false,
        full_atlas:'index.html?render=0',self_hosted_compute:'node server/server.mjs'},
      controls:listReachControls(reach,identity),worlds:manifest.worlds||[],labs:manifest.labs||[],multiview:manifest.multiview||[]}),
    search:({query='',world='',status=''}={})=>{
      const q=String(query).trim().toLocaleLowerCase();
      return copy(instruments.filter(i=>(!world||i.world===world)&&(!status||i.status===status)&&
        (!q||JSON.stringify(i).toLocaleLowerCase().includes(q)))
        .sort((a,b)=>Number(b.id.toLocaleLowerCase()===q)-Number(a.id.toLocaleLowerCase()===q)));
    },
    describe:id=>{
      const i=instruments.find(x=>x.id===id);
      if(!i) throw new Error('Unknown instrument: '+String(id));
      return copy(i);
    },
    forecast:(control,delta=.1)=>copy(forecastReach(reach,control,delta,identity)),
    audit:async input=>({...await auditWithProvenance(input),atlas_identity:copy(identity)})
  });
}
