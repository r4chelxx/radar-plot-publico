#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-evidence-review-'));
try{
 const queue=path.join(root,'queue.json'),out=path.join(root,'out.json');
 const item=(id,category,audit)=>({id,url:'https://example.org/'+id,category,status:'pending',audit:{httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T00:00:00Z',...audit}});
 const q={candidates:[
 item('grant','opportunities',{evidenceText:'Grant applications close 2099-12-31. Eligibility: who can apply is limited to journalists.',structuredData:[]}),
 item('fake-grant','opportunities',{evidenceText:'Welcome to our news blog about awards.',structuredData:[]}),
 item('dataset','datasets',{evidenceText:'',structuredData:[{'@type':'Dataset',name:'City data',license:'CC0',temporalCoverage:'2020/2025',distribution:{contentUrl:'https://example.org/data.csv',encodingFormat:'text/csv'}}]}),
 item('tool','tools',{pageTitle:'Mapping software',evidenceText:'Interactive mapping software that lets journalists create and share maps. Free plan available; paid tiers are described on the pricing page.',structuredData:[]}),
 item('dataset-text-only','datasets',{pageTitle:'Open Data Catalog',evidenceText:'Download municipal CSV files covering 2020–2025. API access and usage terms are documented.',structuredData:[]}),
 item('uncategorized-call','uncategorized',{pageTitle:'Global Reporting Fellowship',evidenceText:'Applications for this fellowship close 31/12/2099. Eligibility: open to journalists worldwide.',structuredData:[]}),
 item('event-false-positive','uncategorized',{pageTitle:'Data Journalism Conference',evidenceText:'Conference awards ceremony and event registration.',structuredData:[]}),\n item('unrelated-date','opportunities',{pageTitle:'Global Reporting Fellowship',evidenceText:'The fellowship supports journalists. Deadline details will be announced soon. The program began in 2020. Eligibility: open to journalists worldwide.',structuredData:[]})
 ]};
 fs.writeFileSync(queue,JSON.stringify(q));
 cp.execFileSync(process.execPath,[path.resolve('scripts/review-editorial-evidence.js'),queue,out],{encoding:'utf8'});
 const result=JSON.parse(fs.readFileSync(out));
 assert.equal(result.records.find(x=>x.id==='grant').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='fake-grant').decision,'pending_more_evidence');
 assert.equal(result.records.find(x=>x.id==='dataset').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='tool').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='tool').checks.licenseStatus,'not stated in captured source');
 assert.equal(result.records.find(x=>x.id==='dataset-text-only').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='dataset-text-only').checks.licenseStatus,'not stated in captured source');
 assert.equal(result.records.find(x=>x.id==='uncategorized-call').category,'opportunities');
 assert.equal(result.records.find(x=>x.id==='uncategorized-call').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='event-false-positive').category,'uncategorized');\n assert.equal(result.records.find(x=>x.id==='unrelated-date').decision,'pending_more_evidence');
 assert(result.records.every(x=>x.publicationReady===false));
 console.log('Category evidence review regressions passed');
}finally{fs.rmSync(root,{recursive:true,force:true})}
