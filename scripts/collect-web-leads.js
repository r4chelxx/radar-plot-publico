#!/usr/bin/env node
// Public web collector: reads audited source-review leads and creates a non-publishing input.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');
const file=process.argv[2]||'intake/candidate-triage.json';
const destination=process.argv[3]||'intake/web-discovery-input.json';
const input=fs.existsSync(file)?JSON.parse(fs.readFileSync(file,'utf8')):{leads:[]};
if(!fs.existsSync(file))console.warn('No prior candidate triage found; live collectors will still run');
if(!Array.isArray(input.leads))throw Error('Expected candidate-triage leads array');
const accepted=new Set(['needs-editorial-review','historical-reference']);
const categories=new Set(['opportunities','datasets','tools','uncategorized']);
const leads=[],seen=new Set();
for(const item of input.leads){
 if(!accepted.has(item.classification)||typeof item.url!=='string')continue;
 try{
  const url=canonical(item.url);
  if(seen.has(url))continue;
  seen.add(url);
  leads.push({url,title:String(item.title||'Untitled candidate').slice(0,220),category:categories.has(item.category)?item.category:'uncategorized'});
 }catch{}
}
fs.mkdirSync(require('node:path').dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify({source:'web',leads},null,2)+'\n');
console.log(JSON.stringify({source:'web',candidates:leads.length}));
