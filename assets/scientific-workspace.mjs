import {connectAtlas,auditWithProvenance} from '../api/agent-client.mjs';
const el=id=>document.getElementById(id);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=x=>x==null?'—':typeof x==='object'?JSON.stringify(x):String(x);
const fmt=x=>typeof x!=='number'||!Number.isFinite(x)?'—':x===0?'0':Math.abs(x)>=1e6||Math.abs(x)<.001?x.toExponential(3):Number(x.toPrecision(5)).toLocaleString('ru-RU');
const metric=(label,value)=>`<div class="metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
const table=(headers,rows)=>`<table><thead><tr>${headers.map(x=>`<th scope="col">${esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
const download=(value,name)=>{
  const url=URL.createObjectURL(new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'}));
  const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
};
let sdk,session,selected=new URLSearchParams(location.search).get('instrument')||'bht',scalingResult=null;
const tabs=[...document.querySelectorAll('[data-tab]')];
function activate(id,update=true){
  if(!tabs.some(t=>t.dataset.tab===id))id='catalogue';
  tabs.forEach(t=>{const on=t.dataset.tab===id;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;el(t.dataset.tab).hidden=!on;});
  if(update)history.replaceState(null,'','#'+id);
}
tabs.forEach((t,i)=>{
  t.onclick=()=>activate(t.dataset.tab);
  t.onkeydown=e=>{
    const n=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;
    if(n!==null){e.preventDefault();activate(tabs[n].dataset.tab);tabs[n].focus();}
  };
});
window.addEventListener('hashchange',()=>activate(location.hash.slice(1),false));
activate(location.hash.slice(1),false);

function renderDetail(){
  if(!selected){el('instrument-detail').innerHTML='<p class="muted">По этому запросу ничего не найдено. Измените поиск или фильтры.</p>';return;}
  const i=sdk.describe(selected),lab=session.labs.find(l=>l.id===i.lab||l.instrument===i.id);
  const route=lab?.route && /^#\/world\/[a-z0-9_-]+\/lab\/[a-z0-9_-]+$/i.test(lab.route)?lab.route:null;
  const fields=(items,inputs)=>table(inputs?['Параметр','Единица','Значение / диапазон','Определение']:['Выход','Единица','Определение'],(items||[]).map(p=>{
    if(typeof p==='string')p={name:p};
    const range=p.min!=null||p.max!=null?`${text(p.min)} … ${text(p.max)}`:'не указан';
    return `<tr><td><code>${esc(p.name||p.id)}</code></td><td class="units">${esc(text(p.unit))}</td>${inputs?`<td>${esc(text(p.default))}<div class="small muted">${esc(p.enum?text(p.enum):range)}</div></td>`:''}<td class="muted">${esc(text(p.description||p.doc))}</td></tr>`;
  }));
  const details=(name,value)=>value?.length?`<details><summary>${esc(name)}</summary><ul>${value.map(x=>`<li>${esc(text(x))}</li>`).join('')}</ul></details>`:'';
  el('instrument-detail').innerHTML=`<div class="detail-head"><div><span class="id">${esc(i.world||'ATLAS')} / ${esc(i.id)}</span><h2>${esc(i.title)}</h2></div>${route?`<a class="button quiet" href="./index.html${esc(route)}">В лабораторию ↗</a>`:''}</div>
    <span class="tag">${esc(i.status||'Статус не объявлен')}</span>
    <p class="small muted">Статус относится к модели и её проверкам. Он не означает подтверждённую точность предсказания по независимым наблюдениям.</p>
    <h3 class="contract-heading">ВХОДНЫЕ ПАРАМЕТРЫ · ${(i.inputs||[]).length}</h3><div class="table-wrap">${fields(i.inputs,true)}</div>
    <h3 class="contract-heading">ВЫХОДНЫЕ ВЕЛИЧИНЫ · ${(i.outputs||[]).length}</h3><div class="table-wrap">${fields(i.outputs,false)}</div>
    ${details('Допущения',i.assumptions)}${details('Область применимости',i.domain_of_validity||i.limits)}${details('Критерии опровержения',i.falsifiers)}${details('Проверки',i.verifiers)}
    <div class="actions"><button id="export-contract" class="button quiet">Контракт JSON ↓</button><a class="button quiet" href="./api/open-problems.json">Открытые вопросы ↗</a></div>`;
  el('export-contract').onclick=()=>download({atlas_identity:{version:session.version,build:session.build},instrument:i},`hcc-${i.id}-contract.json`);
}
function renderCatalogue(){
  const results=sdk.search({query:el('search').value,world:el('world').value,status:el('status').value});
  if(!results.some(i=>i.id===selected))selected=results[0]?.id||null;
  el('match-count').textContent=`${results.length} / ${session.counts.instruments}`;
  el('instrument-list').innerHTML=results.map(i=>`<button class="instrument" data-instrument="${esc(i.id)}" aria-pressed="${i.id===selected}"><code>${esc(i.id)}</code><span>${esc(i.title)}</span></button>`).join('')||'<p class="muted">Нет совпадений.</p>';
  el('instrument-list').querySelectorAll('[data-instrument]').forEach(b=>b.onclick=()=>{
    selected=b.dataset.instrument;
    el('instrument-list').querySelectorAll('[data-instrument]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    const url=new URL(location.href);url.searchParams.set('instrument',selected);history.replaceState(null,'',url);
    renderDetail();
  });
  renderDetail();
}
function renderScaling(){
  scalingResult=null;el('export-scaling').disabled=true;
  const raw=el('delta').value;
  if(!raw.trim()||!el('delta').checkValidity()){
    el('scaling-results').innerHTML='<p class="notice error">Введите изменение от 0 до 90 %.</p>';el('scaling-summary').innerHTML='';return;
  }
  const f=sdk.forecast(el('control').value,Number(raw)/100);scalingResult=f;
  el('export-scaling').disabled=false;
  el('scaling-summary').innerHTML=metric('Цепочки связей',f.results.length)+metric('Степенной закон',f.counts.SCALING_LAW)+metric('Только локально',f.counts.LOCAL_ONLY)+metric('Не установлено',f.counts.UNJUDGED);
  el('scaling-semantics').textContent=f.control_semantics.kind==='NUMERICAL_CONTROL'?'Численный параметр: отклик описывает чувствительность к настройке решателя.':'Параметр физической или математической модели: статус причинного вмешательства не установлен.';
  el('scaling-results').innerHTML=table(['Достигнутый выход / маршрут','Статус','Отклик ×','Границы сценария ×'],f.results.map(r=>`<tr><td><code>${esc(r.reaches)}</code><div class="small muted">${esc(r.route)}</div></td><td class="small">${esc(r.forecastability)}<div class="muted">a = ${fmt(r.exponent)}</div></td><td>${fmt(r.response_ratio)}</td><td>${r.interval_ratio?`${fmt(r.interval_ratio.low)} … ${fmt(r.interval_ratio.high)}`:'—'}</td></tr>`));
}
el('export-scaling').onclick=()=>scalingResult&&download(scalingResult,'hcc-scaling-scenario.json');

function syntheticExample(){
  const actual=[10,12,11,15,14,18,17,20];
  return {schema:'hcc.forecast-evaluation-input/1',model_id:'synthetic-demonstration',
    dataset:{id:'eight-invented-values',kind:'synthetic',source:'Invented example for learning the input format; not observations.',unit:'1'},nominal_coverage:.8,
    records:actual.map((a,i)=>{
      const target=Date.UTC(2026,0,i+3),issued=target-86400000,predicted=a+[1,-1,.5,-2,1,-.5,1,-1][i];
      return {training_end:new Date(issued).toISOString(),issued_at:new Date(issued).toISOString(),target_at:new Date(target).toISOString(),
        actual:a,predicted,baseline:i?actual[i-1]:8,lower:predicted-1.5,upper:predicted+1.5};
    })};
}
let auditSequence=0;
function invalidateAudit(){auditSequence++;el('audit-result').hidden=true;el('audit-empty').hidden=false;el('audit-error').hidden=true;}
el('audit-input').oninput=invalidateAudit;
el('load-example').onclick=()=>{el('audit-input').value=JSON.stringify(syntheticExample(),null,2);invalidateAudit();};
el('audit-file').onchange=async()=>{
  const f=el('audit-file').files[0];if(!f)return;
  invalidateAudit();const seq=auditSequence;
  if(f.size>8*1024*1024){el('audit-error').hidden=false;el('audit-error').textContent='Файл должен быть не больше 8 МБ.';return;}
  try {const value=await f.text();if(seq===auditSequence){el('audit-input').value=value;invalidateAudit();}}
  catch(e){el('audit-error').hidden=false;el('audit-error').textContent=e.message;}
};
function auditPlot(report){
  const rows=report.rows.slice(0,12),values=rows.flatMap(r=>[r.actual,r.predicted,...(r.lower===undefined?[]:[r.lower,r.upper])]);
  const scale=Math.max(...values.map(Math.abs))||1,normalized=values.map(x=>x/scale),min=Math.min(...normalized),max=Math.max(...normalized),span=max-min||1;
  const x=v=>60+(v/scale-min)/span*360,height=rows.length*26+48;
  return `<svg viewBox="0 0 480 ${height}" role="img" aria-label="Сравнение наблюдений, прогнозов и заданных интервалов, первые ${rows.length} строк"><title>Наблюдения — золотые точки; прогнозы — светлые ромбы; интервалы — линии. Единица: ${esc(report.dataset.unit)}.</title>
    <text x="60" y="15">${fmt(min*scale)}</text><text x="420" y="15" text-anchor="end">${fmt(max*scale)}</text>
    ${rows.map((r,i)=>{const y=35+i*26,p=x(r.predicted);return `<text x="18" y="${y+4}">${i+1}</text><line x1="55" x2="430" y1="${y}" y2="${y}" stroke="var(--line)"/>${r.lower!==undefined?`<line x1="${x(r.lower)}" x2="${x(r.upper)}" y1="${y}" y2="${y}" stroke="var(--green)" stroke-width="3" opacity=".45"/>`:''}<path d="M ${p} ${y-4} l 4 4 l -4 4 l -4 -4 Z" fill="var(--green)"/><circle cx="${x(r.actual)}" cy="${y}" r="3" fill="var(--gold)"/>`;}).join('')}</svg><p class="chart-legend">● наблюдение · ◇ прогноз · линия — заданный интервал · ${esc(report.dataset.unit)}</p>`;
}
function renderAudit(r){
  const m=r.metrics,u=r.dataset.unit;
  el('audit-empty').hidden=true;el('audit-result').hidden=false;
  el('audit-result').innerHTML=`<span class="tag">${esc(r.status)}</span><h3>${esc(r.model_id)}</h3><p class="small muted">${esc(r.dataset.source)}</p>
    <div class="metrics">${metric('MAE · '+u,fmt(m.mae))}${metric('RMSE · '+u,fmt(m.rmse))}${metric('Смещение · '+u,fmt(m.bias))}${metric('MSE skill vs baseline',m.mse_skill===null?'не определено':fmt(m.mse_skill*100)+' %')}</div>
    <p class="small muted">${m.n} прогнозов · базовый RMSE ${fmt(m.baseline_rmse)} ${esc(u)}. Skill &gt; 0 — ошибка ниже базовой на этих данных; &lt; 0 — выше.</p>
    ${auditPlot(r)}
    ${r.intervals?`<p class="notice">Покрытие: <strong>${fmt(100*r.intervals.coverage)} %</strong> при заявленных ${fmt(100*r.intervals.nominal_coverage)} %. Средняя ширина: ${fmt(r.intervals.mean_width)} ${esc(u)}. Интервальный балл: ${fmt(r.intervals.mean_interval_score)} ${esc(u)}; меньше — лучше.</p>`:''}
    <h3 class="contract-heading">ПО ГОРИЗОНТУ ПРОГНОЗА</h3><div class="table-wrap">${table(['Горизонт, с','n','RMSE','MAE'],r.by_horizon.map(g=>`<tr><td>${fmt(g.horizon_seconds)}</td><td>${g.metrics.n}</td><td>${fmt(g.metrics.rmse)}</td><td>${fmt(g.metrics.mae)}</td></tr>`))}</div>
    <p class="notice">Хронология согласована по указанным датам. Происхождение данных и предварительная регистрация прогнозов не проверены. Эти показатели не доказывают будущую точность модели.</p>
    <div class="actions"><button id="export-audit" class="button">Результат + исходные данные ↓</button></div>
    <details><summary>Воспроизводимость и метод</summary><p class="small mono" style="overflow-wrap:anywhere">SHA-256: ${esc(r.reproducibility.input_sha256)}</p><p class="small">Знак ошибки: прогноз − наблюдение. Базовый метод оценивается по тем же строкам. Разные горизонты показаны отдельно.</p><a class="small" href="https://otexts.com/fpp3/accuracy.html">Forecasting: Principles and Practice ↗</a></details>`;
  el('export-audit').onclick=()=>download(r,'hcc-forecast-audit.json');
}
el('run-audit').onclick=async()=>{
  invalidateAudit();const seq=auditSequence;el('run-audit').disabled=true;
  try {
    const raw=el('audit-input').value;if(raw.length>8*1024*1024)throw new Error('Данные должны быть не больше 8 МБ.');
    const result=await auditWithProvenance(JSON.parse(raw));
    if(seq===auditSequence)renderAudit({...result,...(session?{atlas_identity:{version:session.version,build:session.build}}:{})});
  }catch(e){if(seq===auditSequence){el('audit-error').hidden=false;el('audit-error').textContent=e.message;}}
  finally{el('run-audit').disabled=false;}
};

try{
  sdk=await connectAtlas(new URL('../',import.meta.url).href);session=sdk.discover();
  el('identity').textContent=`v${session.version} · единая версия данных`;
  const c=session.counts;
  el('multi').innerHTML=table(['Представление','Лаборатории','Шины величин','Научный контракт'],session.multiview.map(p=>`<tr><td>${esc(p.title?.ru||p.title?.en||p.id)}</td><td>${esc((p.views||[]).join(' · '))}</td><td>${esc((p.bus||[]).join(', '))}</td><td>${esc(p.contract?.ru||p.contract?.en||'—')}</td></tr>`));
  el('all-labs').innerHTML=table(['ID','Лаборатория','Класс','Маршрут'],session.labs.map(l=>`<tr><td>${esc(l.id)}</td><td>${esc(l.title)}</td><td>${esc(l.kind)}</td><td>${/^#\/world\/[a-z0-9_-]+\/lab\/[a-z0-9_-]+$/i.test(l.route)?`<a href="./index.html${esc(l.route)}">${esc(l.route)}</a>`:esc(l.route)}</td></tr>`));
  el('census').innerHTML=[[c.worlds,'миров'],[c.laboratories,'лабораторий'],[c.instruments,'типизированных инструментов'],[session.controls.length,'параметров в карте связей']].map(([n,label])=>`<div><strong>${esc(n)}</strong><span>${label}</span></div>`).join('');
  el('world').innerHTML+=[...session.worlds].map(w=>`<option value="${esc(w.id)}">${esc(w.title)}</option>`).join('');
  el('status').innerHTML+=[...new Set(sdk.search().map(i=>i.status).filter(Boolean))].sort().map(s=>`<option value="${esc(s)}">${esc(s)}</option>`).join('');
  el('control').innerHTML=session.controls.map(c=>`<option>${esc(c)}</option>`).join('');
  if(session.controls.includes('bht.M'))el('control').value='bht.M';
  for(const id of ['search','world','status','control','delta'])el(id).disabled=false;
  el('search').oninput=renderCatalogue;el('world').onchange=renderCatalogue;el('status').onchange=renderCatalogue;
  el('control').onchange=renderScaling;el('delta').oninput=renderScaling;
  renderCatalogue();renderScaling();
}catch(e){el('identity').textContent='Данные недоступны';el('load-error').hidden=false;el('load-error').textContent=`Каталог не загружен: ${e.message}. Прямые ссылки и локальная проверка прогноза остаются доступны.`;}
