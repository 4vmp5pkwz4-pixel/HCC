#!/usr/bin/env node
/* Build data/frontier-atlas.json from a local checkout of https://github.com/openai/math (Apache-2.0).
 *   node scripts/build-frontier-atlas.mjs /path/to/openai/math [commit]
 * Reads overview.tex (17 subject sections, 372 \resultentry{n}{title}{description}{links}), CONTENTS.md (the
 * manuscripts of each family and its Lean link) and the withdrawal notes of the preprints. The atlas reads the result
 * at run time; nothing in it is edited by hand. */
import fs from 'node:fs'; import path from 'node:path';
const root = process.argv[2]; if (!root) { console.error('usage: build-frontier-atlas.mjs <openai/math checkout> [commit]'); process.exit(2); }
const commit = process.argv[3] || '';
const tex = fs.readFileSync(path.join(root, 'overview.tex'), 'utf8'), md = fs.readFileSync(path.join(root, 'CONTENTS.md'), 'utf8');
/* balanced-brace arguments of a macro call starting at index i (just after the macro name) */
function args(s, i, n) { const out = []; let k = i; for (let a = 0; a < n; a++) { while (s[k] !== '{') k++; let d = 0, j = k; for (; j < s.length; j++) { if (s[j] === '\\') { j++; continue; } if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (d === 0) break; } } out.push(s.slice(k + 1, j)); k = j + 1; } return { out, end: k }; }
const disciplines = [], families = [];
let cur = null;
for (let i = 0; i < tex.length;) {
  const a = tex.indexOf('\\cataloguesection{', i), b = tex.indexOf('\\resultentry{', i);
  if (a < 0 && b < 0) break;
  if (a >= 0 && (b < 0 || a < b)) { const { out, end } = args(tex, a + 17, 2); cur = { id: +out[1], name: out[0], count: 0 }; disciplines.push(cur); i = end; continue; }
  const { out, end } = args(tex, b + 12, 4); i = end;
  const links = [...out[3].matchAll(/\\href\{([^}]*)\}/g)].map(m => m[1]);
  families.push({ n: +out[0], t: out[1].replace(/--/g, '–').replace(/~/g, ' '), d: out[2].replace(/--/g, '–').replace(/~/g, ' ').replace(/\s+/g, ' ').trim(), k: cur ? cur.id : 0, links });
  if (cur) cur.count++;
}
/* CONTENTS.md: the family line carries the Lean link; the manuscripts follow as &emsp;[title](path) */
const byN = new Map(families.map(f => [f.n, f]));
const blocks = md.split(/\n(?=\*\*\d{3}\. )/);
for (const blk of blocks) { const m = blk.match(/^\*\*(\d{3})\. /); if (!m) continue; const f = byN.get(+m[1]); if (!f) continue;
  f.lean = /\(\[Lean\]\(lean\/docs\/\d+\.md\)\)/.test(blk.split('\n')[0]) || /\[Lean\]\(lean\/docs\//.test(blk.slice(0, 1200));
  f.m = [...blk.matchAll(/&emsp;\[([^\]]+)\]\((preprints\/.+?\.pdf)\)/g)].map(x => [x[1].replace(/\$`([^`]*)`\$/g, '$$$1$$').trim(), x[2]]); }
/* cross references "result 032", "results 032 and 045", "Result 007" */
for (const f of families) { const x = new Set(); for (const m of f.d.matchAll(/[Rr]esults?\s+((?:\d{3}(?:,\s*|\s+and\s+|\s*–\s*)?)+)/g)) for (const n of m[1].match(/\d{3}/g) || []) if (+n !== f.n && byN.has(+n)) x.add(+n); f.x = [...x].sort((a, b) => a - b); }
/* withdrawals: the preprints whose README says so */
const withdrawn = [];
for (const d of fs.readdirSync(path.join(root, 'preprints'))) { const r = path.join(root, 'preprints', d, 'README.md'); if (!fs.existsSync(r)) continue; const s = fs.readFileSync(r, 'utf8'); if (/withdrawn/i.test(s.slice(0, 2000))) withdrawn.push(d); }
const out = { schema: 'hcc.frontier-atlas/1', source: { repo: 'https://github.com/openai/math', commit, license: 'Apache-2.0', note: 'Manuscripts produced by an internal OpenAI model, at different stages of verification; status as the collection states it.' },
  counts: { families: families.length, manuscripts: families.reduce((s, f) => s + (f.m ? f.m.length : 0), 0), lean: families.filter(f => f.lean).length, disciplines: disciplines.length, cross_references: families.reduce((s, f) => s + f.x.length, 0), withdrawn: withdrawn.length },
  disciplines, withdrawn, families: families.map(f => ({ n: f.n, t: f.t, d: f.d, k: f.k, lean: !!f.lean, m: f.m || [], x: f.x })) };
const dst = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'data', 'frontier-atlas.json');
fs.writeFileSync(dst, JSON.stringify(out)); console.log(JSON.stringify(out.counts), (fs.statSync(dst).size / 1024).toFixed(0) + ' KB');
