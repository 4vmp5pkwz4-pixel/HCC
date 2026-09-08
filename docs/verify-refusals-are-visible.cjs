#!/usr/bin/env node
'use strict';
/* A REFUSAL IS THE MORE INFORMATIVE HALF OF A BUS, AND NO READER COULD SEE ONE.
 *
 * The atlas finds a coupling admissible — the units agree, the coordinate names
 * agree, the target's declared domain accepts the value — and then DECLINES it and
 * writes down why. There are forty-nine of those. Every one has been readable by an
 * agent over /api/v1/connections and provable by a boot assertion, and a reader
 * standing in the laboratory it concerns was shown nothing.
 *
 * An arrival says two laboratories agree. A refusal says the atlas considered a
 * connection a reader would reasonably expect and decided against it, and states the
 * grounds — which is the one thing a reader cannot reconstruct from the panel alone.
 *
 * Rendered before this shipped: 16 of 20 laboratories show at least one, 49 refusal
 * rows, none of them with an empty reason, zero page errors.
 */
const fs = require('node:fs'), path = require('node:path');
const ROOT = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
let pass = 0, fail = 0;
const ok = (n, c, d) => { if (c) { pass++; console.log('  PASS — ' + n + (d ? ' :: ' + d : '')); }
  else { fail++; console.log('  FAIL — ' + n + (d ? ' :: ' + d : '')); } };

/* ── the data: every refusal must carry a reason worth reading ─────────────── */
const i = src.indexOf('const HCC_NOT_LINKS=new Map([');
const block = src.slice(i, src.indexOf('\n]);', i));
const entries = [...block.matchAll(/\['([A-Za-z0-9_.]+)\|([A-Za-z0-9_.]+)',\s*([\s\S]*?)\]\s*,?\n/g)];
const thin = entries.filter(m => m[3].replace(/\s+/g, ' ').length < 80);
ok('every refused coupling carries a reason, and a reason is a sentence rather than a word',
  entries.length >= 45 && thin.length === 0,
  thin.length ? (thin.length + ' refusal(s) with almost no reason: ' + thin.slice(0, 3).map(m => m[1] + '→' + m[2]).join(' '))
    : entries.length + ' refusals, shortest reason ' + Math.min(...entries.map(m => m[3].replace(/\s+/g, ' ').length)) + ' chars');

/* ── the panel: it exists, and it is fed from the registry rather than a list ── */
const fn = src.slice(src.indexOf('function busDrivenHTML('), src.indexOf('function nexusRailHTML('));
ok('the laboratory panel has a refusals section, built from HCC_NOT_LINKS itself',
  /HCC_NOT_LINKS/.test(fn) && /declined to carry/.test(fn),
  'no second list of refusals is typed into the panel');
ok('and it prints the REASON, not just the pair — the sentence is the whole point',
  /r\.reason/.test(fn),
  /r\.reason/.test(fn) ? 'each row carries the grounds the atlas gave'
    : 'the pair is shown and the reason is not — which is the half that has no value');

/* AND THE ENDPOINTS ARE RESOLVED THE WAY THE ARRIVALS ARE. The first draft compared
   a refusal's endpoint against the VIEW id; a bus id is not a view id, and the
   arrivals a few lines above resolve a view to its specs for exactly this reason. A
   laboratory whose bus id differs from its view id would have shown no refusals and
   looked simply unrefused — the most misleading state this panel could be in. */
/* AND THIS CHECK WAS ITSELF TOO WEAK ON ITS FIRST RUN. It asked whether busIds was
   DECLARED and used somewhere, which a mutation restoring the view-id comparison
   passes with the declaration left standing above it. What matters is the line that
   decides: the skip must be the one that consults busIds. */
/* and it has to be THE refusal loop's skip, not the first `continue` in the whole
   function — the departures loop above has one too, and matching that made this
   check fail on an unmutated file, which is its own kind of useless. */
const refusalBlock = fn.slice(fn.indexOf('const refusals=[]'), fn.indexOf('if(!rows.length'));
const skipLine = (refusalBlock.match(/^\s*if\(.*\)\s*continue;\s*$/m) || [''])[0];
ok('a refusal is matched against the laboratory\'s BUS ids, not against its view id',
  /for\(const sp of specs\) busIds\.add\(sp\.id\)/.test(fn)
  && /busIds\.has\(/.test(skipLine) && !/!==v/.test(skipLine),
  /!==v/.test(skipLine) ? ('the filter compares against the view id: ' + skipLine.trim())
    : !/busIds\.has\(/.test(skipLine) ? ('the deciding line does not consult busIds: ' + skipLine.trim())
    : 'the view is resolved to its specs first, as the arrivals are');

/* AND A LABORATORY WITH NO API SPEC STILL SHOWS ITS REFUSALS. The function bailed out
   when a laboratory had no spec, because without one there is nothing to evaluate —
   but a refusal is a sentence about a coupling, not an evaluation. */
ok('a laboratory with no API spec still shows its refusals',
  /const noSpecs=!specs\.length;/.test(fn) && !/if\(!specs\.length\) return '';/.test(fn),
  /if\(!specs\.length\) return '';/.test(fn)
    ? 'the early return is back — a laboratory with no spec shows nothing, refusals included'
    : 'the early return that hid them is gone; the spec loop is what is skipped');
ok('and the section does not promise arrivals it has none of',
  /\(rows\.length\|\|feeds\.length\)\?TT\('What the bus delivers here/.test(fn),
  'the heading says "what the bus refused to carry here" when that is all there is');

console.log('\n' + (fail ? ('✖ ' + fail + ' FAILED, ' + pass + ' passed') : ('✔ ALL ' + pass + ' CHECKS PASSED')));
process.exit(fail ? 1 : 0);
