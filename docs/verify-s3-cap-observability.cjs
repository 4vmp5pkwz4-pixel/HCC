#!/usr/bin/env node
/* CI-friendly standalone regression gate; no browser, no external packages. */
(async () => {
const { default: lab } = await import('../core/labs/s3.cap_observability.mjs');
const v=lab.validate({},{provenance:{commit:'verify',code_sha256:'verify'}});
for(const c of v.checks) console.log((c.pass?'PASS ':'FAIL ')+c.name+' — '+c.detail);
if(!v.all_pass) process.exitCode=1;
console.log('S3 CAP SELFTEST:',v.passed+'/'+v.total);

})().catch(e => { console.error(e); process.exitCode=1; });
