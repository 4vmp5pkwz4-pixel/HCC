import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {connectLiveAtlas} from '../api/live-agent-bridge.mjs';

test('live agent uses existing Atlas authorities and refuses unknown navigation', async () => {
  const ctx = {worldId:'solar', labId:null, selectedObjectId:null};
  const scene = {worldId:'solar', labId:null, selectedObjectId:null, scaleLayer:'local',
    viewMode:'single',activeTile:null,visibleTiles:[]};
  const nav = {
    worlds:()=>[{id:'solar'}, {id:'s3'}],
    labs:()=>[{id:'tri', parentWorld:'s3'}],
    find:q=>q==='earth'?[{key:'earth',name:'Earth',mode:'solar'}]:[],
    go:(world,lab)=>{ctx.worldId=scene.worldId=world;ctx.labId=scene.labId=lab;},
    layer:layer=>{if(layer!=='galactic')return false;scene.worldId='solar';scene.labId=null;scene.scaleLayer=layer;return true;},
    open:key=>{if(key!=='earth')return false;scene.worldId='solar';scene.labId=null;scene.selectedObjectId=key;return true;},
    scene:()=>({...scene}),
  };
  const api = {
    schema:'hcc.api/2', version:'4.334.0', build:'test',
    ready:async()=>true,
    describe:id=>id==='tri.metric'?{id,status:'CONDITIONAL'}:null,
    report:(id,input)=>({schema:'hcc.report/1', laboratory:{id}, inputs:input,
      outputs:{distance:42}, source:{version:'4.334.0', build:'test'}}),
  };
  const live=connectLiveAtlas({api,nav});
  await live.ready();
  assert.throws(()=>live.navigate('unknown'),/world/i);
  assert.throws(()=>live.navigate('solar','tri'),/lab|world/i);
  assert.equal(live.snapshot().worldId,'solar');
  assert.equal(live.navigate('s3','tri').labId,'tri');
  assert.equal(live.runInstrument('tri.metric',{theta:0.5}).outputs.distance,42);
  assert.throws(()=>live.runInstrument('missing',{}),/instrument|unknown/i);
  assert.equal(live.findObjects('earth')[0].key,'earth');
  assert.deepEqual([live.openObject('earth').worldId,live.snapshot().selectedObjectId],['solar','earth']);
  assert.throws(()=>live.openObject('missing'),/object/i);
  assert.equal(live.setScaleLayer('galactic').scaleLayer,'galactic');
  assert.throws(()=>live.setScaleLayer('nonsense'),/layer/i);
  const snapshot=live.snapshot(); snapshot.worldId='mutated';
  assert.equal(live.snapshot().worldId,'solar');
});

test('production Atlas scene identifies the active Multiview world tile', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const start = html.indexOf('globalThis.HCC_NAV={');
  const end = html.indexOf('\nconst HCC_FAV=', start);
  assert.ok(start > 0 && end > start, 'live navigation registration must exist');
  const context = {
    globalThis:{},
    state:{mode:'s3',s3view:'tri',solarScaleLayer:'galactic'},
    selectedKey:'earth',
    MV:{on:true,active:1,n:2,views:['tri','@solar']},
    MV_WORLD_OF:new Map([['@solar','solar']]),
    mvIsWorld:value=>value.startsWith('@'),
    mvIsFrac:value=>value.startsWith('#'),
    mvIsLab:value=>value==='tri',
  };
  runInNewContext(html.slice(start, end), context);
  assert.deepEqual(JSON.parse(JSON.stringify(context.globalThis.HCC_NAV.scene())), {
    worldId:'solar', labId:null, selectedObjectId:null, scaleLayer:'galactic',
    viewMode:'multiview', activeTile:'@solar', visibleTiles:['tri','@solar'],
  });
});

test('live bridge refuses a non-finite scientific report before serialization', () => {
  const api={schema:'hcc.api/2', version:'v', build:'b', ready:async()=>true,
    describe:()=>({id:'x'}), report:()=>({schema:'hcc.report/1',outputs:{distance:NaN}})};
  const nav={worlds:()=>[],labs:()=>[],find:()=>[],go:()=>{},layer:()=>false,open:()=>false,
    scene:()=>({worldId:'solar',labId:null,selectedObjectId:null,scaleLayer:'local',
      viewMode:'single',activeTile:null,visibleTiles:[]})};
  const live=connectLiveAtlas({api,nav});
  assert.throws(()=>live.runInstrument('x',{}),/non-finite/i);
});
