#!/usr/bin/env node
// Unified, non-publishing intake for independently collected web, Gmail and LinkedIn leads.
// Input files must be supplied by authorized collectors; no credentials or private mail are committed.
const fs=require('node:fs');
const path=require('node:path');
const {identity}=require('./lead-identity');
const allowed=new Set(['web','gmail','linkedin']);
const categories=new Set(['opportunities','datasets','tools','uncategorized']);
const inputs=process.argv.slice(2);
if(!inputs.length){console.error('Usage: node scripts/unify-discovery.js <web.json> <gmail.json> <linkedin.json>');process.exit(2)}
const merged=new Map(),errors=[],sources={web:0,gmail:0,linkedin:0},sourceHealth={web:{files:0,leads:0},gmail:{files:0,leads:0},linkedin:{files:0,leads:0}};
for(const file of inputs){
 let parsed;
 try{parsed=JSON.parse(fs.readFileSync(file,'utf8'))}catch(e){errors.push({file,error:'Unreadable JSON'});continue}
 if(!allowed.has(parsed.source)||!Array.isArray(parsed.leads)){errors.push({file,error:'Expected {source:web|gmail|linkedin,leads:[]}'});continue}\n sourceHealth[parsed.source].files++;
 for(const item of parsed.leads){
  try{
   if(!item||typeof item.url!=='string')throw Error('Missing URL');
   const key=identity(item.url);
   const category=categories.has(item.category)?item.category:'uncategorized';
   const title=String(item.title||'Untitled candidate').slice(0,220);
   const entry=merged.get(key.id)||{id:key.id,url:key.url,title,category,origins:[],classification:'needs-editorial-review',publicationReady:false};
   if(entry.category==='uncategorized'&&category!=='uncategorized')entry.category=category;
   if(!entry.origins.includes(parsed.source))entry.origins.push(parsed.source);
   merged.set(key.id,entry);sources[parsed.source]++;sourceHealth[parsed.source].leads++;
  }catch(e){errors.push({file,error:String(e.message||e)})}
 }
}
const output={generatedAt:new Date().toISOString(),policy:'Discovery only. Primary-source verification, deadline, duplicate review and editorial approval required before publication.',sources,sourceHealth,candidates:[...merged.values()].sort((a,b)=>a.id.localeCompare(b.id)),errors};
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/unified-discovery.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({candidates:output.candidates.length,sources,errors:errors.length}));
if(errors.length)process.exitCode=1;
