/* EVERY FUNDAMENTAL CONSTANT AT THE LATEST ADJUSTMENT — CODATA 2022 (v4.413). The atlas cited «CODATA 2018» nineteen times and,
   counted against the NIST listings themselves (data/codata/, parsed from physics.nist.gov, 2022 / 2018 / 2014), carried 31
   literals of values the 2022 adjustment has since revised — the electron, proton and neutron masses, the atomic mass constant,
   α, a₀, r_e, R∞, σ_T, μ₀, ε₀, λ_C, m_ec² (one still at CODATA 2014) — across some twenty laboratories, and the proton radius
   0.8414 fm where 2022 gives 0.84075 fm. A value of one adjustment beside a value of another is not a rounding question: CODATA
   values are a single least-squares fit, consistent only with each other.
     1. the NIST tables are present, parsed whole, with their source;
     2. no literal anywhere in the shipped page, the verifiers or the scripts equals a 2018 or 2014 value that 2022 revised
        (mantissas of six significant digits or more — shorter ones are roundings, equal in both);
     3. every named site the update touched now carries exactly the 2022 digits, and the cited proton radius is 2022's;
     4. the page no longer cites «CODATA 2018» anywhere. */
import fs from 'node:fs'; import path from 'node:path';
const ROOT = path.join(path.dirname(new URL(import.meta.url).pathname), '..');
let pass = 0, fail = 0;
const check = (ok, claim, nums) => { if (ok) pass++; else fail++; console.log(`${ok ? 'PASS' : 'FAIL'} — ${claim} :: ${nums}`); };
const T = y => JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'codata', `codata-${y}.json`), 'utf8'));
const c22 = T(2022), c18 = T(2018), c14 = T(2014);
const mant = d => d.toLowerCase().split('e')[0];

/* 1 */
{
  const ok = c22.adjustment === 2022 && c22.count >= 350 && /physics\.nist\.gov/.test(c22.source)
    && c22.constants['inverse fine-structure constant'].digits === '137.035999177'
    && c22.constants['electron mass'].digits === '9.1093837139e-31' && c22.constants['Planck constant'].exact === true;
  check(ok, 'the NIST CODATA 2022 listing is in the repository whole, parsed field by field with its source, beside the 2018 and 2014 listings it supersedes',
    `${c22.count} constants · α⁻¹ = ${c22.constants['inverse fine-structure constant'].digits} · mₑ = ${c22.constants['electron mass'].digits} kg · h exact ${c22.constants['Planck constant'].exact}`);
}
/* 2 */
const superseded = new Map();
for (const [ed, tab] of [['2018', c18], ['2014', c14]]) for (const [k, v] of Object.entries(tab.constants)) {
  const n = c22.constants[k]; if (!n || v.exact || n.exact || v.digits === n.digits) continue;
  const m = mant(v.digits); if (m.replace(/[^0-9]/g, '').replace(/^0+/, '').length < 6) continue;
  if (!superseded.has(m)) superseded.set(m, `${k} (${ed})`); }
{
  const files = ['index.html', ...fs.readdirSync(path.join(ROOT, 'docs')).filter(f => /\.(cjs|mjs)$/.test(f)).map(f => 'docs/' + f),
    ...fs.readdirSync(path.join(ROOT, 'scripts')).filter(f => /\.(cjs|mjs)$/.test(f)).map(f => 'scripts/' + f), 'core/atlas/extracted.mjs'];
  const found = [];
  for (const f of files) {
    let s = fs.readFileSync(path.join(ROOT, f), 'utf8');
    if (f === 'index.html') s = s.replace(/<script type="application\/json" id="hcc-(i18n|planck-sky)">[\s\S]*?<\/script>/g, '');
    if (f === 'docs/verify-codata-2022.mjs') continue;
    for (const lit of s.matchAll(/(?<![0-9.A-Za-z_])[0-9]+\.[0-9]{4,}/g)) { const what = superseded.get(lit[0]); if (what) found.push(`${f}: ${lit[0]} = ${what}`); }
  }
  check(found.length === 0, 'no literal in the page, the verifiers, the scripts or the extracted core equals a value the 2022 adjustment revised — so no laboratory computes with one adjustment\'s electron and another\'s α',
    `${superseded.size} superseded values watched across ${files.length} files · ${found.length ? found.slice(0, 5).join(' | ') : 'none found'}`);
}
/* 3 */
{
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  const D = k => mant(c22.constants[k].digits);
  const sites = [
    ['AD_MP=', D('proton mass')], ['AD_SIGT=', D('Thomson cross section')], ['JEANS_MH=', D('proton mass')], ['EOS_ME=', D('electron mass')],
    ['EOS_MU=', D('atomic mass constant')], ['CQ_U=', D('atomic mass constant')], ['NSY_U=', D('atomic mass constant energy equivalent in MeV')],
    ['NSY_ME=', D('electron mass energy equivalent in MeV')], ['QR_EPS0=', D('vacuum electric permittivity')], ['CF_EPS0=', D('vacuum electric permittivity')],
    ['alpha:', D('fine-structure constant')], ['mu0:', D('vacuum mag. permeability')], ["{M:", D('proton mass energy equivalent in MeV')],
    ['{L:', D('classical electron radius')], ['modern_value:', D('Compton wavelength')]];
  const miss = sites.filter(([pre, m]) => !src.includes(pre + m)).map(([pre, m]) => pre + m);
  const rp = src.includes("['Proton charge radius',8.4075e-16,'qcd','CODATA 2022: 0.84075 fm']") && D('proton rms charge radius') === '8.4075';
  check(!miss.length && rp, 'the sites the update touched carry exactly the 2022 digits — the accretion disk\'s mₚ and σ_T, the Jeans mass, the equation of state, the nuclear masses, the permittivity of the quantum regime and the capacity flow, the particle table — and the proton radius cited is 2022\'s 0.84075 fm',
    `${sites.length - miss.length}/${sites.length} sites · rₚ ${rp ? '0.84075 fm' : 'NOT 2022'}${miss.length ? ' · missing ' + miss.slice(0, 3).join(' | ') : ''}`);
}
/* 4 */
{
  const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8').replace(/<script type="application\/json" id="hcc-i18n">[\s\S]*?<\/script>/, '');
  const n18 = (src.match(/CODATA 2018/g) || []).length, n22 = (src.match(/CODATA 2022/g) || []).length;
  check(n18 === 0 && n22 >= 19, 'the page cites the adjustment it computes with: «CODATA 2022» everywhere, «CODATA 2018» nowhere (G, the Planck units, σ and b are the same in both, and now cited as the latest)',
    `CODATA 2022 ×${n22} · CODATA 2018 ×${n18}`);
}
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
