/* HCC Multiphase Solver
   Pure deterministic kernel. No DOM, renderer or Atlas state access.
   Periodic constraints are dimensionless phases in [0,1); phaseAt constraints
   may wrap any existing ephemeris kernel without creating a second clock. */

export function wrap01(x){
  if(!Number.isFinite(x)) return NaN;
  const r=x%1;
  return r<0?r+1:r;
}

export function circularPhaseDelta(actual,target){
  if(!Number.isFinite(actual)||!Number.isFinite(target)) return NaN;
  return wrap01(actual-target+0.5)-0.5;
}

function finiteRange(c){
  if(!Array.isArray(c?.validRange)||c.validRange.length!==2) return null;
  const a=Number(c.validRange[0]), b=Number(c.validRange[1]);
  return Number.isFinite(a)&&Number.isFinite(b)?[Math.min(a,b),Math.max(a,b)]:null;
}

function phaseOf(epochDays,c){
  if(typeof c.phaseAt==='function') return wrap01(Number(c.phaseAt(epochDays)));
  const p=Number(c.periodDays);
  if(!(p>0)||!Number.isFinite(p)) return NaN;
  const ref=Number.isFinite(Number(c.refDays))?Number(c.refDays):0;
  // Divide only after subtracting the reference. wrap01 reduces before any
  // downstream trigonometry; the solver itself never evaluates trig functions.
  return wrap01((epochDays-ref)/p);
}

export function evaluateMultiPhase(epochDays,constraints=[]){
  const epoch=Number(epochDays);
  const list=Array.isArray(constraints)?constraints:[];
  if(!Number.isFinite(epoch)) throw new TypeError('epochDays must be finite');
  if(!list.length) return {
    status:'NO_CONSTRAINTS',epochDays:epoch,residuals:[],weightedRms:Infinity,
    worstResidual:Infinity,withinTolerance:false,modelLimited:false
  };

  const limited=list.filter(c=>{
    const r=finiteRange(c);
    return r&&(epoch<r[0]||epoch>r[1]);
  });
  if(limited.length){
    return {
      status:'MODEL_LIMITED',epochDays:epoch,residuals:[],weightedRms:Infinity,
      worstResidual:Infinity,withinTolerance:false,modelLimited:true,
      limited:limited.map(c=>c.id||'constraint')
    };
  }

  const residuals=[];
  let weightedSq=0, weightSum=0, worst=0, within=true;
  for(const c of list){
    const actualPhase=phaseOf(epoch,c);
    if(!Number.isFinite(actualPhase)){
      residuals.push({id:c.id||'constraint',status:'INVALID',actualPhase:NaN,targetPhase:NaN,residual:Infinity});
      within=false; worst=Infinity; continue;
    }
    const targetPhase=wrap01(Number.isFinite(Number(c.targetPhase))?Number(c.targetPhase):0);
    const residual=circularPhaseDelta(actualPhase,targetPhase);
    const abs=Math.abs(residual);
    const tolerance=Math.max(0,Number.isFinite(Number(c.tolerance))?Number(c.tolerance):0.01);
    const weight=Math.max(0,Number.isFinite(Number(c.weight))?Number(c.weight):1);
    const ok=abs<=tolerance;
    residuals.push({
      id:c.id||'constraint',actualPhase,targetPhase,residual,absoluteResidual:abs,
      tolerance,weight,withinTolerance:ok
    });
    weightedSq+=weight*residual*residual;
    weightSum+=weight;
    worst=Math.max(worst,abs);
    within=within&&ok;
  }
  const weightedRms=weightSum>0?Math.sqrt(weightedSq/weightSum):worst;
  return {
    status:within?'MATCH':'APPROXIMATE',epochDays:epoch,residuals,weightedRms,
    worstResidual:worst,withinTolerance:within,modelLimited:false
  };
}

function objective(epoch,constraints){
  const e=evaluateMultiPhase(epoch,constraints);
  return Number.isFinite(e.weightedRms)?e.weightedRms:Infinity;
}

function addPeriodicTargets(set,c,lo,hi,max=8192){
  if(typeof c.phaseAt==='function') return;
  const p=Number(c.periodDays);
  if(!(p>0)||!Number.isFinite(p)) return;
  const ref=Number.isFinite(Number(c.refDays))?Number(c.refDays):0;
  const target=wrap01(Number.isFinite(Number(c.targetPhase))?Number(c.targetPhase):0);
  let k0=Math.ceil((lo-ref)/p-target-1e-12);
  let k1=Math.floor((hi-ref)/p-target+1e-12);
  if(k1<k0) return;
  const count=k1-k0+1;
  if(count<=max){
    for(let k=k0;k<=k1;k++) set.add(ref+p*(k+target));
    return;
  }
  // For extremely short periods over huge windows, preserve endpoints and a
  // deterministic spread without allocating millions of candidates.
  const stride=Math.max(1,Math.ceil(count/max));
  for(let k=k0;k<=k1;k+=stride) set.add(ref+p*(k+target));
  set.add(ref+p*(k1+target));
}

function refineBracket(center,halfWidth,lo,hi,constraints,steps){
  let a=Math.max(lo,center-halfWidth), b=Math.min(hi,center+halfWidth);
  if(!(b>a)) return center;
  // Golden-section minimisation is deterministic and never assumes a derivative.
  const phi=(Math.sqrt(5)-1)/2;
  let c=b-phi*(b-a), d=a+phi*(b-a);
  let fc=objective(c,constraints), fd=objective(d,constraints);
  for(let i=0;i<steps;i++){
    if(fc<=fd){ b=d; d=c; fd=fc; c=b-phi*(b-a); fc=objective(c,constraints); }
    else { a=c; c=d; fc=fd; d=a+phi*(b-a); fd=objective(d,constraints); }
  }
  const x=(a+b)/2;
  return objective(center,constraints)<=objective(x,constraints)?center:x;
}

export function searchMultiPhase(options={}){
  const epoch=Number(options.epochDays);
  const constraints=Array.isArray(options.constraints)?options.constraints:[];
  if(!Number.isFinite(epoch)) throw new TypeError('epochDays must be finite');
  if(!constraints.length) return {...evaluateMultiPhase(epoch,constraints),direction:options.direction||'nearest'};

  const direction=['previous','next','nearest'].includes(options.direction)?options.direction:'nearest';
  const window=Math.abs(Number.isFinite(Number(options.windowDays))?Number(options.windowDays):365.2425*20);
  const samples=Math.max(32,Math.min(16384,Math.trunc(Number(options.samples)||768)));
  const refineSteps=Math.max(0,Math.min(96,Math.trunc(Number(options.refineSteps)||32)));
  const strictEps=Math.max(1e-9,window*1e-12,Math.abs(epoch)*Number.EPSILON*8);
  let lo=direction==='next'?epoch+strictEps:epoch-window;
  let hi=direction==='previous'?epoch-strictEps:epoch+window;

  for(const c of constraints){
    const r=finiteRange(c);
    if(r){ lo=Math.max(lo,r[0]); hi=Math.min(hi,r[1]); }
  }
  if(!(hi>=lo)) return {
    status:'NO_VALID_WINDOW',epochDays:epoch,direction,residuals:[],weightedRms:Infinity,
    worstResidual:Infinity,withinTolerance:false,modelLimited:true,searchRange:[lo,hi]
  };

  const candidates=new Set([lo,hi]);
  const span=hi-lo;
  if(span===0) candidates.add(lo);
  else for(let i=0;i<=samples;i++) candidates.add(lo+span*i/samples);
  for(const c of constraints) addPeriodicTargets(candidates,c,lo,hi);

  const ranked=[];
  for(const x of candidates){
    if(!Number.isFinite(x)||x<lo||x>hi) continue;
    const score=objective(x,constraints);
    if(Number.isFinite(score)) ranked.push({x,score});
  }
  if(!ranked.length) return {
    status:'NO_VALID_WINDOW',epochDays:epoch,direction,residuals:[],weightedRms:Infinity,
    worstResidual:Infinity,withinTolerance:false,modelLimited:true,searchRange:[lo,hi]
  };
  ranked.sort((a,b)=>a.score-b.score||Math.abs(a.x-epoch)-Math.abs(b.x-epoch)||a.x-b.x);

  const gridHalf=span>0?span/samples:0;
  let best=ranked[0];
  const refineCount=Math.min(12,ranked.length);
  for(let i=0;i<refineCount;i++){
    const seed=ranked[i];
    const x=refineSteps?refineBracket(seed.x,gridHalf,lo,hi,constraints,refineSteps):seed.x;
    const score=objective(x,constraints);
    const d0=Math.abs(x-epoch), d1=Math.abs(best.x-epoch);
    if(score<best.score-1e-15||(Math.abs(score-best.score)<=1e-15&&(d0<d1-1e-12||(Math.abs(d0-d1)<=1e-12&&x<best.x)))) best={x,score};
  }

  const result=evaluateMultiPhase(best.x,constraints);
  return {...result,direction,searchRange:[lo,hi],samples,candidatesEvaluated:ranked.length};
}
