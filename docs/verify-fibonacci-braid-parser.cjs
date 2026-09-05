#!/usr/bin/env node
'use strict';
const fs=require('fs');
const assert=require('assert/strict');
const src=fs.readFileSync('index.html','utf8');
const good=String.raw`String(word||'').trim().split(/[\s,]+/)`;
const bad=String.raw`String(word||'').trim().split(/[\\s,]+/)`;
assert.ok(src.includes(good),'Fibonacci braid parser must split on actual whitespace and commas');
assert.ok(!src.includes(bad),'double-escaped whitespace class must not survive materialization');
assert.ok(src.includes("[1,-1,2,-2].includes(token)"),'signed sigma_1/sigma_2 generators must remain explicitly bounded');
console.log('PASS — Fibonacci braid parser accepts whitespace/comma tokenization and keeps ±1/±2 domain guard');
