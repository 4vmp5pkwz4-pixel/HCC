/* THE ARRIVAL DEFERS THE HEAVY CHECKS (v4.413). The page runs its own self-tests at boot, and a reader's arrival pays for the
   ones not deferred to CI. Measured in reader mode on the release container: 11.9 s against the harness's 4.5-s budget — and
   11.4 s for the released v4.411 on the same machine, so the cost had crept in over releases, not in one. Three blocks were
   8.1 s of it, each a numerical experiment on the whole atlas: framing every world and every rung of the solar ladder through
   setMode (3.4 s), building and placing the whole Hipparcos sky to look for a star inside the Oort cloud (3.3 s), and six
   hundred free-flight ticks on the live camera (1.4 s). They are deferred exactly the way the suite's other 80 heavy blocks are
   — `if(!defer(...))` at the head — so ?fulltests=1 (every arrival of scripts/selftest.mjs, and CI) runs them as before, and a
   reader's arrival measured 2.9 s after. This holds the three deferrals in place; the budget itself is measured by the harness. */
import fs from 'node:fs';
const SRC = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const blocks = [
  ["if(!defer('every world can be framed whole')) { /* NO WORLD IS TOO BIG TO SEE", "ok('Every world can be framed whole"],
  ["if(!defer('free flight on the live camera')) { /* FREE FLIGHT", "ok('Free flight moves in world units per second"],
  ["if(!defer('no star inside the Oort cloud')) { let inSolar=0;", "ok('No star is drawn inside the Oort cloud"]];
const placed = blocks.map(([head, claim]) => { const i = SRC.indexOf(head), j = SRC.indexOf(claim); return i > 0 && j > i && j - i < 6000; });
const mech = /const defer=\(label\)=>\{ if\(HEAVY\) return false; HEAVY_LABELS\.push\(label\); return true; \};/.test(SRC);
const harness = fs.readFileSync(new URL('../scripts/selftest.mjs', import.meta.url), 'utf8');
const budget = /const READER_BUDGET_MS = 4500;/.test(harness) && /fulltests=1/.test(harness);
check(placed.every(Boolean) && mech && budget,
  'the three experiments that walk the whole atlas — every world framed, the Hipparcos sky built to look inside the Oort cloud, six hundred flight ticks — are deferred at their heads like the suite\'s other heavy blocks, so a full-suite arrival runs them as before and a reader\'s arrival does not pay 8 s for them',
  `${placed.filter(Boolean).length}/3 deferred at the head of their own block · defer() ${mech ? 'as declared' : 'CHANGED'} · harness budget 4500 ms and fulltests ${budget ? 'present' : 'MISSING'}`);
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
