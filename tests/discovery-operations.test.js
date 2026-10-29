'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('discovery operations detect partial feed outage without discarding candidates',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-health-'));
 try{
  fs.mkdirSync(path.join(root,'intake'));
  const write=(name,value)=>fs.writeFileSync(path.join(root,'intake',name),JSON.stringify(value));
  write('live-web-health.json',{health:[{source:'A',status:'ok',items:10},{source:'B',status:'error',reason:'HTTP 404',items:0}]});
  write('dvs-public-health.json',{health:[{page:'DVS',status:'ok',candidates:12}]});
  write('public-funding-health.json',{health:[{source:'Grants for Journalists',status:'fallback',items:2,coverageStatus:'partial'},{source:'GFMD funding',status:'ok',items:0,coverageStatus:'no-relevant-static-links'}]});
  write('opportunity-web-health.json',{health:[{query:'journalism grants',status:'ok',items:8},{query:'fellowships',status:'error',items:0,reason:'HTTP 429'}]});
  write('discovery-quality.json',{counts:{total:22,catalogMatches:2,needsReview:20},summary:{highPriority:5,normalPriority:15}});
  cp.execFileSync(process.execPath,[path.resolve('scripts/report-discovery-operations.js')],{cwd:root});
  const report=JSON.parse(fs.readFileSync(path.join(root,'intake/discovery-operations.json')));
  assert.equal(report.overallStatus,'degraded');
  assert.deepEqual(report.coverage.feeds,{total:2,healthy:1,recovered:0,failed:1,candidates:10});
  assert.equal(report.coverage.dvs.candidates,12);
  assert.deepEqual(report.coverage.fundingPages,{total:2,healthy:2,recovered:1,failed:0,candidates:2});
  assert(report.warnings.some(x=>x.includes('GFMD funding')));
  assert(report.sources.some(x=>x.name==='GFMD funding'&&x.coverageStatus==='no-relevant-static-links'));
  assert.equal(report.totals.needsReview,20);
  assert.equal(report.coverage.opportunitySearch.candidates,8);
  assert.equal(report.opportunities.queryFailures,1);
  assert.equal(report.opportunities.searchCandidates,8);
  assert(report.sources.some(x=>x.name==='Opportunity search: fellowships'&&x.status==='error'));
  assert.equal(report.totals.failed,2);
  assert(report.sourcePerformance.successful.some(x=>x.name==='Grants for Journalists'));
  assert(!report.sourcePerformance.failed.some(x=>x.name==='Grants for Journalists'));
  assert(report.warnings.some(x=>x.includes('feeds')));
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
