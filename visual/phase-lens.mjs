const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const statusClass=s=>{
  const x=String(s||'').toUpperCase();
  if(x==='REFUSED') return 'REFUSED';
  if(x.includes('CANDIDATE')) return 'CANDIDATE';
  if(x.includes('EXACT')||x==='NUMERICALLY_VERIFIED_MAP') return 'EXACT';
  if(x.includes('CONDITIONAL')) return 'CONDITIONAL';
  return 'ANALOGY';
};
const compact=v=>typeof v==='string'?v:JSON.stringify(v);
const touches=(x,id)=>x?.source===id||x?.target===id;

export function phaseLensModel(snapshot,{labId,includeCandidates=false,report=null}={}){
  if(!snapshot||snapshot.schema!=='hcc.phase-space/1') throw new TypeError('hcc.phase-space/1 snapshot required');
  const lab=(snapshot.spaces||[]).find(x=>x.id===labId);
  if(!lab) throw Object.assign(new Error(`no phase-space laboratory "${labId}"`),{code:'NOT_FOUND'});
  const bridgeRows=[...(snapshot.bridges||[]).filter(x=>touches(x,labId))];
  if(includeCandidates) bridgeRows.push(...(snapshot.candidates||[]).filter(x=>touches(x,labId)));
  return Object.freeze({
    lab:Object.freeze({id:lab.id,title:lab.title||lab.id,epistemic:lab.epistemic||null}),
    carrier:`${lab.carrier?.kind??'UNDECLARED'}${lab.carrier?.dimension!==undefined?` · dim ${lab.carrier.dimension}`:''}`,
    time:compact(lab.time??'UNDECLARED'),
    dynamics:compact(lab.dynamics??'UNDECLARED'),
    constraints:Object.freeze((lab.constraints||[]).map(x=>Object.freeze({id:x.id,kind:x.kind,status:x.status}))),
    invariants:Object.freeze((lab.invariants||[]).map(x=>Object.freeze({id:x.id,kind:x.kind,status:x.status,statusClass:statusClass(x.kind==='exact'?'EXACT':x.status)}))),
    projections:Object.freeze((lab.projections||[]).map(x=>Object.freeze({id:x.id,kind:x.kind,label:x.scientific_eligible===false?'PROJECTION ONLY':'SCIENTIFIC PROJECTION'}))),
    validity:compact(lab.domain??'UNDECLARED'),
    freshness:Object.freeze({generated_on_this_release:!!snapshot.generated_on_this_release,stale:!!snapshot.stale}),
    bridges:Object.freeze(bridgeRows.map(x=>Object.freeze({id:x.id,source:x.source,target:x.target,status:x.status,statusClass:statusClass(x.status),canonical:!x.noncanonical,label:x.noncanonical?'Candidate · review required':String(x.status||'UNDECLARED'),passed:x.passed||[],unproven:x.unproven||[]}))),
    refusal:report?.status==='REFUSED'?Object.freeze({code:report.code||'REFUSED',message:report.message||report.reason||'comparison refused'}):null
  });
}

export function renderPhaseLensHtml(model){
  const rows=(xs,empty='None declared')=>xs.length?xs.map(x=>`<li><b>${esc(x.id)}</b> · ${esc(x.kind||'')} · ${esc(x.status||x.label||'')}</li>`).join(''):`<li>${esc(empty)}</li>`;
  const bridges=model.bridges.length?model.bridges.map(b=>`<li data-phase-status="${esc(b.statusClass)}"><b>${esc(b.statusClass)}</b> · ${esc(b.label)} · ${esc(b.source)} → ${esc(b.target)}</li>`).join(''):'<li>No registered bridge for this slice</li>';
  const refusal=model.refusal?`<section class="phase-refusal" data-phase-status="REFUSED"><h4>REFUSED · ${esc(model.refusal.code)}</h4><p>${esc(model.refusal.message)}</p></section>`:'';
  return `<article class="phase-lens" data-phase-lab="${esc(model.lab.id)}"><header><small>Phase Lens · native-state inspection</small><h3>${esc(model.lab.title)}</h3></header><dl><dt>Carrier</dt><dd>${esc(model.carrier)}</dd><dt>Evolution parameter</dt><dd>${esc(model.time)}</dd><dt>Dynamics</dt><dd>${esc(model.dynamics)}</dd><dt>Validity domain</dt><dd>${esc(model.validity)}</dd></dl><section><h4>Constraints</h4><ul>${rows(model.constraints)}</ul></section><section><h4>Invariants / balances</h4><ul>${rows(model.invariants)}</ul></section><section><h4>Projection firewall</h4><ul>${model.projections.length?model.projections.map(p=>`<li><b>${esc(p.label)}</b> · ${esc(p.id)}</li>`).join(''):'<li>No display projection declared</li>'}</ul></section><section><h4>Bridge inspector</h4><ul>${bridges}</ul></section>${refusal}<footer>Spatial proximity and phase fingerprint similarity do not establish physical identity.</footer></article>`;
}

export async function loadPhaseSnapshot(url='./api/phase-space.json',fetchImpl=fetch){
  const r=await fetchImpl(url,{cache:'no-store',credentials:'omit'});
  if(!r.ok) throw Object.assign(new Error(`phase-space registry unavailable (${r.status})`),{code:'PHASE_REGISTRY_UNAVAILABLE'});
  return r.json();
}

export function mountPhaseLens(root,snapshot,options={}){
  if(!root) throw new TypeError('Phase Lens root element required');
  const model=phaseLensModel(snapshot,options); root.innerHTML=renderPhaseLensHtml(model); return model;
}
