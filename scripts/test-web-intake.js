#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),os=require('node:os'),path=require('node:path');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-web-'));
try{
 const input=path.join(tmp,'candidates.json'),output=path.join(tmp,'web.json');
 fs.writeFileSync(input,JSON.stringify({leads:[
  {url:'https://example.org/2025-call',title:'Historical call',category:'opportunities',classification:'historical-reference'},
  {url:'https://example.org/2026-call',title:'Current lead',category:'opportunities',classification:'needs-editorial-review'},
  {url:'https://example.org/home',title:'Homepage',category:'uncategorized',classification:'source-homepage-only'}
 ]}));
 cp.execFileSync(process.execPath,['scripts/collect-web-leads.js',input,output],{stdio:'pipe'});
 const data=JSON.parse(fs.readFileSync(output,'utf8'));
 assert.equal(data.source,'web');assert.equal(data.leads.length,2);
 assert(data.leads.some(x=>x.title==='Historical call'));
 // Regression guards for the provider-provenance pipeline.
 const unify=fs.readFileSync('scripts/unify-discovery.js','utf8');
 assert(unify.includes('item.sourceName'), 'Unified intake must retain source provider');
 const sampleScript=fs.readFileSync('scripts/sample-editorial-review.js','utf8');
 assert(sampleScript.includes('item.providers'), 'Editorial sample must rotate by provider');
 assert(sampleScript.includes('sourceDistribution'), 'Editorial sample must report source mix');
 const qualityScript=fs.readFileSync('scripts/quality-gate-discovery.js','utf8');
 assert(qualityScript.includes('providers:item.providers'), 'Quality gate must propagate providers');
 console.log('Web intake and provider provenance regression passed');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
