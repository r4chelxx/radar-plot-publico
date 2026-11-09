#!/usr/bin/env node
'use strict';
// Fail closed if generated cards diverge from evidence-complete review or resemble approvals.
const fs=require('node:fs');
const [queuePath,reviewPath,draftsPath]=process.argv.slice(2);
if(!queuePath||!reviewPath||!draftsPath)throw Error('Usage: validate-editorial-record-drafts.js QUEUE REVIEW DRAFTS');
const queue=JSON.parse(fs.readFileSync(queuePath,'utf8')),review=JSON.parse(fs.readFileSync(reviewPath,'utf8')),drafts=JSON.parse(fs.readFileSync(draftsPath,'utf8'));
const eligible=(review.records||[]).filter(x=>x.decision==='evidence_complete_for_record_draft'&&x.publicationReady===false);
const expected=new Set(eligible.map(x=>x.id)),candidates=new Map((queue.candidates||[]).map(x=>[x.id,x]));
const actual=new Set();
for(const item of drafts.drafts||[]){
 if(!expected.has(item.id)||actual.has(item.id))throw Error('Draft is not a unique evidence-complete review result: '+item.id);
 actual.add(item.id);
 if(item.status!=='draft_only'||item.publicationReady!==false||item.reviewDecision!=='evidence_complete_for_record_draft')throw Error('Draft cannot represent an approval: '+item.id);
 if(item.approved||item.decision==='approved'||item.review)throw Error('Draft contains an approval-shaped field: '+item.id);
 const candidate=candidates.get(item.id);
 if(!candidate||item.source?.url!==candidate.url)throw Error('Draft source does not match queue candidate: '+item.id);
 if(!/^https:\/\//.test(item.source.url||''))throw Error('Draft source must use HTTPS: '+item.id);
 if(item.evidence?.sourceExcerpt!==String(candidate.audit?.evidenceText||'').replace(/\s+/g,' ').trim().slice(0,4000))throw Error('Draft evidence excerpt mismatch: '+item.id);
 if(!Array.isArray(item.missingFields))throw Error('Draft must report missing fields: '+item.id);
}
if(actual.size!==expected.size)throw Error('Some evidence-complete candidates have no draft');
if(drafts.summary?.publicationReady!==0||drafts.summary?.drafts!==actual.size)throw Error('Draft summary is inconsistent');
console.log(JSON.stringify({drafts:actual.size,eligible:expected.size,publicationReady:0,valid:true}));
