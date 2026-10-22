#!/usr/bin/env node
// Aggregate live collector health and editorial queue quality, without exposing private leads.
const fs=require('node:fs');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const feed=read('intake/live-web-health.json'),dvs=read('intake/dvs-public-health.json'),quality=read('intake/discovery-quality.json');
const sources=[
 ...(feed.health||[]).map(x=>({name:x.source,status:x.status,candidates:x.items||0,error:x.reason||null})),
 ...(dvs.health||[]).map(x=>({name:x.page,status:x.status,candidates:x.candidates||0,error:x.reason||null}))
];
const report={generatedAt:new Date().toISOString(),sources,totals:{healthy:sources.filter(x=>x.status==='ok').length,failed:sources.filter(x=>x.status!=='ok').length,candidates:quality.counts.total,catalogMatches:quality.counts.catalogMatches,needsReview:quality.counts.needsReview,highPriority:quality.summary?.highPriority||0,normalPriority:quality.summary?.normalPriority||0},notes:'Candidate links require editorial verification. Gmail and LinkedIn are not collected by this workflow.'};
fs.writeFileSync('intake/discovery-operations.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.totals));
