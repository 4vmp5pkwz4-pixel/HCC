/** Static Atlas SDK. Import locally in Node 18+ or by URL in a browser.
 * No server discovery side effects, code evaluation, UI mutation or WebGL.
 */
import {forecastReach,listReachControls,validateReachArtifact} from '../core/prediction/reach-forecast.mjs';
import {auditForecast,AUDIT_INPUT_SCHEMA} from '../core/prediction/forecast-audit.mjs';
export {auditForecast,AUDIT_INPUT_SCHEMA};
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
    discover:()=>copy({schema:'hcc.agent-session/1',...identity,base_url:base.href,counts:manifest.counts,
      access:{static_catalogue:true,static_scaling:true,static_forecast_audit:true,public_http_compute:false,
        full_atlas:'index.html?render=0',self_hosted_compute:'node server/server.mjs'},
      controls:listReachControls(reach),worlds:manifest.worlds||[],labs:manifest.labs||[],multiview:manifest.multiview||[]}),
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
