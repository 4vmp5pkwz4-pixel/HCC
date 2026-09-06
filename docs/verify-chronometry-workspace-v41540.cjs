#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert');
const INDEX='index.html';
const FRAG='scripts/fragments/v41540-chronometry-workspace.jsfrag';
const s=fs.readFileSync(INDEX,'utf8');
const f=fs.existsSync(FRAG)?fs.readFileSync(FRAG,'utf8'):'';
const all=s+'\n'+f;

assert.ok(fs.existsSync('core/labs/chronometry.source_locked.mjs'),'source-locked chronometry kernel missing');
assert.ok(fs.existsSync('docs/data/ancient-chronometry-sources.json'),'source registry missing');
assert.ok(fs.existsSync('docs/data/ancient-astronomy-benchmarks.json'),'astronomy benchmark registry missing');
assert.ok(all.includes("HCC_CHRONOMETRY_OBSERVATORY_SCHEMA='hcc.chronometry-observatory/1'"),'browser observatory missing');
assert.ok(all.includes("HCC_MULTIPHASE_WORKSPACE_SCHEMA='hcc.multiphase-workspace/2'"),'workspace persistence contract missing');
assert.ok(all.includes('hcc-multiphase-workspace-v2'),'workspace storage key missing');
assert.ok(/function\s+hccSaveMultiPhaseWorkspace\s*\(/.test(all),'workspace save missing');
assert.ok(/function\s+hccRestoreMultiPhaseWorkspace\s*\(/.test(all),'workspace restore missing');
assert.ok(/setAtlasEpoch\s*\(/.test(s),'AtlasTime gateway missing');
assert.ok(!/hccRestoreMultiPhaseWorkspace[\s\S]{0,2200}state\.epochDays\s*=/.test(all),'workspace restore must not rewind global epoch directly');
assert.ok(all.includes('data-chronometry-observatory'),'chronometry panel marker missing');
assert.ok(all.includes('SAME TERM · DIFFERENT DEFINITION'),'source-conflict view missing');
assert.ok(all.includes('JAIN CYCLE CLOSURE'),'Jain exact closure view missing');
assert.ok(all.includes('PENDING_EPOCH_CORRECTION'),'historical astronomy epistemic firewall missing');
assert.ok(/cycleCommensurability\s*\(/.test(s),'current Atlas commensurability authority missing');
assert.ok(all.includes('cycleCommensurability('),'chronometry must reuse current commensurability authority');
assert.ok(!/boundedRationalScan\s*\(/.test(f),'browser fragment must not introduce a second commensurability engine');
assert.ok(all.includes('quantity_identity_missing'),'anti-apophenia rejection reason must remain visible');
console.log('PASS — v4.154 chronometry observatory + Time-Fabric-safe multiphase workspace contract');
