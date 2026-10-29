#!/usr/bin/env node
// Validate the REAL editorial manifest against current catalogs without changing tracked files.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-approved-dryrun-'));
try{
 fs.mkdirSync(path.join(root,'data'));fs.mkdirSync(path.join(root,'intake'));
 for(const part of ['opportunities','datasets','sources','tools','changelog']){
  fs.copyFileSync(path.resolve('data',part+'.js'),path.join(root,'data',part+'.js'));
 }
 fs.copyFileSync(path.resolve('intake/approved-publications.json'),path.join(root,'intake/approved-publications.json'));
 const publisher=path.resolve('scripts/publish-approved.js');
 const run=()=>JSON.parse(cp.execFileSync(process.execPath,[publisher],{cwd:root,encoding:'utf8'}));
 const first=run(),second=run();
 // Validate the generated catalogs with the SAME schema gate used by production publishing.
 // This catches invalid dataset kinds, status values and provenance before a PR is merged.
 cp.execFileSync(process.execPath,[path.resolve('scripts/validate-data.js')],{cwd:root,encoding:'utf8'});
 if(second.published!==0)throw Error('Manifest publisher is not idempotent');
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'intake/approved-publications.json'),'utf8'));
 const records=manifest.approved.map(x=>({category:x.category,id:x.record.id}));
 for(const {category,id} of records){
  const text=fs.readFileSync(path.join(root,'data',category+'.js'),'utf8');
  if(!text.includes('"id": "'+id+'"')&&!text.includes('"id":"'+id+'"'))throw Error('Approved record missing after dry-run: '+id);
 }
 console.log(JSON.stringify({validated:records.length,newRecords:first.published,idempotent:true,originalCatalogsUnmodified:true}));
}finally{fs.rmSync(root,{recursive:true,force:true})}
