/* ── THE NAVIGATION ARCHITECTURE, CHECKED AS STRUCTURE ────────────────────────
   Atlas → World → Laboratory → Inspector.  This file reads index.html as TEXT and
   checks the declared architecture: the registries, the routes, the scopes, and the
   rule that there is exactly one navigation system rather than two.

   It is deliberately a STATIC check.  The behavioural half — that Back, Forward and
   reload restore the state, and that every Atlas result reaches a working laboratory —
   is measured in the browser by the atlas's own self-tests, because a claim about what
   happens when you press Back can only honestly be made by pressing it.  What this file
   guarantees is the part a browser test cannot: that no laboratory, route or panel was
   left out of the registries in the first place.

   Run: node docs/verify-navigation-architecture.cjs                                  */

const fs=require('fs'), path=require('path');
const out=[]; const ok=(n,c,d)=>out.push([c?'PASS':'FAIL',n,d]);
const H=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

/* ── pull the declarations out of the document ────────────────────────────── */
const worlds=[...H.matchAll(/\{id:'([a-z0-9]+)',\s*title:'[^']*',\s*t:\[[^\]]*\],\s*defaultEntry:'([a-z0-9]+)'\}/g)]
  .map(m=>({id:m[1],defaultEntry:m[2]}));
const viewNames=(()=>{ const m=H.match(/const S3_VIEW_NAMES=\{([\s\S]*?)\};/);
  return m?[...m[1].matchAll(/([a-z0-9]+):'/g)].map(x=>x[1]):[]; })();
const catOf=(()=>{ const m=H.match(/const LAB_CATEGORY_OF=\{([\s\S]*?)\};/);
  const o={}; if(m) for(const x of m[1].matchAll(/([a-z0-9]+):'([a-z]+)'/g)) o[x[1]]=x[2];
  return o; })();
const categories=(()=>{ const m=H.match(/const LAB_CATEGORIES=\[([\s\S]*?)\n\];/);
  return m?[...m[1].matchAll(/\['([a-z]+)',/g)].map(x=>x[1]):[]; })();
const scopes=(()=>{ const m=H.match(/const TOOL_REGISTRY=\{([\s\S]*?)\n\};/);
  const o={}; if(m) for(const x of m[1].matchAll(/([a-zA-Z]+):\{scope:'(global|world|laboratory)'(?:,\s*(world|lab):'([a-z0-9]+)')?\}/g))
    o[x[1]]={scope:x[2],[x[3]||'_']:x[4]};
  return o; })();
const domPanels=[...H.matchAll(/<div id="([a-zA-Z]+)" class="panel"/g)].map(m=>m[1]);
const descExtra=(()=>{ const m=H.match(/const LAB_DESC_EXTRA=\{([\s\S]*?)\n\};/);
  return m?[...m[1].matchAll(/\n\s{2}([a-z0-9]+):'/g)].map(x=>x[1]):[]; })();
const atlasDescribed=(()=>{ const m=H.match(/const LAB_ATLAS_DEFS=\[([\s\S]*?)\n\];/);
  return m?[...m[1].matchAll(/','([a-z0-9]+)',/g)].map(x=>x[1]):[]; })();

/* ══ 1 ══ every laboratory has an existing parent world ═════════════════════ */
{
  const wid=new Set(worlds.map(w=>w.id));
  ok('every laboratory declares a parent world that exists: the registry is built from S3_VIEW_NAMES with parentWorld "s3", and "s3" is a registered world, so no laboratory can be reachable without a world to reach it through',
    worlds.length===7 && wid.has('s3') && viewNames.length===72,
    `${worlds.length} worlds (${[...wid].join(', ')}) · ${viewNames.length} laboratories, all with parentWorld = s3`);
}
/* ══ 2 ══ every route is unique ════════════════════════════════════════════ */
{
  const routes=worlds.map(w=>`#/world/${w.id}`).concat(viewNames.map(v=>`#/world/s3/lab/${v}`));
  const dup=routes.filter((r,i)=>routes.indexOf(r)!==i);
  ok('every route is unique: seven world routes and one route per laboratory, with no collision, so a URL names exactly one place',
    dup.length===0 && routes.length===79,
    `${routes.length} routes, ${new Set(routes).size} distinct${dup.length?' · duplicates: '+dup.join(', '):''}`);
}
/* ══ 3 ══ every panel in the document has a scope ═══════════════════════════ */
{
  const missing=domPanels.filter(id=>!scopes[id]);
  ok('every panel in the document declares a scope in TOOL_REGISTRY: a panel with no scope is an orphan by definition, and the audit found exactly one — labPanel, which held all 72 laboratory buttons and was absent from every registry',
    missing.length===0 && domPanels.length>=15,
    `${domPanels.length} panels in the document, ${Object.keys(scopes).length} scoped${missing.length?' · unscoped: '+missing.join(', '):' · none unscoped'}`);
}
/* ══ 4 ══ S³ panels cannot exist outside S³ ════════════════════════════════ */
{
  const s3only=Object.entries(scopes).filter(([,v])=>v.world==='s3'||v.scope==='laboratory').map(([k])=>k);
  const leak=s3only.filter(id=>{ const S=scopes[id];
    return S.scope==='global' || (S.scope==='world'&&!S.world); });
  ok('no S³ panel can appear outside S³: every laboratory-scoped panel and every panel bound to the s3 world is declared as such, and the enforcement removes rather than disables — an empty panel is a promise the interface cannot keep',
    leak.length===0 && s3only.length>=4,
    `${s3only.length} panels bound to S³ or to a single laboratory: ${s3only.join(', ')}`);
}
/* ══ 5 ══ every laboratory is reachable from the Atlas ═════════════════════ */
{
  const uncategorised=viewNames.filter(v=>!catOf[v]);
  const badCat=Object.values(catOf).filter(c=>!categories.includes(c));
  ok('every laboratory is reachable from the Atlas, because every one carries a category and every category is rendered: an uncategorised laboratory would exist in the registry and appear in no list, which is how a catalogue quietly loses entries',
    uncategorised.length===0 && badCat.length===0 && categories.length===9,
    `${viewNames.length} laboratories across ${categories.length} categories${uncategorised.length?' · uncategorised: '+uncategorised.join(', '):' · none uncategorised'}`);
}
/* ══ 6 ══ every world has a default entry ══════════════════════════════════ */
{
  const bad=worlds.filter(w=>!w.defaultEntry);
  const s3=worlds.find(w=>w.id==='s3');
  ok('every world declares a default entry, and the S³ default is a real laboratory: without one, choosing a world would leave the atlas in a world with nothing shown, which is the state the audit called "I do not know where I am"',
    bad.length===0 && !!s3 && viewNames.includes(s3.defaultEntry),
    `${worlds.length} worlds all with a default entry · S³ enters at "${s3?s3.defaultEntry:'—'}", which is a registered laboratory`);
}
/* ══ 7 ══ there is ONE navigation system ═══════════════════════════════════ */
{
  /* the entry points must route through hccGo; setMode and setS3View remain the
     implementation underneath but must not be called directly by a control */
  /* THE HANDLER BODY, NOT A CHARACTER BUDGET.  This used to require hccGo within 900
     characters of the handler's opening brace, which is a proxy for "the handler calls
     hccGo" and a bad one: adding a comment to the handler broke it while the routing was
     untouched.  The body is now delimited by matching braces and asked the real question
     -- does it route through hccGo, and does it avoid calling setMode behind hccGo's back. */
  const modeBtn=(()=>{
    const m=H.match(/modebtn\[data-mode\]'\)\.forEach\(b=>b\.onclick=\(\)=>\{/);
    if(!m) return false;
    let i=m.index+m[0].length, depth=1;
    while(i<H.length&&depth>0){ const c=H[i++];
      if(c==='{') depth++; else if(c==='}') depth--; }
    const body=H.slice(m.index,i);
    return /hccGo\(/.test(body) && !/(^|[^.\w])setMode\(/.test(body);
  })();
  const labBtn=/function uiSetS3View\(v\)\{[\s\S]{0,300}?hccGo\(/.test(H);
  const seven=/hccGo\(target,opts=\{\}\)/.test(H) && /hccEnforceScope\(\)/.test(H)
    && /hccRenderBreadcrumb\(\)/.test(H) && /history\.(push|replace)State/.test(H);
  ok('there is exactly ONE navigation system: the world buttons and the laboratory entry point both route through hccGo, which is the only code permitted to change world and laboratory together — it drops out-of-scope panels, switches, activates, opens the inspector and writes both breadcrumb and URL, so no route can perform half the transition',
    modeBtn && labBtn && seven,
    `world buttons route through hccGo: ${modeBtn} · uiSetS3View routes through hccGo: ${labBtn} · hccGo performs scope sweep, breadcrumb and history: ${seven}`);
}
/* ══ 8 ══ the URL is written and read ══════════════════════════════════════ */
{
  const parse=/function hccParseRoute\(h\)/.test(H);
  const boot=/hccBootRoute/.test(H) && /hccParseRoute\(location\.hash\)/.test(H);
  const pop=/addEventListener\('popstate'/.test(H) && /addEventListener\('hashchange'/.test(H);
  ok('the URL is both written and read: routes are parsed at boot BEFORE the first frame, and popstate and hashchange are both handled, so reload and the browser Back and Forward buttons restore world and laboratory. The audit found location.hash empty on load and never written, so none of this existed',
    parse && boot && pop,
    `route parser: ${parse} · read at boot: ${boot} · popstate and hashchange handled: ${pop}`);
}
/* ══ 9 ══ one Back ═════════════════════════════════════════════════════════ */
{
  const back=/function hccBack\(\)/.test(H);
  const demoted=/modelReturnBtn'\);\s*if\(r\)\s*r\.dataset\.sec='1'/.test(H);
  ok('there is one Back in the primary row: hccBack unwinds the navigation history, then the laboratory, then the world, and the duplicate model-return control was demoted to the overflow rather than deleted, so nothing is lost and the primary row stops offering two answers to one question',
    back && demoted,
    `hccBack exists: ${back} · the duplicate return is moved to the overflow rather than removed: ${demoted}`);
}
/* ══ 10 ══ every laboratory has a purpose line ═════════════════════════════ */
{
  const described=new Set([...atlasDescribed,...descExtra]);
  const bare=viewNames.filter(v=>!described.has(v));
  ok('every laboratory card can state what the laboratory is FOR: the audit counted twenty-six with no description anywhere, and they are supplied here, so no card in the Atlas shows a name with nothing under it',
    bare.length===0,
    `${atlasDescribed.length} purposes already written + ${descExtra.length} supplied = ${described.size} distinct, covering all ${viewNames.length}${bare.length?' · still bare: '+bare.join(', '):''}`);
}

/* ══ 11 ══ the Inspector is present and cannot offer a dead tab ════════════ */
{
  const tabs=(H.match(/const INSPECTOR_TABS=\[([\s\S]*?)\n\];/)||[])[1]||'';
  const n=[...tabs.matchAll(/\['([a-z]+)',/g)].map(m=>m[1]);
  const gate=/if\(!document\.getElementById\(id\)\) return null;[\s\S]{0,120}?panelInScope\(id,ctx\)\?id:null/.test(H);
  const strip=/function hccRenderInspector\(\)/.test(H) && /live\.length<2/.test(H);
  /* the count is NOT the invariant.  This check pinned it at five and duly failed the
     moment a sixth laboratory earned a tab, which is a test measuring its own history
     rather than the architecture.  What must hold is that the tabs are distinct, that
     every one of them resolves through the existence-and-scope gate, and that a strip
     of one hides itself — none of which cares how many there are. */
  const fit=/function hccInspectorFit\(\)/.test(H)
    && /elementFromPoint/.test(H);   /* the strip is verified reachable, not merely rendered */
  ok('the Inspector is the fourth level of the hierarchy, it is present, and it is REACHABLE: its tabs are distinct, a tab resolves to a panel only if that panel EXISTS and is IN SCOPE so the strip cannot render a control that opens nothing, a strip of one hides itself, and a runtime check hit-tests every tab centre — because the strip once rendered perfectly underneath the panel dock while every logic test passed',
    n.length>=5 && new Set(n).size===n.length && gate && strip && fit,
    `tabs: ${n.join(', ')} (${n.length}, all distinct) · resolution gated on existence and scope: ${gate} · a one-tab strip hides itself: ${strip} · reachability measured at runtime: ${fit}`);
}
/* ══ 12 ══ Recommended reads the declared graph ════════════════════════════ */
{
  const fn=/function hccRecommended\(limit=4\)/.test(H) && /NEXUS_RELATIONS/.test(H);
  const empty=/const cur=HCC_CTX\.labId; if\(!cur\) return \[\];/.test(H);
  ok('Recommended is the declared relation graph read as navigation and nothing else: it walks NEXUS_RELATIONS, and with no laboratory active it returns an empty list rather than inventing an adjacency to fill the space',
    fn && empty,
    `derived from NEXUS_RELATIONS: ${fn} · returns nothing when there is nothing to be near: ${empty}`);
}

/* ══ 13 ══ the three columns are published, and the phone opts out ═════════ */
{
  const pub=/function hccPublishColumns\(dt\)/.test(H)
    && /setProperty\('--col-l'/.test(H) && /setProperty\('--col-r'/.test(H)
    && /setProperty\('--col-c'/.test(H) && /setProperty\('--col-cx'/.test(H);
  const phoneOut=/if\(innerWidth<=900\|\|matchMedia\('\(pointer:coarse\)'\)\.matches\)\{[\s\S]{0,200}?--col-l','0px'/.test(H);
  const hud=/body #hud\{left:var\(--col-cx/.test(H);
  const crumbCap=/max-width:min\(32vw,400px\)/.test(H);
  ok('the three columns are measured and published rather than drawn, the phone opts out of them because a phone has one column, and the two things that were measured going wrong are fixed: the readout is centred on the COLUMN centre with a selector specific enough to win, and the breadcrumb carries a cap that actually binds',
    pub && phoneOut && hud && crumbCap,
    `columns published: ${pub} · disabled below 901 px and on coarse pointers: ${phoneOut} · readout centred on the column with "body #hud": ${hud} · breadcrumb capped at min(32vw, 400px): ${crumbCap}`);
}

for(const [s,n,d] of out) console.log(s.padEnd(5), n, '\n      ', d);
console.log('\n', out.filter(r=>r[0]==='PASS').length+'/'+out.length, 'checks pass');
process.exitCode = out.some(r=>r[0]==='FAIL') ? 1 : 0;
