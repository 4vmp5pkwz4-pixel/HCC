import {capObservability} from '../core/math/s3-cap-observability.mjs';
import {searchMathCatalog,bridgeVerdict} from '../core/research/math-bridges.mjs';
const $=id=>document.getElementById(id),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={tab:'map',gate:null,page:0,query:'',discipline:'',artifactOnly:false,L:6,angle:4.8};
const labels={direct:'ПРЯМОЙ КАНДИДАТ',method:'МЕТОД',conditional:'УСЛОВНЫЙ МОСТ',blocked:'ПЕРЕНОС ЗАБЛОКИРОВАН'};
let catalog,audit,problems,manifest;
async function read(path){const r=await fetch(new URL(path,import.meta.url),{cache:'no-store'});if(!r.ok)throw new Error(`${path}: ${r.status}`);return r.json();}
function routes(ids){return (ids||[]).map(id=>{const lab=manifest.labs.find(l=>l.id===id);return lab?`<a href="./index.html#/world/${esc(lab.world)}/lab/${esc(id)}">${esc(lab.title)} ↗</a>`:'';}).join('');}
function setTab(id){state.tab=id;for(const b of document.querySelectorAll('[data-tab]')){const on=b.dataset.tab===id;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1;$(b.dataset.tab).hidden=!on;}}
function sourceMap(bridges,gate){
 const ids=[...new Set(bridges.map(b=>b.family))],height=Math.max(240,ids.length*32+45),mid=height/2;
 const y=i=>30+i*32;
 return `<svg class="proof-map" viewBox="0 0 560 ${height}" role="img" aria-label="Кандидаты из ${ids.length} семейств связаны с выбранной задачей; доказательство переноса остаётся открытым">${ids.map((id,i)=>`<path d="M105 ${y(i)}C215 ${y(i)},240 ${mid},335 ${mid}"/><circle cx="90" cy="${y(i)}" r="12"/><text x="15" y="${y(i)+4}">${esc(id)}</text>`).join('')}<circle class="target" cx="345" cy="${mid}" r="26"/><text text-anchor="middle" x="345" y="${mid+5}">HCC</text><path d="M375 ${mid}C405 ${mid},410 ${mid+70},450 ${mid+70}"/><circle class="end" cx="466" cy="${mid+70}" r="15"/><text text-anchor="middle" x="466" y="${mid+74}">?</text><text class="caption" text-anchor="middle" x="345" y="${mid-40}">задача</text><text class="caption" text-anchor="middle" x="463" y="${mid+103}">недостающий переход</text></svg><p class="muted">Пунктир — связь исследования. Граф не является цепью доказательства.</p>`;
}
function renderMap(){
 const gate=audit.gates.find(g=>g.id===state.gate)||audit.gates[0];state.gate=gate.id;
 $('gate-buttons').innerHTML=audit.gates.map(g=>`<button data-gate="${esc(g.id)}" aria-pressed="${g.id===gate.id}" class="${g.id===gate.id?'active':''}">${esc(g.title)}</button>`).join('');
 const bridges=audit.bridges.filter(b=>b.gate===gate.id);
 $('gate-content').innerHTML=`<div class="section-head"><div><p class="eyebrow">УСЛОВИЯ ПЕРЕНОСА / ${esc(gate.id)}</p><h2>${esc(gate.title)}</h2><p>${esc(gate.question)}</p></div><span class="badge">${esc(gate.status)}</span></div><div class="gate-summary"><article class="card"><h3>Что нужно для закрытия</h3><ul>${gate.requirements.map(x=>`<li>${esc(x)}</li>`).join('')}</ul><p>${esc(gate.progress)}</p><div class="actions">${routes(gate.targetLabs)}${gate.id==='observability'?'<button data-show="cap">Вычислить ограничение S³ →</button>':''}</div></article><article class="card">${sourceMap(bridges,gate)}</article></div><div class="bridge-grid">${bridges.map(b=>{
 const verdict=bridgeVerdict(b),f=catalog.families.find(f=>f.id===b.family);
 return `<article class="card"><header><div><p class="eyebrow">СЕМЕЙСТВО ${esc(b.family)}</p><h3>${esc(b.title)}</h3></div><span class="badge ${verdict.kind}">${labels[verdict.kind]}</span></header><p class="sub">${esc(b.theorem)} · ${esc(b.review_level||'PRIMARY_STATEMENT_REVIEW')}</p><p><b>Область источника:</b></p><ul>${b.hypotheses.map(h=>`<li>${esc(h)}</li>`).join('')}</ul><p><b>Что усиливает HCC:</b> ${esc(b.use)}</p><p><b>Что остаётся открытым:</b> ${esc(b.notClosed)}</p><details><summary>Точное покрытие артефактов и пробелы аудита</summary><p>${esc(b.leanCoverage||'Локальная проверка Lean не выполнялась; наличие записи в каталоге не удостоверяет это утверждение.')}</p><p>${esc(b.auditGap||'Проверены формулировки и применимость; полное независимое доказательство не воспроизводилось.')}</p></details><div class="actions"><a href="${esc(b.sourceURL)}" target="_blank" rel="noopener">Первоисточник ↗</a>${f?.lean_family_document?`<a href="${esc(f.lean_family_document)}" target="_blank" rel="noopener">Паспорт Lean ↗</a>`:''}<button data-family="${esc(b.family)}">Все работы семейства →</button></div></article>`;
 }).join('')}</div>${!bridges.length?'<p class="empty">Прямое закрытие в каталоге не найдено. Условия задачи сформулированы отдельно.</p>':''}`;
}
function renderCatalog(){
 const rows=searchMathCatalog(catalog,state),perPage=12,maxPage=Math.max(0,Math.ceil(rows.length/perPage)-1);state.page=Math.min(state.page,maxPage);
 $('catalog-count').textContent=`${rows.length} семейств · ${rows.reduce((s,f)=>s+f.papers.length,0)} рукописей · инструкции Lean требуют проверки точного покрытия.`;
 $('catalog-results').innerHTML=rows.slice(state.page*perPage,(state.page+1)*perPage).map(f=>`<article class="card"><header><div><p class="eyebrow">${esc(f.id)} / ${esc(f.discipline)}</p><h3>${esc(f.title)}</h3></div><span class="badge">SOURCE CLAIM</span></header><p>${esc(f.description)}</p><div class="actions">${audit.bridges.filter(b=>b.family===f.id).map(b=>`<button data-open-gate="${esc(b.gate)}">Связь с HCC →</button>`).join('')}${f.lean_family_document?`<a href="${esc(f.lean_family_document)}" target="_blank" rel="noopener">Инструкция Lean ↗</a>`:''}</div><details><summary>${f.papers.length} ${f.papers.length===1?'рукопись':'рукописей'} · аннотации и первоисточники</summary>${f.papers.map(p=>`<h4><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.title)} ↗</a></h4><p>${esc(p.abstract)}</p><p class="muted">${p.catalog_source_in_formalization_registry?'Источник упомянут в реестре формализаций. Точное покрытие проверяется отдельно.':'Подтверждение формализации этой рукописи здесь не установлено.'} · Lean build здесь не запускался.</p>`).join('')}</details></article>`).join('')||'<p class="empty">Совпадений нет. Попробуйте исходный английский термин.</p>';
 $('previous').disabled=state.page===0;$('next').disabled=state.page===maxPage;$('page-count').textContent=`${state.page+1} / ${maxPage+1}`;
}
function renderProblems(){
 const q=$('problem-search').value.toLowerCase(),rows=problems.problems.filter(p=>(p.lab_id+' '+p.problem).toLowerCase().includes(q));
 $('problem-count').textContent=`${rows.length} задач из ${problems.count}. Статусы исходного реестра сохранены.`;
 $('problem-results').innerHTML=rows.map(p=>{
 const id=p.lab_id.replace(/^atlas\./,''),candidates=audit.gates.filter(g=>g.targetLabs.includes(id));
 return `<article class="task"><h3>${esc(p.lab_id)} · ${esc(p.status)}</h3><details><summary>Прочитать задачу${candidates.length?' · есть тематические кандидаты':''}</summary><p>${esc(p.problem)}</p><div class="actions">${candidates.map(g=>`<button data-open-gate="${esc(g.id)}">${esc(g.title)} →</button>`).join('')}</div><p class="muted">${candidates.length?'Сопоставление по лаборатории; прямой перенос к этому утверждению не доказан.':'Соответствие конкретной теореме каталога не установлено.'}</p></details></article>`;
 }).join('');
}
function renderCap(){
 state.L=Number($('band').value);state.angle=Number($('aperture').value);
 $('band-value').textContent=state.L;$('aperture-value').textContent=`${state.angle.toFixed(2)}°`;
 const r=capObservability({L:state.L,chi:state.angle*Math.PI/180});
 const format=x=>x.toLocaleString('en',{maximumSignificantDigits:5});
 $('cap-numbers').innerHTML=[['Все скалярные моды',format(r.mode_count)],['Радиальное подпространство',String(r.radial_subspace_dimension)],['Доля объёма S³',format(r.volume_fraction)],['log₁₀ ‖T⁻¹‖, нижняя граница',r.log10_inverse_gain_lower_bound.toFixed(3)],['log₁₀ κ(T), нижняя граница',r.log10_condition_number_lower_bound.toFixed(3)]].map(([a,b])=>`<div class="metric"><span>${a}</span><strong>${b}</strong></div>`).join('');
 const points=Array.from({length:100},(_,i)=>{const t=-4+4*i/99,chi=Math.PI*10**t;return [t,capObservability({L:state.L,chi,includeGram:false}).log10_inverse_gain_lower_bound];});
 const max=Math.max(1,...points.map(p=>p[1])),X=x=>55+(x+4)*470/4,Y=y=>220-y*170/max;
 const path=points.map(([x,y],i)=>`${i?'L':'M'}${X(x).toFixed(2)},${Y(y).toFixed(2)}`).join(' '),px=X(Math.log10(r.chi_rad/Math.PI)),py=Y(r.log10_inverse_gain_lower_bound);
 $('cap-chart').innerHTML=`<svg class="plot" viewBox="0 0 570 285" role="img" aria-label="Нижняя граница усиления ошибки при изменении радиуса наблюдаемой области"><text x="55" y="24">log₁₀ ‖T⁻¹‖, нижняя граница</text>${[0,.25,.5,.75,1].map(t=>`<path d="M55 ${Y(max*t)}H530" stroke="#2a3d35"/><text x="47" y="${Y(max*t)+4}" text-anchor="end">${(max*t).toFixed(0)}</text>`).join('')}<path d="${path}" fill="none" stroke="#d6b77a" stroke-width="2"/><circle cx="${px}" cy="${py}" r="4" fill="#82dbbf"/>${[-4,-3,-2,-1,0].map(x=>`<text x="${X(x)}" y="247" text-anchor="middle">${x===0?'π':`10${['⁻⁴','⁻³','⁻²','⁻¹'][x+4]}π`}</text>`).join('')}<text x="290" y="273" text-anchor="middle">χ, рад · логарифмическая шкала</text></svg>`;
 const maxG=Math.max(...r.radial_gram.flat().map(Math.abs)),n=r.radial_subspace_dimension;
 $('gram').innerHTML=`<div class="gram-table" style="grid-template-columns:repeat(${n},1fr)" role="img" aria-label="Тепловая карта ${n} на ${n} радиальной матрицы; численные значения доступны в экспорте">${r.radial_gram.flat().map(v=>`<span title="${v.toPrecision(6)}" style="background:${v<0?'#b88963':'#75c4a7'};opacity:${maxG?Math.max(.05,Math.abs(v)/maxG):.05}"></span>`).join('')}</div><p class="gram-caption">Цветовая шкала относительна текущему максимуму |Gₙₘ| = ${maxG.toPrecision(4)}; цвет не является спектральным сертификатом.</p>`;
 $('cap-passport').textContent=JSON.stringify(r,null,2);
}
function download(){const snapshot={schema:'hcc.math-atlas-export/1',source_commit:catalog.source_commit,source_sha256:catalog.source_sha256,state:{...state},bridge_audit:audit,cap:capObservability({L:state.L,chi:state.angle*Math.PI/180}),catalog_counts:catalog.counts,open_problem_count:problems.count};const blob=new Blob([JSON.stringify(snapshot,null,2)],{type:'application/json'}),a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download='HCC_Math_Atlas_2026-10-10.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
try{
 [catalog,audit,problems,manifest]=await Promise.all([read('../api/math-catalog.json'),read('../api/math-bridges.json'),read('../api/open-problems.json'),read('../api/manifest.json')]);
 if(catalog.source_commit!==audit.source_commit)throw new Error('Снимки каталога и аудита не совпадают');
 $('counts').innerHTML=[[catalog.counts.manuscripts,'рукописей в полном индексе'],[catalog.counts.families,'семейства результатов'],[new Set(audit.bridges.map(b=>b.family)).size,'семейств с проверкой первоисточника'],[audit.gates.length,'явных задач и условий']].map(([a,b])=>`<div class="count"><b>${esc(a)}</b><span>${esc(b)}</span></div>`).join('');
 $('snapshot').textContent=`Снимок ${catalog.snapshot_date} · OpenAI Math ${catalog.source_commit.slice(0,12)} · Atlas ${manifest.version}`;
 $('scope').textContent=catalog.scope+' · '+audit.scope_ru;
 $('discipline').insertAdjacentHTML('beforeend',[...new Set(catalog.families.map(f=>f.discipline))].map(x=>`<option>${esc(x)}</option>`).join(''));
 $('world-links').innerHTML=manifest.worlds.map(w=>`<a href="./index.html#/world/${esc(w.id)}">${esc(w.title)} ↗</a>`).join('');
 state.gate=new URL(location.href).searchParams.get('gate')||'observability';renderMap();renderCap();renderCatalog();renderProblems();
 for(const b of document.querySelectorAll('[data-tab]')){b.addEventListener('click',()=>setTab(b.dataset.tab));b.addEventListener('keydown',e=>{const tabs=[...document.querySelectorAll('[data-tab]')],i=tabs.indexOf(b);if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;setTab(tabs[next].dataset.tab);tabs[next].focus();}});}
 document.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.gate){state.gate=b.dataset.gate;renderMap();}if(b.dataset.openGate){state.gate=b.dataset.openGate;renderMap();setTab('map');}if(b.dataset.show)setTab(b.dataset.show);if(b.dataset.family){$('search').value=b.dataset.family;state.query=b.dataset.family;state.discipline='';state.artifactOnly=false;$('discipline').value='';$('artifacts').checked=false;state.page=0;renderCatalog();setTab('catalog');}if(b.dataset.angle){$('aperture').value=b.dataset.angle;renderCap();}});
 for(const id of ['band','aperture'])$(id).addEventListener('input',renderCap);
 $('search').addEventListener('input',()=>{state.query=$('search').value;state.page=0;renderCatalog();});
 $('discipline').addEventListener('change',()=>{state.discipline=$('discipline').value;state.page=0;renderCatalog();});
 $('artifacts').addEventListener('change',()=>{state.artifactOnly=$('artifacts').checked;state.page=0;renderCatalog();});
 $('previous').addEventListener('click',()=>{state.page--;renderCatalog();});$('next').addEventListener('click',()=>{state.page++;renderCatalog();});
 $('problem-search').addEventListener('input',renderProblems);$('export').addEventListener('click',download);
}catch(e){$('error').hidden=false;$('error').textContent=`Раздел не загрузился: ${e.message}. Повторите загрузку после завершения публикации.`;$('counts').textContent='Источники недоступны; результаты не вычислены.';}
