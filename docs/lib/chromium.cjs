'use strict';
// One place where the browser verifiers find a browser.
//
// Playwright refuses to start when the browser build it was compiled against is
// not the one installed. That is the right default: a silent substitution would
// let a check pass against a browser nobody chose. But a container that ships a
// newer Chromium than the pinned Playwright expects is not a broken container —
// it is a different, still-real browser, and refusing it turns two verifiers
// into permanent skips. A skip that is never announced is worse than a
// substitution that is.
//
// So: try the pinned build first. If it is absent, look for a real Chromium on
// disk, use it, and SAY SO on stdout — the run records which browser answered.
// If neither exists, throw. Nothing here silences a failure.
const fs=require('fs');
const path=require('path');

function candidates(){
  const out=[];
  if(process.env.HCC_CHROMIUM) out.push(process.env.HCC_CHROMIUM);
  const root=process.env.PLAYWRIGHT_BROWSERS_PATH;
  if(root&&fs.existsSync(root)){
    let dirs=[];
    try{dirs=fs.readdirSync(root);}catch(e){dirs=[];}
    // newest build number first, full chromium before headless shell
    const rank=n=>(/^chromium-/.test(n)?2:/^chromium_headless_shell-/.test(n)?1:0);
    dirs.filter(rank).sort((a,b)=>{
      const r=rank(b)-rank(a); if(r) return r;
      return (parseInt(b.split('-').pop(),10)||0)-(parseInt(a.split('-').pop(),10)||0);
    }).forEach(d=>{
      out.push(path.join(root,d,'chrome-linux','chrome'));
      out.push(path.join(root,d,'chrome-linux','headless_shell'));
    });
    out.push(path.join(root,'chromium'));
  }
  return out;
}

function found(){
  for(const c of candidates()){
    try{ if(fs.statSync(fs.realpathSync(c)).isFile()) return fs.realpathSync(c); }catch(e){}
  }
  return null;
}

// Launch Chromium, preferring the build Playwright was pinned to.
async function launchChromium(chromium,opts){
  const options=Object.assign({headless:true},opts||{});
  try{
    return await chromium.launch(options);
  }catch(err){
    const missing=/Executable doesn't exist|please run the following command to download/i.test(String(err&&err.message));
    if(!missing) throw err;
    const exe=found();
    if(!exe) throw err;
    console.log(`note — pinned Chromium build absent; using ${exe}`);
    return await chromium.launch(Object.assign({},options,{executablePath:exe}));
  }
}

module.exports={launchChromium};
