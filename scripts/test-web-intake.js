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
 // Functional end-to-end regression in an isolated working directory.
 const work=path.join(tmp,'work');fs.mkdirSync(path.join(work,'scripts'),{recursive:true});fs.mkdirSync(path.join(work,'intake'),{recursive:true});fs.mkdirSync(path.join(work,'data'),{recursive:true});
 for(const name of ['unify-discovery.js','lead-identity.js','quality-gate-discovery.js','sample-editorial-review.js','export-editorial-review.js'])fs.copyFileSync(path.join('scripts',name),path.join(work,'scripts',name));
 for(const name of ['opportunities.js','datasets.js','tools.js'])fs.copyFileSync(path.join('data',name),path.join(work,'data',name));
 const leads=[
  {url:'https://example.org/a',title:'Research dataset A',sourceName:'Feed A'},
  {url:'https://example.org/b',title:'Research dataset B',sourceName:'Feed A'},
  {url:'https://example.org/c',title:'Research dataset C',sourceName:'Feed B'}
 ];
 fs.writeFileSync(path.join(work,'intake','test.json'),JSON.stringify({source:'web',leads}));
 const run=(script,...args)=>cp.execFileSync(process.execPath,['scripts/'+script,...args],{cwd:work,stdio:'pipe'});
 run('unify-discovery.js','intake/test.json');
 const unified=JSON.parse(fs.readFileSync(path.join(work,'intake','unified-discovery.json')));
 assert.equal(unified.candidates.length,3);
 assert(unified.candidates.some(x=>x.providers?.includes('Feed B')));
 run('quality-gate-discovery.js');
 const quality=JSON.parse(fs.readFileSync(path.join(work,'intake','discovery-quality.json')));
 assert(quality.review.some(x=>x.providers?.includes('Feed B')));
 run('sample-editorial-review.js');run('export-editorial-review.js');
 const sample=JSON.parse(fs.readFileSync(path.join(work,'intake','editorial-review-sample.json')));
 assert.equal(sample.selected.length,3);
 assert.equal(sample.sourceDistribution['Feed A'],2);
 assert.equal(sample.sourceDistribution['Feed B'],1);
 assert.notEqual(sample.selected[0].providers[0],sample.selected[1].providers[0],'Round-robin must alternate providers before repeating one');
 const md=fs.readFileSync(path.join(work,'intake','editorial-review.md'),'utf8');
 assert(md.includes('Feed A: 2')&&md.includes('Feed B: 1'));
 assert(sample.selected.every(x=>x.verified===false&&x.publicationReady===false));
 console.log('Web intake and provider provenance regression passed');
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
