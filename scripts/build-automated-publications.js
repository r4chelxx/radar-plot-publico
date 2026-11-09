#!/usr/bin/env node
'use strict';
// Convert only fresh, category-complete evidence drafts into machine-verified approvals.
const fs=require('node:fs'),crypto=require('node:crypto');
const sourceFields={
 opportunities:'rules',datasets:'url',tools:'url'
};
const requiredChecks={
 opportunities:['callSignal','eligibility'],
 datasets:['datasetSignal','directResource','format','coverage'],
 tools:['productSignal','function','access']
};
const requiredFields={
 opportunities:['title','org','summary','type','scope','deadline','deadlineStatus','eligibility','status','rules'],
 datasets:['name','org','territoryTier','kind','themes','coverage','frequency','format','period','granularity','geoUnit','api','docs','limitations','lastChecked','url','description'],
 tools:['name','kind','url','desc']
};
const safeUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!!u.hostname}catch{return false}};
const canonical=value=>{try{const u=new URL(value);u.hash='';u.hostname=u.hostname.toLowerCase();u.pathname=u.pathname.replace(/\/+$/,'')||'/';return u.toString()}catch{return ''}};
const complete=value=>value!=null&&value!==''&&(!Array.isArray(value)||value.length>0);
function buildAutomaticPublications(drafts,manual={approved:[]},now=new Date()){
 const manualItems=Array.isArray(manual.approved)?manual.approved:[];
 const knownIds=new Set(manualItems.map(x=>x.record?.id).filter(Boolean));
 const knownUrls=new Set(manualItems.map(x=>canonical(x.record?.url||x.record?.rules)).filter(Boolean));
 const approved=[],skipped={notDraft:0,staleSource:0,missingFields:0,failedEvidenceChecks:0,duplicate:0};
 for(const draft of drafts.drafts||[]){
  if(draft.status!=='draft_only'||draft.publicationReady!==false||draft.reviewDecision!=='evidence_complete_for_record_draft'){skipped.notDraft++;continue}
  const category=draft.category,record=draft.recordDraft||{},checks=draft.evidence?.checks||{},source=draft.source||{},excerpt=String(draft.evidence?.sourceExcerpt||'');
  if(!requiredFields[category]||!sourceFields[category]){skipped.failedEvidenceChecks++;continue}
  if(!safeUrl(source.url)||source.httpStatus!==200||!/^text\/html\b/i.test(source.contentType||'')||excerpt.length<25){skipped.failedEvidenceChecks++;continue}
  const checked=Date.parse(source.checkedAt||''),age=now.getTime()-checked;
  if(!Number.isFinite(checked)||age<0||age>24*60*60*1000){skipped.staleSource++;continue}
  if((draft.missingFields||[]).length||requiredFields[category].some(field=>!complete(record[field]))){skipped.missingFields++;continue}
  if(!requiredChecks[category].every(key=>checks[key]===true)){skipped.failedEvidenceChecks++;continue}
  if(category==='opportunities'){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(record.deadline)||record.deadline<now.toISOString().slice(0,10)||!safeUrl(record.rules)||!record.eligibility){skipped.failedEvidenceChecks++;continue}
  }else if(category==='datasets'){
   if(!safeUrl(record.url)||!safeUrl(record.api)||!safeUrl(record.docs)){skipped.failedEvidenceChecks++;continue}
  }else if(category==='tools'){
   if(!safeUrl(record.url)||String(record.desc).length<70){skipped.failedEvidenceChecks++;continue}
  }
  const sourceField=sourceFields[category],recordUrl=record[sourceField];
  if(!safeUrl(recordUrl)||new URL(recordUrl).hostname!==new URL(source.url).hostname){skipped.failedEvidenceChecks++;continue}
  const identity=canonical(recordUrl);
  if(knownIds.has(record.id)||knownUrls.has(identity)){skipped.duplicate++;continue}
  knownIds.add(record.id);knownUrls.add(identity);
  approved.push({category,record,review:{
   decision:'approved',reviewedBy:'Radar evidence gate v1',reviewedAt:source.checkedAt.slice(0,10),
   reviewPolicyVersion:'radar-evidence-v1',officialUrl:source.url,checkedAt:source.checkedAt,evidence:excerpt,
   evidenceHash:crypto.createHash('sha256').update(excerpt).digest('hex'),
   sourceStatus:source.httpStatus,contentType:source.contentType,evidenceChecks:checks
  }});
 }
 return {manifest:{schemaVersion:1,policy:'Human approvals plus deterministic evidence-gate v1 approvals. Each automated approval is source-linked and independently validated by the publisher.',approved:[...manualItems,...approved]},summary:{manualApproved:manualItems.length,automaticallyApproved:approved.length,byCategory:Object.fromEntries(['opportunities','datasets','tools'].map(category=>[category,approved.filter(x=>x.category===category).length])),skipped}};
}
if(require.main===module){
 const [draftPath,manualPath,outPath]=process.argv.slice(2);
 if(!draftPath||!manualPath||!outPath)throw Error('Usage: build-automated-publications.js DRAFTS MANUAL_MANIFEST OUTPUT');
 const result=buildAutomaticPublications(JSON.parse(fs.readFileSync(draftPath,'utf8')),JSON.parse(fs.readFileSync(manualPath,'utf8')));
 fs.writeFileSync(outPath,JSON.stringify(result.manifest,null,2)+'\n');
 console.log(JSON.stringify(result.summary));
}
module.exports={buildAutomaticPublications};
