#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');

function filterRejected(manifestPath,baseDir=process.cwd()){
 const absolute=path.resolve(baseDir,manifestPath),manifest=JSON.parse(fs.readFileSync(absolute,'utf8'));
 if(!Array.isArray(manifest.approved))throw Error('Approval manifest requires approved[]');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-filter-approvals-'));
 try{
  fs.mkdirSync(path.join(root,'data'));fs.mkdirSync(path.join(root,'intake'));
  for(const part of ['opportunities','datasets','sources','tools','changelog']){
   const source=path.join(baseDir,'data',part+'.js');
   if(fs.existsSync(source))fs.copyFileSync(source,path.join(root,'data',part+'.js'));
  }
  const copy=path.join(root,'intake/approved-publications.json');
  fs.writeFileSync(copy,JSON.stringify(manifest));
  const publisher=path.join(baseDir,'scripts/publish-approved.js');
  const output=cp.execFileSync(process.execPath,[publisher],{cwd:root,encoding:'utf8'});
  const dryRun=JSON.parse(output),keys=new Set((dryRun.rejected||[]).map(x=>(x.category||'')+':'+(x.id||'')));
  const before=manifest.approved.length;
  manifest.approved=manifest.approved.filter(x=>!keys.has((x.category||'')+':'+(x.record?.id||'')));
  fs.writeFileSync(absolute,JSON.stringify(manifest,null,2)+'\\n');
  const result={removed:before-manifest.approved.length,remaining:manifest.approved.length,rejected:dryRun.rejected||[]};
  console.log(JSON.stringify(result));
  return result;
 }finally{fs.rmSync(root,{recursive:true,force:true})}
}
if(require.main===module)filterRejected(process.argv[2]||'intake/approved-publications-next.json');
module.exports={filterRejected};
