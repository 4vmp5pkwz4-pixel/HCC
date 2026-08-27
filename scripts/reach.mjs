#!/usr/bin/env node
/* ============================================================================
   FROM A CONTROL YOU CAN TURN TO A LABORATORY YOU CANNOT SEE

   This atlas now measures influence at two scales and they do not meet.
   api/sensitivity.json says what a laboratory's own control does to that
   laboratory's own outputs.  api/transfers.json says what one laboratory's
   output does to another's, over a declared coupling.  Neither says the thing
   the atlas is actually for: turn a knob a reader can reach, and watch something
   twelve decades away move.

   Both halves are exponents in log-log, so the chain is a PRODUCT.  Turn a black
   hole's mass and its Hawking temperature moves with exponent -1; hand that
   temperature to a blackbody and the exitance moves with 4; so the exitance
   moves with -4 in the mass, and the atlas has never said so because no single
   measurement spans both steps.

   THIS COSTS NOTHING AND MEASURES NOTHING.  It opens no browser and evaluates no
   instrument: it is arithmetic over two artifacts that were measured separately,
   which is exactly why it is worth having a verifier check the products against
   closed forms.  A composition is only as good as the two numbers it multiplies
   and the assumption that they compose at all — and that assumption is real:
   both factors are LOCAL derivatives measured about their own default points,
   so a chain is only valid where the far end sits near the point its factor was
   measured at.  The file says so, and the verifier tests it where physics can
   settle the answer.

   Usage:  node scripts/reach.mjs [--check]
   ========================================================================= */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'api', 'reach.json');
const CHECK = process.argv.includes('--check');

const read = f => {
  const p = join(ROOT, 'api', f);
  if (!existsSync(p)) { console.error(`api/${f} is missing — run its generator first.`); process.exit(1); }
  return JSON.parse(readFileSync(p, 'utf8'));
};
const sens = read('sensitivity.json');
const tran = read('transfers.json');
const version = JSON.parse(readFileSync(join(ROOT, 'version.json'), 'utf8'));

/* ── THE TWO HALVES MUST DESCRIBE THE SAME ATLAS ────────────────────────────
   Composing a number measured at one build with a number measured at another is
   how a product comes out confident and wrong, and neither artifact can notice
   on its own. */
if (sens.build !== tran.build || sens.version !== tran.version) {
  console.error(`the two artifacts were measured at different builds — sensitivity at ${sens.version}/${sens.build}, `
    + `transfers at ${tran.version}/${tran.build}. Re-run both before composing them.`);
  process.exit(1);
}

/* ── THE LAW ITSELF LIVES IN index.html, NOT HERE ───────────────────────────
   This file used to carry its own copy of the composition: two nested loops, a join
   on a.out === b.from, a product, and the rule that the second leg must be fitted
   from the SOURCE rather than from the last hop. The page needs the same law to
   answer the same question live for a reader, and a law with two implementations is
   a law that gets corrected in one of them — which is precisely how the first version
   of this composition shipped a three-laboratory chain as its own reciprocal.

   So hccReachCompose is written once, in index.html beside the transfer measurement
   it composes, and sliced out by scripts/extract-kernels.mjs into the module below.
   This script contributes what it always did: reading the two artifacts, and refusing
   to compose them if they were measured at different builds. */
import { hccReachCompose } from '../core/atlas/extracted.mjs';

const chains = hccReachCompose(sens, tran);

const controls = new Set(chains.map(c => c.control));
const reached = new Set(chains.map(c => c.reaches.split('.')[0]));
const deepest = Math.max(0, ...chains.map(c => c.laboratories));

const doc = {
  schema: 'hcc.reach/1',
  version: version.version, build: version.build,
  generator: 'scripts/reach.mjs — the product of two measured exponents, opening no browser and evaluating nothing',
  composed_from: {
    sensitivity: `${sens.version}/${sens.build}`,
    transfers: `${tran.version}/${tran.build}`,
    note: 'both halves are LOCAL derivatives measured about their own default points, so a chain describes '
        + 'the far end only near the point its own factor was measured at; and the second leg is fitted '
        + 'against the value the bus DELIVERS, which is why the two multiply cleanly',
    numerical_controls: 'A CHAIN IS ONLY PHYSICS IF ITS CONTROL IS. Some inputs in this atlas are numerical '
        + 'rather than physical — an integration step, a sample count, a tolerance — and nothing in a '
        + 'declaration says which. A chain rooted at one of those is propagating a discretisation error '
        + 'across the bus, not a dependence: it says the answer changes when the solver is refined, which is '
        + 'true and is not the same statement. ns.step is such a control and is left in this file rather '
        + 'than filtered out, because removing it would hide the finding; atlas.numerical_controls in the '
        + 'open-problem register is where it is written down.'
  },
  counts: { chains: chains.length, controls: controls.size,
    laboratories_reached: reached.size, deepest_chain: deepest },
  chains
};
const text = JSON.stringify(doc, null, 1) + '\n';

if (CHECK) {
  if (!existsSync(OUT)) { console.error('api/reach.json is missing.'); process.exit(1); }
  const prev = readFileSync(OUT, 'utf8');
  if (prev !== text) { console.error('api/reach.json disagrees with the two artifacts it is composed from.'); process.exit(1); }
  console.log(`api/reach.json matches its two sources (${chains.length} chains).`);
  process.exit(0);
}

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, text);
console.log(`api/reach.json written: ${doc.counts.chains} chains from ${doc.counts.controls} turnable controls, `
  + `reaching ${doc.counts.laboratories_reached} laboratories, ${doc.counts.deepest_chain} deep`);
for (const c of chains.slice(0, 6))
  console.log(`  ${c.control} → ${c.reaches}  exponent ${c.exponent.toFixed(4)}  (${c.leg_control_to_output} × ${c.leg_output_to_far}, ${c.laboratories} laboratories)`);
process.exit(0);
