/** Optional native Dawn execution. No runtime dependency is added to the atlas. */
import {runVisualGpuChecks} from './helpers/visual-gpu-checks.mjs';
let result;
let timeout;
try {
  const {create,globals}=await import(process.env.HCC_DAWN_MODULE||'webgpu');
  Object.assign(globalThis,globals);
  globalThis.hccTestNativeGpu=create(['backend=vulkan']);
  result=await Promise.race([runVisualGpuChecks(globalThis.hccTestNativeGpu),new Promise((_,reject)=>{
    timeout=setTimeout(()=>reject(new Error('native GPU checks timed out')),45000);
  })]);
}catch(e){result={ran:false,reason:String(e?.stack||e)};}
finally{clearTimeout(timeout);delete globalThis.hccTestNativeGpu;}
console.log(JSON.stringify(result,null,2));
if(!result.ran){if(process.env.HCC_REQUIRE_GPU==='1')process.exitCode=1;}
else if(result.failures.length)process.exitCode=1;
