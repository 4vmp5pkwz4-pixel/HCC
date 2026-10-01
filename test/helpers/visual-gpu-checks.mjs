/** Shared real-dispatch checks for browser and native Dawn adapters. */
export async function runVisualGpuChecks(gpu){
    const adapter=await gpu?.requestAdapter();
    if(!adapter)return {ran:false,reason:'no WebGPU adapter'};
    const device=await adapter.requestDevice(), checks=[], failures=[];
    const verify=(name,yes,detail)=>{checks.push({name,pass:!!yes,detail});if(!yes)failures.push(name);};
    const errors=[];device.addEventListener('uncapturederror',e=>errors.push(e.error.message));
    let allocations=0;
    const tracked=new Proxy(device,{get(target,key){if(key==='createBuffer')return (...args)=>{allocations++;return target.createBuffer(...args);};const value=Reflect.get(target,key,target);return typeof value==='function'?value.bind(target):value;}});
    const {HadwigerReductionEngine}=await import('../../visual/gpu/hadwiger-reduction.mjs');
    const {AsteroidComputeEngine}=await import('../../visual/gpu/asteroid-compute.mjs');
    const {verletStep}=await import('../../visual/gpu/asteroid-reference.mjs');
    const reducer=await HadwigerReductionEngine.create(tracked,100000,3), data=new Float32Array(100000*12);
    for(let i=0;i<100000;i++)data.set([0,0,1,0,1,0,1,0,0,1,1,0],12*i);
    const before=allocations;
    for(const count of [100000,8193,65,1,0]) {
      const r=await reducer.reduce(data,count);
      verify(`complete reduction ${count}`,Math.abs(r.V2-count/4)<Math.max(1e-6,count*1e-6)&&Math.abs(r.V3-count/6)<Math.max(1e-6,count*1e-6),r);
    }
    const pending=[reducer.reduce(data,99999),reducer.reduce(data,129),reducer.reduce(data,2)];
    let busy=false;try{await reducer.reduce(data,1);}catch(e){busy=/busy/.test(e.message);}
    verify('readback ring refuses saturation',busy);
    const concurrent=await Promise.all(pending);
    verify('concurrent counts keep their own uniforms',concurrent.every((r,i)=>Math.abs(r.V2-[99999,129,2][i]/4)<0.01),concurrent);
    const P=[0,0,0,2,0,0,2,2,0,0,2,0,0,0,2,2,0,2,2,2,2,0,2,2];
    const I=[0,3,2,0,2,1,4,5,6,4,6,7,0,1,5,0,5,4,1,2,6,1,6,5,2,3,7,2,7,6,3,0,4,3,4,7];
    const cube=await reducer.computeMesh(P,I);
    verify('mesh packing reproduces cube closed forms',Math.abs(cube.V2-12)<1e-6&&Math.abs(cube.V3-8)<1e-6,cube);
    let invalidIndex=false;try{await reducer.computeMesh(P,[0,1,99]);}catch(e){invalidIndex=/index/.test(e.message);}
    verify('mesh packing rejects invalid indices',invalidIndex);
    verify('repeated reductions allocate no GPU buffers',before===allocations,{before,after:allocations});
    reducer.destroy();let refused=false;try{await reducer.reduce(data,1);}catch(e){refused=/destroyed/.test(e.message);}verify('destroyed reducer refuses new work',refused);
    const dying=await HadwigerReductionEngine.create(device,1,1), inflight=dying.reduce(data,1);dying.destroy();
    const stopped=await Promise.allSettled([inflight]);verify('pending mapping rejects cleanly on destroy',stopped[0].status==='rejected');

    // Deliberately non-multiple of 128, and w lanes are metadata, including zero.
    const count=129, initial=new Float32Array(count*8);
    for(let i=0;i<count;i++)initial.set([1+i/1000,0,0,i%3,0,1,0,0],8*i);
    const engine=await AsteroidComputeEngine.create(tracked,initial,count), orbitBefore=allocations;
    const params={sunGM:1,jupGM:0.01,satGM:0.003,jupPos:[5,1,0],satPos:[9,0,1],particleCount:count,dt:0.01};
    let x=[initial[0],initial[1],initial[2]],v=[initial[4],initial[5],initial[6]];
    for(const dt of [0.01,0.02,-0.015,0.005]){params.dt=dt;engine.step(params);[x,v]=verletStep(x,v,params);}
    verify('orbital steps allocate no GPU buffers',allocations===orbitBefore);
    const got=await engine.snapshot();
    verify('changing dt snapshots match float64 Verlet',Math.hypot(got[0]-x[0],got[1]-x[1],got[2]-x[2])<2e-6&&Math.hypot(got[4]-v[0],got[5]-v[1],got[6]-v[2])<2e-6,{gpu:[...got.slice(0,8)],cpu:{x,v}});
    verify('partial workgroup preserves particle metadata',got[128*8+3]===2&&got[128*8+7]===0);
    engine.reset(initial);const reset=await engine.snapshot();verify('reset restores initial states',reset.every((value,i)=>value===initial[i]));
    engine.destroy();await device.queue.onSubmittedWorkDone();
    verify('no WebGPU validation errors',errors.length===0,errors);
    const info=adapter.info||await adapter.requestAdapterInfo?.();
    device.destroy();
    return {ran:true,backend:info?{vendor:info.vendor,architecture:info.architecture,device:info.device,description:info.description}:null,checks,failures};
}
