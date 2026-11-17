#!/usr/bin/env node
// Confirm approved records are actually served by the deployed public catalog.
const fs=require('node:fs');
const base=process.env.RADAR_PUBLIC_URL||'https://r4chelxx.github.io/radar-plot-publico/';
const approved=JSON.parse(fs.readFileSync(process.env.RADAR_APPROVED_MANIFEST||'intake/approved-publications.json','utf8')).approved||[];
const aliasPath='intake/publication-aliases.json';
const aliases=fs.existsSync(aliasPath)?JSON.parse(fs.readFileSync(aliasPath,'utf8')).aliases||[]:[];
const aliasById=new Map(aliases.map(x=>[x.id,x]));
const expected=approved.filter(x=>x.record?.id&&!aliasById.has(x.record.id)).map(x=>({id:x.record.id,category:x.category}));
// The publisher writes this report during this run; aliases must be absent and their
// registered primary records present. Never waive an arbitrary missing approval.
for(const alias of aliases){
 if(alias.category!=='opportunities'||!alias.id||!alias.primaryId||alias.id===alias.primaryId)throw Error('Invalid publication alias');
 // The alias itself is intentionally absent; the primary must be verified
 // independently only when it is an approved manifest record.
 if(!approved.some(x=>x.category===alias.category&&x.record?.id===alias.primaryId))throw Error('Alias primary is not an approved manifest record: '+alias.id);
}
const retries=Math.min(12,Math.max(1,Number(process.env.RADAR_DEPLOY_RETRIES||8)));
const delay=Math.min(30000,Math.max(1000,Number(process.env.RADAR_DEPLOY_DELAY_MS||15000)));
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 let missing=[];
 for(let i=1;i<=retries;i++){
  missing=[];
  for(const category of new Set(expected.map(x=>x.category))){
   const response=await fetch(new URL('data/'+category+'.js?audit='+Date.now(),base),{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
   if(!response.ok)throw Error('Public '+category+' returned HTTP '+response.status);
   const body=await response.text();
   const has=id=>body.includes('"id": "'+id+'"')||body.includes('"id":"'+id+'"');
   for(const record of expected.filter(x=>x.category===category)){
    const alias=aliases.find(x=>x.category===category&&x.id===record.id);
    if(!has(alias?alias.primaryId:record.id))missing.push(record.id);
   }
   for(const alias of aliases.filter(x=>x.category===category))if(has(alias.id))missing.push('duplicate:'+alias.id);
  }
  console.log(JSON.stringify({attempt:i,expected:expected.length,missing}));
  if(!missing.length){console.log('Deployed public catalog contains all approved records');return}
  if(i<retries)await sleep(delay);
 }
 throw Error('Deployed site is missing approved records after '+retries+' checks: '+missing.join(', '));
})().catch(e=>{console.error(e.message);process.exitCode=1});
