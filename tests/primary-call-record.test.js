'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {primaryCallUrl}=require('../scripts/audit-editorial-queue');
const {buildDrafts}=require('../scripts/build-editorial-record-drafts');
const {officialName}=require('../scripts/repair-dataset-titles');
test('repairing a display title preserves the approval evidence and its digest',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-title-repair-')),previous=process.cwd();
 try{
  fs.mkdirSync(path.join(root,'data'));fs.mkdirSync(path.join(root,'intake'));
  fs.writeFileSync(path.join(root,'data/datasets.js'),'window.RADAR_PARTS.datasets='+JSON.stringify([{id:'one',name:'Old title...',url:'https://datacatalog.worldbank.org/search/dataset/123'}]));
  const proof={evidence:'Old title... and original verified evidence',evidenceHash:'original-digest'};
  fs.writeFileSync(path.join(root,'intake/approved-publications.json'),JSON.stringify({approved:[{record:{id:'one',name:'Old title...'},review:proof}]}));
  const html='<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{dataset:{dataset_unique_id:'123',name:'Complete official title'}}}})+'</script>';
  process.chdir(root);
  await require(path.join(previous,'scripts/repair-dataset-titles')).run(async()=>({ok:true,text:async()=>html}));
  const repaired=JSON.parse(fs.readFileSync('intake/approved-publications.json')).approved[0];
  assert.equal(repaired.record.name,'Complete official title');assert.deepEqual(repaired.review,proof);
 }finally{process.chdir(previous);fs.rmSync(root,{recursive:true,force:true})}
});
test('an aggregator official-information link is followed, social and private targets are not',()=>{
 const html='<p>For more information, visit <a href="https://spencerfellows.org/how-to-apply-2/">Spencer Fellowship</a></p>';
 assert.equal(primaryCallUrl(html,'https://opportunitydesk.org/call'),'https://spencerfellows.org/how-to-apply-2/');
 assert.equal(primaryCallUrl('<a href="https://facebook.com/page">Official website</a>','https://opportunitydesk.org/call'),null);
 assert.equal(primaryCallUrl('<a href="https://127.0.0.1/">Official website</a>','https://opportunitydesk.org/call'),null);
});
test('a fresh primary call preserves its actual program name, abbreviated deadline and US restriction',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-primary-'));
 try{
  const evidence='The Spencer Education Journalism Fellowship is open to journalists. Based at Columbia Journalism School, it supports education reporting. The deadline to apply is 11:59 p.m. EST on Feb. 4, 2099. Applicants must also be U.S. citizens or permanent resident/green card holders.';
  const queue={candidates:[{id:'primary',status:'pending',category:'opportunities',url:'https://opportunitydesk.org/call',audit:{pageTitle:'How to Apply',pageDescription:'An education journalism fellowship open to journalists.',evidenceText:evidence,httpStatus:200,contentType:'text/html',checkedAt:new Date().toISOString(),finalUrl:'https://spencerfellows.org/how-to-apply-2/'}}]};
  const q=path.join(root,'q.json'),r=path.join(root,'r.json');fs.writeFileSync(q,JSON.stringify(queue));
  cp.execFileSync(process.execPath,[path.resolve('scripts/review-editorial-evidence.js'),q,r]);
  const review=JSON.parse(fs.readFileSync(r));assert.equal(review.records[0].checks.deadline,'2099-02-04');
  const draft=buildDrafts(queue,review).drafts[0];assert.ok(draft);assert.deepEqual(draft.missingFields,[]);
  const draftsFile=path.join(root,'drafts.json');
  fs.writeFileSync(draftsFile,JSON.stringify(buildDrafts(queue,review)));
  cp.execFileSync(process.execPath,[path.resolve('scripts/validate-editorial-record-drafts.js'),q,r,draftsFile]);
  const altered=JSON.parse(JSON.stringify(queue));altered.candidates[0].audit.finalUrl='https://uninspected.example/call';
  fs.writeFileSync(q,JSON.stringify(altered));
  assert.throws(()=>cp.execFileSync(process.execPath,[path.resolve('scripts/validate-editorial-record-drafts.js'),q,r,draftsFile],{stdio:'pipe'}));
  assert.match(draft.recordDraft.title,/Spencer Education Journalism Fellowship/);
  assert.equal(draft.source.url,'https://spencerfellows.org/how-to-apply-2/');
  assert.equal(draft.recordDraft.rules,draft.source.url);
  assert.match(draft.recordDraft.scope,/green card holders/);assert.equal(draft.recordDraft.eligibility,'restrita');
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('dataset title repair requires exact official dataset identity',()=>{
 const html='<script id="__NEXT_DATA__">'+JSON.stringify({props:{pageProps:{dataset:{dataset_unique_id:'123',identification:{title:'Complete dataset name'}}}}})+'</script>';
 assert.equal(officialName({url:'https://datacatalog.worldbank.org/search/dataset/123'},html),'Complete dataset name');
 assert.equal(officialName({url:'https://datacatalog.worldbank.org/search/dataset/999'},html),null);
});
