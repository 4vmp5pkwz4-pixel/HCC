/** Restricted, massless test particles. GM and dt must use matching units. */
export const ASTEROID_UNIFORM_BYTES = 64;
export const ASTEROID_SOFTENING_SQUARED = 1e-8;

export function validateAsteroidParams(p) {
  finiteParameter(p?.sunGM,'sunGM',true);finiteParameter(p?.jupGM,'jupGM',true);
  finiteParameter(p?.satGM,'satGM',true);finiteParameter(p?.dt,'dt',false);
  if(!p.jupPos||p.jupPos.length!==3||!p.satPos||p.satPos.length!==3)throw new RangeError('perturber positions must contain three finite parameters');
  for(let i=0;i<3;i++){finiteParameter(p.jupPos[i],'jupPos',false);finiteParameter(p.satPos[i],'satPos',false);}
}
function finiteParameter(v,name,nonnegative){if(!Number.isFinite(v)||!Number.isFinite(Math.fround(v))||(nonnegative&&v<0))throw new RangeError(`${name} must be a finite representable parameter`);}

/** Supplied views are reused by the engine; the public convenience form accepts ArrayBuffer. */
export function packAsteroidUniforms(storage, p, floats, uints) {
  validateAsteroidParams(p);
  if (!(storage instanceof ArrayBuffer) || storage.byteLength !== ASTEROID_UNIFORM_BYTES) throw new RangeError('uniform storage must be 64 bytes');
  if (!Number.isInteger(p.particleCount) || p.particleCount < 0 || p.particleCount > 0xffffffff) throw new RangeError('particleCount must be uint32');
  const f = floats || new Float32Array(storage), u = uints || new Uint32Array(storage);
  f[0]=p.sunGM; f[1]=p.jupGM; f[2]=p.satGM; f[3]=p.dt;
  f[4]=p.jupPos[0]; f[5]=p.jupPos[1]; f[6]=p.jupPos[2]; f[7]=0;
  f[8]=p.satPos[0]; f[9]=p.satPos[1]; f[10]=p.satPos[2]; f[11]=0;
  u[12]=p.particleCount; u[13]=0; u[14]=0; u[15]=0;
  return storage;
}

export function asteroidAcceleration(x, p) {
  const eps=p.softeningSquared ?? ASTEROID_SOFTENING_SQUARED;
  const r2=x[0]**2+x[1]**2+x[2]**2+eps, k=-p.sunGM/r2**1.5;
  const a=x.map(v=>k*v);
  for(const [body,gm] of [[p.jupPos,p.jupGM],[p.satPos,p.satGM]]) {
    if(gm===0) continue;
    const d=body.map((v,i)=>v-x[i]), d2=d[0]**2+d[1]**2+d[2]**2+eps;
    const b2=body[0]**2+body[1]**2+body[2]**2+eps;
    for(let i=0;i<3;i++) a[i]+=gm*(d[i]/d2**1.5-body[i]/b2**1.5);
  }
  return a;
}

/** Fixed-step second-order velocity Verlet for the supplied frozen perturbers. */
export function verletStep(x,v,p) {
  const a=asteroidAcceleration(x,p), half=v.map((w,i)=>w+0.5*p.dt*a[i]);
  const next=x.map((w,i)=>w+p.dt*half[i]), b=asteroidAcceleration(next,p);
  return [next, half.map((w,i)=>w+0.5*p.dt*b[i])];
}
