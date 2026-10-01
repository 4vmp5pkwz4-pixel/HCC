/** Exercise device replacement through the actual atlas integration functions. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../index.html',import.meta.url),'utf8');
const init=source.slice(source.indexOf('let HCC_GPU=null'),source.indexOf('/* ── std430 PACKING'));
const diagnostics=source.slice(source.indexOf('let HCC_HAD_ENGINE=null'),source.indexOf('/* the CPU twin of that reduction'));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
const tick=()=>new Promise(resolve=>setImmediate(resolve));

function fixture(){
  const entered=deferred(),release=deferred(),devices=[],engines=[];
  class Engine {
    static creations=0;
    static async create(device,initialOrCapacity,count){
      if(this.creations++===0){entered.resolve();await release.promise;}
      const engine=new Engine(device,initialOrCapacity,count);engines.push(engine);return engine;
    }
    constructor(device,initial,count){
      this.device=device;this.destroyed=device.closed;this.initial=initial;this.count=count;
      this.maxTriangles=131072;this.slots=[{},{},{}];this.memoryBytes=64;
      device.lost.then(()=>this.destroy());
    }
    destroy(){this.destroyed=true;}
    reset(initial){if(this.destroyed)throw new Error('engine destroyed');this.initial=initial;}
    async snapshot(){if(this.destroyed)throw new Error('engine destroyed');return this.initial.slice();}
    async computeMesh(){if(this.destroyed)throw new Error('engine destroyed');return {V2:12,V3:8};}
  }
  const context=vm.createContext({console,Float32Array,AsteroidComputeEngine:Engine,HadwigerReductionEngine:Engine,
    navigator:{gpu:{async requestAdapter(){return {async requestDevice(){
      const loss=deferred(),device={limits:{maxBufferSize:1e9,maxStorageBufferBindingSize:1e9},lost:loss.promise,closed:false,
        lose(){this.closed=true;loss.resolve();}};devices.push(device);return device;
    }};}}},
    hadwigerIntrinsic:()=>({V2:12,V3:8}),state:{epochDays:0},PLANETS:Array(6),planetPos:()=>({x:1,y:0,z:0}),
    AST_GM:1,AST_GMJ:0,AST_GMS:0,hccAsteroidVerlet:()=>{throw new Error('not used by zero-step fixture');}});
  vm.runInContext(`${init}\n${diagnostics}\nglobalThis.api={hccGpuInit,hadwigerGpuCompare,hccGpuAsteroidsCompare,hadDevice:()=>HCC_HAD_ENGINE?.device};`,context);
  return {api:context.api,entered,release,devices,engines};
}

test('asteroid diagnostic recovers after device loss during engine creation',async()=>{
  const f=fixture(),interrupted=f.api.hccGpuAsteroidsCompare({count:1,steps:0});
  await f.entered.promise;f.devices[0].lose();await tick();f.release.resolve();
  assert.equal((await interrupted).ran,false);
  const recovered=await f.api.hccGpuAsteroidsCompare({count:1,steps:0});
  assert.equal(recovered.ran,true,recovered.reason);
  assert.equal(f.devices.length,2);assert.equal(f.engines.length,2);
  assert.equal(f.engines[0].destroyed,true);assert.equal(f.engines[1].device,f.devices[1]);
});

test('late Hadwiger creation cannot replace a fresh-device engine',async()=>{
  const f=fixture();await f.api.hccGpuInit();
  const interrupted=f.api.hadwigerGpuCompare([],[]);
  await f.entered.promise;f.devices[0].lose();await tick();await f.api.hccGpuInit();
  const recovered=await f.api.hadwigerGpuCompare([],[]);assert.equal(recovered.ran,true,recovered.reason);
  f.release.resolve();assert.equal((await interrupted).ran,false);
  assert.equal(f.api.hadDevice(),f.devices[1]);
  assert.equal((await f.api.hadwigerGpuCompare([],[])).ran,true);
  assert.equal(f.devices.length,2);assert.equal(f.engines.length,2);
  assert.equal(f.engines.at(-1).destroyed,true);
});
