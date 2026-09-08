/* The one test of the seven that needs a THREE implementation: the scene branches,
   their vertex bounds, buffer reuse across a playback step and disposal. It runs in
   the Computational core workflow, whose install step already names it ("the scene
   test dependency"), through docs/verify-galactic-butterfly-scene.cjs. */
import test from 'node:test';
import assert from 'node:assert/strict';
import * as b from '../core/cycles/galactic-butterfly.mjs';
import * as THREE from 'three';
import {createButterflyScene} from '../visual/galactic-butterfly.mjs';

test('five scene branches have bounded finite geometry, reuse buffers during playback, and release them', () => {
  const ephemeris=d=>({earth:[Math.cos(d/58),Math.sin(d/58),0],venus:[.72*Math.cos(d/35.7),.72*Math.sin(d/35.7),.02]});
  const scene=createButterflyScene({THREE,label:()=>new THREE.Object3D(),ephemeris});
  for(const view of ['sky','venus','solar','nebula','galaxy']){
    scene.update(view,0,{lang:'ru'});
    const count=scene.stats().rebuilds;
    assert.ok(scene.stats().vertices>100);
    assert.ok(scene.stats().vertices<18000);
    scene.group.traverse(o=>{if(o.geometry){for(const n of o.geometry.attributes.position.array)assert.ok(Number.isFinite(n));}});
    const before=[];scene.group.traverse(o=>{if(o.geometry)before.push(o.geometry);});
    scene.update(view,.1,{lang:'ru'});
    assert.equal(scene.stats().rebuilds,count);
    const after=[];scene.group.traverse(o=>{if(o.geometry)after.push(o.geometry);});
    assert.deepEqual(after,before);
  }
  let disposals=0;scene.group.traverse(o=>o.geometry?.addEventListener('dispose',()=>disposals++));
  scene.dispose();assert.ok(disposals>0);assert.equal(scene.stats().vertices,0);
});
