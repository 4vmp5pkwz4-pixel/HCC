import test from 'node:test';
import assert from 'node:assert/strict';
import { attachPhaseDiscovery } from '../scripts/phase-api-integration.mjs';

test('adds one phase resource without deleting existing discovery',()=>{
  const agent={resources:{manifest:'./api/manifest.json'},self_hosted:{tools:['old']}};
  const manifest={contracts:{base:'site-root'}};
  const out=attachPhaseDiscovery({agent,manifest,phaseTools:['describe_phase_space','probe_invariant']});
  assert.equal(out.agent.resources.phase_space,'./api/phase-space.json');
  assert.equal(out.manifest.contracts.phase_space,'./api/phase-space.json');
  assert.deepEqual(out.agent.self_hosted.tools,['old']);
  assert.deepEqual(out.agent.phase_space.tools,['describe_phase_space','probe_invariant']);
});

test('does not mutate source objects',()=>{
  const agent={resources:{manifest:'x'}}; const manifest={contracts:{base:'y'}};
  attachPhaseDiscovery({agent,manifest,phaseTools:[]});
  assert.deepEqual(agent,{resources:{manifest:'x'}}); assert.deepEqual(manifest,{contracts:{base:'y'}});
});
