#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-unified-'));
try{
 const same='https://example.org/call?utm_source=newsletter';
 for(const [source,url] of [['web','https://example.org/call'],['gmail',same],['linkedin','https://example.org/call#post']]){
  fs.writeFileSync(path.join(tmp,source+'.json'),JSON.stringify({source,leads:[{url,title:'Fixture',category:'opportunities'}]}));
 }
 const files=['web','gmail','linkedin'].map(x=>path.join(tmp,x+'.json'));
 cp.execFileSync(process.execPath,['scripts/unify-discovery.js',...files],{cwd:process.cwd(),stdio:'pipe'});
 const out=JSON.parse(fs.readFileSync('intake/unified-discovery.json','utf8'));
 assert.equal(out.candidates.length,1);
 for(const source of ['web','gmail','linkedin']){assert.equal(out.sourceHealth[source].files,1);assert.equal(out.sourceHealth[source].leads,1)}
 assert.deepEqual(out.candidates[0].origins,['web','gmail','linkedin']);
 assert.equal(out.candidates[0].publicationReady,false);
 assert.equal(out.candidates[0].classification,'needs-editorial-review');
 console.log('Unified intake regression passed');
}finally{
 fs.rmSync(tmp,{recursive:true,force:true});
 fs.rmSync('intake/unified-discovery.json',{force:true});
}
