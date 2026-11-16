#!/usr/bin/env node
'use strict';
// Repair existing identities from the exact official dataset, never from a slug.
const fs=require('node:fs'),vm=require('node:vm');
const {extractStructuredMetadata,metadataForLink}=require('./structured-lead-metadata');
function officialName(record,html){
 const url=new URL(record.url);
 if(url.hostname!=='datacatalog.worldbank.org'||! /\/dataset\/\d+(?:\/|$)/.test(url.pathname))return null;
 const data=metadataForLink(extractStructuredMetadata(html,record.url),record.url);
 if(data?.sourceType!=='Dataset'||!data.title||/\.\.\.|…/.test(data.title))return null;
 return data.title;
}
async function run(fetcher=fetch){
 const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('data/datasets.js','utf8'),ctx);
 const repairs=[];
 for(const record of ctx.window.RADAR_PARTS.datasets||[]){
  if(!/\.\.\.|…/.test(record.name)||!/^https:\/\/datacatalog\.worldbank\.org\//.test(record.url))continue;
  try{
   const response=await fetcher(record.url,{signal:AbortSignal.timeout(12000)});
   if(!response.ok)continue;
   const name=officialName(record,await response.text());
   if(name&&name!==record.name)repairs.push({id:record.id,old:record.name,name,url:record.url});
  }catch{/* Failed refresh leaves the existing identity unchanged. */}
 }
 for(const file of ['data/datasets.js','data/changelog.js']){
  if(!fs.existsSync(file))continue;
  let source=fs.readFileSync(file,'utf8');
  for(const repair of repairs)source=source.split(JSON.stringify(repair.old).slice(1,-1)).join(JSON.stringify(repair.name).slice(1,-1));
  fs.writeFileSync(file,source);
 }
 const manifestPath='intake/approved-publications.json';
 if(fs.existsSync(manifestPath)){
  const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
  for(const item of manifest.approved||[]){
   const repair=repairs.find(x=>x.id===item.record?.id);
   if(repair)item.record.name=repair.name; // Preserve original proof bytes and hash.
  }
  fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 }
 console.log(JSON.stringify({correctedTitles:repairs.length,repairs}));
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1});
module.exports={officialName,run};
