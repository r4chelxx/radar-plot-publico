#!/usr/bin/env node
// Small, non-publishing editorial sample. Does not alter the public catalog.
const fs=require('node:fs');
const r=JSON.parse(fs.readFileSync('intake/discovery-quality.json','utf8'));
const items=(r.review||[]).filter(x=>x.classification==='needs-editorial-review');
const groups={high:items.filter(x=>x.reviewPriority==='high'),normal:items.filter(x=>x.reviewPriority!=='high')};
const selected=[...groups.high.slice(0,25),...groups.normal.slice(0,10)];
const out={generatedAt:new Date().toISOString(),selection:'First 25 high-priority and 10 normal-priority candidates, for manual verification only.',totalPending:items.length,selected:selected.map(x=>({title:x.title,url:x.url,origins:x.origins,priority:x.reviewPriority,verified:false,publicationReady:false}))};
fs.writeFileSync('intake/editorial-review-sample.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({pending:items.length,sample:selected.length}));
