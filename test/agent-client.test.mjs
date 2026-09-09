import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createServer} from 'node:http';

test('static agent SDK exists',()=>assert.ok(fs.existsSync(new URL('../api/agent-client.mjs',import.meta.url))));

test('SDK reads the actual published files, searches, describes and computes without a browser',async t=>{
  const server=createServer((req,res)=>{
    const url=new URL(req.url,'http://test');
    const p=new URL('..'+url.pathname,import.meta.url);
    try {res.setHeader('content-type','application/json');res.end(fs.readFileSync(p));}
    catch {res.writeHead(404);res.end('{}');}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const {connectAtlas}=await import('../api/agent-client.mjs');
  const sdk=await connectAtlas(`http://127.0.0.1:${server.address().port}/`);
  assert.ok(sdk.discover().counts.instruments>100);
  assert.equal(sdk.search({query:'anyon'})[0].id,'anyon');
  assert.ok(sdk.describe('anyon').inputs.length);
  assert.throws(()=>sdk.describe('missing-id'),/Unknown instrument/);
  const x=sdk.describe('anyon');x.inputs.length=0;
  assert.ok(sdk.describe('anyon').inputs.length,'caller cannot corrupt internal catalogue');
  assert.ok(sdk.forecast('bht.M',.1).results.length>0);
  assert.equal(sdk.discover().access.public_http_compute,false);
});

test('SDK refuses mixed release data and HTTP failures',async t=>{
  let fail=false;
  const server=createServer((req,res)=>{
    if(fail){res.writeHead(503);res.end('{}');return;}
    res.setHeader('content-type','application/json');
    const data=req.url.endsWith('manifest.json')?{schema:'hcc.manifest/2',version:'old',build:'old',instruments:[]}:
      req.url.endsWith('reach.json')?{schema:'hcc.reach/1',version:'new',build:'new',chains:[]}:{version:'new',build:'new'};
    res.end(JSON.stringify(data));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  t.after(()=>new Promise(resolve=>server.close(resolve)));
  const {connectAtlas}=await import('../api/agent-client.mjs');
  const url=`http://127.0.0.1:${server.address().port}/`;
  await assert.rejects(()=>connectAtlas(url),/release mismatch/);
  fail=true;
  await assert.rejects(()=>connectAtlas(url),/HTTP 503/);
});
