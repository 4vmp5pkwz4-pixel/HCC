#!/usr/bin/env node
/* ============================================================================
   THE AUTHORS' OWN LEDGER OF WHAT IS PROVED, AS DATA THE ATLAS CAN READ.

   Preece & Batenin, «Certified quantum reachability under local excitation
   constraints» (BINDU_VECTRA, release of 21 November 2026), keep a ledger of
   every claim of the manuscript with its exact statement, its assumptions, the
   proof artifact or theorem name behind it, a test or log hash, a CLASS — what
   kind of evidence stands behind it — and the dependency that is still open.
   data/bindu/claims.tsv and data/bindu/registry.json are those two files as
   supplied; this script parses them into api/bindu-claims.json, unchanged in
   content, with the classes explained and counted, and the Lean declarations of
   the registry attached to the claims they serve. Nothing is re-judged here: a
   class is the authors' own.

   The manuscript and the Lean sources it cites are not copied into the atlas;
   their SHA-256 at the time they were supplied are recorded as provenance.

   Usage:  node scripts/bindu-claims.mjs          (writes api/bindu-claims.json)
           node scripts/bindu-claims.mjs --check  (fails if it is stale)
   ========================================================================= */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'), OUT = join(ROOT, 'api', 'bindu-claims.json');
const tsv = readFileSync(join(ROOT, 'data/bindu/claims.tsv'), 'utf8'), reg = JSON.parse(readFileSync(join(ROOT, 'data/bindu/registry.json'), 'utf8'));
const sha = s => createHash('sha256').update(s).digest('hex');
const lines = tsv.split('\n').filter(l => l.trim()), head = lines[0].split('\t');
const col = n => head.indexOf(n);
const CLASSES = {
  LEAN_KERNEL_PASS_SCOPE_REVIEW: { short: 'KERNEL', colour: '#7fe0a6', rank: 0, meaning: 'checked by the Lean kernel in the authors’ latest gate, with the scope of the statement under review' },
  LEAN_PASS: { short: 'LEAN', colour: '#7fe0a6', rank: 1, meaning: 'a registered Lean declaration that passes the authors’ controller gate, with only the standard axioms' },
  ANALYTIC_PROOF: { short: 'ANALYTIC', colour: '#8ab4ff', rank: 2, meaning: 'a written proof in the manuscript, not machine-checked' },
  EXACT_COMPUTATION: { short: 'EXACT', colour: '#4dd0e1', rank: 3, meaning: 'an exact (symbolic or rational) computation for the stated case' },
  NUMERIC: { short: 'NUMERIC', colour: '#ffd27a', rank: 4, meaning: 'a floating-point computation: evidence, not proof' },
  OPEN: { short: 'OPEN', colour: '#ffb347', rank: 5, meaning: 'claimed but not established: the proof or its replay is missing or incomplete' },
  FALSE: { short: 'FALSE', colour: '#ff6b6b', rank: 6, meaning: 'refuted — by a counterexample, an unsound definition, or a failed implication' },
  HISTORICAL: { short: 'HISTORICAL', colour: '#9aa0aa', rank: 7, meaning: 'provenance only: an earlier module or receipt, not evidence by itself' } };
const decl = {}; for (const d of reg.claims || []) (decl[d.claim_id] = decl[d.claim_id] || []).push({ name: d.name, assumptions: d.physical_assumptions, section: d.manuscript_section });
const claims = lines.slice(1).map(l => l.split('\t')).filter(r => r[col('claim_id')]).map(r => ({
  id: r[col('claim_id')], statement: r[col('exact_statement')], assumptions: r[col('assumptions')], source: r[col('source_citation')],
  proof: r[col('proof_file/theorem')], evidence: r[col('test/log_hash')], class: r[col('classification')], unresolved: r[col('unresolved_dependency')] || '',
  declarations: decl[r[col('claim_id')]] || [] }));
const by_class = {}; for (const c of claims) by_class[c.class] = (by_class[c.class] || 0) + 1;
const out = { schema: 'hcc.bindu-claims/1', source: { title: 'Certified quantum reachability under local excitation constraints: finite-time envelopes, dissipative all-time bounds, and tensor-rank obstructions', authors: ['Andrei Preece', 'Boris Batenin'], release: '2026-11-21',
    files: { 'data/bindu/claims.tsv': sha(tsv), 'data/bindu/registry.json': sha(readFileSync(join(ROOT, 'data/bindu/registry.json'))) },
    not_copied: { 'BINDU_VECTRA.tex': 'c220268054e2e786', 'formal/Main.lean': '45984c35a347ca92', 'Replay.lean': '4881c8eeb125bdc1' }, note: 'the classes are the authors’ own; the atlas recomputes some statements (docs/verify-the-dark-diamond.mjs) but replays no Lean proof' },
  classes: CLASSES, counts: { claims: claims.length, declarations: (reg.claims || []).length, by_class: Object.fromEntries(Object.entries(by_class).sort((a, b) => ((CLASSES[a[0]] || {}).rank ?? 9) - ((CLASSES[b[0]] || {}).rank ?? 9))) },
  claims };
const text = JSON.stringify(out, null, 1) + '\n';
if (process.argv.includes('--check')) { let old = ''; try { old = readFileSync(OUT, 'utf8'); } catch (e) {} if (old !== text) { console.error('STALE: api/bindu-claims.json — run node scripts/bindu-claims.mjs'); process.exit(1); } console.log('api/bindu-claims.json is in step'); process.exit(0); }
writeFileSync(OUT, text);
console.log(`bindu-claims: ${claims.length} claims · ${(reg.claims || []).length} registered declarations · ${Object.entries(out.counts.by_class).map(([k, v]) => k + ' ' + v).join(', ')}`);
