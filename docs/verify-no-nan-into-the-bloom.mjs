/* NO NaN INTO THE BLOOM (v4.411) — a reader met a black square hundreds of pixels wide at the centre of the φ-ladder (N ≈ 95) and
   at other scales. One fragment computing NaN — GLSL pow of a base that a rounding error made negative (1 − |n·v| with n·v =
   1.0000001 at the centre of a sphere facing the camera), which Metal through ANGLE turns into NaN even for an integer exponent —
   is one dark pixel in a plain render; the bloom's mip chain spreads it over every tap that touches it and the additive composite
   blacks out a square. This verifier holds both repairs in place: every GLSL pow in the page has a base that cannot be negative,
   and between the scene and the bloom a pass replaces NaN and infinity, read by their bits. */
import fs from 'node:fs';
const SRC=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
let pass=0, fail=0; const check=(ok,claim,nums)=>{ if(ok) pass++; else fail++; console.log(`${ok?'PASS':'FAIL'} — ${claim} :: ${nums}`); };
const args=(s,i)=>{ const out=[]; let depth=0, j=i, st=i; for(;j<s.length;j++){ const c=s[j]; if(c==='('){ depth++; } else if(c===')'){ if(depth===0){ out.push(s.slice(st,j)); break; } depth--; } else if(c===','&&depth===0){ out.push(s.slice(st,j)); st=j+1; } } return out.map(x=>x.trim()); };

/* 1. every GLSL pow (a call not written Math.pow) takes a base that is non-negative by construction */
{ const SAFE=/^(max\(|abs\(|clamp\(|exp2?\(|2\.|10\.|vec3\(10|PHI\b|uPhi\b|0\.5\*\(1\.0\+|pow\(10)/; const bad=[]; let n=0;
  for(const m of SRC.matchAll(/(?<![.\w])pow\(/g)){ const a=args(SRC,m.index+4); if(a.length!==2) continue; n++; if(!SAFE.test(a[0])) bad.push(`${SRC.slice(0,m.index).split('\n').length}: pow(${a[0].slice(0,40)}, ${a[1].slice(0,12)})`); }
  /* mutation: the shell's Fresnel term as it was must be caught */
  const mut='float f=pow(1.0-abs(dot(normalize(vN),normalize(vV))),2.6);', mutBad=[...mut.matchAll(/(?<![.\w])pow\(/g)].some(m=>!SAFE.test(args(mut,m.index+4)[0]));
  check(n>70&&!bad.length&&mutBad,'every GLSL pow in the atlas has a base that cannot be negative — max(·, 0), abs(·) for even powers, max(·, 1e−6) for negative exponents, or a positive constant — so no fragment computes pow of a negative number, which Metal makes NaN',
    `${n} calls · ${bad.length?'unsafe: '+bad.slice(0,6).join(' | '):'none unsafe'} · the old Fresnel term would be ${mutBad?'caught':'MISSED'}`); }

/* 2. the inverse trigonometry and square roots that met a unit vector's component or a squared radius are guarded */
{ const ok=/asin\(clamp\(gz,-1\.0,1\.0\)\)/.test(SRC)&&!/asin\(gz\)/.test(SRC)&&(SRC.match(/inversesqrt\(max\(r2b,1e-12\)\)/g)||[]).length===2&&!/inversesqrt\(r2b\)/.test(SRC);
  check(ok,'asin of a unit vector’s component is clamped to [−1, 1], and the inverse square root of a squared radius is kept off zero',
    ok?'asin(clamp(gz, −1, 1)) · inversesqrt(max(r2b, 1e−12)) ×2':'guard missing'); }

/* 3. the finite-value pass stands between the scene and the bloom, and only there */
{ const eb=SRC.slice(SRC.indexOf('function ensureBloom(){'),SRC.indexOf('function bloomResize('));
  const iR=eb.indexOf('new RenderPass(scene,camera)'), iF=eb.indexOf('new ShaderPass(HCC_FINITE_SHADER)'), iB=eb.indexOf('new UnrealBloomPass(');
  check(iR>0&&iF>iR&&iB>iF&&(SRC.match(/new ShaderPass\(HCC_FINITE_SHADER\)/g)||[]).length===1,'the composer runs scene → finite-value pass → bloom → SMAA → output: no NaN or infinity reaches the bloom’s mip chain',
    `RenderPass @${iR} · finite pass @${iF} · UnrealBloomPass @${iB}`); }

/* 4. the pass's rule, evaluated here on the bit patterns it reads: NaN → 0 (alpha → 1), ±∞ → ±6·10⁴, the rest clamped to ±6·10⁴ */
{ const sh=SRC.slice(SRC.indexOf('const HCC_FINITE_SHADER='),SRC.indexOf('function ensureBloom(){'));
  const bits=x=>{ const b=new DataView(new ArrayBuffer(4)); b.setFloat32(0,x); return b.getUint32(0); };
  const fin=(x,z)=>{ const u=bits(x); if((u&0x7f800000)===0x7f800000) return (u&0x007fffff)!==0?z:(x>0?6e4:-6e4); return Math.max(-6e4,Math.min(6e4,x)); };
  const cases=[[NaN,0,0],[Infinity,0,6e4],[-Infinity,0,-6e4],[7e4,0,6e4],[1.5,0,1.5],[-0.25,0,-0.25],[NaN,1,1]], ok=cases.every(([x,z,w])=>Object.is(fin(x,z),w)||fin(x,z)===w);
  const glsl=/floatBitsToUint\(x\)/.test(sh)&&/\(u&0x7f800000u\)==0x7f800000u/.test(sh)&&/\(u&0x007fffffu\)!=0u\?z:\(x>0\.0\?6\.0e4:-6\.0e4\)/.test(sh)&&/clamp\(x,-6\.0e4,6\.0e4\)/.test(sh)&&/fin\(c\.a,1\.0\)/.test(sh);
  check(ok&&glsl,'the pass reads each channel by its bits — no fast-math compiler can fold that away — and maps NaN to 0 (alpha to 1), an infinity to the half-float ceiling, and clamps the rest; the same rule evaluated here on the cases',
    `${cases.length} cases · shader ${glsl?'as stated':'CHANGED'}`); }

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
