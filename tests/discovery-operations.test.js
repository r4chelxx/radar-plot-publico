'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('discovery operations detect partial feed outage without discarding candidates',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-health-'));
 try{
  fs.mkdirSync(path.join(root,'intake'));
  const write=(name,value)=>fs.writeFileSync(path.join(root,'intake',name),JSON.stringify(value));
  write('live-web-health.json',{health:[{source:'A',status:'ok',items:10},{source:'B',status:'error',reason:'HTTP 404',items:0}]});
  write('dvs-public-health.json',{health:[{page:'DVS',status:'ok',candidates:12}]});
  write('discovery-quality.json',{counts:{total:22,catalogMatches:2,needsReview:20},summary:{highPriority:5,normalPriority:15}});
  cp.execFileSync(process.execPath,[path.resolve('scripts/report-discovery-operations.js')],{cwd:root});
  const report=JSON.parse(fs.readFileSync(path.join(root,'intake/discovery-operations.json')));
  assert.equal(report.overallStatus,'degraded');
  assert.deepEqual(report.coverage.feeds,{total:2,healthy:1,failed:1,candidates:10});
  assert.equal(report.coverage.dvs.candidates,12);
  assert.equal(report.totals.needsReview,20);
  assert(report.warnings.some(x=>x.includes('feeds')));
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
