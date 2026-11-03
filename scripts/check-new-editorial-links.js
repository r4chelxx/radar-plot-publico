#!/usr/bin/env node
// The full historical link audit runs separately; publication validates only new URLs.
const fs=require('node:fs'),vm=require('node:vm'),{execFileSync}=require('node:child_process');
const categories=['opportunities','datasets','tools'];
function load(source){const context={window:{RADAR_PARTS:{}}};vm.createContext(context);for(const c of categories){vm.runInContext(source(c),context,{filename:c+'.js'});}return context.window.RADAR_PARTS;}
function newUrls(){
 const current=load(c=>fs.readFileSync('data/'+c+'.js','utf8'));
 const old=load(c=>execFileSync('git',['show','HEAD:data/'+c+'.js'],{encoding:'utf8'}));
 const urls=[];
 for(const c of categories){
  const seen=new Set((old[c]||[]).map(x=>x.id));
  for(const record of current[c]||[])if(!seen.has(record.id)){
   const url=c==='opportunities'?record.rules:record.url;
   if(!url)throw Error('New '+c+' record missing URL: '+record.id);
   urls.push({category:c,id:record.id,url});
  }
 }
 return urls;
}
async function check(x){
 const u=new URL(x.url);if(u.protocol!=='https:')throw Error('Non-HTTPS URL: '+x.id);
 let error='';
 for(let attempt=0;attempt<2;attempt++){
  try{
   const r=await fetch(x.url,{redirect:'follow',headers:{'user-agent':'Mozilla/5.0 Radar-PLOT-Editorial/1.0'},signal:AbortSignal.timeout(12000)});
   if(r.status===404||r.status===410||r.status>=500)throw Error('HTTP '+r.status);
   if(r.status>=200&&r.status<400)return {...x,status:r.status,result:'ok'};
   // Auth, bot protection and rate limiting are inconclusive, not proof of a dead link.
   if([401,403,405,406,429].includes(r.status))return {...x,status:r.status,result:'manual-review-blocked'};
   throw Error('HTTP '+r.status);
  }catch(e){error=e.message;}
 }
 throw Error('New editorial URL unavailable: '+x.id+' '+x.url+' '+error);
}
async function main(){
 const urls=newUrls();
 if(!urls.length){console.log('No new editorial records; no URLs to audit');return;}
 const results=[];
 for(const x of urls)results.push(await check(x));
 console.log(JSON.stringify({newEditorialUrls:results.length,results},null,2));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={newUrls};
