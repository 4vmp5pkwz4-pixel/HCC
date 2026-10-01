import {ASTEROID_UNIFORM_BYTES,packAsteroidUniforms} from './asteroid-reference.mjs';

export const ASTEROID_WGSL = `
struct Particle { pos:vec4<f32>, vel:vec4<f32> };
struct Params {
  sunGM:f32, jupGM:f32, satGM:f32, dt:f32,
  jupPos:vec4<f32>, satPos:vec4<f32>,
  particleCount:u32, pad0:u32, pad1:u32, pad2:u32
};
@group(0) @binding(0) var<uniform> p:Params;
@group(0) @binding(1) var<storage,read> current:array<Particle>;
@group(0) @binding(2) var<storage,read_write> next:array<Particle>;
fn pull(x:vec3<f32>,b:vec3<f32>,gm:f32)->vec3<f32> {
  let d=b-x; let inv=inverseSqrt(dot(d,d)+1e-8);
  let ib=inverseSqrt(dot(b,b)+1e-8);
  return gm*(d*inv*inv*inv-b*ib*ib*ib);
}
fn acceleration(x:vec3<f32>)->vec3<f32> {
  let inv=inverseSqrt(dot(x,x)+1e-8);
  return -p.sunGM*x*inv*inv*inv+pull(x,p.jupPos.xyz,p.jupGM)+pull(x,p.satPos.xyz,p.satGM);
}
@compute @workgroup_size(128)
fn main(@builtin(global_invocation_id) gid:vec3<u32>) {
  let i=gid.x; if(i>=p.particleCount){return;}
  let q=current[i]; let half=q.vel.xyz+0.5*p.dt*acceleration(q.pos.xyz);
  let x=q.pos.xyz+p.dt*half;
  let v=half+0.5*p.dt*acceleration(x);
  next[i]=Particle(vec4<f32>(x,q.pos.w),vec4<f32>(v,q.vel.w));
}`;

/** GPU-only stepping; snapshots are explicit and never part of the render loop. */
export class AsteroidComputeEngine {
  static async create(device, initial, count) {
    if(!Number.isInteger(count)||count<1||count>Math.floor(device.limits.maxStorageBufferBindingSize/32)
      ||count>Math.floor(device.limits.maxBufferSize/32)||Math.ceil(count/128)>device.limits.maxComputeWorkgroupsPerDimension) throw new RangeError('particle capacity exceeds device limits');
    const module=device.createShaderModule({code:ASTEROID_WGSL,label:'HCC asteroid Verlet'});
    const pipe=await device.createComputePipelineAsync({layout:'auto',compute:{module,entryPoint:'main'}});
    return new AsteroidComputeEngine(device,initial,count,pipe);
  }
  constructor(device,initial,count,pipeline) {
    this.device=device; this.count=count; this.pipeline=pipeline; this.index=0; this.destroyed=false; this.mapping=false;
    this.uniformData=new ArrayBuffer(ASTEROID_UNIFORM_BYTES);
    this.floats=new Float32Array(this.uniformData); this.uints=new Uint32Array(this.uniformData);
    this.buffers=[];
    try {
      const size=count*32;
      for(let i=0;i<2;i++) this.buffers.push(device.createBuffer({size,usage:GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST|GPUBufferUsage.COPY_SRC|GPUBufferUsage.VERTEX}));
      this.uniform=device.createBuffer({size:ASTEROID_UNIFORM_BYTES,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
      this.bindGroups=[0,1].map(i=>device.createBindGroup({layout:pipeline.getBindGroupLayout(0),entries:[
        {binding:0,resource:{buffer:this.uniform}}, {binding:1,resource:{buffer:this.buffers[i]}},
        {binding:2,resource:{buffer:this.buffers[1-i]}}]}));
      this.reset(initial);
    } catch(e) { this.destroy(); throw e; }
    device.lost.then(()=>this.destroy());
  }
  reset(data) {
    if(this.destroyed) throw new Error('asteroid engine destroyed');
    if(!(data instanceof Float32Array)||data.length!==this.count*8||data.some(v=>!Number.isFinite(v))) throw new RangeError('initial state must contain eight finite f32 values per particle');
    this.device.queue.writeBuffer(this.buffers[0],0,data); this.index=0;
  }
  step(params) {
    if(this.destroyed) throw new Error('asteroid engine destroyed');
    if(params.particleCount!==this.count) throw new RangeError('particleCount must equal initialized count');
    packAsteroidUniforms(this.uniformData,params,this.floats,this.uints);
    const enc=this.device.createCommandEncoder({label:'HCC asteroid Verlet step'}), pass=enc.beginComputePass();
    pass.setPipeline(this.pipeline); pass.setBindGroup(0,this.bindGroups[this.index]);
    pass.dispatchWorkgroups(Math.ceil(this.count/128)); pass.end();
    // Every write is immediately followed by its submit. Encoding several steps then
    // writing the same uniform before a shared submit would make them all read the last dt.
    this.device.queue.writeBuffer(this.uniform,0,this.uniformData);
    this.device.queue.submit([enc.finish()]); this.index=1-this.index;
    return this.buffers[this.index];
  }
  async snapshot() {
    if(this.destroyed) throw new Error('asteroid engine destroyed');
    if(this.mapping) throw new Error('asteroid snapshot busy');
    if(!this.readback) this.readback=this.device.createBuffer({size:this.count*32,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});
    this.mapping=true;
    try {
      const enc=this.device.createCommandEncoder();
      enc.copyBufferToBuffer(this.buffers[this.index],0,this.readback,0,this.count*32);
      this.device.queue.submit([enc.finish()]); await this.readback.mapAsync(GPUMapMode.READ);
      if(this.destroyed) throw new Error('asteroid engine destroyed');
      return new Float32Array(this.readback.getMappedRange().slice(0));
    } finally { if(this.readback.mapState==='mapped')this.readback.unmap(); this.mapping=false; }
  }
  get memoryBytes(){return this.count*64+ASTEROID_UNIFORM_BYTES+(this.readback?this.count*32:0);}
  destroy(){if(this.destroyed)return;this.destroyed=true;for(const b of this.buffers)b.destroy();this.uniform?.destroy();this.readback?.destroy();}
}
