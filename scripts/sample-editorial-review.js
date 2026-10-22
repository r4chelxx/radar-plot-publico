#!/usr/bin/env node
// Small, non-publishing editorial sample. Does not alter the public catalog.
const fs=require('node:fs');
const r=JSON.parse(fs.readFileSync('intake/discovery-quality.json','utf8'));
const items=(r.review||[]).filter(x=>x.classification==='needs-editorial-review');
const groups={high:items.filter(x=>x.reviewPriority==='high'),normal:items.filter(x=>x.reviewPriority!=='high')};
// Rotate through source groups so one large feed cannot monopolize the sample.
const originKey=item=>{
 const first=(item.origins||[])[0];
 return typeof first==='string'?first:String(first?.source||'unknown');
};
function diverseSample(items,limit){
 const bySource=new Map();
 for(const item of items){const key=originKey(item);if(!bySource.has(key))bySource.set(key,[]);bySource.get(key).push(item);}
 const selected=[];
 while(selected.length<limit){
  let progressed=false;
  for(const bucket of bySource.values())if(bucket.length&&selected.length<limit){selected.push(bucket.shift());progressed=true;}
  if(!progressed)break;
 }
 return selected;
}
const selected=[...diverseSample(groups.high,25),...diverseSample(groups.normal,10)];
const out={generatedAt:new Date().toISOString(),selection:'Up to 25 high-priority and 10 normal-priority candidates, round-robin by source, for manual verification only.',totalPending:items.length,selected:selected.map(x=>({title:x.title,url:x.url,origins:x.origins,priority:x.reviewPriority,verified:false,publicationReady:false}))};
fs.writeFileSync('intake/editorial-review-sample.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({pending:items.length,sample:selected.length}));
