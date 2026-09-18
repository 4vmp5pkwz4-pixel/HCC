from pathlib import Path
import json, re

OLD_VERSION='4.269.0'
NEW_VERSION='4.270.0'
OLD_BUILD='between-neptune-and-the-cloud-2026.09.15.14'
NEW_BUILD='self-description-has-one-authority-2026.09.18.16'

def text(path): return Path(path).read_text()
def write(path, s): Path(path).write_text(s)
def sub_once(path, pattern, repl, flags=0):
    s=text(path); s2,n=re.subn(pattern,repl,s,count=1,flags=flags)
    if n != 1: raise SystemExit(f'{path}: expected one match, got {n}: {pattern}')
    write(path,s2)
def replace_once(path, old, new):
    s=text(path); n=s.count(old)
    if n != 1: raise SystemExit(f'{path}: expected one exact occurrence, got {n}: {old[:100]!r}')
    write(path,s.replace(old,new,1))

manifest=json.loads(text('api/manifest.json'))
c=manifest['counts']
labs=int(c['laboratories']); worlds=int(c['worlds']); instruments=int(c['instruments'])

sub_once('README.md',
    r'the atlas — \*\*\d+\*\* laboratories across \d+ worlds, \*\*\d+\*\* typed instruments, \*\*\d+\*\* φ-ladder objects, WebXR',
    f'the atlas — **{labs}** laboratories across {worlds} worlds, **{instruments}** typed instruments, φ-ladder, WebXR')
sub_once('README.md',
    r'The live laboratory registry is authoritative: \*\*\d+ laboratories across \d+ worlds\*\* at the\s+v\d+\.\d+\.\d+ release boundary\.',
    'The live census is api/manifest.json (counts.laboratories, counts.instruments, counts.worlds) at the release declared by version.json.')

replace_once('llms.txt','## Scientific workspace and static SDK (4.190.0)','## Scientific workspace and static SDK')
sub_once('llms.txt',r'(?m)^\s*list\s+describe\s+evaluate\s+\d+ laboratories, their contracts, their answers\s*$',
    '    list     describe  evaluate        laboratories, their contracts, their answers — counts in api/manifest.json')
sub_once('server/server.mjs',r'TYPED: \d+ hand-written edges over \d+ laboratories, each with the KIND of relationship',
    'TYPED: hand-written edges across the laboratory catalogue, each with the KIND of relationship')
sub_once('server/server.mjs',
    r'Each artifact reports its own release stamp and whether it was measured on THIS release — one of them is deliberately dated, and a stale measurement read as a fresh one is worse than none\.',
    'Each artifact reports its own release stamp and whether it was measured on THIS release; dated artifacts are still served because a stale measurement read as a fresh one is worse than none.')

sub_once('core/index.mjs',
    r'Of the four measured artifacts, liveness carries release \d+\.\d+\.\d+ while the others carry the current one, because regenerating it walks every view and costs about twenty minutes\. It is served with measured_on_this_release: false so no agent reads it as fresh, which is honest but not the same as current\. Nothing in the repository decides WHEN a dated artifact has drifted far enough to be worth the walk\.',
    'Each measured artifact carries its own walk-time release stamp and is served with measured_on_this_release, so dated evidence is explicit rather than rewritten as current. The remaining gap is policy: nothing in the repository decides WHEN a dated artifact has drifted far enough to require an expensive re-walk.')
replace_once('core/index.mjs','from fourteen call sites, with no owner and no record of who decided',
    'from every call site of setControlDistanceLimits, with no owner and no record of who decided')
replace_once('core/index.mjs',
    "['desi.covariance', 'no DESI covariance or evidence computation exists in this repository']",
    "['desi.covariance', 'the atlas runtime has no DESI inverse-covariance kernel and no Bayesian evidence Z; off-atlas vde_likelihood/ and vde_validation/ contain executed BAO-only Cobaya pilot analyses with Ω_k fixed, and those conditional pilots are not an atlas covariance layer or a topology detection']")

replace_once('core/index.mjs',
    "function CORE_VERSION_OF_ATLAS() {\n  try { return JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8')).version || null; }\n  catch { return null; }\n}",
    "function CORE_RELEASE_OF_ATLAS() {\n  try { const r = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));\n    return { version: r.version || null, build: r.build || null }; }\n  catch { return { version: null, build: null }; }\n}\nfunction CORE_VERSION_OF_ATLAS() { return CORE_RELEASE_OF_ATLAS().version; }")
replace_once('core/index.mjs',
    "measured_on_this_release: (j.version || null) === CORE_VERSION_OF_ATLAS(),",
    "measured_on_this_release: (() => { const r = CORE_RELEASE_OF_ATLAS();\n          return (j.version || null) === r.version && (j.build || null) === r.build; })(),")
replace_once('core/index.mjs',
    "atlas_release: CORE_VERSION_OF_ATLAS(), artifacts: stamps,",
    "atlas_release: CORE_VERSION_OF_ATLAS(), atlas_build: CORE_RELEASE_OF_ATLAS().build, artifacts: stamps,")

marker="const identity=JSON.parse(readFileSync(join(ROOT,'version.json'),'utf8'));"
stamp="""const identity=JSON.parse(readFileSync(join(ROOT,'version.json'),'utf8'));
const measurementKinds=['sensitivity','transfers','reach','liveness'];
for (const kind of measurementKinds) {
  const p=join(ROOT,'api/'+kind+'.json'); if (!existsSync(p)) continue;
  const measured=JSON.parse(readFileSync(p,'utf8'));
  const measuredRelease={version:measured.version||null,build:measured.build||null};
  const currentRelease={version:identity.version||null,build:identity.build||null};
  const fresh=measuredRelease.version===currentRelease.version && measuredRelease.build===currentRelease.build;
  measured.measured_release=measuredRelease;
  measured.current_release=currentRelease;
  measured.measured_on_this_release=fresh;
  measured.stale=!fresh;
  measured.release_lag={measured_release:measuredRelease.version,current_release:currentRelease.version};
  writeFileSync(p,JSON.stringify(measured,null,2)+'\\n');
}"""
replace_once('scripts/build-api.mjs',marker,stamp)

v=json.loads(text('version.json'))
if v.get('version') != OLD_VERSION or v.get('build') != OLD_BUILD: raise SystemExit('unexpected version.json base')
v['version']=NEW_VERSION; v['build']=NEW_BUILD
write('version.json',json.dumps(v,indent=2,ensure_ascii=False)+'\n')

p=json.loads(text('package.json'))
if p.get('version') != OLD_VERSION: raise SystemExit('unexpected package version')
p['version']=NEW_VERSION
needle=' && npm run test:agent'
cmd=p['scripts']['test:source']
if needle not in cmd: raise SystemExit('test:source insertion point missing')
p['scripts']['test:source']=cmd.replace(needle,' && node docs/verify-self-description-authority.mjs'+needle,1)
write('package.json',json.dumps(p,indent=2,ensure_ascii=False)+'\n')

idx=text('index.html')
idx,nv=re.subn(r"(const HCC_VERSION=')"+re.escape(OLD_VERSION)+r"(')",r'\g<1>'+NEW_VERSION+r'\2',idx,count=1)
idx,nb=re.subn(r"(const HCC_BUILD=')"+re.escape(OLD_BUILD)+r"(')",r'\g<1>'+NEW_BUILD+r'\2',idx,count=1)
if nv != 1 or nb != 1: raise SystemExit(f'index constants failed {nv}/{nb}')
for old,new in [
    (f'data-hcc-build="{OLD_BUILD}"',f'data-hcc-build="{NEW_BUILD}"'),
    (f'<meta name="hcc-build" content="{OLD_BUILD}">',f'<meta name="hcc-build" content="{NEW_BUILD}">'),
    (f'<span class="buildMark">· v{OLD_VERSION}</span>',f'<span class="buildMark">· v{NEW_VERSION}</span>')
]:
    if idx.count(old)!=1: raise SystemExit('index visible identity mismatch: '+old)
    idx=idx.replace(old,new,1)
write('index.html',idx)

manifest=json.loads(text('api/manifest.json'))
if manifest.get('version') != OLD_VERSION or manifest.get('build') != OLD_BUILD: raise SystemExit('unexpected manifest identity')
manifest['version']=NEW_VERSION; manifest['build']=NEW_BUILD
write('api/manifest.json',json.dumps(manifest,indent=2,ensure_ascii=False)+'\n')

verifier="""#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { CORE } from '../core/index.mjs';
const read=p=>readFileSync(p,'utf8'), json=p=>JSON.parse(read(p));
let pass=0,fail=0;
const ok=(n,c,d='')=>{if(c){pass++;console.log('  PASS — '+n+(d?' :: '+d:''));}else{fail++;console.log('  FAIL — '+n+(d?' :: '+d:''));}};
const readme=read('README.md'), llms=read('llms.txt'), server=read('server/server.mjs');
const manifest=json('api/manifest.json'), release=json('version.json');
const top=readme.match(/the atlas — \\*\\*(\\d+)\\*\\* laboratories across (\\d+) worlds, \\*\\*(\\d+)\\*\\* typed instruments/);
const want=[manifest.counts.laboratories,manifest.counts.worlds,manifest.counts.instruments];
ok('README catalogue counts agree with api/manifest.json',top&&top.slice(1).map(Number).every((n,i)=>n===want[i]),'want '+want.join('/'));
ok('README has no historical release boundary presented as live census',!/\\d+ laboratories across \\d+ worlds[\\s\\S]{0,100}v\\d+\\.\\d+\\.\\d+ release boundary/i.test(readme));
const lm=llms.match(/\\b(\\d+)\\s+laboratories\\b/);
ok('llms.txt carries no stale laboratory authority',!lm||Number(lm[1])===manifest.counts.laboratories,lm?lm[1]:'structural wording');
ok('MCP prose carries no frozen laboratory count',!/over\\s+\\d+\\s+laboratories/i.test(server));
const payload=CORE.openProblems(); const probs=payload.problems||payload.open_problems||[];
const find=id=>probs.find(p=>p.lab_id===id)||{};
const liv=find('atlas.liveness_is_measured_on_an_older_release').problem||'';
ok('liveness problem is structural, not version-frozen',liv.includes('measured_on_this_release')&&!/\\b\\d+\\.\\d+\\.\\d+\\b/.test(liv)&&!/others carry the current one/i.test(liv));
const cam=find('atlas.a_frame_is_configured_by_whoever_touched_it_last').problem||'';
ok('camera problem does not freeze a call-site count',cam.includes('setControlDistanceLimits')&&!/\\b\\d+\\s+call sites\\b/i.test(cam));
const desi=find('desi.covariance').problem||'';
ok('DESI problem separates runtime gap from off-atlas pilots',!existsSync('vde_likelihood')||(/inverse-covariance kernel/i.test(desi)&&/vde_likelihood\\//.test(desi)&&/not an atlas covariance layer/i.test(desi)&&!/no DESI covariance or evidence computation exists in this repository/i.test(desi)));
for(const kind of ['sensitivity','transfers','reach','liveness']){
  const a=json('api/'+kind+'.json'); const fresh=a.version===release.version&&a.build===release.build;
  ok(kind+' freshness stamp is derived',a.measured_release?.version===a.version&&a.measured_release?.build===a.build&&a.current_release?.version===release.version&&a.current_release?.build===release.build&&a.measured_on_this_release===fresh&&a.stale===!fresh&&a.release_lag?.measured_release===a.version&&a.release_lag?.current_release===release.version);
}
const measured=CORE.measurements();
for(const kind of ['sensitivity','transfers','reach','liveness']){
  const a=json('api/'+kind+'.json'), s=measured.artifacts[kind], fresh=a.version===release.version&&a.build===release.build;
  ok('CORE '+kind+' freshness agrees with artifact',s?.version===a.version&&s?.build===a.build&&s?.measured_on_this_release===fresh);
}
ok('CORE reports current atlas build',measured.atlas_release===release.version&&measured.atlas_build===release.build);
console.log('\\n  '+pass+' passed, '+fail+' failed');
process.exit(fail?1:0);
"""
write('docs/verify-self-description-authority.mjs',verifier)
