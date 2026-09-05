'use strict';

const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
let failures = 0;

function check(condition, message) {
  if (condition) console.log(`PASS — ${message}`);
  else { console.error(`FAIL — ${message}`); failures++; }
}

console.log('=== Semantic reconciliation · Stage 1 ===');

check(
  html.includes('function syncVisualViewport()')
    && html.includes("window.visualViewport?.addEventListener('resize',syncVisualViewport")
    && html.includes("window.visualViewport?.addEventListener('scroll',syncVisualViewport")
    && html.includes("root.style.setProperty('--keyboard-h',keyboard+'px')"),
  'VisualViewport is the shared mobile authority for WebGL, CSS and keyboard geometry'
);

check(
  html.includes('--safe-l:env(safe-area-inset-left,0px)')
    && html.includes('--safe-r:env(safe-area-inset-right,0px)')
    && !/maximum-scale\s*=\s*1(?:\.0)?/i.test(html),
  'iPhone side safe areas are named and browser zoom is not disabled'
);

check(
  html.includes("g.setAttribute('role','separator')")
    && html.includes("g.setAttribute('aria-label','Resize controls sheet')")
    && html.includes("drag.velocity>.55")
    && html.includes("e.key==='Escape'"),
  'mobile sheets retain keyboard-accessible resizing plus guarded flick-to-dismiss'
);

check(
  html.includes("b.setAttribute('aria-pressed',active?'true':'false')")
    && html.includes("b.setAttribute('aria-current','page')")
    && html.includes("b.querySelector('i')?.setAttribute('aria-hidden','true')"),
  'compact navigation exposes translated names, pressed state and one current destination'
);

check(
  html.includes('function selectionRelationCurve(a,b,seed=0,viewDir=null,segments=24)')
    && html.includes("selectionLinksGroup.name='Typed relationship field'")
    && html.includes('selectionRelationFlow=new THREE.Points')
    && html.includes('Typed relation flow probes'),
  'typed relationships render as curved non-metric orbits with animated flow probes'
);

check(
  html.includes('p[0].distanceTo(a)<1e-12')
    && html.includes('p.at(-1).distanceTo(b)<1e-12')
    && html.includes('not straight lines that can be mistaken for physical distance'),
  'the relation-curve self-test preserves exact endpoints and the non-metric semantic contract'
);

check(
  html.includes('astOn:false'),
  'Solar 65,536-particle N-body swarm remains opt-in after reconciliation'
);

if (failures) {
  console.error(`\n${failures} Stage-1 reconciliation contract(s) missing.`);
  process.exit(1);
}
console.log('\nPASS — all Stage-1 reconciliation contracts are present.');
