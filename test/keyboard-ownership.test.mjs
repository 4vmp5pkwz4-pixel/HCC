import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const section=(start,end)=>source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)));
function harness({tag='BODY',editable=false,modal=false}={}){
 const handlers={},calls=[],active={tagName:tag,isContentEditable:editable,closest:()=>/INPUT|TEXTAREA|SELECT|BUTTON/.test(tag)||editable?{}:null};
 const context={document:{activeElement:active,querySelector:()=>modal?{}:null,body:{classList:{contains:()=>false}},fullscreenElement:null},
  addEventListener:(name,fn)=>(handlers[name]??=[]).push(fn),HCC_FLY:{on:false,keys:new Set()},
  setFreeFly:on=>{context.HCC_FLY.on=on;calls.push('flight');},labBarStep:()=>calls.push('lab'),toggleFS:()=>calls.push('fullscreen'),toggleZen:()=>calls.push('zen'),
  WORLD_REGISTRY:[{id:'solar'}],setMode:()=>calls.push('world'),togglePanel:()=>calls.push('panel'),state:{mode:'solar'},selectedKey:null,
  HELP:{toggle:()=>calls.push('help'),isOpen:()=>false},CMDK:{open:()=>calls.push('search'),isOpen:()=>false}};
 const helper=source.includes('function hccKeyboardOwnedByUI(')?section('function hccKeyboardOwnedByUI(',"addEventListener('keydown', e=>{"):'';
 runInNewContext(helper+section("addEventListener('keydown', e=>{\n  if(e.metaKey",'let _lastCamDist=NaN;')+
  section("addEventListener('keydown',e=>{\n  if(e.defaultPrevented",'// === MODULE: Command Palette')+
  section("addEventListener('keydown', e=>{\n  if((e.key==='f'",'{ // zen bar wiring'),context);
 return {calls,context,press(key,extra={}){const e={key,target:active,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...extra};for(const h of handlers.keydown)h(e);return e;}};
}
test('F owns only flight; Shift+F owns only fullscreen',()=>{const h=harness();h.press('f');assert.deepEqual(h.calls,['flight']);h.calls.length=0;h.press('F',{shiftKey:true});assert.deepEqual(h.calls,['fullscreen']);});
test('held toggle keys do not retrigger transitions',()=>{const h=harness();h.press('f',{repeat:true});h.press('F',{shiftKey:true,repeat:true});h.press('1',{repeat:true});assert.deepEqual(h.calls,[]);});
test('browser shortcuts and consumed/composing events never reach the scene',()=>{for(const props of [{ctrlKey:true},{metaKey:true},{altKey:true},{defaultPrevented:true},{isComposing:true}]){const h=harness();h.press('f',props);assert.deepEqual(h.calls,[],JSON.stringify(props));}});
test('inputs, buttons, editable text and modals retain keyboard ownership',()=>{for(const opts of [{tag:'INPUT'},{tag:'BUTTON'},{editable:true},{modal:true}]){const h=harness(opts);h.press('f');h.press('1');h.press(']');assert.deepEqual(h.calls,[],JSON.stringify(opts));}});
test('normal scene navigation and held movement still work',()=>{const h=harness();h.press('1');h.press(']');assert.deepEqual(h.calls,['world','lab']);h.context.HCC_FLY.on=true;h.press('w',{repeat:true});assert.ok(h.context.HCC_FLY.keys.has('w'));});
test('First-Principles Escape is consumed before reaching background panels',()=>{
 let close=0,listener;
 runInNewContext(section("  lens.addEventListener('keydown',",'\n'),{lens:{addEventListener:(_,fn)=>listener=fn},hccFpCloseLens:()=>close++});
 const e={key:'Escape',defaultPrevented:false,stopped:false,preventDefault(){this.defaultPrevented=true;},stopPropagation(){this.stopped=true;}};
 listener(e);assert.equal(close,1);assert.equal(e.defaultPrevented,true);assert.equal(e.stopped,true);
});
