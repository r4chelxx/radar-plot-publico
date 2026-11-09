'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {buildDrafts}=require('../scripts/build-editorial-record-drafts');
const queue={updatedAt:'2026-11-09T12:00:00Z',candidates:[
 {id:'global-reporting-grant',title:'Global reporting grant',url:'https://example.org/grant',category:'opportunities',providers:['Example Foundation'],audit:{pageTitle:'Global Reporting Grant',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'Applications are open. Eligibility is open to journalists worldwide. Applications close 2099-12-31.',structuredData:[],resourceLinks:[]}},
 {id:'city-data-catalog',title:'City data catalog',url:'https://example.org/data',category:'datasets',providers:['Example City'],audit:{pageTitle:'City Open Data Catalog',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'Download CSV files covering 2020–2025. License terms are available on the portal.',structuredData:[{'@type':'Dataset',name:'City records',distribution:{contentUrl:'https://example.org/download.csv',encodingFormat:'text/csv'}}],resourceLinks:[{url:'https://example.org/download.csv',label:'CSV download'}]}},
 {id:'mapping-tool',title:'Mapping tool',url:'https://example.org/tool',category:'tools',providers:['Example Lab'],audit:{pageTitle:'Interactive Mapping Tool',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'Software lets journalists create interactive maps. Free plan available.',structuredData:[{'@type':'SoftwareApplication',applicationCategory:'Mapping'}],resourceLinks:[]}},
 {id:'pandas-library',title:'pandas',url:'https://pandas.pydata.org/',category:'tools',providers:['Data Visualization Society'],audit:{pageTitle:'pandas - Python Data Analysis Library',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'pandas is a fast, powerful, flexible and easy to use open source data analysis and manipulation tool, built on top of the Python programming language. Install pandas now!',structuredData:[],resourceLinks:[]}},
 {id:'incomplete-lead',title:'Needs more proof',url:'https://example.org/pending',category:'tools',audit:{httpStatus:200,contentType:'text/html',evidenceText:'Not enough evidence.',structuredData:[],resourceLinks:[]}}
]};
const review={records:[
 {id:'global-reporting-grant',decision:'evidence_complete_for_record_draft',publicationReady:false,category:'opportunities',checks:{deadline:'2099-12-31'}},
 {id:'city-data-catalog',decision:'evidence_complete_for_record_draft',publicationReady:false,category:'datasets',checks:{directResource:true}},
 {id:'mapping-tool',decision:'evidence_complete_for_record_draft',publicationReady:false,category:'tools',checks:{function:true}},
 {id:'pandas-library',decision:'evidence_complete_for_record_draft',publicationReady:false,category:'tools',checks:{function:true,access:true}},
 {id:'incomplete-lead',decision:'pending_more_evidence',publicationReady:false,category:'tools',checks:{}}
]};
test('builds traceable drafts only from evidence-complete primary-source reviews',()=>{
 const out=buildDrafts(queue,review,'2026-11-09T12:00:00Z');
 assert.equal(out.summary.drafts,4);assert.equal(out.summary.publicationReady,0);
 assert.deepEqual(out.summary.byCategory,{opportunities:1,datasets:1,tools:2});
 assert(!out.drafts.some(x=>x.id==='incomplete-lead'));
 const pandas=out.drafts.find(x=>x.id==='pandas-library');
 assert.equal(pandas.recordDraft.kind,'Python Data Analysis Library');
 assert.match(pandas.recordDraft.desc,/data analysis and manipulation tool/);
 assert.match(pandas.recordDraft.desc,/limitations; consult the official documentation and license/);
 assert(!pandas.missingFields.includes('kind'));assert(!pandas.missingFields.includes('desc'));
 const grant=out.drafts.find(x=>x.category==='opportunities');
 assert.equal(grant.recordDraft.deadline,'2099-12-31');
 assert.equal(grant.recordDraft.org,null,'discovery feed name must not be presented as the opportunity owner');
 assert.deepEqual(grant.source.discoveryProviders,['Example Foundation']);
 assert.match(grant.recordDraft.eligibility,/open to journalists worldwide/);
 assert.equal(grant.recordDraft.status,null);
 assert(grant.missingFields.includes('summary'));
 const dataset=out.drafts.find(x=>x.category==='datasets');
 assert.equal(dataset.recordDraft.api,'https://example.org/download.csv');
 assert.equal(dataset.recordDraft.format,'text/csv');
 assert.equal(dataset.recordDraft.limitations,null);
 const tool=out.drafts.find(x=>x.category==='tools');
 assert.equal(tool.recordDraft.kind,'Mapping');
 assert.match(tool.recordDraft.desc,/Interactive mapping software/);
 assert.equal(out.drafts.every(x=>x.status==='draft_only'&&x.publicationReady===false),true);
});
test('draft validator detects source drift and publisher rejects drafts as an approval manifest',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-drafts-'));
 try{
  const qp=path.join(root,'queue.json'),rp=path.join(root,'review.json'),dp=path.join(root,'drafts.json');
  fs.writeFileSync(qp,JSON.stringify(queue));fs.writeFileSync(rp,JSON.stringify(review));
  fs.writeFileSync(dp,JSON.stringify(buildDrafts(queue,review)));
  const validator=path.resolve('scripts/validate-editorial-record-drafts.js');
  const result=cp.spawnSync(process.execPath,[validator,qp,rp,dp],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/"publicationReady":0/);
  const publisher=path.resolve('scripts/publish-approved.js');
  const rejected=cp.spawnSync(process.execPath,[publisher,dp],{cwd:root,encoding:'utf8'});
  assert.notEqual(rejected.status,0);
  assert.match(rejected.stderr,/Manifest requires approved/);
  const bad=JSON.parse(fs.readFileSync(dp,'utf8'));bad.drafts[0].source.url='https://attacker.example/';
  fs.writeFileSync(dp,JSON.stringify(bad));
  const invalid=cp.spawnSync(process.execPath,[validator,qp,rp,dp],{encoding:'utf8'});
  assert.notEqual(invalid.status,0);assert.match(invalid.stderr,/Draft source does not match/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
