#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const assert = require('node:assert/strict');
const src = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');

// A 256x256 float-texture N-body simulation (65,536 points, velocity + position
// ping-pong passes) must never be an unavoidable cost of opening Solar.  The
// feature remains available from the Solar checkbox, but a driver gets a quiet
// first frame unless the reader explicitly enables it.
assert.match(src, /epochDays:[^\n]{0,180}\bastOn:false\b/,
  'Solar GPU N-body swarm must default OFF (opt-in), not allocate on first Solar frame');

const update = src.match(/function updateAsteroids\(T,geoShift\)\{([\s\S]{0,1800}?)\n\}/);
assert.ok(update, 'updateAsteroids() was not found');
const body = update[1];
const guard = body.indexOf('if(state.astOn===false)');
const init = body.indexOf('astInit(T)');
assert.ok(guard >= 0 && init >= 0 && guard < init,
  'astOn=false must return before astInit(T), so no N-body render targets are allocated');

assert.match(src, /id=\\?"astOn\\?"|id="astOn"/,
  'Solar panel must retain the asteroid-swarm opt-in checkbox');

console.log('PASS — Solar N-body GPU swarm is opt-in and its OFF path precedes GPU allocation');
