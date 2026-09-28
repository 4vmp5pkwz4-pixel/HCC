import test from 'node:test';
import assert from 'node:assert/strict';
import {connectLiveAtlas} from '../api/live-agent-bridge.mjs';

test('live agent uses existing Atlas authorities and refuses unknown navigation', async () => {
  const ctx = {worldId:'solar', labId:null, selectedObjectId:null};
  const nav = {
    worlds:()=>[{id:'solar'}, {id:'s3'}],
    labs:()=>[{id:'tri', parentWorld:'s3'}],
    find:q=>q==='earth'?[{key:'earth',name:'Earth',mode:'solar'}]:[],
    go:(world,lab)=>{ctx.worldId=world;ctx.labId=lab;},
    layer:layer=>{if(layer!=='galactic')return false;ctx.worldId='solar';return true;},
    open:key=>{if(key!=='earth')return false;ctx.selectedObjectId=key;return true;},
  };
  const api = {
    schema:'hcc.api/2', version:'4.334.0', build:'test',
    ready:async()=>true,
    describe:id=>id==='tri.metric'?{id,status:'CONDITIONAL'}:null,
    report:(id,input)=>({schema:'hcc.report/1', laboratory:{id}, inputs:input,
      outputs:{distance:42}, source:{version:'4.334.0', build:'test'}}),
  };
  const live=connectLiveAtlas({api,nav,ctx});
  await live.ready();
  assert.throws(()=>live.navigate('unknown'),/world/i);
  assert.throws(()=>live.navigate('solar','tri'),/lab|world/i);
  assert.equal(live.snapshot().worldId,'solar');
  assert.equal(live.navigate('s3','tri').labId,'tri');
  assert.equal(live.runInstrument('tri.metric',{theta:0.5}).outputs.distance,42);
  assert.throws(()=>live.runInstrument('missing',{}),/instrument|unknown/i);
  assert.equal(live.findObjects('earth')[0].key,'earth');
  assert.equal(live.openObject('earth').selectedObjectId,'earth');
  assert.throws(()=>live.openObject('missing'),/object/i);
  assert.equal(live.setScaleLayer('galactic').worldId,'solar');
  assert.throws(()=>live.setScaleLayer('nonsense'),/layer/i);
  const snapshot=live.snapshot(); snapshot.worldId='mutated';
  assert.equal(live.snapshot().worldId,'solar');
});

test('live bridge refuses a non-finite scientific report before serialization', () => {
  const api={schema:'hcc.api/2', version:'v', build:'b', ready:async()=>true,
    describe:()=>({id:'x'}), report:()=>({schema:'hcc.report/1',outputs:{distance:NaN}})};
  const nav={worlds:()=>[],labs:()=>[],find:()=>[],go:()=>{},layer:()=>false,open:()=>false};
  const live=connectLiveAtlas({api,nav,ctx:{worldId:'solar',labId:null,selectedObjectId:null}});
  assert.throws(()=>live.runInstrument('x',{}),/non-finite/i);
});
