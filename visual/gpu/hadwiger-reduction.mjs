/** V2 and V3 only. V1/V0 need mesh adjacency and stay on the CPU. */
export const HADWIGER_WGSL = `
struct Tri {a:vec4<f32>,b:vec4<f32>,c:vec4<f32>};
struct Acc {vol:f32,area:f32,pad0:f32,pad1:f32};
struct Counts {triangles:u32,blocks:u32,pad0:u32,pad1:u32};
@group(0) @binding(0) var<storage,read> triangles:array<Tri>;
@group(0) @binding(1) var<storage,read_write> partials:array<Acc>;
@group(0) @binding(2) var<storage,read_write> result:array<Acc>;
@group(0) @binding(3) var<uniform> counts:Counts;
var<workgroup> local:array<Acc,64>;
fn reduceLocal(lane:u32) {
  workgroupBarrier();
  for(var s=32u;s>0u;s=s>>1u){
    if(lane<s){local[lane].vol+=local[lane+s].vol;local[lane].area+=local[lane+s].area;}
    workgroupBarrier();
  }
}
@compute @workgroup_size(64)
fn stage1(@builtin(global_invocation_id) gid:vec3<u32>,@builtin(local_invocation_id) lid:vec3<u32>,@builtin(workgroup_id) wid:vec3<u32>){
  var a=Acc(0.0,0.0,0.0,0.0);
  if(gid.x<counts.triangles){
    let t=triangles[gid.x];
    a.vol=dot(t.a.xyz,cross(t.b.xyz,t.c.xyz))/6.0;
    a.area=0.5*length(cross(t.b.xyz-t.a.xyz,t.c.xyz-t.a.xyz));
  }
  local[lid.x]=a;reduceLocal(lid.x);
  if(lid.x==0u){partials[wid.x]=local[0];}
}
@compute @workgroup_size(64)
fn stage2(@builtin(local_invocation_id) lid:vec3<u32>){
  var a=Acc(0.0,0.0,0.0,0.0);
  // One workgroup covers ALL partials, including 1563 blocks for 100k triangles.
  for(var i=lid.x;i<counts.blocks;i+=64u){a.vol+=partials[i].vol;a.area+=partials[i].area;}
  local[lid.x]=a;reduceLocal(lid.x);
  if(lid.x==0u){result[0]=local[0];}
}`;

export class HadwigerReductionEngine {
  static async create(device,maxTriangles=131072,ringSize=3) {
    if(!Number.isInteger(maxTriangles)||maxTriangles<1||maxTriangles>Math.floor(device.limits.maxStorageBufferBindingSize/48)
      ||maxTriangles>Math.floor(device.limits.maxBufferSize/48)||Math.ceil(maxTriangles/64)>device.limits.maxComputeWorkgroupsPerDimension) throw new RangeError('triangle capacity exceeds device limits');
    if(!Number.isInteger(ringSize)||ringSize<1||ringSize>16) throw new RangeError('ring size must be 1..16');
    const layout=device.createBindGroupLayout({entries:[
      {binding:0,visibility:GPUShaderStage.COMPUTE,buffer:{type:'read-only-storage'}},
      {binding:1,visibility:GPUShaderStage.COMPUTE,buffer:{type:'storage'}},
      {binding:2,visibility:GPUShaderStage.COMPUTE,buffer:{type:'storage'}},
      {binding:3,visibility:GPUShaderStage.COMPUTE,buffer:{type:'uniform'}}]});
    const pipelineLayout=device.createPipelineLayout({bindGroupLayouts:[layout]});
    const module=device.createShaderModule({code:HADWIGER_WGSL,label:'HCC complete Hadwiger reduction'});
    const first=await device.createComputePipelineAsync({layout:pipelineLayout,compute:{module,entryPoint:'stage1'}});
    const second=await device.createComputePipelineAsync({layout:pipelineLayout,compute:{module,entryPoint:'stage2'}});
    return new HadwigerReductionEngine(device,maxTriangles,ringSize,layout,first,second);
  }
  constructor(device,maxTriangles,ringSize,layout,first,second) {
    this.device=device;this.maxTriangles=maxTriangles;this.first=first;this.second=second;this.destroyed=false;
    this.staging=new Float32Array(maxTriangles*12);this.counts=new Uint32Array(4);this.resources=[];this.slots=[];
    const buffer=(size,usage)=>{const b=device.createBuffer({size,usage});this.resources.push(b);return b;};
    try {
      this.triangles=buffer(maxTriangles*48,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_DST);
      this.partials=buffer(Math.ceil(maxTriangles/64)*16,GPUBufferUsage.STORAGE);
      this.result=buffer(16,GPUBufferUsage.STORAGE|GPUBufferUsage.COPY_SRC);
      this.uniform=buffer(16,GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST);
      for(let i=0;i<ringSize;i++)this.slots.push({buffer:buffer(16,GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ),busy:false});
      this.bind=device.createBindGroup({layout,entries:[
        {binding:0,resource:{buffer:this.triangles}}, {binding:1,resource:{buffer:this.partials}},
        {binding:2,resource:{buffer:this.result}}, {binding:3,resource:{buffer:this.uniform}}]});
    }catch(e){this.destroy();throw e;}
    device.lost.then(()=>this.destroy());
  }
  computeMesh(P,I) {
    if(!P||!I||P.length%3||I.length%3)throw new RangeError('mesh must contain complete xyz vertices and triangle indices');
    const count=I.length/3;
    if(count>this.maxTriangles)throw new RangeError('triangle capacity exceeded');
    for(let f=0;f<count;f++)for(let k=0;k<3;k++){
      const v=I[3*f+k], offset=f*12+k*4;
      if(!Number.isInteger(v)||v<0||3*v+2>=P.length)throw new RangeError('triangle index outside vertex array');
      for(let c=0;c<3;c++){
        const value=P[3*v+c];if(!Number.isFinite(value)||!Number.isFinite(Math.fround(value)))throw new RangeError('vertex must be a finite f32 value');
        this.staging[offset+c]=value;
      }
      this.staging[offset+3]=0;
    }
    return this.reduce(this.staging,count);
  }
  async reduce(data,count) {
    if(this.destroyed)throw new Error('Hadwiger engine destroyed');
    if(!Number.isInteger(count)||count<0||count>this.maxTriangles||!(data instanceof Float32Array)||data.length<count*12)throw new RangeError('invalid triangle count/data');
    if(count===0)return {V2:0,V3:0,signedVolume:0};
    const slot=this.slots.find(s=>!s.busy);if(!slot)throw new Error('Hadwiger readback ring busy');
    slot.busy=true;
    try {
      const groups=Math.ceil(count/64);this.counts[0]=count;this.counts[1]=groups;
      const enc=this.device.createCommandEncoder({label:'HCC Hadwiger two-stage reduction'});
      let pass=enc.beginComputePass();pass.setPipeline(this.first);pass.setBindGroup(0,this.bind);pass.dispatchWorkgroups(groups);pass.end();
      pass=enc.beginComputePass();pass.setPipeline(this.second);pass.setBindGroup(0,this.bind);pass.dispatchWorkgroups(1);pass.end();
      enc.copyBufferToBuffer(this.result,0,slot.buffer,0,16);
      this.device.queue.writeBuffer(this.triangles,0,data,0,count*12);
      this.device.queue.writeBuffer(this.uniform,0,this.counts);
      this.device.queue.submit([enc.finish()]);
      await slot.buffer.mapAsync(GPUMapMode.READ);
      if(this.destroyed)throw new Error('Hadwiger engine destroyed');
      const mapped=new Float32Array(slot.buffer.getMappedRange());
      return {V2:mapped[1]/2,V3:Math.abs(mapped[0]),signedVolume:mapped[0]};
    }finally{if(slot.buffer.mapState==='mapped')slot.buffer.unmap();slot.busy=false;}
  }
  get memoryBytes(){return this.maxTriangles*48+Math.ceil(this.maxTriangles/64)*16+32+this.slots.length*16;}
  destroy(){if(this.destroyed)return;this.destroyed=true;for(const b of this.resources)b.destroy();}
}
