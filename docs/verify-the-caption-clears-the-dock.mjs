/* THE CAPTION CLEARS THE DOCK (v4.424) — v4.422 gave every laboratory a dock: a strip of its main chips and its pace, reserved
   above the laboratory bar so that its arrival never moves the scene. On a desktop the central caption (#hud) is also centred above
   that bar, and the two were drawn over each other: measured at 1440 × 900, the dock covered most of the caption's last line in
   every laboratory that has one (s3sky, aesphere, fibflag, hopf…). The caption now stands above the dock's strip while the dock
   is up, by the dock's own height; the scene does not move (the caption is not one of the stage's occluders). Measured after the
   fix: the overlap is 0 px² in s3sky, aesphere, fibflag and hopf, and inflate — which has a dock of its own placed beside the
   caption — is unchanged. Checked here, in the source:
     1. the rule: on a desktop, with the laboratory bar and the dock up, the caption's bottom rises by the dock's height;
     2. the mark: whenever the laboratory dock is shown, placed or hidden, the body says so and carries the dock's height. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const fn = name => { const i = src.indexOf('function ' + name + '('); if (i < 0) return ''; const j = src.indexOf('\nfunction ', i + 10); return src.slice(i, j < 0 ? i + 4000 : j); };
{ const rule = /@media \(min-width:901px\) and \(pointer:fine\)\{ body\.labbar-on\.labdock-on #hud\{bottom:calc\(var\(--bottom-band\) \+ var\(--labbar-h,48px\) \+ 18px \+ var\(--labdock-h,52px\)\)!important\} \}/.test(src);
  const base = /@media \(min-width:901px\) and \(pointer:fine\)\{ body\.labbar-on #hud\{bottom:calc\(var\(--bottom-band\) \+ var\(--labbar-h,48px\) \+ 18px\)!important\} \}/.test(src);
  check(rule && base, 'on a desktop the caption stands above the laboratory bar, and above the dock’s strip as well while the dock is up — by the dock’s own height, carried in --labdock-h', `rule ${rule} · base rule kept ${base}`); }
{ const mark = fn('stageDockMark'), show = fn('stageDockShow'), place = fn('stageDockPlace');
  const ok = /b\.classList\.toggle\('labdock-on',on\)/.test(mark) && /b\.style\.setProperty\('--labdock-h',h\)/.test(mark) && /!d\.classList\.contains\('col'\)/.test(mark)
    && /if\(id==='labDock'\) stageDockMark\(d\);/.test(show) && /Rd=d\?stageDockPlace\(d,F\):F\.bare; if\(!d\) stageDockShow\('labDock',false\); else stageDockMark\(d\);/.test(src);
  check(ok, 'whenever the laboratory dock is shown, hidden, or placed by the stage (and so whenever it steps aside for the sheet), the page marks it — a strip along the bottom raises the caption, a column beside the scene (a phone held sideways) does not',
    `marked when shown or hidden ${/stageDockMark/.test(show)} · after every placing ${/else stageDockMark\(d\);/.test(src)}`); }
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
