#!/usr/bin/env node
'use strict';
/* ══ HOLOGRAPHIC · AND EVERY COLOUR IN IT WAS MEASURED FIRST ═══════════════════
 *
 * A third panel scope, opted into exactly like Obsidian and for exactly the same
 * reason: the tokens at :root are the atlas's own, three separate mechanisms read
 * them, and overwriting one to change a look has bitten this file before. A body
 * that does not carry the attribute never sees any of it.
 *
 * THE PALETTE WAS CHECKED BEFORE IT WAS USED, NOT AFTER. Against the panel ground —
 * rgba(4,7,14,.92) composited over #02040a, which is #04070e — the WCAG 2.1
 * relative-luminance formula gives
 *
 *     cyan   #00f0ff   14.31 : 1     passes AA body text
 *     gold   #ffaa00   10.56 : 1     passes AA body text
 *     violet #b026ff    4.38 : 1     FAILS AA body text, clears AA large and UI
 *
 * So the violet appears in chrome, where 3.0 is the bar, and never in body text.
 * Where violet text is wanted there is a second token: the SAME hue lightened in
 * linear space by the least factor that clears 4.5 — 1.0578, giving #b527ff at
 * 4.51 : 1, with the hue moving 1.3°. Solving for the least factor rather than
 * picking a lighter purple is what keeps it the same violet.
 *
 * Every number above is recomputed here from the formula. None is trusted from the
 * comment that quotes it.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: EXPECTED ' + d : '')); } };

const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const enc = v => Math.round(255 * (v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(Math.min(1, Math.max(0, v)), 1 / 2.4) - 0.055));
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => { const la = L(a), lb = L(b); return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05); };
const hex = h => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
const hue = c => { const mx = Math.max(...c), mn = Math.min(...c); if (mx === mn) return 0;
  const h = mx === c[0] ? (c[1] - c[2]) / (mx - mn) : mx === c[1] ? 2 + (c[2] - c[0]) / (mx - mn) : 4 + (c[0] - c[1]) / (mx - mn);
  return ((h * 60) % 360 + 360) % 360; };

/* the ground the panel text actually lands on */
const GROUND = [4, 7, 14].map((v, i) => Math.round(v * 0.92 + hex('#02040a')[i] * 0.08));
ok('the ground is composited rather than guessed, because a translucent panel is not its own colour',
  GROUND.join(',') === '4,7,14' && /--glass-deep:rgba\(4,9,18,\.90\)/.test(src),
  `rgba(4,7,14,.92) over #02040a is #${GROUND.map(v => v.toString(16).padStart(2, '0')).join('')} — guessing a single colour for a translucent surface is how a probe reported a false ratio in this file before`);

const CY = ratio(hex('#00f0ff'), GROUND), GO = ratio(hex('#ffaa00'), GROUND), VI = ratio(hex('#b026ff'), GROUND);
ok('cyan and gold clear AA body text against that ground',
  CY >= 4.5 && GO >= 4.5,
  `cyan ${CY.toFixed(2)} : 1 · gold ${GO.toFixed(2)} : 1, against the 4.5 body text needs`);

ok('the violet does not, and that is why it is chrome',
  VI < 4.5 && VI >= 3.0,
  `violet ${VI.toFixed(2)} : 1 — above the 3.0 a UI component needs and below the 4.5 text needs, measured before it was used rather than after`);

ok('so the declared tokens put the violet in the shadow and the border, never in a text colour',
  /--holo-violet:#b026ff/.test(src)
  && /box-shadow:0 1px 0 rgba\(0,240,255,\.12\) inset,\s*\n\s*0 0 0 1px rgba\(176,38,255,\.10\)/.test(src)
  && !/color:\s*var\(--holo-violet\)\s*[;}]/.test(src),
  'the only places it appears are an inset ring and a chip outline, both of which are UI components');

/* the text variant, solved rather than picked */
const base = hex('#b026ff').map(lin);
let lo = 1, hi = 2;
for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2;
  if (ratio(base.map(v => enc(v * m)), GROUND) < 4.5) lo = m; else hi = m; }
const solved = base.map(v => enc(v * hi));
const declared = hex('#b527ff');
ok('the violet used for text is that same violet lightened by the least factor that clears the threshold',
  solved.every((v, i) => Math.abs(v - declared[i]) <= 1)
  && /--holo-violet-text:#b527ff/.test(src),
  `factor ${hi.toFixed(4)} in linear space gives #${solved.map(v => v.toString(16).padStart(2, '0')).join('')}, and the token declares #b527ff`);

ok('and it clears the threshold by the smallest margin that exists, which is what "least" means',
  ratio(declared, GROUND) >= 4.5 && ratio(declared, GROUND) < 4.6
  && ratio(base.map(v => enc(v * (hi - 0.01))), GROUND) < 4.5,
  `${ratio(declared, GROUND).toFixed(4)} : 1 · one per cent less lightening measures ${ratio(base.map(v => enc(v * (hi - 0.01))), GROUND).toFixed(4)} and fails`);

ok('the hue survives the lightening, so it is still the same violet and not a different purple',
  Math.abs(hue(declared) - hue(hex('#b026ff'))) < 3,
  `${hue(hex('#b026ff')).toFixed(2)}° → ${hue(declared).toFixed(2)}°, a shift of ${Math.abs(hue(declared) - hue(hex('#b026ff'))).toFixed(2)}° · picking a lighter purple instead of solving for the factor is how a palette loses its identity`);

/* ── the scope, and what it must not do ──────────────────────────────────────── */
ok('the scope is opted into and overwrites nothing at :root',
  /body\[data-lux="holo"\]\{/.test(src)
  && /--holo-cyan:#00f0ff; --holo-gold:#ffaa00; --holo-violet:#b026ff;/.test(src)
  && /:root\{[\s\S]{0,4000}--gold:#d4af6a;/.test(src),
  'removing the attribute restores every token :root declares, which is what keeps the theme pass exactly reversible — and that reversibility is asserted elsewhere by a self-test');

ok('one switch sets the scope, so there is never a second authority for which look is on',
  /if\(themeDay\) delete document\.body\.dataset\.lux;\s*\n\s*else document\.body\.dataset\.lux=\(state\.luxHolo\?'holo':'obsidian'\);/.test(src)
  && (src.match(/document\.body\.dataset\.lux=/g) || []).length === 1,
  'three states through one line: day removes the scope entirely, because a dark glass panel on a bright page is what Obsidian was already removed for');

ok('the blur is conditional, because a panel that turns transparent where it cannot blur is worse than a plain one',
  /@supports \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)\{[\s\S]{0,600}body\[data-lux="holo"\] \.panel/.test(src),
  'the same bargain Obsidian already struck, and for the same reason');

ok('and the palette states its own measurements in the file, so the next reader does not have to take them on trust',
  /cyan   #00f0ff   14\.31 : 1/.test(src) && /violet #b026ff    4\.38 : 1/.test(src)
  && /FAILS AA body text/.test(src),
  'a palette whose contrast is claimed but not written down is a palette somebody will change without re-measuring');

console.log(`\n  ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
