#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const OLD_VERSION='4.153.0';
const OLD_BUILD='multiphase-solar-control-2026.09.06.1';
const VERSION='4.154.0';
const BUILD='chronometry-workspace-2026.09.06.1';

let html=fs.readFileSync('index.html','utf8');
if(html.includes(VERSION)&&html.includes(BUILD)){
  console.log('release identity already materialized');
}else{
  if(!html.includes(OLD_VERSION)||!html.includes(OLD_BUILD))
    throw new Error('expected v4.153.0 release identity not found');
  html=html.split(OLD_VERSION).join(VERSION).split(OLD_BUILD).join(BUILD);
  if(html.includes(OLD_VERSION)||html.includes(OLD_BUILD)) throw new Error('old release identity remains in index');
  fs.writeFileSync('index.html',html);
}
const v=JSON.parse(fs.readFileSync('version.json','utf8'));
v.version=VERSION;
v.build=BUILD;
v.note="Served with cache: 'no-store' by the freshness sentinel in index.html. v4.154 adds the source-locked Ancient Chronometry Observatory and Time-Fabric-safe persistent multiphase workspace; generated machine-facing artifacts are rebuilt from this exact release tree.";
fs.writeFileSync('version.json',JSON.stringify(v,null,2)+'\n');
console.log('release identity: v'+VERSION+' · '+BUILD);
