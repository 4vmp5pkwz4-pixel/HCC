#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const OLD_VERSION='4.154.0';
const OLD_BUILD='chronometry-workspace-2026.09.06.1';
const VERSION='4.155.0';
const BUILD='predictive-reach-observatory-2026.09.06.1';

let html=fs.readFileSync('index.html','utf8');
if(html.includes(`const HCC_VERSION='${VERSION}'`)&&html.includes(`const HCC_BUILD='${BUILD}'`)){
  console.log('release identity already materialized');
}else{
  if(!html.includes(`const HCC_VERSION='${OLD_VERSION}'`)||!html.includes(`const HCC_BUILD='${OLD_BUILD}'`))
    throw new Error('expected v4.154.0 release identity not found');
  html=html.split(OLD_VERSION).join(VERSION).split(OLD_BUILD).join(BUILD);
  if(html.includes(`const HCC_VERSION='${OLD_VERSION}'`)||html.includes(`const HCC_BUILD='${OLD_BUILD}'`))
    throw new Error('old primary release identity remains in index');
  fs.writeFileSync('index.html',html);
}
const v=JSON.parse(fs.readFileSync('version.json','utf8'));
v.version=VERSION;
v.build=BUILD;
v.note="Served with cache: 'no-store' by the freshness sentinel in index.html. v4.155 adds the fail-closed Predictive Reach Observatory over measured sensitivity, transfer and reach chains, with explicit numerical-control semantics and read-only intervention forecasts; generated machine-facing artifacts are rebuilt from this exact release tree.";
fs.writeFileSync('version.json',JSON.stringify(v,null,2)+'\n');
console.log('release identity: v'+VERSION+' · '+BUILD);
