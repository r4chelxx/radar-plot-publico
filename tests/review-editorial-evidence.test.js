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
 item('tool','tools',{evidenceText:'',structuredData:[{'@type':'SoftwareApplication',name:'Tool',description:'Reporting analysis tool',applicationCategory:'Data analysis',operatingSystem:'Web',license:'MIT'}]})
 ]};
 fs.writeFileSync(queue,JSON.stringify(q));
 cp.execFileSync(process.execPath,[path.resolve('scripts/review-editorial-evidence.js'),queue,out],{encoding:'utf8'});
 const result=JSON.parse(fs.readFileSync(out));
 assert.equal(result.records.find(x=>x.id==='grant').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='fake-grant').decision,'pending_more_evidence');
 assert.equal(result.records.find(x=>x.id==='dataset').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='tool').decision,'evidence_complete_for_record_draft');
 assert(result.records.every(x=>x.publicationReady===false));
 console.log('Category evidence review regressions passed');
}finally{fs.rmSync(root,{recursive:true,force:true})}
