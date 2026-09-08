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
/* A FAILING CHECK MUST NOT PRINT THE SENTENCE WRITTEN FOR THE PASSING CASE.
   Twelve details in one day were computed unconditionally, so a red check argued
   against its own verdict — filed as atlas.a_failure_message_can_argue_against_
   its_own_verdict. This is the structural remedy rather than a thirteenth hand fix:
   a detail that was written as an expectation is LABELLED as one when the check
   fails, so no failure line can ever read as a reassurance. A detail built from
   what actually went wrong reads the same either way and loses nothing. */
const ok = (name, cond, detail) => { if (cond) { pass++; console.log('  PASS — ' + name + (detail ? ' :: ' + detail : '')); }
  else { fail++; console.log('  FAIL — ' + name + (detail ? ' :: EXPECTED ' + detail : '')); } };

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

  /* ── WHAT IS CONNECTED BY NOTHING, AND WHY THE OLD NUMBER WAS MISLEADING ─── */
  ok('the two isolation numbers are named for what they each count, and they are not the same number',
    all.counts.isolated_on_the_bus > 50
    && all.counts.connected_by_nothing < all.counts.isolated_on_the_bus
    && all.counts.laboratories_touched + all.counts.connected_by_nothing === all.counts.laboratories_known
    && all.counts.isolated_laboratories === undefined,
    (all.counts.isolated_laboratories !== undefined
       ? 'the misleading isolated_laboratories field is back in the payload — it counts bus isolation under a name that reads as total isolation · '
       : '')
    + (all.counts.laboratories_touched + all.counts.connected_by_nothing !== all.counts.laboratories_known
       ? `the census does not close: ${all.counts.laboratories_touched} touched + ${all.counts.connected_by_nothing} isolated ≠ ${all.counts.laboratories_known} known · `
       : '')
    + `${all.counts.isolated_on_the_bus} isolated ON THE BUS · but across all four kinds `
    + `${all.counts.laboratories_touched} of ${all.counts.laboratories_known} laboratories are touched, `
    + `so ${all.counts.connected_by_nothing} is connected by nothing`);

  /* THE RULE THAT KEEPS THIS HONEST. A laboratory nothing connects to must either
     GET a connection or CARRY a reason. Inventing an edge to flatten the count is
     the failure this atlas spends its verifiers preventing, so the alternative is
     made cheap and the silence is made expensive. */
  const unexplained = all.connected_by_nothing.filter(x => !x.reason || x.reason.length < 40);
  ok('and a laboratory connected by nothing carries a written reason — an edge is never invented to flatten the count',
    unexplained.length === 0,
    unexplained.length ? ('connected by nothing and unexplained: ' + unexplained.map(x => x.lab).join(' '))
      : all.connected_by_nothing.map(x => x.lab).join(' ') + ' — each with its reason stated');

  /* four different empty answers, each saying which it is */
  const notes = {
    isolated: CORE.connections({ lab: all.connected_by_nothing[0] && all.connected_by_nothing[0].lab }).note,
    filtered: CORE.connections({ lab: 'eos', kind: 'sourced' }).note,
    typo: CORE.connections({ lab: 'definitely-not-a-lab' }).note };
  ok('an empty result says WHICH kind of empty it is: isolated, filtered out, or a name that does not exist',
    /NOTHING connects to it in any of the four kinds/.test(notes.isolated || '')
    && /the filter you combined with it is what emptied the result/.test(notes.filtered || '')
    && /check the spelling/.test(notes.typo || ''),
    /* the detail names which of the three notes failed to distinguish itself */
    [!/NOTHING connects to it in any of the four kinds/.test(notes.isolated || '')
       && 'the isolated note does not say so: "' + String(notes.isolated).slice(0, 60) + '"',
     !/the filter you combined with it is what emptied the result/.test(notes.filtered || '')
       && 'the filtered note does not say so: "' + String(notes.filtered).slice(0, 60) + '"',
     !/check the spelling/.test(notes.typo || '')
       && 'the unknown-name note does not say so: "' + String(notes.typo).slice(0, 60) + '"'
    ].filter(Boolean).join(' · ') || 'three distinguishable notes for three different reasons a list is empty');

  /* ── A FAMILY IS A DIFFERENT RELATION FROM AN EDGE ───────────────────────── */
  const fams = all.connections.filter(c => c.kind === 'family');
  ok('the invariant thread reaches the agent surface whole — the questions, not just the edges',
    all.counts.family === ex.INVARIANT_THREAD.length && fams.length >= 14
    && all.counts.family_rows === ex.INVARIANT_THREAD.reduce((n, f) => n + f.rows.length, 0),
    `${all.counts.family} families carrying ${all.counts.family_rows} rows`);
  ok('every family says whether it is ONE NUMBER or a question several numbers answer, and only one of them is one number',
    fams.every(f => typeof f.one_number === 'boolean')
    && fams.filter(f => f.one_number).length === all.counts.families_that_are_one_number
    && all.counts.families_that_are_one_number === 1,
    `${all.counts.families_that_are_one_number} identity · ${fams.length - all.counts.families_that_are_one_number} relation`);
  ok('and the identity is the only family whose rows are all in ONE unit — which is what makes the claim checkable',
    fams.filter(f => f.one_number).every(f => f.units.length === 1)
    && fams.filter(f => !f.one_number && f.units.length === 1).length <= 1,
    (fams.filter(f => f.one_number && f.units.length !== 1).length
       ? 'a family claiming ONE NUMBER whose rows are not all in one unit: '
         + fams.filter(f => f.one_number && f.units.length !== 1).map(f => f.id + ' in ' + f.units.join('/')).join(', ')
       : fams.filter(f => !f.one_number).length === 0
         ? 'every family claims to be one number, so there is nothing left to be a relation'
         : fams.filter(f => f.one_number).map(f => f.id + ' in ' + f.units[0]).join(', ')
           + ' · relation families span '
           + Math.max(...fams.filter(f => !f.one_number).map(f => f.units.length)) + ' units at most'));
  ok('every family row names the laboratory AND the bus key carrying its number, so a question can be walked to a live quantity',
    fams.every(f => f.rows.length > 0 && f.rows.every(r => r.lab && r.key && r.unit)),
    (fams.some(f => f.rows.some(r => !r.lab || !r.key || !r.unit))
       ? (fams.flatMap(f => f.rows.filter(r => !r.lab || !r.key || !r.unit).map(r =>
            f.id + ': ' + ['lab', 'key', 'unit'].filter(k => !r[k]).join(' and ') + ' missing')).slice(0, 4).join(' · '))
       : `${all.counts.family_rows} rows, each with a laboratory, a bus key and a unit`));
  const gyro = CORE.connections({ lab: 'gyro' });
  ok('and a laboratory that appears only inside a family is reachable by the laboratory filter',
    gyro.counts.returned > 0 && gyro.connections.some(c => c.kind === 'family'),
    `gyro: ${gyro.counts.returned} connection(s), ${gyro.connections.filter(c => c.kind === 'family').length} of them families`);

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
