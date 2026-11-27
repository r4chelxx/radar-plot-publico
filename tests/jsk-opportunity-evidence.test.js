'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {reviewCandidate}=require('../scripts/review-editorial-evidence');
const {buildDrafts}=require('../scripts/build-editorial-record-drafts');
const {buildAutomaticPublications}=require('../scripts/build-automated-publications');

test('an official application FAQ completes a fellowship record from page evidence',()=>{
 const url='https://jsk.stanford.edu/become-a-fellow/faq';
 const at='2026-11-27T19:00:00.000Z';
 const evidence=[
  'Applications for the 2027-28 fellowships are now open.',
  'The deadline is 1 p.m., Pacific time, Dec. 2, 2099.',
  'Who may apply? U.S. and international journalists, people in operations or strategy roles in news organizations, and people working with journalism support organizations.',
  'You need at least five years of professional experience. A college degree or experience inside a traditional newsroom is not required.',
  'The John S. Knight Journalism Fellowships provide a stipend and nine months at Stanford University.'
 ].join(' ');
 const candidate={
  id:'jsk-fellowship',category:'opportunities',status:'pending',title:'Become a fellow',
  url,audit:{
   finalUrl:url,httpStatus:200,contentType:'text/html; charset=utf-8',checkedAt:at,
   pageTitle:'Application FAQ',pageDescription:'The updated FAQ for the John S. Knight Journalism Fellowships explains the stipend, tuition, health insurance, family support and application checklist.',
   evidenceText:evidence,structuredData:[],structuredEvidence:{organization:'John S. Knight Journalism Fellowships'}
  }
 };
 const reviewed=reviewCandidate(candidate);
 assert.equal(reviewed.category,'opportunities');
 assert.equal(reviewed.checks.deadline,'2099-12-02');
 assert.equal(reviewed.checks.eligibility,true);
 assert.equal(reviewed.decision,'evidence_complete_for_record_draft');
 const drafts=buildDrafts({candidates:[candidate]},{records:[reviewed]},at);
 assert.equal(drafts.drafts.length,1);
 const draft=drafts.drafts[0];
 assert.equal(draft.recordDraft.title,'John S. Knight Journalism Fellowships');
 assert.equal(draft.recordDraft.org,'John S. Knight Journalism Fellowships');
 assert.match(draft.recordDraft.scope,/U\.S\. and international journalists/);
 assert.deepEqual(draft.missingFields,[]);
 const published=buildAutomaticPublications(drafts,{approved:[]},new Date('2026-11-27T19:01:00.000Z'));
 assert.equal(published.summary.automaticallyApproved,1);
 assert.equal(published.manifest.approved[0].record.title,'John S. Knight Journalism Fellowships');
});
