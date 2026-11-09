'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const {buildAutomaticPublications}=require('../scripts/build-automated-publications');
const now=new Date(),checkedAt=now.toISOString();
const complete={id:'complete-tool',category:'tools',status:'draft_only',publicationReady:false,reviewDecision:'evidence_complete_for_record_draft',source:{url:'https://example.org/tool',httpStatus:200,contentType:'text/html',checkedAt},evidence:{sourceExcerpt:'Official product page describes the data analysis tool and access details.',checks:{productSignal:true,function:true,access:true}},missingFields:[],recordDraft:{id:'complete-tool',name:'Research data tool',kind:'data analysis',url:'https://example.org/tool',desc:'Official product page describes the data analysis tool and how journalists can use it. Limitations are not stated; check official docs and license.'}};
test('approves only fresh, complete, category-checked drafts and preserves item evidence',()=>{
 const stale={...complete,id:'stale-tool',recordDraft:{...complete.recordDraft,id:'stale-tool'},source:{...complete.source,checkedAt:new Date(now.getTime()-25*60*60*1000).toISOString()}};
 const incomplete={...complete,id:'incomplete-tool',recordDraft:{...complete.recordDraft,id:'incomplete-tool',desc:null},missingFields:['desc']};
 const failedCheck={...complete,id:'failed-tool',recordDraft:{...complete.recordDraft,id:'failed-tool'},evidence:{...complete.evidence,checks:{...complete.evidence.checks,function:false}}};
 const result=buildAutomaticPublications({drafts:[complete,stale,incomplete,failedCheck]},{approved:[]},now);
 assert.equal(result.summary.automaticallyApproved,1);
 assert.deepEqual(result.summary.byCategory,{opportunities:0,datasets:0,tools:1});
 assert.equal(result.summary.skipped.staleSource,1);
 assert.equal(result.summary.skipped.missingFields,1);
 assert.equal(result.summary.skipped.failedEvidenceChecks,1);
 const approval=result.manifest.approved[0];
 assert.equal(approval.review.reviewedBy,'Radar evidence gate v1');
 assert.equal(approval.review.officialUrl,complete.source.url);
 assert.equal(approval.review.evidenceHash,crypto.createHash('sha256').update(complete.evidence.sourceExcerpt).digest('hex'));
});
test('does not add a machine approval when a human approval already owns the same id or source',()=>{
 const human={category:'tools',record:{id:'complete-tool',url:'https://example.org/tool'},review:{decision:'approved'}};
 const result=buildAutomaticPublications({drafts:[complete]},{approved:[human]},now);
 assert.equal(result.summary.manualApproved,1);
 assert.equal(result.summary.automaticallyApproved,0);
 assert.equal(result.summary.skipped.duplicate,1);
});
