import {SCHEMA,RELATIONS,SOURCES,DEG,YEAR_DAYS,skyGeometry,planeBasis,epochSummary,planetaryEpochValid,venusTrace,solarReference} from '../core/cycles/galactic-butterfly.mjs';

export const VIEWS=Object.freeze([
 ['sky','Celestial geometry','Небесная геометрия','Himmelsgeometrie'],
 ['venus','Venus weave','Узор Венеры','Venus-Muster'],
 ['solar','Solar butterfly','Солнечная бабочка','Sonnenschmetterling'],
 ['nebula','NGC 6302','NGC 6302','NGC 6302'],
 ['galaxy','Fermi bubbles','Пузыри Ферми','Fermi-Blasen']
]);
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tr=(lang,en,ru,de)=>lang==='ru'?ru:lang==='de'?de:en;
const fmt=n=>Number(n).toLocaleString('en-US',{maximumFractionDigits:2});

/** Uses the Atlas renderer and root clock; owns only disposable scene resources. */
export function createButterflyScene({THREE,label,xrLabel,ephemeris}){
 const group=new THREE.Group();group.name='Galactic Butterfly Observatory';group.visible=false;
 let signature='',live={},renderCount=0;
 const color={gold:0xe6bb73,blue:0x70cbdc,white:0xe4eafa,purple:0xb69bfa};
 const v=(a,s=1)=>new THREE.Vector3(a[0]*s,a[2]*s,-a[1]*s);
 const add=o=>{group.add(o);return o;};
 const ball=(r,c)=>new THREE.Mesh(new THREE.SphereGeometry(r,20,12),new THREE.MeshBasicMaterial({color:c}));
 function line(points,c,opacity=.8,segments=false){
  const g=new THREE.BufferGeometry().setFromPoints(points),m=new THREE.LineBasicMaterial({color:c,transparent:true,opacity,depthWrite:false});
  return add(segments?new THREE.LineSegments(g,m):new THREE.Line(g,m));
 }
 function text(s,p,c='label major'){
  const o=label(s,c);o.position.copy(p);group.add(o);
  if(xrLabel){const sprite=xrLabel(s);sprite.position.copy(p);sprite.userData.butterflyXRLabel=true;group.add(sprite);o.userData.butterflyXRPeer=sprite;}
  return o;
 }
 function ring(pole,r,c,opacity=.8){
  const [a,b]=planeBasis(pole),pts=[];
  for(let i=0;i<=160;i++){const t=i/160*2*Math.PI;pts.push(v(a.map((x,k)=>r*(x*Math.cos(t)+b[k]*Math.sin(t)))));}
  return line(pts,c,opacity);
 }
 function clear(){
  const gs=new Set(),ms=new Set(),ts=new Set();
  group.traverse(o=>{
   if(o.geometry)gs.add(o.geometry);
   if(o.material)for(const m of [].concat(o.material)){ms.add(m);for(const value of Object.values(m))if(value?.isTexture)ts.add(value);}
   o.element?.remove();
  });
  group.clear();gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());ts.forEach(t=>t.dispose());live={};
 }
 function buildSky(lang){
  const s=skyGeometry();
  ring(s.eclipticPole,5,color.gold);ring(s.equatorPole,5.12,color.white,.55);ring(s.galacticPole,5,color.purple);
  const shell=new THREE.Mesh(new THREE.SphereGeometry(4.96,36,22),new THREE.MeshBasicMaterial({color:0x60799e,wireframe:true,transparent:true,opacity:.06,depthWrite:false}));add(shell);
  add(ball(.3,color.blue));
  const centre=add(ball(.13,color.purple));centre.position.copy(v(s.galacticCentre,5));
  line([new THREE.Vector3(),centre.position],color.purple,.55);
  text('Sgr A* · J2000',centre.position.clone().multiplyScalar(1.16));
  text(tr(lang,'ECLIPTIC','ЭКЛИПТИКА','EKLIPTIK'),new THREE.Vector3(5.8,0,0),'label const');
  text(tr(lang,'Earth · sky directions','Земля · направления неба','Erde · Himmelsrichtungen'),new THREE.Vector3(0,-.75,0));
  text(tr(lang,'Galactic plane · violet / equator · silver','Галактическая плоскость · фиолетовый / экватор · серебро','Galaktische Ebene · violett / Äquator · silbern'),new THREE.Vector3(0,-5.8,0),'label dim');
  const cone=[];for(let i=0;i<=128;i++){const a=i/128*Math.PI*2;cone.push(v([Math.sin(23.4392911*DEG)*Math.cos(a),Math.sin(23.4392911*DEG)*Math.sin(a),Math.cos(23.4392911*DEG)],4));}
  line(cone,color.blue,.55);
  live.axis=line([new THREE.Vector3(),v(s.equatorPole,4)],color.blue);
  live.pole=add(ball(.12,color.blue));live.sun=add(ball(.19,color.gold));
  live.sunLabel=text(tr(lang,'Sun · approximate','Солнце · приближённо','Sonne · angenähert'),new THREE.Vector3());
  text(tr(lang,'Mean precession cone · 25,772 yr','Конус средней прецессии · 25 772 лет','Mittlerer Präzessionskegel · 25.772 J.'),new THREE.Vector3(0,4.6,0),'label const');
 }
 function buildVenus(day,options){
  const trace=venusTrace(day,ephemeris,options.detail?400:200);live.trace=trace;
  add(ball(.18,color.gold));
  if(!trace){text(tr(options.lang,'Planetary model outside 1800–2050','Модель планет вне диапазона 1800–2050','Planetenmodell außerhalb 1800–2050'),new THREE.Vector3());return;}
  const pts=[],colors=[];
  trace.segments.forEach((p,i)=>{
   pts.push(v(p.earth,4.8),v(p.venus,4.8));
   const c=new THREE.Color().lerpColors(new THREE.Color(color.blue),new THREE.Color(color.gold),i/(trace.segments.length-1));
   colors.push(c.r,c.g,c.b,c.r,c.g,c.b);
  });
  const chords=line(pts,color.white,.26,true);
  chords.geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));chords.material.vertexColors=true;
  const earthOrbit=[],venusOrbit=[];
  for(let i=0;i<=256;i++){const p=ephemeris(trace.startDay+i/256*365.256);earthOrbit.push(v(p.earth,4.8));}
  for(let i=0;i<=192;i++){const p=ephemeris(trace.startDay+i/192*224.701);venusOrbit.push(v(p.venus,4.8));}
  line(earthOrbit,color.blue,.8);line(venusOrbit,color.gold,.8);
  live.earth=add(ball(.12,color.blue));live.venus=add(ball(.15,color.gold));
  live.chord=line([new THREE.Vector3(),new THREE.Vector3()],color.white,.9);
  text(tr(options.lang,'5 Venus returns ≈ 8 Earth years','5 возвращений Венеры ≈ 8 земных лет','5 Venus-Wiederkehren ≈ 8 Erdenjahre'),new THREE.Vector3(0,2.8,0),'label const');
  text(tr(options.lang,'Earth–Venus chords · heliocentric · distances in au','Хорды Земля–Венера · гелиоцентрически · расстояния в а.е.','Erde–Venus-Sehnen · heliozentrisch · Entfernungen in au'),new THREE.Vector3(0,-2.3,0),'label dim');
 }
 function buildSolar(options){
  const n=options.detail?3000:1500,positions=[],colors=[];
  for(let i=0;i<n;i++){
   const t=i/(n-1),cycle=t*3,phase=cycle%1;
   const spread=3+9*Math.sin(Math.PI*phase),noise=Math.sin(i*2.39996323)*spread;
   const latitude=(35-30*phase+noise)*(i%2?1:-1);
   const activity=Math.sin(Math.PI*phase)**2;
   positions.push(-5+10*t,latitude/11,activity*1.5);
   const c=new THREE.Color(i%2?color.gold:color.blue);colors.push(c.r,c.g,c.b);
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  add(new THREE.Points(g,new THREE.PointsMaterial({size:.055,vertexColors:true,transparent:true,opacity:.8,depthWrite:false})));
  line([new THREE.Vector3(-5.4,0,0),new THREE.Vector3(5.4,0,0)],color.white,.45);
  for(let i=0;i<=3;i++){const x=-5+i*10/3;line([new THREE.Vector3(x,-4,0),new THREE.Vector3(x,4,0)],color.white,.16);text(String(i*11)+' yr',new THREE.Vector3(x,-4.7,0),'label dim');}
  live.cursor=line([new THREE.Vector3(0,-4,0),new THREE.Vector3(0,4,0)],color.white,.8);
  text(tr(options.lang,'SYNTHETIC · latitude × cycle time × activity proxy','СИНТЕТИКА · широта × время цикла × условная активность','SYNTHETISCH · Breite × Zykluszeit × Aktivitätsproxy'),new THREE.Vector3(0,5,0),'label const');
  text('+45° N',new THREE.Vector3(-6,3.9,0),'label dim');text('−45° S',new THREE.Vector3(-6,-3.9,0),'label dim');
  text(tr(options.lang,'No measured spot counts or event forecast','Без измеренных чисел пятен и прогноза событий','Keine gemessenen Fleckenzahlen oder Ereignisprognose'),new THREE.Vector3(0,-5.6,0),'label dim');
 }
 function buildLobes(options,galactic){
  const n=options.detail?3800:1900,pts=[],cols=[];
  for(let i=0;i<n;i++){
   const u=(i+.5)/n,a=i*2.39996323,side=i%2?1:-1;
   const z=galactic?2.5*u:5.7*u;
   const r=galactic?1.28*Math.sin(Math.PI*u)**.6:.20+2.05*Math.sin(Math.PI*u)**.75;
   const p=galactic?new THREE.Vector3(r*Math.cos(a),side*z,r*Math.sin(a)):new THREE.Vector3(side*z,r*Math.cos(a),r*Math.sin(a));
   pts.push(p.x,p.y,p.z);
   const c=new THREE.Color().lerpColors(new THREE.Color(color.gold),new THREE.Color(galactic?color.purple:color.blue),u);cols.push(c.r,c.g,c.b);
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(cols,3));
  const shell=new THREE.Points(geometry,new THREE.PointsMaterial({size:galactic?.035:.05,vertexColors:true,transparent:true,opacity:.7,depthWrite:false}));add(shell);live.shell=shell;
  for(let k=0;k<12;k++)for(const side of [-1,1]){
   const meridian=[];for(let j=0;j<=64;j++){const u=j/64,a=k*Math.PI/6;
    const r=galactic?1.28*Math.sin(Math.PI*u)**.6:.20+2.05*Math.sin(Math.PI*u)**.75;
    meridian.push(galactic?new THREE.Vector3(r*Math.cos(a),side*2.5*u,r*Math.sin(a)):new THREE.Vector3(side*5.7*u,r*Math.cos(a),r*Math.sin(a)));}
   const l=line(meridian,galactic?color.purple:color.blue,.19);live.outlines??=[];live.outlines.push(l);
  }
  add(ball(.11,color.white));
  if(galactic){
   for(let r=1;r<=5;r++)ring([0,0,1],r,color.gold,.12);
   const disk=new THREE.Mesh(new THREE.CircleGeometry(5,96),new THREE.MeshBasicMaterial({color:0x8493ad,transparent:true,opacity:.075,side:THREE.DoubleSide,depthWrite:false}));disk.rotation.x=-Math.PI/2;add(disk);
   live.orbit=add(ball(.10,color.gold));ring([0,0,1],2.6,color.gold,.65);
   text(tr(options.lang,'FERMI LOBES · schematic geometry','ЛОПАСТИ ФЕРМИ · схема геометрии','FERMI-LOPPEN · schematische Geometrie'),new THREE.Vector3(0,3.3,0),'label const');
   text(tr(options.lang,'50,000 ly end to end · disk reference diameter 100,000 ly','Размах 50 000 св. лет · опорный диаметр диска 100 000 св. лет','50.000 Lj. Gesamtausdehnung · Scheiben-Referenzdurchmesser 100.000 Lj.'),new THREE.Vector3(0,-3.5,0),'label dim');
  }else{
   const torus=new THREE.Mesh(new THREE.TorusGeometry(.9,.28,16,64),new THREE.MeshBasicMaterial({color:color.gold,wireframe:true,transparent:true,opacity:.35,depthWrite:false}));torus.rotation.y=Math.PI/2;add(torus);
   text(tr(options.lang,'NGC 6302 · bipolar outflow + dusty torus','NGC 6302 · биполярный выброс + пылевой тор','NGC 6302 · bipolarer Ausfluss + Staubtorus'),new THREE.Vector3(0,3.5,0),'label const');
   text(tr(options.lang,'SCHEMATIC · no measured 3D reconstruction or event clock','СХЕМА · без измеренной 3D-реконструкции и часов события','SCHEMA · keine gemessene 3D-Rekonstruktion oder Ereignisuhr'),new THREE.Vector3(0,-3.6,0),'label dim');
  }
 }
 function setLine(o,a,b){const p=o.geometry.attributes.position;p.setXYZ(0,a.x,a.y,a.z);p.setXYZ(1,b.x,b.y,b.z);p.needsUpdate=true;o.geometry.computeBoundingSphere();}
 function update(view,day,options={}){
  const key=[view,options.lang,!!options.detail,options.revision||0,planetaryEpochValid(day)].join('|');
  if(key!==signature){
   clear();signature=key;renderCount++;
   if(view==='sky')buildSky(options.lang);else if(view==='venus')buildVenus(day,options);else if(view==='solar')buildSolar(options);else buildLobes(options,view==='galaxy');
  }
  const s=epochSummary(day);
  group.traverse(o=>{if(o.userData.butterflyXRLabel)o.visible=!!options.xr;});
  if(view==='sky'){
   const a=-2*Math.PI*s.precessionPhase,p=skyGeometry().equatorPole;
   const axis=v([p[0]*Math.cos(a)-p[1]*Math.sin(a),p[0]*Math.sin(a)+p[1]*Math.cos(a),p[2]],4);
   live.pole.position.copy(axis);setLine(live.axis,new THREE.Vector3(),axis);
   const valid=planetaryEpochValid(day);live.sun.visible=live.sunLabel.visible=valid;
   if(valid){const e=ephemeris(day).earth;live.sun.position.copy(v(e).normalize().multiplyScalar(-5));live.sunLabel.position.copy(live.sun.position).multiplyScalar(1.17);}
   const peer=live.sunLabel.userData.butterflyXRPeer;if(peer){peer.visible=valid&&!!options.xr;peer.position.copy(live.sunLabel.position);}
  }
  if(view==='venus'&&live.trace){
   const p=ephemeris(day);live.earth.position.copy(v(p.earth,4.8));live.venus.position.copy(v(p.venus,4.8));setLine(live.chord,live.earth.position,live.venus.position);
  }
  if(view==='solar'){
   const solar=solarReference(2000+day/365.25);live.cursor.position.x=-5+(solar.phase+1)*10/3;
  }
  if(view==='galaxy'){const a=2*Math.PI*s.galacticPhase;live.orbit.position.set(2.6*Math.cos(a),0,-2.6*Math.sin(a));}
  if(view==='nebula'){
   const expansion=options.expansion??1;live.shell.scale.setScalar(expansion);live.outlines.forEach(l=>l.scale.setScalar(expansion));
  }
  return s;
 }
 return {group,update,dispose(){clear();signature='';},stats(){let vertices=0,objects=0;group.traverse(o=>{objects++;vertices+=o.geometry?.attributes?.position?.count||0;});return {objects,vertices,rebuilds:renderCount,schema:SCHEMA,traceWindow:live.trace?{start:live.trace.startDay,end:live.trace.endDay}:null};}};
}

export function butterflyControlsHTML({lang='en',view='sky',day,paused,rate,detail,expansion=1,events=[],dateLabel}){
 const t=(en,ru,de)=>tr(lang,en,ru,de),s=epochSummary(day),g=skyGeometry(),r=s.calendar;
 const selected=RELATIONS.filter(x=>x.view===view),rest=RELATIONS.filter(x=>x.view!==view);
 const relation=x=>`<article class="bf-relation"><span class="bf-kind">${esc(x.kind)}</span><strong>${esc(lang==='ru'?x.ru:lang==='de'?x.de:x.title)}</strong><p>${esc(lang==='ru'?x.ruText:lang==='de'?x.deText:x.text)}</p><div class="bf-sources">${x.sources.map(k=>`<a href="${esc(SOURCES[k].url)}" target="_blank" rel="noopener noreferrer">${esc(SOURCES[k].title)}</a>`).join('')}</div></article>`;
 const notes={
  sky:t('Observer-centred directions. Gold: ecliptic; silver: J2000 equator; violet: Galactic plane; cyan: mean precession cone. Drag to orbit, scroll/pinch to zoom.','Направления от наблюдателя. Золото: эклиптика; серебро: экватор J2000; фиолетовый: галактическая плоскость; голубой: конус средней прецессии. Вращайте и приближайте сцену.','Beobachterzentrierte Richtungen. Gold: Ekliptik; Silber: J2000-Äquator; Violett: galaktische Ebene; Cyan: mittlerer Präzessionskegel. Ziehen zum Drehen, Scrollen/Pinch zum Zoomen.'),
  venus:t('Each chord joins Earth’s approximate barycentric position and Venus at the same instant. The eight-year weave uses the Atlas ephemeris. Colors encode sampling time.','Каждая хорда соединяет приближённое положение барицентра Земля–Луна с Венерой в один момент. Восьмилетний узор использует эфемериды Atlas; цвет обозначает время отсчёта.','Jede Sehne verbindet den angenäherten Ort des Erde–Mond-Baryzentrums mit Venus im selben Moment. Das Achtjahresmuster verwendet die Atlas-Ephemeride; Farben markieren die Abtastzeit.'),
  solar:t('A synthetic teaching diagram: x = three 11-year reference cycles, y = latitude, z = an arbitrary activity proxy. The white cursor follows the shared date modulo 11 years.','Синтетическая учебная диаграмма: x = три опорных 11-летних цикла, y = широта, z = условная активность. Белый курсор следует общей дате по модулю 11 лет.','Synthetisches Lehrdiagramm: x = drei 11-Jahres-Referenzzyklen, y = Breite, z = willkürlicher Aktivitätsproxy. Der weiße Cursor folgt dem gemeinsamen Datum modulo 11 Jahre.'),
  nebula:t('Schematic lobes around an evolved star. Expansion changes only the illustrative shape; it is not an age estimate and does not advance with the Atlas clock.','Схема лопастей вокруг эволюционировавшей звезды. Расширение меняет только иллюстративную форму; оно не оценивает возраст и не следует часам Atlas.','Schematische Lappen um einen entwickelten Stern. Ausdehnung ändert nur die Darstellungsform; sie ist keine Altersmessung und folgt nicht der Atlas-Uhr.'),
  galaxy:t('Schematic gamma-ray lobes above and below the Galactic plane. The Sun marker uses a 230-million-year reference orbit with arbitrary phase zero; the lobes are static.','Схематические гамма-лопасти над и под плоскостью Галактики. Маркер Солнца движется по опорной орбите в 230 млн лет с условным нулём фазы; лопасти статичны.','Schematische Gamma-Lappen oberhalb und unterhalb der galaktischen Ebene. Die Sonnenmarke folgt einer 230-Millionen-Jahre-Referenzbahn mit freiem Phasennullpunkt; die Lappen bleiben statisch.')
 };
 return `<section class="bf-panel" data-butterfly-panel data-schema="${SCHEMA}">
 <div class="bf-heading"><span>HCC / ${t('CYCLES','ЦИКЛЫ','ZYKLEN')}</span><h3>${t('Galactic Butterfly','Галактическая бабочка','Galaktischer Schmetterling')}</h3></div>
 <div class="bf-tabs" role="group" aria-label="${t('Scientific view','Научный вид','Wissenschaftliche Ansicht')}">${VIEWS.map(v=>`<button type="button" class="bf-btn" data-bf-view="${v[0]}" aria-pressed="${view===v[0]}">${esc(lang==='ru'?v[2]:lang==='de'?v[3]:v[1])}</button>`).join('')}</div>
 <p class="bf-caption">${notes[view]}</p>
 <div class="bf-metrics"><div><span>${view==='venus'?t('Calendar closure','Календарное замыкание','Kalenderschließung'):t('Plane inclination','Наклон плоскостей','Ebenenneigung')}</span><b>${view==='venus'?fmt(r.calendarRoundDays)+' d':g.planeInclinationDeg.toFixed(2)+'°'}</b></div><div><span>${view==='venus'?t('5 Venus − 8 tropical years','5 Венер − 8 тропических лет','5 Venus − 8 tropische Jahre'):t('Sgr A* ecliptic latitude','Эклиптическая широта Sgr A*','Ekliptikale Breite Sgr A*')}</span><b>${view==='venus'?r.venusEightYearResidualDays.toFixed(3)+' d':g.galacticCentreLatitudeDeg.toFixed(2)+'°'}</b></div></div>
 <div class="bf-clock"><span data-bf-clock>${esc(dateLabel)}</span><div class="bf-actions"><button class="bf-btn" data-bf-pause>${paused?'▶':'Ⅱ'} ${paused?t('Play','Пуск','Start'):t('Pause','Пауза','Pause')}</button><button class="bf-btn" data-bf-now>${t('Today','Сегодня','Heute')}</button><button class="bf-btn" data-bf-frame>${t('Frame scene','Центрировать','Ansicht zentrieren')}</button></div>
 <label>${t('Shared speed','Общая скорость','Gemeinsames Tempo')} <select data-bf-rate>${[[1,'1 d/s'],[30,'30 d/s'],[365.25,'1 yr/s'],[365250,'1 kyr/s'],[365250000,'1 Myr/s']].map(([n,name])=>`<option value="${n}" ${Math.abs(rate-n)<.01?'selected':''}>${name}</option>`).join('')}<option value="keep" ${![1,30,365.25,365250,365250000].some(n=>Math.abs(rate-n)<.01)?'selected':''}>${t('Current','Текущая','Aktuell')}: ${esc(fmt(rate))} d/s</option></select></label>
 <label>${t('UTC date','Дата UTC','UTC-Datum')} <input type="date" data-bf-date min="1800-01-01" max="2050-12-31" value="${s.planetaryStatus==='APPROXIMATE_JPL'?esc(new Date((day+10957.5)*86400000).toISOString().slice(0,10)):''}"></label>
 <div class="bf-status" data-bf-status>${s.planetaryStatus==='OUT_OF_RANGE'?t('Planetary positions unavailable outside 1800–2050. Reference geometry remains available.','Положения планет недоступны вне 1800–2050. Опорная геометрия остаётся доступной.','Planetenpositionen außerhalb 1800–2050 nicht verfügbar. Referenzgeometrie bleibt verfügbar.'):t('JPL approximation · 1800–2050 · use Horizons for precision epochs','Приближение JPL · 1800–2050 · точные эпохи: Horizons','JPL-Näherung · 1800–2050 · präzise Epochen: Horizons')}</div></div>
 ${view==='nebula'?`<label>${t('Illustrative expansion','Условное расширение','Illustrative Ausdehnung')} <input type="range" min="0.5" max="1.3" step=".01" value="${expansion}" data-bf-expansion></label>`:''}
 <label class="bf-check"><input type="checkbox" data-bf-detail ${detail?'checked':''}>${t('More geometric detail','Больше деталей геометрии','Mehr geometrische Details')}</label>
 <div class="bf-actions"><button class="bf-btn" data-bf-solar>${t('Solar System · same date','Солнечная система · та же дата','Sonnensystem · gleiches Datum')}</button><button class="bf-btn" data-bf-fermi>${t('Fermi bubbles · quantitative lab','Пузыри Ферми · расчётная лаборатория','Fermi-Blasen · quantitatives Labor')}</button><button class="bf-btn" data-bf-share>${t('Copy this view','Копировать вид','Ansicht kopieren')}</button></div><output class="bf-feedback" data-bf-feedback aria-live="polite"></output>
 <details class="bf-details"><summary>${t('Events and calendar dates','События и календарные даты','Ereignisse und Kalenderdaten')}</summary><p>${t('Select a date to pause the shared clock. Catalogue dates are external references; this instrument does not calculate local eclipse visibility.','Выбор даты остановит общие часы. Даты каталога — внешние опорные данные; инструмент не рассчитывает местную видимость затмений.','Datumswahl pausiert die gemeinsame Uhr. Katalogdaten sind externe Referenzen; dieses Instrument berechnet keine lokale Finsternissichtbarkeit.')}</p><div class="bf-event-list">${events.map((e,i)=>`<button class="bf-btn" data-bf-event="${i}">${esc(e.label)}</button>`).join('')}</div></details>
 <details class="bf-details" open><summary>${t('Connections and evidence','Связи и основания','Bezüge und Belege')} · ${selected.length}</summary>${selected.map(relation).join('')}</details>
 <details class="bf-details"><summary>${t('All documented connections','Все найденные связи','Alle dokumentierten Bezüge')} · ${RELATIONS.length}</summary><p>${t('These entries cover the identified meanings of the name; shared shape does not establish shared dynamics.','Здесь собраны установленные значения названия; сходство формы не устанавливает общей динамики.','Diese Einträge behandeln die gefundenen Bedeutungen; ähnliche Form belegt keine gemeinsame Dynamik.')}</p>${rest.map(relation).join('')}</details>
 <details class="bf-details"><summary>${t('Formulae and conventions','Формулы и соглашения','Formeln und Konventionen')}</summary><p>J2000: JD 2451545.0. ε = 23.4392911°. ${t('Right-handed ecliptic axes','Правые эклиптические оси','Rechtshändige ekliptikale Achsen')}: x, y, z → ${t('display','сцена','Szene')} (x,z,−y).</p><p>r<sub>eq</sub> = (cos δ cos α, cos δ sin α, sin δ); r<sub>ecl</sub> = (x, y cos ε + z sin ε, −y sin ε + z cos ε).</p><p>α = RA; δ = Dec; ε = ${t('obliquity','наклон эклиптики','Ekliptikschiefe')}. ${t('Galactic pole','Галактический полюс','Galaktischer Pol')}: α = 192.85948°, δ = 27.12825°.</p><p>φ = mod(d, P)/P; d = ${t('days since J2000','дни от J2000','Tage seit J2000')}; P<sub>prec</sub> = 25772 × 365.25 d; P<sub>gal</sub> = 230000000 × 365.25 d.</p><p>LCM(260,365) = 260 × 365 / GCD(260,365) = 18980 d. GCD = 5. 5 × 584 = 8 × 365 = 2920 d; 5 × 583.92 − 8 × 365.2422 = −2.3376 d.</p><p>${t('UTC dates feed the existing Atlas clock. The planetary model uses the existing low-precision time convention; this view adds no TT/TDB correction, nutation or light-time solution.','Даты UTC поступают в существующие часы Atlas. Приближение планет сохраняет его шкалу времени; этот вид не добавляет поправку TT/TDB, нутацию или решение светового времени.','UTC-Daten verwenden die vorhandene Atlas-Uhr. Die Planetennäherung behält deren Zeitkonvention; diese Ansicht ergänzt keine TT/TDB-Korrektur, Nutation oder Lichtlaufzeitlösung.')}</p></details>
 </section>`;
}
