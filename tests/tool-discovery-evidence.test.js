'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {reviewCandidate}=require('../scripts/review-editorial-evidence');
const {buildDrafts}=require('../scripts/build-editorial-record-drafts');
const {buildAutomaticPublications}=require('../scripts/build-automated-publications');
const {hasDocumentedToolFunction,isEditorialPage}=require('../scripts/tool-publication-evidence');

test('specific functions and access paths qualify real investigative tools without article evidence',()=>{
 const checkedAt='2026-11-27T19:00:00.000Z';
 const examples=[
  {
   id:'reverse-image-search',url:'https://decopy.ai/reverse-image',
   title:'Reverse Image Search - Find Similar Photos & Images Online',
   description:'Reverse Image Search lets you search by image on your phone or PC to find sources, similar images, faces, places, and more in seconds on Google, Bing, and more.'
  },
  {
   id:'planet-satellite-explorer',url:'https://ai.planet.com/signin',
   title:"Planet's agentic AI — Satellite Imagery Explorer",
   description:"Planet's agentic AI — explore, search, and analyze high-resolution satellite imagery on an interactive map."
  }
 ];
 const candidates=examples.map(x=>({
  id:x.id,category:'tools',status:'pending',title:x.title,url:x.url,
  audit:{finalUrl:x.url,httpStatus:200,contentType:'text/html; charset=utf-8',checkedAt,
   pageTitle:x.title,pageDescription:x.description,evidenceText:x.description,
   structuredData:[],structuredEvidence:{organization:x.id==='planet-satellite-explorer'?"Planet's agentic AI":'Decopy'}}
 }));
 const reviewed=candidates.map(reviewCandidate);
 assert.deepEqual(reviewed.map(x=>x.category),['tools','tools']);
 assert.deepEqual(reviewed.map(x=>x.decision),['evidence_complete_for_record_draft','evidence_complete_for_record_draft']);
 const drafts=buildDrafts({candidates},{records:reviewed},checkedAt);
 assert.equal(drafts.drafts.length,2);
 const decopy=drafts.drafts.find(x=>x.id==='reverse-image-search');
 const planet=drafts.drafts.find(x=>x.id==='planet-satellite-explorer');
 assert.equal(decopy.recordDraft.name,'Reverse Image Search');
 assert.equal(decopy.recordDraft.kind,'Pesquisa reversa de imagens');
 assert.equal(planet.recordDraft.kind,'Exploração e análise de imagens de satélite');
 for(const draft of drafts.drafts){
  assert.deepEqual(draft.missingFields,[]);
  assert.equal(hasDocumentedToolFunction(draft.recordDraft.desc),true);
  assert.equal(isEditorialPage(draft.recordDraft,{evidence:draft.evidence.sourceExcerpt}),false);
 }
 const now=new Date('2026-11-27T19:01:00.000Z');
 const published=buildAutomaticPublications(drafts,{approved:[]},now);
 assert.equal(published.summary.automaticallyApproved,2);
});
