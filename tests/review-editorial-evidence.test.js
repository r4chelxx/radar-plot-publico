#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-evidence-review-'));
try{
 const queue=path.join(root,'queue.json'),out=path.join(root,'out.json');
 const item=(id,category,audit,url)=>({id,url:url||'https://example.org/'+id,category,status:'pending',audit:{httpStatus:200,contentType:'text/html',checkedAt:'2026-11-09T00:00:00Z',...audit}});
 const q={candidates:[
 item('grant','opportunities',{evidenceText:'Grant applications close 2099-12-31. Eligibility: who can apply is limited to journalists.',structuredData:[]}),
 item('structured-deadline','opportunities',{pageTitle:'Global Data Journalism Award',evidenceText:'Applications are open to journalists worldwide. Eligibility is stated on this page.',structuredData:[{'@type':'Event',name:'Global Data Journalism Award',endDate:'2099-12-31'}]}),
 item('fake-grant','opportunities',{evidenceText:'Welcome to our news blog about awards.',structuredData:[]}),
 item('dataset','datasets',{evidenceText:'',structuredData:[{'@type':'Dataset',name:'City data',license:'CC0',temporalCoverage:'2020/2025',distribution:{contentUrl:'https://example.org/data.csv',encodingFormat:'text/csv'}}]}),
 item('tool','tools',{pageTitle:'Mapping software',evidenceText:'Interactive mapping software that lets journalists create and share maps. Free plan available; paid tiers are described on the pricing page.',structuredData:[]}),
 item('design-tool','tools',{pageTitle:'Figma',evidenceText:'Figma is a collaborative design and prototyping platform. Create, share and review designs online.',structuredData:[]}),
 item('python-metadata','tools',{pageTitle:'Python',pageDescription:'Python is a programming language that lets you work quickly. Free and open source.',evidenceText:'',structuredData:[]}),
 item('contest-entries','opportunities',{pageTitle:'2026 Data Journalism Competition',evidenceText:'Competition entries close 2099-12-31. Who can participate: journalists worldwide.',structuredData:[]}),
 item('arcgis-competition','opportunities',{pageTitle:'2026 ArcGIS StoryMaps Competition',pageDescription:'Esri invites global storytellers to submit an original geospatial story for its annual ArcGIS StoryMaps competition, with four award categories and public recognition for selected winners.',evidenceText:'Global storytelling competition. Esri invites storytellers age 18 and up to answer that question. Submit a story created with ArcGIS StoryMaps that addresses one of the following categories. SUBMISSION DEADLINE December 11, 2026, 5:00 p.m. (PT). Applicants 18 years and older globally may enter the competition once in one of four categories.',structuredData:[]}),
 item('dataset-text-only','datasets',{pageTitle:'Open Data Catalog',evidenceText:'Download municipal CSV files covering 2020–2025. API access and usage terms are documented.',structuredData:[],resourceLinks:[{url:'https://example.org/api/municipal.csv',label:'Download municipal CSV'}]}),
 item('dataset-without-resource','datasets',{pageTitle:'Open Data Catalog',evidenceText:'Download municipal CSV files covering 2020–2025. API access and usage terms are documented.',structuredData:[]}),
 item('maintenance-date','opportunities',{pageTitle:'Global Reporting Fellowship',evidenceText:'Applications for this fellowship are open to journalists. The website deadline for maintenance is 2099-12-31. Eligibility: open to journalists worldwide.',structuredData:[]}),
 item('uncategorized-call','uncategorized',{pageTitle:'Global Reporting Fellowship',evidenceText:'Applications for this fellowship close 31/12/2099. Eligibility: open to journalists worldwide.',structuredData:[]}),
 item('event-false-positive','uncategorized',{pageTitle:'Data Journalism Conference',evidenceText:'Conference awards ceremony and event registration.',structuredData:[]}),
 item('unrelated-date','opportunities',{pageTitle:'Global Reporting Fellowship',evidenceText:'The fellowship supports journalists. Deadline details will be announced soon. The program celebrates its 2099 anniversary. Eligibility: open to journalists worldwide.',structuredData:[]}),
 item('tool-guide','tools',{pageTitle:'Chart types guide',evidenceText:'A guide to chart software. Create interactive charts and dashboards. Free access.',structuredData:[]},'https://datawrapper.de/blog/chart-types-guide'),
 item('tool-newsroom','tools',{pageTitle:'The Markup',evidenceText:'Our newsroom uses tools for investigations and supports data visualization. Free resources are available.',structuredData:[]},'https://themarkup.org/'),
 item('tool-launch-article','uncategorized',{pageTitle:'Press Gazette launches a tool for newsrooms',evidenceText:'The tool provides data visualization and lets users create interactive charts. Free access is available.',structuredData:[]},'https://pressgazette.example/2026/10/02/press-gazette-launches-a-tool'),
 item('creative-community','tools',{pageTitle:'CreativeApplications.Net – Technology, Society, and Critical Making',evidenceText:'A community of creative practitioners working at the intersection of art, media and technology. Published 4,232 articles and supported by 1,740 members.',structuredData:[]},'https://www.creativeapplications.net/'),
 item('poynter-course','tools',{pageTitle:'AI for Journalists and Content Creators',evidenceText:'A course and training program for journalists and content creators.',structuredData:[]},'https://www.poynter.org/shop/fact-checking-media-literacy/ai-for-journalists-and-content-creators-from-understanding-to-application'),
 item('agency-noise','tools',{pageTitle:'The Fix Research & Advisory',evidenceText:'Research advisory and consulting services for newsrooms.',structuredData:[]}),
 item('archive-noise','tools',{pageTitle:'News App Archives — ProPublica',evidenceText:'Archive of newsroom projects and applications.',structuredData:[]}),
 item('membership-noise','tools',{pageTitle:'Upgrade to an Indicator membership',evidenceText:'Membership plans and benefits for data access.',structuredData:[]}),
 item('academic-library-noise','tools',{pageTitle:'Academic Library',evidenceText:'Library catalog and research resources.',structuredData:[]})
 ]};
 fs.writeFileSync(queue,JSON.stringify(q));
 cp.execFileSync(process.execPath,[path.resolve('scripts/review-editorial-evidence.js'),queue,out],{encoding:'utf8'});
 const result=JSON.parse(fs.readFileSync(out));
 assert.equal(result.records.find(x=>x.id==='grant').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='structured-deadline').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='structured-deadline').checks.deadline,'2099-12-31');
 assert.equal(result.records.find(x=>x.id==='fake-grant').decision,'pending_more_evidence');
 assert.equal(result.records.find(x=>x.id==='dataset').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='tool').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='design-tool').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='tool').checks.licenseStatus,'not stated in captured source');
 assert.equal(result.records.find(x=>x.id==='python-metadata').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='contest-entries').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='arcgis-competition').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='arcgis-competition').checks.deadline,'2026-12-11');
 assert.equal(result.records.find(x=>x.id==='arcgis-competition').checks.eligibility,true);
 assert.equal(result.records.find(x=>x.id==='dataset-text-only').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='dataset-text-only').checks.licenseStatus,'not stated in captured source');
 assert.equal(result.records.find(x=>x.id==='dataset-without-resource').decision,'pending_more_evidence');
 assert.equal(result.records.find(x=>x.id==='dataset-without-resource').checks.directResource,false);
 assert.equal(result.records.find(x=>x.id==='maintenance-date').decision,'pending_more_evidence');
 assert.equal(result.records.find(x=>x.id==='maintenance-date').checks.deadline,null);
 assert.equal(result.records.find(x=>x.id==='uncategorized-call').category,'opportunities');
 assert.equal(result.records.find(x=>x.id==='uncategorized-call').decision,'evidence_complete_for_record_draft');
 assert.equal(result.records.find(x=>x.id==='event-false-positive').category,'uncategorized');
 assert.equal(result.records.find(x=>x.id==='unrelated-date').decision,'pending_more_evidence');
 for(const id of ['tool-guide','tool-newsroom','tool-launch-article']){assert.equal(result.records.find(x=>x.id===id).category,'uncategorized');assert.equal(result.records.find(x=>x.id===id).decision,'pending_more_evidence');}
 for(const id of ['agency-noise','archive-noise','membership-noise','academic-library-noise']){assert.equal(result.records.find(x=>x.id===id).category,'uncategorized');assert.equal(result.records.find(x=>x.id===id).decision,'pending_more_evidence');}
 for(const id of ['creative-community','poynter-course']){assert.equal(result.records.find(x=>x.id===id).category,'uncategorized');assert.equal(result.records.find(x=>x.id===id).decision,'pending_more_evidence');}
 assert(result.records.every(x=>x.publicationReady===false));
 console.log('Category evidence review regressions passed');
}finally{fs.rmSync(root,{recursive:true,force:true})}
