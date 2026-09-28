import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { server, TOOLS, PHASE_MCP_TOOLS } from '../server/server.mjs';

const expected=['describe_phase_space','probe_invariant','compare_phase_spaces','list_phase_bridges'];

test('single MCP authority exposes the four additive phase-space tools',()=>{
  assert.deepEqual(PHASE_MCP_TOOLS,expected);
  for(const name of expected) assert.ok(TOOLS.some(t=>t.name===name),name);
});

test('phase-space tools work through JSON-RPC and REFUSED remains a scientific result',async()=>{
  server.listen(0); await once(server,'listening'); const port=server.address().port;
  const call=async(name,args={})=>fetch(`http://127.0.0.1:${port}/mcp`,{method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name,arguments:args}})}).then(r=>r.json());
  try{
    const d=await call('describe_phase_space',{lab_id:'rel'});
    assert.equal(d.result.structuredContent.id,'rel'); assert.equal(d.result.isError,false);
    const cmp=await call('compare_phase_spaces',{lab_a:'rel',lab_b:'heat'});
    assert.equal(cmp.result.structuredContent.status,'REFUSED'); assert.equal(cmp.result.isError,false);
    const hidden=await call('list_phase_bridges',{});
    assert.deepEqual(hidden.result.structuredContent.candidates,[]);
    const bad=await call('describe_phase_space',{lab_id:'missing'});
    assert.equal(bad.result.isError,true); assert.equal(bad.result.structuredContent.error.code,'NOT_FOUND');
  }finally{await new Promise(r=>server.close(r));}
});
