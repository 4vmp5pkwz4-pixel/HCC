#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const seamMatch = source.match(/const ATLAS_SCALE_SEAM=Object\.freeze\(\{outGly:([\d.]+),inGly:([\d.]+),cooldown:([\d.]+)\}\)/);
assert(seamMatch, 'the shared Solar/Observable scale seam is missing');

const [, outwardRaw, inwardRaw, cooldownRaw] = seamMatch;
const outward = Number(outwardRaw);
const inward = Number(inwardRaw);
const cooldown = Number(cooldownRaw);

assert(Number.isFinite(outward) && Number.isFinite(inward));
assert(inward > 0 && inward < outward, 'the inward gate must form a positive hysteresis band below the outward gate');
assert(outward / inward < 2, 'the two sides of one scale seam must overlap locally, not be separated by orders of magnitude');
assert(cooldown > 0 && cooldown < 0.75, 'the anti-bounce pause must be short enough not to interrupt a reversed zoom gesture');

assert.match(source, /d>ATLAS_SCALE_SEAM\.outGly\*GLY_AU/,
  'the outward hand-off must use the shared seam');
assert.match(source, /dObs<ATLAS_SCALE_SEAM\.inGly/,
  'the return hand-off must use the shared seam');
assert.match(source, /camera\.position\.copy\(dir\)\.multiplyScalar\(d\/GLY_AU\)/,
  'Solar AU must map to Observable Gly without changing radius or direction');
assert.match(source, /camera\.position\.copy\(dir\.multiplyScalar\(dObs\*GLY_AU\)\)/,
  'Observable Gly must map back to Solar AU without clamping or changing direction');

console.log(`PASS — continuous round trip at the Solar/Observable seam (${inward}–${outward} Gly, ${cooldown}s anti-bounce)`);
