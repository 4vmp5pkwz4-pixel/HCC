#!/usr/bin/env node
'use strict';
/* WHAT AN AGENT COULD NOT ASK THIS ATLAS.
 *
 * Nine tools: enumerate laboratories, describe one, run it, sweep it, validate it,
 * export the result, read every declared gap. Not one of them could say how two
 * laboratories are RELATED. So an agent could read all 132 laboratory contracts and
 * still not learn that the quantity bus refuses thirty-seven couplings it found
 * admissible, or on what grounds — which is the single most useful thing this atlas
 * knows, because a refusal with a reason is a boundary an agent can plan around and
 * a laboratory list is not.
 *
 * The surface exists now, and this holds it to three things:
 *
 *   COMPLETE   nothing is dropped between the registry and the answer. A count that
 *              silently truncates is how a caller concludes an edge does not exist.
 *   ONE SOURCE the HTTP route and the MCP tool call the SAME function. openProblems
 *              taught this repository that two surfaces each building the same answer
 *              will disagree by ten entries and nobody will notice for a release.
 *   HONEST     an unknown kind is refused with the known ones named, and a laboratory
 *              nothing connects to is TOLD SO. An empty list that means "no such
 *              name" and an empty list that means "no edges" are different answers.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
let pass = 0, fail = 0;
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  PASS — ' + name + (detail ? ' :: ' + detail : '')); }
  else { fail++; console.log('  FAIL — ' + name + (detail ? ' :: ' + detail : '')); } };

(async () => {
  const { CORE, evidenceTierOf } = await import('../core/index.mjs');
  const { TOOLS } = await import('../server/server.mjs');
  const gb = await import('../core/cycles/galactic-butterfly.mjs');

  const all = CORE.connections();

  /* ── COMPLETE: two authorities for each count, and they have to agree ─────── */
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/manifest.json'), 'utf8'));
  ok('every route and every refusal the atlas walk recorded reaches the agent surface',
    all.counts.route === man.bus.links.length && all.counts.refusal === man.bus.refused.length,
    `${all.counts.route}/${man.bus.links.length} routes · ${all.counts.refusal}/${man.bus.refused.length} refusals`);
  ok('and every sourced connection the explorer declares reaches it too',
    all.counts.sourced === gb.RELATIONS.length && gb.RELATIONS.length >= 12,
    `${all.counts.sourced} of ${gb.RELATIONS.length} declared`);
  ok('the returned array is the whole answer, not a page of it — a silent truncation is how an edge is concluded not to exist',
    all.connections.length === all.counts.total
    && all.counts.total === all.kinds.reduce((n, k) => n + all.counts[k], 0),
    `${all.connections.length} rows, ${all.counts.total} counted = ${all.kinds.map(k => all.counts[k] + ' ' + k).join(' + ')}`);

  /* ── the three kinds each carry what makes them worth having ─────────────── */
  const refusals = all.connections.filter(c => c.kind === 'refusal');
  ok('a refusal states its grounds — "no" without a reason is not an answer an agent can act on',
    refusals.length > 20 && refusals.every(c => typeof c.evidence === 'string' && c.evidence.length > 40),
    `${refusals.length} refusals, shortest reason ${Math.min(...refusals.map(c => c.evidence.length))} chars`);
  const sourced = all.connections.filter(c => c.kind === 'sourced');
  ok('a sourced connection carries its claim KIND and a resolvable URL for every source it cites',
    sourced.length >= 12 && sourced.every(c => !!c.claim_kind && c.sources.length > 0
      && c.sources.every(s => /^https?:\/\//.test(s.url || '') && !s.missing)),
    `${new Set(sourced.map(c => c.claim_kind)).size} claim kinds over ${sourced.length} connections`);
  const routes = all.connections.filter(c => c.kind === 'route');
  ok('a route names both endpoints and the unit the number travels in',
    routes.every(c => c.from && c.to && c.unit !== undefined),
    `${routes.length} routes`);

  /* ── THE TYPED GRAPH: sliced from the document, not transcribed ──────────── */
  const ex = await import('../core/atlas/extracted.mjs');
  const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  ok('the typed relation graph reaches the agent surface whole',
    all.counts.typed === ex.NEXUS_RELATIONS.length && ex.NEXUS_RELATIONS.length >= 300,
    `${all.counts.typed} of ${ex.NEXUS_RELATIONS.length} edges over `
    + `${new Set(ex.NEXUS_RELATIONS.flatMap(r => [r.a, r.b])).size} laboratories`);
  ok('and it is SLICED out of index.html rather than transcribed, so the panel and the API cannot disagree',
    /'NEXUS_RELATIONS'/.test(fs.readFileSync(path.join(ROOT, 'scripts/extract-kernels.mjs'), 'utf8'))
    && html.includes('const NEXUS_RELATIONS=['),
    'declared in the extractor ROOTS; index.html remains its only home');

  const typed = all.connections.filter(c => c.kind === 'typed');
  ok('every typed edge names both ends, the KIND of relationship, the claim and the sentence behind it',
    typed.every(c => c.from && c.to && c.relation && c.claim && c.evidence && c.epistemic_status),
    `${new Set(typed.map(c => c.relation)).size} relationship kinds: ${[...new Set(typed.map(c => c.relation))].sort().join(' ')}`);

  /* ── the derived tier, which is the part that could quietly lie ───────────── */
  const statuses = [...new Set(ex.NEXUS_RELATIONS.map(r => r.status))];
  const tiers = all.counts.by_evidence_tier;
  /* AND THE FALLBACK IS EXERCISED RATHER THAN ASSUMED. unclassified being zero says
     nothing about whether the rule CAN return it — a mutation making the fallback
     return "model" leaves every count identical, because no status in the file is
     currently unanticipated. The rule is handed a status nobody wrote, and has to
     say so. That is the whole safety of publishing a derived field. */
  ok('a status the rule does not anticipate is reported as unclassified rather than swept into a tier',
    evidenceTierOf('a-status-nobody-ever-wrote-and-nobody-will') === 'unclassified'
    && evidenceTierOf('theorem-bound') === 'theorem',
    /* the detail names what actually went wrong; a failure that prints the sentence
       it would have printed on success argues against its own verdict */
    [evidenceTierOf('a-status-nobody-ever-wrote-and-nobody-will') !== 'unclassified'
       && 'an unanticipated status was given the tier "' + evidenceTierOf('a-status-nobody-ever-wrote-and-nobody-will') + '" instead of unclassified',
     evidenceTierOf('theorem-bound') !== 'theorem'
       && 'precedence broken: theorem-bound → ' + evidenceTierOf('theorem-bound')
    ].filter(Boolean).join(' · ') || 'the fallback is reachable and the precedence holds: theorem-bound → theorem');

  ok('SEVENTY-ONE free-text statuses are reduced to a tier an agent can filter on, and nothing falls through',
    statuses.length > 40 && tiers.unclassified === 0
    && typed.every(c => typeof c.evidence_tier === 'string'),
    `${statuses.length} distinct statuses → ${Object.entries(tiers).filter(([, n]) => n).map(([t, n]) => t + ' ' + n).join(' · ')}`);
  ok('and every tier the surface advertises is actually populated — a tier nothing lands in is a guess about the data',
    all.evidence_tiers.filter(t => t !== 'unclassified').every(t => tiers[t] > 0),
    all.evidence_tiers.filter(t => t !== 'unclassified' && !tiers[t]).join(' ') || 'all eight populated');
  /* MEMBERSHIP IS NOT CORRESPONDENCE. The first draft of this check asked whether
     each served status was IN the set of statuses, which a mutation replacing every
     one of them with the single word "model" passes, because "model" is in that set.
     Compare edge by edge against the source instead. */
  const byId = new Map(ex.NEXUS_RELATIONS.map(r => [r.id, r]));
  const drifted = typed.filter(c => (byId.get(c.id) || {}).status !== c.epistemic_status);
  ok('the RAW status is served unchanged beside the tier — the derived field never replaces what somebody wrote',
    drifted.length === 0 && typed.length === byId.size,
    drifted.length ? (drifted.length + ' edge(s) served a status their own row does not carry, e.g. '
      + drifted[0].id + ': "' + drifted[0].epistemic_status + '" vs "' + (byId.get(drifted[0].id) || {}).status + '"')
      : typed.length + ' edges, each carrying its own status string as written');
  const theorem = CORE.connections({ tier: 'theorem' });
  ok('"only the theorem-grade edges" is a question with an answer',
    theorem.counts.returned === tiers.theorem && theorem.counts.returned > 50
    && theorem.connections.every(c => /theorem|exact/.test(c.epistemic_status)),
    theorem.connections.filter(c => !/theorem|exact/.test(c.epistemic_status)).length
      ? (theorem.connections.filter(c => !/theorem|exact/.test(c.epistemic_status)).length
         + ' edge(s) in the theorem tier whose own status names neither a theorem nor an exactness')
      : `${theorem.counts.returned} edges whose own status names a theorem or an exactness`);
  let refusedTier = null;
  try { CORE.connections({ tier: 'bogus' }); } catch (e) { refusedTier = e; }
  ok('an unknown tier is refused with the known tiers named',
    !!refusedTier && refusedTier.code === 'BAD_INPUT' && /known tiers:/.test(refusedTier.message),
    refusedTier ? refusedTier.message.slice(0, 90) : 'an unknown tier was accepted');
  const noTier = CORE.connections({ kind: 'route', tier: 'theorem' });
  ok('and asking for a tier on a kind that carries none is TOLD SO, not answered with an empty list',
    noTier.counts.returned === 0 && /carries an evidence tier/.test(noTier.note || ''),
    noTier.note || 'no note');

  /* ── ONE SOURCE: no second implementation anywhere ───────────────────────── */
  const server = fs.readFileSync(path.join(ROOT, 'server/server.mjs'), 'utf8');
  const route = /\/api\/v1\/connections'[\s\S]{0,400}?CORE\.connections\(/.test(server);
  const tool = TOOLS.find(t => t.name === 'list_connections');
  const toolBody = tool ? String(tool.call) : '';
  ok('the HTTP route and the MCP tool both call CORE.connections — one function, two doors',
    route && !!tool && /CORE\.connections\(/.test(toolBody),
    /* the detail has to name WHICH half broke: the first draft printed "route ✓ · tool ✓"
       on the very mutation that gave the tool its own implementation, which is a failure
       message that argues against its own verdict */
    [!route && 'the HTTP route does not delegate to CORE.connections',
     !tool && 'the MCP tool list_connections is missing',
     tool && !/CORE\.connections\(/.test(toolBody) && 'the MCP tool has its own implementation: ' + toolBody.slice(0, 60)
    ].filter(Boolean).join(' · ') || 'route ✓ · tool ✓ · one function behind both');
  ok('and the tool declares its filters as a closed enum, so an agent is told the kinds rather than guessing them',
    !!tool && Array.isArray(tool.inputSchema.properties.kind.enum)
    && tool.inputSchema.properties.kind.enum.join() === all.kinds.join(),
    tool ? tool.inputSchema.properties.kind.enum.join(' · ') : '');

  /* ── HONEST: the two empty answers are different answers ─────────────────── */
  let refusedKind = null;
  try { CORE.connections({ kind: 'bogus' }); }
  catch (e) { refusedKind = e; }
  ok('an unknown kind is REFUSED with the known kinds named, never answered with an empty list',
    !!refusedKind && refusedKind.code === 'BAD_INPUT' && /route, refusal, sourced/.test(refusedKind.message),
    refusedKind ? refusedKind.message : 'an unknown kind was accepted');
  const miss = CORE.connections({ lab: 'definitely-not-a-lab' });
  ok('a name that matches nothing is TOLD SO, so an empty list is never mistaken for an absence of edges',
    miss.counts.returned === 0 && typeof miss.note === 'string' && miss.note.includes('check the spelling'),
    miss.note || 'no note');
  const eos = CORE.connections({ lab: 'eos' });
  ok('and a laboratory that does connect comes back with its edges and no note',
    eos.counts.returned > 0 && eos.note === null,
    `eos: ${eos.counts.returned} connection(s)`);

  /* ── and the machine-facing contracts advertise it ───────────────────────── */
  const openapi = JSON.parse(fs.readFileSync(path.join(ROOT, 'api/openapi.json'), 'utf8'));
  const mcp = JSON.parse(fs.readFileSync(path.join(ROOT, '.well-known/mcp.json'), 'utf8'));
  ok('the generated OpenAPI and MCP contracts advertise the surface, so an agent finds it without being told',
    !!openapi.paths['/api/v1/connections'] && !!openapi.paths['/api/v1/connections/{lab}']
    && mcp.tools.some(t => t.name === 'list_connections')
    && mcp.tools.length === TOOLS.length,
    `${Object.keys(openapi.paths).length} paths · ${mcp.tools.length} tools, matching the ${TOOLS.length} the server has`);

  /* ── the degraded path says so rather than answering with fewer edges ─────── */
  ok('and when the generated bus half is unreadable the answer SAYS so instead of returning fewer connections',
    /bus_status/.test(fs.readFileSync(path.join(ROOT, 'core/index.mjs'), 'utf8'))
    && typeof all.bus_status === 'string' && all.bus_status.length > 0,
    all.bus_status);

  console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
  process.exit(fail ? 1 : 0);
})();
