'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {buildDrafts}=require('../scripts/build-editorial-record-drafts');
const {buildAutomaticPublications}=require('../scripts/build-automated-publications');
test('catalog-compatible rolling calls and HTML datasets traverse review, drafting, approval and publication',()=>{
 const {extractEvidence,rollingApplicationEvidence}=require('../scripts/editorial-page-evidence');
 assert.equal(rollingApplicationEvidence('Applications are reviewed on a rolling basis until February 22, 2099.'),false);
 assert.equal(rollingApplicationEvidence('The Center is accepting applications on a rolling basis.'),true);
 assert.equal(rollingApplicationEvidence('Deadline: Ongoing Eligibility Criteria: journalists worldwide.'),true);
 assert.deepEqual(extractEvidence('<table><tr><td>Layout</td><td>Menu</td></tr><tr><td>A</td><td>B</td></tr><tr><td>C</td><td>D</td></tr></table>').tabularData,[]);
 const {canonical}=require('../scripts/lead-identity');
 const {normalizeToolName}=require('../scripts/build-editorial-record-drafts');
 const {eligibilityScope}=require('../scripts/build-editorial-record-drafts');
 assert.equal(eligibilityScope('Back to all grants Organisation: Foundation Status: Open Deadline: Ongoing Eligibility: journalists in select SADC countries Target Region: Southern Africa Application Language: English'),'journalists in select SADC countries');
 assert.equal(canonical('https://cran.r-project.org/?package=fedmatch&utm_source=email'),'https://cran.r-project.org/?package=fedmatch');
 assert.equal(normalizeToolName('R','',canonical('https://cran.r-project.org/?package=fedmatch')),'fedmatch');
 assert.equal(normalizeToolName('R','','https://cran.r-project.org/package=fedmatch'),'fedmatch');
 assert.notEqual(canonical('https://cran.r-project.org/?package=fedmatch'),canonical('https://cran.r-project.org/?package=readr'));
 assert.equal(canonical('https://example.org/?package=private-value'),'https://example.org/');
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-catalog-compat-'));
 try{
  const at=new Date().toISOString();
  const call='Organization: Example Foundation. This reporting grant funds original investigative journalism by experienced reporters working on public-interest projects worldwide. Applications are accepted year-round with no deadline. Eligibility: open to journalists worldwide with a detailed reporting proposal.';
  const item=(id,category,title,text,extra={})=>({id,url:'https://official.example/'+id,category,status:'pending',audit:{pageTitle:title,pageDescription:text,evidenceText:text,httpStatus:200,contentType:'text/html',checkedAt:at,structuredData:[],...extra}});
  const table=extractEvidence('<table><tr><th>Country</th><th>Value</th></tr><tr><td>A</td><td>12</td></tr><tr><td>B</td><td>23</td></tr></table>','https://official.example/table');
  const q={candidates:[item('rolling','opportunities','Investigative journalism grant',call),item('unknown-date','opportunities','Investigative journalism grant',call.replace('Applications are accepted year-round with no deadline.','Applications are open; deadline to be announced.')),item('closed','opportunities','Investigative journalism grant',call+' Applications are closed.'),item('html-data','datasets','Global public services dataset','Organization: Statistics Institute. This dataset covers global public service indicators for 2025, presented as a public table that users may consult online. Detailed methodology and coverage are provided.',{tabularData:table.tabularData}),item('mentorship','uncategorized','Journalism mentorship programme','Organization: Example Foundation. This journalism mentorship supports experienced reporters with expert editorial guidance and professional development. Applications close 2099-12-31. Eligibility: open to journalists worldwide.') ]};
  fs.writeFileSync(root+'/queue.json',JSON.stringify(q));
  cp.execFileSync(process.execPath,[path.resolve('scripts/review-editorial-evidence.js'),root+'/queue.json',root+'/review.json']);
  const review=JSON.parse(fs.readFileSync(root+'/review.json'));
  assert.equal(review.records.find(x=>x.id==='unknown-date').decision,'pending_more_evidence');assert.equal(review.records.find(x=>x.id==='closed').decision,'pending_more_evidence');
  const drafts=buildDrafts(q,review);assert.equal(drafts.drafts.length,3);
  const rolling=drafts.drafts.find(x=>x.id==='rolling');assert.equal(rolling.recordDraft.deadline,null);assert(!rolling.missingFields.includes('deadline'));
  const html=drafts.drafts.find(x=>x.id==='html-data');assert.equal(html.recordDraft.api,null);assert.match(html.recordDraft.format,/HTML/);assert.deepEqual(html.missingFields,[]);
  const result=buildAutomaticPublications(drafts,{approved:[]});assert.equal(result.summary.automaticallyApproved,3);
  const known={...rolling.recordDraft,id:'already-published',title:rolling.recordDraft.title.replace(/ /g,' — '),rules:'https://primary.example/grant'};
  const deduped=buildAutomaticPublications(drafts,{approved:[]},new Date(),[known]);assert.equal(deduped.summary.automaticallyApproved,2);assert.equal(deduped.summary.skipped.duplicate,1);
  const refreshing=buildAutomaticPublications(drafts,{approved:[]},new Date(),[rolling.recordDraft]);assert.equal(refreshing.summary.automaticallyApproved,3);
  const forged=structuredClone(html);forged.evidence.tabularData=[];assert.equal(buildAutomaticPublications({drafts:[forged]},{approved:[]}).summary.automaticallyApproved,0);
  fs.mkdirSync(root+'/data');fs.mkdirSync(root+'/intake');for(const key of ['opportunities','datasets','tools','changelog'])fs.writeFileSync(root+'/data/'+key+'.js','window.RADAR_PARTS.'+key+'=[];');
  fs.writeFileSync(root+'/intake/approved-publications.json',JSON.stringify(result.manifest));
  const output=JSON.parse(cp.execFileSync(process.execPath,[path.resolve('scripts/publish-approved.js')],{cwd:root,encoding:'utf8'}));assert.deepEqual(output.byCategory,{opportunities:2,datasets:1,tools:0});
  const vm=require('node:vm'),ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(root+'/data/opportunities.js','utf8'),ctx);
  ctx.window.RADAR_PARTS.opportunities.find(x=>x.id==='rolling').scope='Bad legacy scope with navigation and unrelated metadata';
  fs.writeFileSync(root+'/data/opportunities.js','window.RADAR_PARTS.opportunities='+JSON.stringify(ctx.window.RADAR_PARTS.opportunities)+';');
  fs.writeFileSync(root+'/data/tools.js','window.RADAR_PARTS.tools='+JSON.stringify([{id:'r-package',name:'R',url:'https://cran.r-project.org/package=fedmatch',kind:'pacote R',desc:'Record linkage package for R.'},{id:'r-language',name:'R',url:'https://www.r-project.org/',kind:'linguagem',desc:'Statistical computing.'}])+';');
  const second=JSON.parse(cp.execFileSync(process.execPath,[path.resolve('scripts/publish-approved.js')],{cwd:root,encoding:'utf8'}));assert.equal(second.published,0);
  assert.doesNotMatch(fs.readFileSync(root+'/data/opportunities.js','utf8'),/Bad legacy scope/);
  assert.match(fs.readFileSync(root+'/data/opportunities.js','utf8'),/open to journalists worldwide with a detailed reporting proposal/);
  assert.match(fs.readFileSync(root+'/data/tools.js','utf8'),/"name": "fedmatch"/);
  assert.match(fs.readFileSync(root+'/data/tools.js','utf8'),/"name": "R"/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('public-records request functions pass the publisher without inheriting a newsroom label',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-foia-'));
 try{
  fs.mkdirSync(root+'/data');fs.mkdirSync(root+'/intake');for(const key of ['opportunities','datasets','tools','changelog'])fs.writeFileSync(root+'/data/'+key+'.js','window.RADAR_PARTS.'+key+'=[];');
  const at=new Date().toISOString(),text='File, track and share public records requests. This online software lets journalists request, analyze and share government information. Free account access.';
  const q={candidates:[{id:'records-tool',url:'https://records.example/',audit:{pageTitle:'Records software',pageDescription:text,evidenceText:text,checkedAt:at,httpStatus:200,contentType:'text/html',structuredData:[]}}]};
  const r={records:[{id:'records-tool',category:'tools',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{productSignal:true,function:true,access:true}}]};
  const drafts=buildDrafts(q,r),record=drafts.drafts[0].recordDraft;assert.equal(record.kind,'Gestão de pedidos de acesso à informação');
  fs.writeFileSync(root+'/intake/approved-publications.json',JSON.stringify(buildAutomaticPublications(drafts,{approved:[]}).manifest));
  const out=JSON.parse(cp.execFileSync(process.execPath,[path.resolve('scripts/publish-approved.js')],{cwd:root,encoding:'utf8'}));assert.equal(out.published,1);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('institutional title suffix needs a matching structured owner URL and stays outside dataset name',()=>{
 const url='https://official.example/cities/results';
 const candidate={id:'results',url,audit:{pageTitle:'Sanitation results 2025 — Ministry of Cities',evidenceText:'Dataset covering sanitation in 2024. Download CSV.',structuredData:[{'@type':'Organization',url:'https://official.example/cities'}]}};
 const review={records:[{id:'results',category:'datasets',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{}}]};
 const draft=()=>buildDrafts({candidates:[candidate]},review).drafts[0].recordDraft;
 assert.equal(draft().org,'Ministry of Cities');assert.equal(draft().name,'Sanitation results 2025');
 candidate.audit.structuredData[0].url='https://aggregator.example/';assert.equal(draft().org,null);
});
test('dataset downloads retain their evidenced file format and never infer geography from administrative scale',()=>{
 for(const [location,scale,tier] of [['Tanzania','national','Outros'],['California','statewide','Outros'],['Nairobi','municipal','Outros'],['Brasil','national','Brasil']]){
  const url='https://data.example/catalog',file='https://data.example/results.xlsx';
  const q={candidates:[{id:'files',url,status:'pending',audit:{pageTitle:location+' dataset',evidenceText:scale+' dataset covering '+location+' in 2024.',httpStatus:200,contentType:'text/html',checkedAt:new Date().toISOString(),structuredData:[],resourceLinks:[{url,label:'Official reports and spreadsheet downloads'},{url:'https://data.example/dados-abertos',label:'Dados Abertos'},{url:file,label:'Planilhas de indicadores'}]}}]};
  const r={records:[{id:'files',category:'datasets',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{}}]};
  const d=buildDrafts(q,r).drafts[0].recordDraft;
  assert.equal(d.format,'XLSX');assert.equal(d.api,file);assert.equal(d.territoryTier,tier);
 }
 const apiQueue={updatedAt:new Date().toISOString(),candidates:[{id:'api',url:'https://data.example.org/indicator/123',audit:{pageTitle:'Global country dataset',evidenceText:'Annual country data in JSON format.',structuredData:[],resourceLinks:[{url:'https://api.example.org/v2/country/all?format=json',label:'Official API'}]}}]};
 const apiReview={records:[{id:'api',category:'datasets',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{}}]};
 assert.equal(buildDrafts(apiQueue,apiReview).drafts[0].recordDraft.api,'https://api.example.org/v2/country/all?format=json');
});
const queue={updatedAt:'2026-11-09T12:00:00Z',candidates:[
 {id:'global-reporting-grant',title:'Global reporting grant',url:'https://example.org/grant',category:'opportunities',providers:['Example Foundation'],audit:{pageTitle:'Global Reporting Grant',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'Applications are open. Eligibility is open to journalists worldwide. Applications close 2099-12-31.',structuredData:[],resourceLinks:[]}},
 {id:'city-data-catalog',title:'City data catalog',url:'https://example.org/data',category:'datasets',providers:['Example City'],audit:{pageTitle:'City Open Data Catalog',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'Download CSV files covering 2020–2025. License terms are available on the portal.',structuredData:[{'@type':'Dataset',name:'City records',distribution:{contentUrl:'https://example.org/download.csv',encodingFormat:'text/csv'}}],resourceLinks:[{url:'https://example.org/download.csv',label:'CSV download'}]}},
 {id:'mapping-tool',title:'Mapping tool',url:'https://example.org/tool',category:'tools',providers:['Example Lab'],audit:{pageTitle:'Interactive Mapping Tool',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'Software lets journalists create interactive maps. Free plan available.',structuredData:[{'@type':'SoftwareApplication',applicationCategory:'Mapping'}],resourceLinks:[]}},
 {id:'pandas-library',title:'pandas',url:'https://pandas.pydata.org/',category:'tools',providers:['Data Visualization Society'],audit:{pageTitle:'pandas - Python Data Analysis Library',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T10:00:00Z',evidenceText:'pandas is a fast, powerful, flexible and easy to use open source data analysis and manipulation tool, built on top of the Python programming language. Install pandas now!',structuredData:[],resourceLinks:[]}},
 {id:'incomplete-lead',title:'Needs more proof',url:'https://example.org/pending',category:'tools',audit:{httpStatus:200,contentType:'text/html',evidenceText:'Not enough evidence.',structuredData:[],resourceLinks:[]}}
]};
const review={records:[
 {id:'global-reporting-grant',decision:'evidence_complete_for_record_draft',publicationReady:false,category:'opportunities',checks:{callSignal:true,deadline:'2099-12-31',eligibility:true}},
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
 assert.equal(pandas.recordDraft.name,'pandas');
 assert.match(pandas.recordDraft.desc,/data analysis and manipulation tool/);
 assert.match(pandas.recordDraft.desc,/limitations are not fully stated.*consult official documentation and license/);
 assert(!pandas.missingFields.includes('kind'));assert(!pandas.missingFields.includes('desc'));
 const grant=out.drafts.find(x=>x.category==='opportunities');
 assert.equal(grant.recordDraft.deadline,'2099-12-31');
 assert.equal(grant.recordDraft.org,null,'discovery feed name must not be presented as the opportunity owner');
 assert.deepEqual(grant.source.discoveryProviders,['Example Foundation']);
 assert.equal(grant.recordDraft.eligibility,'parcial');
 assert.match(grant.recordDraft.scope,/open to journalists worldwide/);
 assert.equal(grant.recordDraft.status,'aberta');
 assert(grant.missingFields.includes('summary'));
 const dataset=out.drafts.find(x=>x.category==='datasets');
 assert.equal(dataset.recordDraft.api,'https://example.org/download.csv');
 assert.equal(dataset.recordDraft.format,'text/csv');
 assert.match(dataset.recordDraft.limitations,/não detalha todas as limitações/);
 const tool=out.drafts.find(x=>x.category==='tools');
 assert.equal(tool.recordDraft.kind,'Mapping');
 assert.match(tool.recordDraft.desc,/Software lets journalists create interactive maps/);
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


test('complete opportunity evidence creates a machine approval that the publisher accepts',()=>{
 const now=new Date(),checkedAt=now.toISOString();
 const page='Global storytelling competition. Esri invites storytellers age 18 and up to answer that question. Submit a story created with ArcGIS StoryMaps that addresses one of the following categories. SUBMISSION DEADLINE December 11, 2099, 5:00 p.m. (PT). Applicants 18 years and older globally may enter the competition once in one of four categories. Esri will award selected winners and feature their work.';
 const q={updatedAt:checkedAt,candidates:[{id:'verified-arcgis-competition',title:'2026 ArcGIS StoryMaps Competition',url:'https://www.esri.com/en-us/arcgis/products/arcgis-storymaps/contest/overview',category:'opportunities',providers:[],audit:{pageTitle:'2026 ArcGIS StoryMaps Competition',pageDescription:'A 180 character official summary describing a global storytellers to submit an original geospatial story in the annual ArcGIS StoryMaps competition, with four entry categories and awards for selected winners.',httpStatus:200,contentType:'text/html',checkedAt,evidenceText:page,structuredData:[],resourceLinks:[]}}]};
 const review={records:[{id:'verified-arcgis-competition',category:'opportunities',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{callSignal:true,deadline:'2099-12-11',eligibility:true}}]};
 const drafts=buildDrafts(q,review,checkedAt);
 assert.equal(drafts.summary.drafts,1);assert.deepEqual(drafts.drafts[0].missingFields,[]);assert.equal(drafts.drafts[0].recordDraft.org,'Esri');assert.match(drafts.drafts[0].recordDraft.scope,/globally may enter/);assert.equal(drafts.drafts[0].recordDraft.fit,6);
 const built=buildAutomaticPublications(drafts,{approved:[]},now);
 assert.equal(built.summary.automaticallyApproved,1);
 const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-publish-e2e-'));
 try{
  fs.mkdirSync(path.join(tmp,'data'));
  for(const category of ['opportunities','datasets','tools','changelog'])fs.writeFileSync(path.join(tmp,'data',category+'.js'),'window.RADAR_PARTS.'+category+'=[];');
  const manifest=path.join(tmp,'approved.json');fs.writeFileSync(manifest,JSON.stringify(built.manifest));
  cp.execFileSync(process.execPath,[path.resolve('scripts/publish-approved.js'),manifest],{cwd:tmp,encoding:'utf8'});
  const vm=require('node:vm'),ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(tmp,'data/opportunities.js'),'utf8'),ctx);
  assert(ctx.window.RADAR_PARTS.opportunities.some(x=>x.id==='verified-arcgis-competition'));
 }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});

test('extracts an explicitly labeled organization from a funding page',()=>{
 const q={candidates:[{id:'gfmd-funding',title:'Knight-Wallace Fellowship',url:'https://gfmd.info/fundings/knight-wallace-fellowship-international-applicants',category:'opportunities',audit:{pageTitle:'Knight-Wallace Fellowship (International Applicants) - GFMD',pageDescription:'A fellowship for international journalists with a future application deadline and explicit eligibility.',httpStatus:200,contentType:'text/html',checkedAt:'2026-11-10T10:00:00Z',evidenceText:'Organisation: Wallace House Center for Journalists Status: Open Type: Fellowship Deadline: 2099-12-01 Eligibility: International journalists. The fellowship supports ambitious journalism projects.',structuredData:[],resourceLinks:[]}}]};
 const review={records:[{id:'gfmd-funding',category:'opportunities',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{callSignal:true,deadline:'2099-12-01',eligibility:true}}]};
 const out=buildDrafts(q,review,'2026-11-10T10:00:00Z');
 assert.equal(out.drafts[0].recordDraft.org,'Wallace House Center for Journalists');
 const unlabeled={...q,candidates:[{...q.candidates[0],id:'gfmd-unlabeled',audit:{...q.candidates[0].audit,evidenceText:'Organization University of Michigan Focus Area Professional Development Deadline 2099-12-01 Eligibility: international journalists.'}}]};
 const unlabeledReview={records:[{id:'gfmd-unlabeled',category:'opportunities',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{callSignal:true,deadline:'2099-12-01',eligibility:true}}]};
 const unlabeledOut=buildDrafts(unlabeled,unlabeledReview,'2026-11-10T10:00:00Z');
 assert.equal(unlabeledOut.drafts[0].recordDraft.org,'University of Michigan');
});

test('official host institution and software identity do not inherit page slogans',()=>{
 const candidates=[
 {id:'primary-call',url:'https://official.example/fellowship',audit:{pageTitle:'Education Reporting Fellowship – Opportunity Desk',pageDescription:'A yearlong fellowship for education reporting based at Columbia Journalism School.',evidenceText:'Based at Columbia Journalism School. Eligibility: open to journalists worldwide.',checkedAt:new Date().toISOString(),httpStatus:200,contentType:'text/html'}},
 {id:'software-name',url:'https://www.figma.com/',audit:{pageTitle:'Figma: The collaborative canvas',evidenceText:'Collaborative design platform. Documentation available online.',structuredData:[{'@type':'SoftwareApplication',name:'Figma',description:'Collaborative design platform.'}],checkedAt:new Date().toISOString(),httpStatus:200,contentType:'text/html'}}
 ];
 const records=candidates.map((x,i)=>({id:x.id,category:i?'tools':'opportunities',decision:'evidence_complete_for_record_draft',publicationReady:false,checks:{deadline:'2099-12-31',callSignal:true}}));
 const out=buildDrafts({candidates},{records});
 assert.equal(out.drafts[0].recordDraft.org,'Columbia Journalism School');
 assert.equal(out.drafts[0].recordDraft.title,'Education Reporting Fellowship');
 assert.equal(out.drafts[1].recordDraft.name,'Figma');
});
