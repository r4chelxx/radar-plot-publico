'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {reconcileHistory}=require('../scripts/reconcile-published-history');
test('exact public catalog matches reconcile publication status with traceable proof',()=>{
 const before={schemaVersion:1,updatedAt:'2026-11-09T00:00:00Z',leads:{
  tool:{url:'https://example.org/tool/',editorialStatus:'unverified',title:'Tool'},
  other:{url:'https://example.org/other',editorialStatus:'unverified',title:'Other'},
  rejected:{url:'https://example.org/rejected',editorialStatus:'rejected',title:'Rejected'}
 }};
 const catalogs={tools:[{id:'official-tool',url:'https://example.org/tool',name:'Tool'}],opportunities:[],datasets:[]};
 const out=reconcileHistory(before,catalogs,'2026-11-09T12:00:00Z');
 assert.equal(out.history.leads.tool.editorialStatus,'published');
 assert.deepEqual(out.history.leads.tool.publicationVerification,{type:'observed-live-catalog-membership',category:'tools',recordId:'official-tool',officialUrl:'https://example.org/tool',observedAt:'2026-11-09T12:00:00Z'});
 assert.equal(out.history.leads.other.editorialStatus,'unverified');
 assert.equal(out.history.leads.rejected.editorialStatus,'rejected');
 assert.equal(out.summary.markedPublished,1);
 assert.equal(out.summary.conflicts.length,1);
});
test('already published records receive an observation proof without a fake editorial review',()=>{
 const before={leads:{x:{url:'https://example.org/dataset',editorialStatus:'published',reviewedBy:null,editorialEvidence:null}}};
 const out=reconcileHistory(before,{datasets:[{id:'d1',url:'https://example.org/dataset'}]},'2026-11-09T13:00:00Z');
 assert.equal(out.history.leads.x.editorialStatus,'published');
 assert.equal(out.history.leads.x.reviewedBy,null);
 assert.equal(out.history.leads.x.editorialEvidence,null);
 assert.equal(out.summary.proofRefreshed,1);
});
