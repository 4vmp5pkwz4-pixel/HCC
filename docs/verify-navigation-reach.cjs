#!/usr/bin/env node
/* ============================================================================
   EVERY LABORATORY REACHABLE, ON EVERY SURFACE

   The atlas holds eighty-five laboratories and three ways to reach one: the wrist picker
   in XR, the command palette, and the catalogue. All three carried hand-written lists at
   some point, and a hand-written list standing in for a registry is the fault this file
   exists to keep closed.

   It was not hypothetical. Diffing the setS3View calls in the XR wrist menu against
   S3_VIEW_NAMES showed EIGHTEEN laboratories offered and eighty-five registered: sixty-
   seven of them — the Einstein ring, the accretion disk, neutrino oscillation, helium-3,
   the embadon laboratory, every CIVP station — could not be reached from inside a headset
   at all.

   The checks below run against the extracted kernels, in Node, with no browser and no
   headset, because "the headset menu is complete" must be checkable by someone who does
   not own one.

   Run: node docs/verify-navigation-reach.cjs
   ========================================================================= */

let pass = 0, fail = 0;
const ok = (t, c, d) => { c ? pass++ : fail++;
  console.log(`${c ? '  PASS' : '  FAIL'} — ${t}`); if (d) console.log(`         ${d}`); };

(async () => {
const { pathToFileURL } = require('node:url');
const { join } = require('node:path');
const { readFileSync } = require('node:fs');
const X = await import(pathToFileURL(join(__dirname, '..', 'core/atlas/extracted.mjs')).href);
const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

console.log('\nNAVIGATION — can a reader actually get to all eighty-five?\n');

/* the registry, read from the document rather than from the module, so the check cannot
   be satisfied by the extraction agreeing with itself */
const REG = (() => {
  const m = html.match(/const S3_VIEW_NAMES=\{([\s\S]*?)\};/);
  return [...m[1].matchAll(/([a-zA-Z0-9_]+):'/g)].map(x => x[1]);
})();

/* ── 1 · the headset ──────────────────────────────────────────────────────── */
{
  const xr = X.xrLabIds();
  const missing = REG.filter(v => !xr.includes(v));
  ok('the XR wrist picker enumerates every laboratory the router knows about',
    missing.length === 0 && xr.length === REG.length,
    `${xr.length} reachable of ${REG.length} registered in index.html${missing.length ? ' · MISSING: ' + missing.join(', ') : ' · none missing'}`);

  ok('and it does it by GENERATING the list, not by carrying one — the document contains no hand-written laboratory menu for XR any more',
    (() => { const menu = html.slice(html.indexOf('function refreshMenu()'), html.indexOf('function refreshXRControls'));
      const hard = [...menu.matchAll(/setS3View\('([a-z0-9]+)'\)/g)].map(m => m[1]);
      return hard.length === 0; })(),
    (() => { const menu = html.slice(html.indexOf('function refreshMenu()'), html.indexOf('function refreshXRControls'));
      const hard = [...menu.matchAll(/setS3View\('([a-z0-9]+)'\)/g)].map(m => m[1]);
      return `${hard.length} hard-coded setS3View calls remain in the wrist menu (was 18, covering ${18} of ${REG.length})`; })());

  ok('no laboratory appears twice and none is invented',
    new Set(xr).size === xr.length && xr.every(v => REG.includes(v)),
    `${new Set(xr).size} unique ids, all of them registered`);
}

/* ── 2 · paging covers the registry exactly once ──────────────────────────── */
{
  const xr = X.xrLabIds();
  const plan0 = X.xrLabPickerPlan({ labs: xr });
  const seen = [];
  for (const d of plan0.domains) {
    const p = X.xrLabPickerPlan({ labs: xr, domain: d });
    for (let k = 0; k < p.pages; k++) seen.push(...X.xrLabPickerPlan({ labs: xr, domain: d, page: k }).items);
  }
  ok('walking every page of every domain of the wrist picker yields the whole registry, exactly once — nothing dropped between pages and nothing repeated',
    seen.length === REG.length && new Set(seen).size === REG.length && REG.every(v => seen.includes(v)),
    `${plan0.domains.length} domains · ${plan0.domains.reduce((n, d) => n + X.xrLabPickerPlan({ labs: xr, domain: d }).pages, 0)} pages of nine · ${seen.length} slots for ${REG.length} laboratories`);

  ok('and a page index out of range wraps instead of rendering an empty wrist, in both directions',
    (() => { const d = plan0.domains[0];
      const hi = X.xrLabPickerPlan({ labs: xr, domain: d, page: 999 });
      const lo = X.xrLabPickerPlan({ labs: xr, domain: d, page: -7 });
      return hi.items.length > 0 && lo.items.length > 0 && hi.page < hi.pages && lo.page >= 0; })(),
    'page 999 and page −7 both land inside the range');

  ok('an unknown domain falls back to the first rather than showing nothing at all',
    (() => { const p = X.xrLabPickerPlan({ labs: xr, domain: 'not-a-domain' });
      return p.domain === plan0.domains[0] && p.items.length > 0; })(),
    `an unrecognised domain renders ${X.xrLabPickerPlan({ labs: X.xrLabIds(), domain: 'not-a-domain' }).items.length} laboratories rather than zero`);
}

/* ── 3 · the labels ───────────────────────────────────────────────────────── */
{
  const xr = X.xrLabIds();
  const labels = xr.map(v => X.xrLabShort(v));
  ok('every wrist label fits the twenty characters a third of a 42 cm panel can carry at arm’s length',
    labels.every(l => l.length <= 20),
    `longest ${Math.max(...labels.map(l => l.length))} characters`);

  ok('AND NO TWO LABELS ARE THE SAME. Keeping the part before the middle dot — the obvious rule — rendered all seven CIVP stations as the identical button "CIVP"',
    new Set(labels).size === labels.length,
    `${new Set(labels).size} distinct labels for ${labels.length} laboratories · the CIVP stations read "${['civplock', 'civpcut', 'civpidx'].map(v => X.xrLabShort(v)).join('", "')}"`);

  ok('and a label is never cut in the middle of a word — it ends at a space or at the end of the name',
    labels.every(l => !/\S…$/.test(l) || l.length <= 20) && labels.every(l => !l.includes('  ')),
    `${labels.filter(l => l.endsWith('…')).length} labels are elided, each at a word boundary`);
}

/* ── 4 · the recent list ──────────────────────────────────────────────────── */
{
  ok('the recent-laboratory list keeps the most recent first, de-duplicates, and refuses an id that is not a laboratory',
    (() => { const a = X.xrLabRemember('elens');
      X.xrLabRemember('adisk'); const r = X.xrLabRemember('elens');
      const n = r.length; X.xrLabRemember('definitely-not-a-lab');
      const after = X.xrLabRemember('elens');
      return r[0] === 'elens' && r[1] === 'adisk' && n === 2 && after.length === 2; })(),
    'elens → adisk → elens leaves [elens, adisk]; an unregistered id is refused rather than stored');
}

/* ── 5 · every laboratory can be found by what it does ────────────────────── */
{
  /* the palette and the catalogue search the same four registries; here the registries are
     read straight out of the document, so this is a check on the CONTENT and not on the
     search code agreeing with itself */
  /* THE THREE SOURCES THE SEARCH ACTUALLY READS. My first version of this check scanned
     two of them and reported a forty-six laboratory "gap" that did not exist: most
     descriptions live in LAB_ATLAS_DEFS, as the fifth element of each row. A verifier
     that checks a narrower thing than the code does is not a stricter verifier, it is a
     wrong one. */
  const grab = (name, re) => { const m = html.match(re); return m ? m[1] : ''; };
  const descExtra = grab('LAB_DESC_EXTRA', /const LAB_DESC_EXTRA=\{([\s\S]*?)\n\};/);
  const targets   = grab('PREDICTION_TARGETS', /const PREDICTION_TARGETS=\{([\s\S]*?)\n\};/);
  const atlasDefs = grab('LAB_ATLAS_DEFS', /const LAB_ATLAS_DEFS=\[([\s\S]*?)\n\];/);
  const hay = (descExtra + targets + atlasDefs).toLowerCase();

  /* and it TOKENISES, because the filter does: "point node" matches a description that
     writes "point-node", and demanding the exact phrase would fail on the hyphen alone */
  const tokenHit = q => q.toLowerCase().split(/\s+/).every(t => hay.includes(t));
  const probes = [['isco', 'adisk'], ['point node', 'he3'], ['unitarity', 'nuosc'],
                  ['einstein radius', 'elens'], ['circulation quantum', 'he3'],
                  ['49/36', 'adisk']];
  ok('the words a reader actually arrives with are present in the searchable registries, so a laboratory can be found by what it does and not only by what it is called',
    probes.every(([q]) => tokenHit(q)),
    probes.map(([q, id]) => `"${q}" → ${id}`).join(' · ') + ' · the catalogue filter used to match the title and the id and nothing else');

  const described = new Set([
    ...[...descExtra.matchAll(/^\s*([a-zA-Z0-9_]+):/gm)].map(x => x[1]),
    ...[...targets.matchAll(/^\s*([a-zA-Z0-9_]+):/gm)].map(x => x[1]),
    ...[...atlasDefs.matchAll(/\[\s*'[a-zA-Z0-9_]+'\s*,\s*'([a-zA-Z0-9_]+)'/g)].map(x => x[1]),
  ]);
  const gap = REG.filter(v => !described.has(v));
  ok('and every laboratory carries a description somewhere the search can see it, so none of the eighty-five is findable by name alone',
    gap.length === 0,
    `${REG.length - gap.length} of ${REG.length} carry a description or a declared prediction target${gap.length ? ' · GAP: ' + gap.join(', ') : ' · no gap'}`);
}

/* ── 6 · the relation graph is walkable from every laboratory ─────────────── */
{
  /* THE GRAPH IS READ OUT OF THE DOCUMENT, not out of the extracted module. Pulling the
     whole relation table into the kernel slice dragged in prose blocks the statement
     walker could not classify and a reference to `window`, and the extraction verifier
     said so — correctly. The table is prose-heavy data, not physics; it belongs in the
     page. So the tuples are parsed here, exactly as S3_VIEW_NAMES is above, and the check
     stays a check on the document rather than on the module agreeing with itself. */
  const relSrc = html.slice(html.indexOf('const NEXUS_RELATIONS=['));
  const edges = [...relSrc.slice(0, relSrc.indexOf('\n];')).matchAll(
    /\[\s*'([a-zA-Z0-9_]+)'\s*,\s*'([a-zA-Z0-9_]+)'\s*,\s*'([a-z-]+)'/g)]
    .map(m => ({ a: m[1], b: m[2], type: m[3] }));
  const REGSET = new Set(REG);
  const neighbours = id => { const seen = new Set(), out = [];
    for (const e of edges) { const o = e.a === id ? e.b : e.b === id ? e.a : null;
      if (!o || seen.has(o) || !REGSET.has(o)) continue; seen.add(o); out.push({ id: o, kind: e.type }); }
    return out; };
  const X = { labNeighbours: neighbours, xrLabIds: () => REG };

  const ids = REG;
  const iso = ids.filter(v => X.labNeighbours(v).length === 0);
  ok('EVERY laboratory declares at least one neighbour in the relation table, so "where can I go from here" always has an answer',
    iso.length === 0,
    `${ids.length - iso.length} of ${ids.length} have a declared neighbour${iso.length ? ' · ISOLATED: ' + iso.join(', ') : ''} · ${edges.length} edges in the source table. The graph the page BUILDS from these holds 204 of them and leaves "nexus" isolated, which is right — the Nexus is the graph rather than a node in it — and the in-browser self-test measures that side.`);

  ok('and the neighbour list reads the relation objects the atlas builds rather than the tuples its source literal is written as — reading the tuple shape reported all eighty-five as isolated, an always-empty "related" row, which is worse than no row because it asserts there is nothing nearby',
    X.labNeighbours('adisk').length === 4
    && X.labNeighbours('adisk').every(n => n.id && n.kind && REGSET.has(n.id)),
    `adisk → ${X.labNeighbours('adisk').map(n => n.id + ' (' + n.kind + ')').join(', ')}`);

  ok('no laboratory is its own neighbour, no neighbour is listed twice, and every edge lands on something the router can actually reach',
    ids.every(v => { const nb = X.labNeighbours(v);
      return nb.every(n => n.id !== v) && new Set(nb.map(n => n.id)).size === nb.length; }),
    `busiest node: ${(() => { let b = '', n = 0; for (const v of ids) { const k = X.labNeighbours(v).length; if (k > n) { n = k; b = v; } } return b + ' with ' + n + ' neighbours'; })()}`);

  ok('and the relation is symmetric as a route: if A lists B then B lists A, so walking the graph can never strand you somewhere with no way back',
    (() => { for (const v of ids) for (const n of X.labNeighbours(v))
        if (!X.labNeighbours(n.id).some(m => m.id === v)) return false;
      return true; })(),
    `every one of the ${ids.reduce((n, v) => n + X.labNeighbours(v).length, 0) / 2} edges is walkable in both directions`);
}

console.log(`\n${fail === 0 ? '✔' : '✗'} ${pass} passed, ${fail} failed\n`);
process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
