'use strict';
/* ══ READING THE ATLAS'S OWN DECLARATIONS, WITHOUT GUESSING WHAT NAMES LOOK LIKE ══
 *
 * THREE TIMES IN ONE DAY a regex in a verifier of mine refused a character the data
 * actually contains, matched a SUBSET of its subject, and reported that subset as a
 * whole count while passing:
 *
 *   [a-z]+          missed a thread family called h0                13 of 14
 *   [a-z0-9]+       refused the hyphen in 'galactic-year'           10 of 12
 *   [a-z_0-9]+      refused the capitals in spin.CHSH and sn.L       4 of 11
 *
 * Filed as atlas.a_character_class_written_from_expectation_tests_the_expectation.
 * This is the structural remedy rather than a fourth hand-fix.
 *
 * TWO PARTS, AND THE SECOND IS THE ONE THAT MATTERS.
 *
 *   ONE PATTERN PER THING, written once and permissive: an id is [A-Za-z0-9_.-]+
 *   because that is what the file actually contains, not what I expect a name to
 *   look like.
 *
 *   AND EVERY EXTRACTOR COUNTS ITS SUBJECT A SECOND WAY. A pattern that matches
 *   fewer rows than an independent, cruder count of the same construct THROWS. That
 *   is the general defence: not a better regex, but a refusal to report a partial
 *   match as a whole one. All three failures above would have thrown here instead
 *   of passing.
 */
const ID = "[A-Za-z0-9_.-]+";

function census(label, matched, crude, sample) {
  if (matched >= crude) return;
  throw new Error(
    `${label}: the pattern matched ${matched} of at least ${crude} — it is refusing rows that exist, `
    + `which is how a partial match gets reported as a whole count`
    + (sample ? `. First unmatched-looking text: ${JSON.stringify(String(sample).slice(0, 90))}` : ''));
}
const countOf = (s, needle) => s.split(needle).length - 1;

/* ── the invariant thread ──────────────────────────────────────────────────── */
function threadSlice(src) {
  const i = src.indexOf('const INVARIANT_THREAD=[');
  if (i < 0) throw new Error('INVARIANT_THREAD is not in this file at all');
  return src.slice(i, src.indexOf('\n];', i));
}
function threadFamilies(src) {
  const t = threadSlice(src);
  const out = [...t.matchAll(new RegExp(`\\{id:'(${ID})', kind:'(identity|relation)'`, 'g'))]
    .map(m => ({ id: m[1], kind: m[2] }));
  census('threadFamilies', out.length, countOf(t, ", kind:'"), t);
  return out;
}
function threadRows(src) {
  const t = threadSlice(src);
  const out = [...t.matchAll(new RegExp(`\\{k:'(${ID})',lab:'(${ID})'([^}]*)\\}`, 'g'))]
    .map(m => ({ key: m[1], lab: m[2], rest: m[3],
      station: (m[3].match(/,at:'([^']*)'/) || [])[1] || null,
      cyc: /,cyc:1/.test(m[3]) }));
  census('threadRows', out.length, countOf(t, "{k:'"), t);
  return out;
}

/* ── the quantity bus ──────────────────────────────────────────────────────── */
function busPublications(src) {
  const out = [...src.matchAll(new RegExp(`ATLAS_BUS\\.pub\\('(${ID})'`, 'g'))].map(m => m[1]);
  census('busPublications', out.length, countOf(src, "ATLAS_BUS.pub('"), null);
  return out;
}

/* ── and the UNIT each publication states, which needs the call sliced ────────
   A regex over the whole call cannot find the third argument: the second argument is
   an expression that contains commas, parentheses and quoted strings of its own. The
   call is cut by BALANCED PARENTHESES from the key onward, and the unit is the
   trailing quoted literal of what is inside. A site whose unit is not a literal —
   built by concatenation, or a variable — is reported as such rather than guessed at,
   because a caption assembled at runtime is exactly the thing this measures. */
function busPublicationUnits(src) {
  const out = [];
  const re = new RegExp(`ATLAS_BUS\\.pub\\('(${ID})',`, 'g');
  let m;
  while ((m = re.exec(src))) {
    const start = m.index + m[0].length;
    let depth = 1, k = start;
    while (k < src.length && depth > 0) { const c = src[k];
      if (c === '(') depth++; else if (c === ')') depth--; k++; }
    const args = src.slice(start, k - 1);
    const lit = args.match(/,\s*'([^']*)'\s*$/);
    out.push({ key: m[1], unit: lit ? lit[1] : null, literal: !!lit });
  }
  census('busPublicationUnits', out.length, countOf(src, "ATLAS_BUS.pub('"), null);
  return out;
}

/* ── the sourced connections of the galactic butterfly explorer ────────────── */
function sourcedConnections(src) {
  const out = [...src.matchAll(new RegExp(`^\\s*row\\('(${ID})','([A-Z_]+)','(${ID})'`, 'gm'))]
    .map(m => ({ id: m[1], kind: m[2], view: m[3] }));
  census('sourcedConnections', out.length, countOf(src, ' row('), src);
  return out;
}
function sourcedSources(src) {
  const out = [...src.matchAll(new RegExp(`^\\s{2}(${ID}):\\{title:'([^']*)',url:'([^']*)',kind:'([^']*)'`, 'gm'))]
    .map(m => ({ id: m[1], title: m[2], url: m[3], kind: m[4] }));
  census('sourcedSources', out.length, countOf(src, ':{title:'), src);
  return out;
}

/* which sources each connection cites, per connection rather than as one flat bag —
   a flat list cannot answer "is this connection unsourced", which is the check that
   matters most for a laboratory whose whole claim is that it cites */
function sourcedCitations(src) {
  const rows = sourcedConnections(src);
  const out = rows.map(r => {
    const i = src.indexOf(`row('${r.id}'`);
    const j = src.indexOf("\n row(", i + 1);
    const body = src.slice(i, j < 0 ? src.length : j);
    const m = body.match(new RegExp(`\\[((?:'${ID}',?\\s*)+)\\]\\)`));
    return { ...r, cites: m ? m[1].split(',').map(x => x.replace(/'/g, '').trim()).filter(Boolean) : [] };
  });
  census('sourcedCitations', out.filter(r => r.cites.length).length,
    (src.match(/\]\),?\n/g) || []).length - 1, src);
  return out;
}

module.exports = { ID, census, threadFamilies, threadRows, busPublications, busPublicationUnits,
  sourcedConnections, sourcedSources, sourcedCitations };
