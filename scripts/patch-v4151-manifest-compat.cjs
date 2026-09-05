#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path='scripts/build-manifest.mjs';
let s=fs.readFileSync(path,'utf8');
const MARK='hcc.first-principles manifest compatibility: legacy instrument parameter shape preserved';
if(s.includes(MARK)){
  console.log('manifest compatibility layer already present');
  process.exit(0);
}

const expanded=`params: schema.map(s => ({ id: s.id, label: s.label || null,
        min: (s.domain && s.domain.min !== undefined) ? s.domain.min : null,
        max: (s.domain && s.domain.max !== undefined) ? s.domain.max : null,
        symbol: s.symbol || null, role: s.role || null,
        quantity_kind: s.quantity_kind || s.quantityKind || null,
        unit: s.unit || s.units || null,
        dimensional_signature: s.dimensional_signature || s.dimension || null,
        source_status: s.source_status || s.status || null })) }`;

const split=`params: schema.map(s => ({ id: s.id, label: s.label || null,
        min: (s.domain && s.domain.min !== undefined) ? s.domain.min : null,
        max: (s.domain && s.domain.max !== undefined) ? s.domain.max : null })),
      /* ${MARK}.  Rich semantics travel only in fp_params, so the long-lived
         instrument fingerprint remains a checksum of the pre-existing public contract. */
      fp_params: schema.map(s => ({ id: s.id, label: s.label || null,
        min: (s.domain && s.domain.min !== undefined) ? s.domain.min : null,
        max: (s.domain && s.domain.max !== undefined) ? s.domain.max : null,
        symbol: s.symbol || null, role: s.role || null,
        quantity_kind: s.quantity_kind || s.quantityKind || null,
        unit: s.unit || s.units || null,
        dimensional_signature: s.dimensional_signature || s.dimension || null,
        source_status: s.source_status || s.status || null })) }`;

if(!s.includes(expanded)) throw new Error('expanded first-principles parameter mapping not found; core patch did not produce the expected builder shape');
s=s.replace(expanded,split);

const oldCall='first_principles: measuredFirstPrinciples(L, row.params) });';
const newCall='first_principles: measuredFirstPrinciples(L, row.fp_params || row.params) });';
if(!s.includes(oldCall)) throw new Error('first-principles manifest callsite not found');
s=s.replace(oldCall,newCall);

fs.writeFileSync(path,s);
console.log('preserved legacy instrument parameter shape while retaining rich first-principles metadata');
