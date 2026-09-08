'use strict';
/* ── A WALK THAT TAKES SIXTEEN MINUTES IS A WALK NOBODY RUNS ─────────────────
   Two browser walks added in one day took the local gate from under a minute to
   sixteen, because each entered every laboratory in the atlas at a settle long
   enough to be honest. Exhaustive is right before a merge and wrong between two
   edits: a check you avoid running is worth less than a check that covers a
   deterministic slice every time.
   So the scope is declared. HCC_WALK=full walks everything — CI sets it, and so
   does `node scripts/gate.mjs --full`. Otherwise the walk takes a deterministic
   stride through the list, never a random sample, so a failure is reproducible
   and the same slice is covered every run.
   IT IS NEVER SILENT. Every sampled run prints what it skipped and returns the
   scope so the summary line says so — a green partial run must not be readable
   as a green full one. */
function walkScope(all, label) {
  const full = String(process.env.HCC_WALK || '').toLowerCase() === 'full';
  if (full || all.length <= 24) return { list: all, full: true, note: `${all.length} ${label}, all of them` };
  const stride = Math.ceil(all.length / 20);
  const list = all.filter((_, i) => i % stride === 0);
  return { list, full: false,
    note: `${list.length} of ${all.length} ${label} — every ${stride}th, deterministic. SAMPLED: set HCC_WALK=full for all of them` };
}
module.exports = { walkScope };
