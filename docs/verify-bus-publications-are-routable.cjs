#!/usr/bin/env node
'use strict';
/* ══ PUBLISHING IS NOT BEING ROUTABLE, AND THIS IS THE MISSING MEASUREMENT ═════
 *
 * The atlas wrote this defect down itself and then left it unmeasured:
 *
 *   atlas.a_laboratory_can_publish_to_a_bus_that_cannot_see_it —
 *   "ATLAS_BUS.pub accepts a name, a value and a unit from any station whatsoever
 *    and returns nothing, so a laboratory can publish for a hundred releases into a
 *    registry that will never route it and no check anywhere notices the difference
 *    between publishing and being routable. The count of publications is not the
 *    count of couplings and never was, and this atlas has no measurement of the gap."
 *
 * IT DOES NOW, AND THE GAP IS LARGER THAN THE LEDGER GUESSED. Two hundred and
 * seventy-two publications; forty of them the bus could route. The rest divide into
 * a station with no instrument contract at all, and — far more often — a station
 * whose contract exists and calls the same quantity something else. sn.L against the
 * declared sn.luminosity; bht.TH against bht.T_H; exo.transit_depth_ppm against
 * exo.depth_ppm; rmhd.vA against rmhd.alfven_speed. The bus and the contracts are
 * TWO VOCABULARIES FOR THE SAME LABORATORIES, which is the atlas's own definition of
 * a defect: two authorities for one fact.
 *
 * THREE AUTHORITIES, EACH ASKED FOR ONE THING AND NOTHING ELSE:
 *
 *   THE INVENTORY   docs/lib/atlas-source.cjs reads every ATLAS_BUS.pub site out of
 *                   index.html behind a census that THROWS if the pattern matches
 *                   fewer rows than a cruder independent count.
 *   THE CONTRACTS   api/manifest.json, which the atlas generates by walking all of
 *                   its own laboratories headless. Its version is compared against
 *                   HCC_VERSION so a stale table cannot quietly flatter the count.
 *   THE RULE        function busRoutability is CUT OUT OF index.html AND EXECUTED
 *                   here, over a contract registry built from the manifest. The rule
 *                   is not restated in this file. If the atlas changes what routable
 *                   means, this number changes with it and no edit here is needed —
 *                   which is the only way a check and its subject stay one authority.
 *
 * THE CEILING ONLY FALLS AND THE FLOOR ONLY RISES. Neither may be edited in the
 * direction that makes a regression pass; that is what makes them a measurement
 * rather than a note.
 */
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const { busPublications } = require('./lib/atlas-source.cjs');

let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

/* ── the rule, taken from the atlas rather than written again ──────────────── */
const fnStart = src.indexOf('function busRoutability(');
const fnEnd = src.indexOf('\nconst ATLAS_BUS=', fnStart);
ok('the routability rule exists in index.html as one named function',
  fnStart > 0 && fnEnd > fnStart, 'function busRoutability(key,unit) declared before ATLAS_BUS');
const ruleSrc = fnStart > 0 && fnEnd > fnStart ? src.slice(fnStart, fnEnd) : '';

/* ── the contracts, from the manifest the atlas builds by walking itself ───── */
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/manifest.json'), 'utf8'));
const version = (src.match(/const HCC_VERSION='([^']+)'/) || [])[1] || null;
ok('the contract table is the one this release generated, not an older one',
  manifest.version === version, `api/manifest.json ${manifest.version} vs HCC_VERSION ${version}`);
const specs = new Map((manifest.instruments || []).map(i => [i.id, i]));
ok('the contract table carries every instrument with its declared outputs',
  specs.size >= 100 && [...specs.values()].every(s => Array.isArray(s.outputs)),
  `${specs.size} instruments, ${[...specs.values()].reduce((n, s) => n + s.outputs.length, 0)} declared outputs`);

/* ── run the atlas's rule over the atlas's contracts ─────────────────────────
   The rule consults two tables: the contracts, which come from the manifest, and the
   list of publications refused BY NAME as not being quantities at all. Both are cut
   out of the atlas rather than restated, so a publication that stops being refused
   there stops being refused here on the same edit. */
const nqStart = src.indexOf('const HCC_NOT_QUANTITIES=Object.freeze({');
const nqEnd = src.indexOf('\n});', nqStart);
ok('the deliberately unroutable publications are declared in one frozen table',
  nqStart > 0 && nqEnd > nqStart, 'const HCC_NOT_QUANTITIES=Object.freeze({...})');
const ctx = vm.createContext({ HCC_API_SPECS: specs });
vm.runInContext(src.slice(nqStart, nqEnd + 4) + '\n' + ruleSrc + '\n;globalThis.__r = busRoutability;'
  + '\n;globalThis.__nq = HCC_NOT_QUANTITIES;', ctx);
const judge = ctx.__r;
const NQ = ctx.__nq;
const thinReasons = Object.entries(NQ).filter(([, why]) => String(why).length < 100);
ok('and each one carries a reason long enough to be a reason rather than a label',
  Object.keys(NQ).length >= 5 && thinReasons.length === 0,
  thinReasons.length ? `${thinReasons.length} refusal(s) with almost no reason: ${thinReasons.map(r => r[0]).join(' ')}`
    : `${Object.keys(NQ).length} refused by name, shortest reason ${Math.min(...Object.values(NQ).map(w => String(w).length))} chars`);

/* THE SELF-TEST'S OWN PROBE IS NOT A PUBLICATION, AND IT IS EXCLUDED BY NAME RATHER
   THAN BY BEING HIDDEN. The boot suite proves pub() returns a verdict by publishing
   one key and deleting it again. Writing that key as a computed string would have
   kept it out of this census and would have been a way of not counting something —
   the exact move this file exists to prevent. It stays a plain literal in the source,
   it is named here, and the atlas is checked for removing it. */
const PROBE = 'selftest.routability_probe';
const allKeys = busPublications(src);
const probes = allKeys.filter(k => k === PROBE);
ok('the only publication excluded from the census is the self-test probe, and the atlas deletes it again',
  probes.length === 1 && /m\.delete\('selftest\.routability_probe'\)/.test(src.replace(/\s+/g, '')),
  `${probes.length} probe site(s) named ${PROBE}, removed from _d, _t and _r immediately after publication`);
/* COUNTED BY KEY AND NOT BY CALL SITE. The first version counted publication SITES,
   and a key published from two places counted twice — so removing pole.Q's duplicate
   site, which is a repair, lowered a floor that may only rise. The atlas publishes
   QUANTITIES; how many places each is written from is a separate fact, checked below
   and not mixed into this one. */
const keys = [...new Set(allKeys.filter(k => k !== PROBE))];
const sites = allKeys.filter(k => k !== PROBE).length;
const rows = keys.map(k => judge(k, undefined));
ok('the census counts distinct keys, and says how many call sites wrote them',
  keys.length <= sites && keys.length >= 240,
  `${keys.length} distinct key(s) published from ${sites} call site(s)`);
const routable = rows.filter(r => r.routable).length;
const tally = {};
for (const r of rows) tally[r.reason] = (tally[r.reason] || 0) + 1;

/* ── the reason vocabulary is declared once and every reason produced is in it ─ */
const reasonBlock = src.slice(src.indexOf('const BUS_REASONS=Object.freeze({'),
  src.indexOf('function busRoutability('));
const declaredReasons = [...reasonBlock.matchAll(/^\s{2}([a-z_]+):'/gm)].map(m => m[1]);
const undeclared = Object.keys(tally).filter(r => !declaredReasons.includes(r));
ok('every reason the rule can return is declared, with a sentence rather than a word',
  declaredReasons.length >= 5 && undeclared.length === 0
  && !/^\s{2}[a-z_]+:'.{0,60}'/m.test(reasonBlock),
  undeclared.length ? `reasons produced but never declared: ${undeclared.join(', ')}`
    : `${declaredReasons.length} declared: ${declaredReasons.join(', ')}`);

/* ── AND THE GAP, COUNTED ──────────────────────────────────────────────────────
   Raise the floor and lower the ceiling when the work is done; never the reverse. */
/* v4.192.0 measured it first at 232 unrouted and 40 routable. v4.193.0 declared
   instrument contracts for the wheels of time and the cycles of the sky — the two
   largest stations that had none — and twenty publications became routable by the
   same rule that had judged them unroutable. v4.194.0 declared four more —
   asteroseismology, gyrochronology, the radiative wind and the Fermi bubbles — and
   repaired seven unit spellings the conversion table did not know, for another
   twenty-three. v4.195.0 declared the Earth`s axis and REFUSED seven publications by
   name as not being quantities at all, which is the other honest way a station leaves
   this list. v4.196.0 declared the seven calendar phases the chronometry observatory
   had always computed and never declared, which is the FIRST repair of the large half:
   a station holding a contract that did not name what it publishes.
   Stations with no contract at all: 15, then 13, then 9, then 5. */
/* THE BASIS CHANGED FROM CALL SITES TO KEYS AT v4.197.0, AND THAT IS NOT A
   REGRESSION. Until then a key published from two places was counted twice: 272
   sites over 269 distinct keys, with pole.Q, rel.gamma and sn.Dbox each written from
   two. Removing pole.Q's duplicate — a repair — lowered a floor that may only rise,
   which is what a floor over the wrong quantity does. These numbers are over KEYS
   and are not comparable to the ones before them; from here they move the one way. */
const BUS_UNROUTED_CEILING = 179;
const BUS_ROUTABLE_FLOOR = 90;
/* AND THE DEBT IS THE ACCIDENTAL HALF ALONE. A publication refused by name with a
   written reason is finished work, not debt, and counting it with the merely
   undeclared ones lets the total fall for the wrong reason. This ceiling is over the
   publications that want a declaration and have not got one, and it is the number
   that actually has to reach zero. */
const BUS_UNDECLARED_CEILING = 172;
const unrouted = rows.length - routable;

ok('every published key in the source is judged, none skipped',
  rows.length === keys.length && rows.length >= 240,
  `${rows.length} key(s) judged out of ${keys.length} found in index.html`);
ok('the number of publications the bus cannot route is at or below its ceiling, and the ceiling only falls',
  unrouted <= BUS_UNROUTED_CEILING,
  `unrouted ${unrouted} against ceiling ${BUS_UNROUTED_CEILING} — a rise means a new publication was added to a laboratory whose contract does not declare it`);
ok('the number it can route is at or above its floor, and the floor only rises',
  routable >= BUS_ROUTABLE_FLOOR,
  `routable ${routable} against floor ${BUS_ROUTABLE_FLOOR}`);
const deliberate = rows.filter(r => r.reason === 'not_a_quantity').length;
ok('and the debt is counted apart from the deliberate refusals, so it cannot fall for the wrong reason',
  (unrouted - deliberate) <= BUS_UNDECLARED_CEILING && deliberate === Object.keys(NQ).length,
  `${unrouted - deliberate} publication(s) want a declaration and have not got one, against ceiling ${BUS_UNDECLARED_CEILING}`
  + ` · ${deliberate} refused by name, which is finished work rather than debt`);

/* ── the gap is legible, not just counted: which laboratories, and why ─────── */
const byLab = new Map();
for (const r of rows) {
  const L = byLab.get(r.lab) || { published: 0, unrouted: 0, reason: null };
  L.published++; if (!r.routable) { L.unrouted++; L.reason = r.reason; }
  byLab.set(r.lab, L);
}
const worst = [...byLab].filter(([, l]) => l.unrouted).sort((a, b) => b[1].unrouted - a[1].unrouted);
const noContract = worst.filter(([, l]) => l.reason === 'no_contract');
ok('the gap resolves to named laboratories rather than one number',
  worst.length > 0 && worst.every(([id]) => typeof id === 'string' && id.length > 0),
  `${worst.length} laboratories publish something unroutable · worst: `
  + worst.slice(0, 5).map(([id, l]) => `${id} ${l.unrouted}/${l.published}`).join(', '));
ok('and the two kinds of gap are kept apart, because they are not the same repair',
  tally.no_contract > 0 && tally.undeclared_output > 0,
  `${tally.no_contract || 0} from ${noContract.length} station(s) with no contract at all `
  + `(a contract has to be written) · ${tally.undeclared_output || 0} from stations whose contract `
  + `calls the same quantity something else (one vocabulary has to win)`);

/* ── and the atlas can be asked, at any moment, without reading this file ──── */
/* SLICED, NOT PATTERN-MATCHED. The first draft of this check used [^}]* to span the
   body of pub(), and the body contains braces — it publishes an object literal — so
   the check went red against a correct implementation. A check pinned to punctuation
   tests the punctuation. The body is cut out by its two ends and read. */
const pubBody = (() => { const a = src.indexOf('pub(k,v,unit){');
  const b = src.indexOf('\n  get(k){', a); return a > 0 && b > a ? src.slice(a, b) : ''; })();
ok('ATLAS_BUS.pub returns the verdict instead of nothing, so a publication is judged as it happens',
  /busRoutability\(/.test(pubBody) && /return\s+verdict/.test(pubBody),
  'pub() computes and returns a routability verdict');
ok('the census is reachable from outside as one named global',
  /globalThis\.HCC_BUS_ROUTABILITY=HCC_BUS_ROUTABILITY/.test(src)
  && /function HCC_BUS_ROUTABILITY\(\)/.test(src), 'globalThis.HCC_BUS_ROUTABILITY()');
/* ── AND A KEY WITH TWO AUTHORS ──────────────────────────────────────────────
   pub overwrites in silence, which is right for a live value and wrong for a key two
   places write. The unit string is what separates them, and pole.Q is what it found:
   published twice in one block, as Q to four decimals and as loaded Q to two, the
   second overwriting the first every tick. */
const pubBody2 = (() => { const a = src.indexOf('pub(k,v,unit){');
  const b = src.indexOf('\n  get(k){', a); return a > 0 && b > a ? src.slice(a, b) : ''; })();
ok('the bus records the unit each key was FIRST published under, so a second author cannot overwrite in silence',
  pubBody2.includes('this._u.get(k)') && pubBody2.includes('conflict:true'),
  'pub compares the unit against the first one seen and records a conflict');
ok('and a key republished with a new value under the SAME unit is not called a conflict, because that is what a live value does',
  /first!==u/.test(pubBody2) && !/first!==v/.test(pubBody2),
  'the comparison is on the unit string, never on the value');
const poleQ = (src.match(/ATLAS_BUS\.pub\('pole\.Q'/g) || []).length;
ok('pole.Q is published once, from the line that calls itself canonical',
  poleQ === 1, `${poleQ} publication site(s) for pole.Q — two of them meant the second silently won`);

ok('and it counts BOTH directions, because either half alone is the misleading one',
  /declared_but_never_published/.test(src) && /fraction_routable/.test(src),
  'published-but-unroutable and declared-but-never-published are separate counts');

/* ── AND A READER MUST BE ABLE TO SEE IT, WHICH A CENSUS ALONE IS NOT ──────────
   The atlas proves the RENDER at boot with two probes and reads the drawn text back.
   What is checked here is that the render exists at all and is fed from the rule
   rather than from a hand-kept list, so the two halves cannot drift apart. */
const panel = (() => { const a = src.indexOf('function busDrivenHTML('),
  b = src.indexOf('function nexusRailHTML(', a); return a > 0 ? src.slice(a, b) : ''; })();
ok('the laboratory panel lists what the station publishes, judged by the same rule',
  panel.includes('ATLAS_BUS.routable(key)') && panel.includes('busRoutability(key,e.unit)')
  && panel.includes('BUS_REASONS'),
  'busDrivenHTML asks the bus for the verdict rather than keeping its own list');
ok('and an unroutable publication is drawn with the grounds, not merely greyed out',
  /pubs\.map/.test(panel) && panel.includes('p.why') && panel.includes('p.reason'),
  'each row carries the reason sentence from the declared vocabulary');
ok('a publication row is not dressed as a route a finger can follow, because it is not one',
  !/pubs\.map\(p=>`\s*<div class="navRow"/.test(panel),
  'publication rows carry no data-nexjump and no navRow class — nothing to press');
/* SLICED FROM THE HEAD OF THE BLOCK, NOT FROM ITS VERDICT. The first draft started
   the slice at the ok() sentence, which sits AFTER the code it describes, so the
   check read an empty region and went red against a working assertion. */
const boot = src.slice(src.indexOf('AND A READER STANDING IN A LABORATORY CAN SEE WHAT LEAVES IT'),
  src.indexOf('EVERY RELATIONSHIP THE ATLAS KNOWS IS NOW A ROUTE'));
ok('the atlas measures that render on itself at boot, with a declared probe and an undeclared one, and removes both',
  boot.includes('__no_such_output__') && /drawnRoutable/.test(boot)
  && /m\.delete\(k\)/.test(boot),
  'two probes into a registered laboratory, read back off the rendered text, then deleted');

console.log(`\n${fail ? 'FAIL' : 'PASS'} — bus publications are judged for routability :: `
  + `${rows.length} published, ${routable} routable, ${unrouted} not `
  + `(${JSON.stringify(tally)}) · ${pass} check(s) passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
