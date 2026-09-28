import { CORE, LABS } from '../core/index.mjs';
import { CORE_VERSION } from '../core/version.mjs';
import { createPhaseTools } from './phase-tools.mjs';

const ENTRY=process.argv[1]||'';
const IS_ENTRY=ENTRY.endsWith('/server/server.mjs')||ENTRY.endsWith('\\server\\server.mjs');
if(IS_ENTRY) process.argv[1]=ENTRY+'.loading-base';
const base=await import('./base-server.mjs');
if(IS_ENTRY) process.argv[1]=ENTRY;

const phaseTools=createPhaseTools(CORE.phase);
base.TOOLS.push(...phaseTools);
export const TOOLS=base.TOOLS;
export const server=base.server;
export const shutdown=base.shutdown;
export const PHASE_MCP_TOOLS=Object.freeze(phaseTools.map(t=>t.name));
const TOOL=new Map(TOOLS.map(t=>[t.name,t]));

const json=(res,code,body,extra={})=>{const s=JSON.stringify(body,null,2);res.writeHead(code,{
  'content-type':'application/json; charset=utf-8','access-control-allow-origin':'*','access-control-allow-headers':'*',
  'access-control-expose-headers':'deprecation, sunset, link, mcp-session-id','access-control-allow-methods':'GET,POST,DELETE,OPTIONS',
  'content-length':Buffer.byteLength(s),...extra});res.end(s);};
const errBody=e=>({error:{code:e.code||'ERROR',message:e.message,detail:e.detail||null}});
const httpCodeFor=e=>e.code==='NOT_IMPLEMENTED'?501:e.code==='NOT_FOUND'?404:e.code==='BUSY'?429:422;
async function readBody(req){const chunks=[];for await(const c of req)chunks.push(c);if(!chunks.length)return{};try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch{throw Object.assign(new Error('request body is not valid JSON'),{code:'BAD_REQUEST'});}}

const original=server.listeners('request')[0];
server.removeAllListeners('request');
server.on('request',async(req,res)=>{
  const path=new URL(req.url,'http://x').pathname;
  if(req.method==='OPTIONS'&&(path==='/mcp'||path==='/mcp/call')) return json(res,204,{});
  if(path==='/mcp'){
    if(req.method==='GET') return json(res,405,{jsonrpc:'2.0',id:null,error:{code:-32601,message:'this server opens no server-initiated SSE stream; POST JSON-RPC to /mcp'}});
    if(req.method!=='POST') return json(res,405,errBody({code:'METHOD_NOT_ALLOWED',message:req.method}));
    let body;try{body=await readBody(req);}catch{return json(res,400,{jsonrpc:'2.0',id:null,error:{code:-32700,message:'parse error'}});}
    const batch=Array.isArray(body), msgs=batch?body:[body], out=[];
    for(const msg of msgs){
      const {id=null,method,params={}}=msg||{};
      const ok=result=>({jsonrpc:'2.0',id,result});
      const err=(code,message,data)=>({jsonrpc:'2.0',id,error:{code,message,...(data?{data}:{})}});
      if(method==='notifications/initialized') continue;
      if(method==='initialize'){out.push(ok({protocolVersion:params.protocolVersion||'2025-06-18',capabilities:{tools:{listChanged:false}},serverInfo:{name:'hcc-core',version:CORE_VERSION},instructions:'Every result carries provenance, units, assumptions and validity-domain status. Phase-space candidate bridges are noncanonical; ill-posed phase requests remain explicit REFUSED results.'}));continue;}
      if(method==='ping'){out.push(ok({}));continue;}
      if(method==='tools/list'){out.push(ok({tools:TOOLS.map(t=>({name:t.name,description:t.description,inputSchema:t.inputSchema}))}));continue;}
      if(method==='tools/call'){
        const t=TOOL.get(params.name);
        if(!t){out.push(err(-32602,`no MCP tool "${params.name}"`,{available:TOOLS.map(x=>x.name)}));continue;}
        try{const value=t.call(params.arguments||{});out.push(ok({content:[{type:'text',text:JSON.stringify(value,null,2)}],structuredContent:value,isError:false}));}
        catch(e){const value=errBody(e);out.push(ok({content:[{type:'text',text:JSON.stringify(value,null,2)}],structuredContent:value,isError:true}));}
        continue;
      }
      out.push(err(-32601,`unknown method "${method}"`));
    }
    if(!out.length){res.writeHead(202,{'access-control-allow-origin':'*'});return res.end();}
    const accept=String(req.headers.accept||'');
    if(/text\/event-stream/.test(accept)&&!/application\/json/.test(accept)){
      res.writeHead(200,{'content-type':'text/event-stream','cache-control':'no-cache',connection:'keep-alive','access-control-allow-origin':'*'});
      for(const r of out)res.write(`data: ${JSON.stringify(r)}\n\n`);return res.end();
    }
    return json(res,200,batch?out:out[0]);
  }
  if(path==='/mcp/call'&&req.method==='POST'){
    let body;try{body=await readBody(req);}catch(e){return json(res,400,errBody(e));}
    const t=TOOL.get(body.tool),dep={deprecation:'true',link:'</mcp>; rel="successor-version"',warning:'299 - "POST /mcp/call is superseded by JSON-RPC 2.0 at POST /mcp"'};
    if(!t)return json(res,400,errBody({code:'UNKNOWN_TOOL',message:`no MCP tool "${body.tool}"`,detail:{available:TOOLS.map(x=>x.name)}}),dep);
    try{return json(res,200,t.call(body.arguments||{}),dep);}catch(e){return json(res,httpCodeFor(e),errBody(e),dep);}
  }
  return original(req,res);
});

if(IS_ENTRY) server.listen(Number(process.env.PORT||8974),()=>console.log(`HCC compute service on http://127.0.0.1:${Number(process.env.PORT||8974)} · ${LABS.size} laboratories · ${TOOLS.length} MCP tools`));
