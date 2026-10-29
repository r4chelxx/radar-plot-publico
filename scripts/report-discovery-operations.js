#!/usr/bin/env node
// Aggregate live collector health and editorial queue quality, without exposing private leads.
const fs=require('node:fs');
const {editorialFunnel}=require('./editorial-funnel');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
const feed=read('intake/live-web-health.json'),dvs=read('intake/dvs-public-health.json'),funding=read('intake/public-funding-health.json'),quality=read('intake/discovery-quality.json');
const opportunity=fs.existsSync('intake/opportunity-web-health.json')?read('intake/opportunity-web-health.json'):{health:[]};
const sources=[
 ...(feed.health||[]).map(x=>({name:x.source,status:x.status,candidates:x.items||0,error:x.reason||null})),
 ...(dvs.health||[]).map(x=>({name:x.page,status:x.status,candidates:x.candidates||0,error:x.reason||null})),
 ...(funding.health||[]).map(x=>({name:x.source,status:x.status,candidates:x.items||0,error:x.reason||null,coverageStatus:x.coverageStatus||null})),
 ...(opportunity.health||[]).map(x=>({name:'Opportunity search: '+x.query,status:x.status,candidates:x.items||0,error:x.reason||null}))
];
const successful=sources.filter(x=>x.status==='ok'||x.status==='fallback');
const failed=sources.filter(x=>x.status!=='ok'&&x.status!=='fallback');
const families={feeds:(feed.health||[]),dvs:(dvs.health||[]),fundingPages:(funding.health||[]),opportunitySearch:(opportunity.health||[])};
const coverage=Object.fromEntries(Object.entries(families).map(([name,items])=>[name,{total:items.length,healthy:items.filter(x=>x.status==='ok'||x.status==='fallback').length,recovered:items.filter(x=>x.status==='fallback').length,failed:items.filter(x=>x.status!=='ok'&&x.status!=='fallback').length,candidates:items.reduce((n,x)=>n+(x.items||x.candidates||0),0)}]));
const warnings=[];
for(const [name,x] of Object.entries(coverage)){
 if(!x.total||!x.healthy)warnings.push(name+': all sources unavailable');
 else if(x.failed)warnings.push(name+': '+x.failed+' of '+x.total+' sources unavailable');
 if(x.healthy&&!x.candidates)warnings.push(name+': successful sources returned no candidates');
}
for(const item of funding.health||[])if((item.status==='ok'||item.status==='fallback')&&!item.items)warnings.push('fundingPages: '+item.source+' returned no relevant static links; manual or feed review needed');
const queue=fs.existsSync('intake/editorial-queue.json')?read('intake/editorial-queue.json'):{candidates:[]};
const manifest=fs.existsSync('intake/approved-publications.json')?read('intake/approved-publications.json'):{approved:[]};
const funnel=editorialFunnel(queue,manifest);
const report={editorialFunnel:funnel,generatedAt:new Date().toISOString(),sources,coverage,warnings,overallStatus:warnings.length?'degraded':'healthy',sourcePerformance:{successful:successful.map(x=>({name:x.name,candidates:x.candidates})).sort((a,b)=>b.candidates-a.candidates),failed:failed.map(x=>({name:x.name,error:x.error}))},opportunities:{queries:(opportunity.health||[]).length,queryFailures:(opportunity.health||[]).filter(x=>x.status!=='ok').length,searchCandidates:(opportunity.health||[]).reduce((n,x)=>n+(x.items||0),0),note:'Search candidates are unverified leads, not published opportunities.'},totals:{healthy:successful.length,failed:failed.length,candidates:quality.counts.total,catalogMatches:quality.counts.catalogMatches,needsReview:quality.counts.needsReview,highPriority:quality.summary?.highPriority||0,normalPriority:quality.summary?.normalPriority||0},notes:'Candidate links require editorial verification. Gmail is not collected by this workflow; LinkedIn posts are imported only when a curated public input file is provided.'};
fs.writeFileSync('intake/discovery-operations.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({status:report.overallStatus,coverage:report.coverage,warnings:report.warnings,totals:report.totals}));
