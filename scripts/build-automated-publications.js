#!/usr/bin/env node
'use strict';
// Convert only fresh, category-complete evidence drafts into machine-verified approvals.
const fs=require('node:fs'),crypto=require('node:crypto');
const {rollingApplicationEvidence}=require('./editorial-page-evidence');
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
function buildAutomaticPublications(drafts,manual={approved:[]},now=new Date(),publishedOpportunities=[]){
 const localDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
 const automaticEnabled=process.env.RADAR_ENABLE_AUTOMATIC_PUBLICATION!=='false';
 const manualItems=Array.isArray(manual.approved)?manual.approved:[];
 if(!automaticEnabled)return {manifest:{schemaVersion:1,policy:'Manual approvals only while automatic publication is under reconstruction.',approved:manualItems},summary:{manualApproved:manualItems.length,automaticallyApproved:0,byCategory:{opportunities:0,datasets:0,tools:0},skipped:{automaticPublicationDisabled:true}}};
 const knownIds=new Set(manualItems.map(x=>x.record?.id).filter(Boolean));
 const knownUrls=new Set(manualItems.map(x=>canonical(x.record?.url||x.record?.rules)).filter(Boolean));
 const approved=[],skipped={notDraft:0,staleSource:0,missingFields:0,failedEvidenceChecks:0,duplicate:0};
 const programmeKey=record=>!record.deadline&&record.status==='aberta'&&String(record.title||'').length>=12&&record.org
  ?[record.title,record.org].map(value=>String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()).join('|'):null;
 const knownProgrammes=new Set([...publishedOpportunities,...manualItems.filter(x=>x.category==='opportunities').map(x=>x.record)].map(programmeKey).filter(Boolean));
 const publishedExact=new Set(publishedOpportunities.map(record=>String(record.id)+'|'+canonical(record.rules)));
 for(const draft of drafts.drafts||[]){
  if(draft.status!=='draft_only'||draft.publicationReady!==false||draft.reviewDecision!=='evidence_complete_for_record_draft'){skipped.notDraft++;continue}
  const category=draft.category,record=draft.recordDraft||{},checks=draft.evidence?.checks||{},source=draft.source||{},excerpt=String(draft.evidence?.sourceExcerpt||'');
  if(!requiredFields[category]||!sourceFields[category]){skipped.failedEvidenceChecks++;continue}
  if(!safeUrl(source.url)||source.httpStatus!==200||!/^text\/html\b/i.test(source.contentType||'')||excerpt.length<25){skipped.failedEvidenceChecks++;continue}
  const checked=Date.parse(source.checkedAt||''),age=now.getTime()-checked;
  if(!Number.isFinite(checked)||age<0||age>24*60*60*1000){skipped.staleSource++;continue}
  const rolling=category==='opportunities'&&checks.rolling===true&&rollingApplicationEvidence(excerpt)&&!record.deadline;
  const webAccess=category==='datasets'&&checks.webAccess===true&&/^HTML\b/i.test(record.format||'')&&draft.evidence?.tabularData?.some(x=>x.rows>=3&&x.columns>=2);
  if((draft.missingFields||[]).length||requiredFields[category].some(field=>!complete(record[field])&&!(field==='deadline'&&rolling)&&!(field==='api'&&webAccess))){skipped.missingFields++;continue}
  if(!requiredChecks[category].every(key=>checks[key]===true)){skipped.failedEvidenceChecks++;continue}
  if(category==='opportunities'){
   if((!rolling&&(!/^\d{4}-\d{2}-\d{2}$/.test(record.deadline)||record.deadline<localDay))||!safeUrl(record.rules)||!record.eligibility){skipped.failedEvidenceChecks++;continue}
  }else if(category==='datasets'){
   const datasetText=String(record.name||'')+' '+String(record.coverage||'')+' '+String(record.description||'')+' '+String(record.url||'');
   const datasetNoise=/(?:podcast|youtube|ranking|rankings|top ai companies|newsletter|blog|article|press release)/i.test(datasetText);
   if(datasetNoise||!safeUrl(record.url)||(!safeUrl(record.api)&&!webAccess)||!safeUrl(record.docs)){skipped.failedEvidenceChecks++;continue}
  }else if(category==='tools'){
   const identityText=String(record.name||'')+' '+String(record.kind||'');
   const description=String(record.desc||'');
   const types=(draft.evidence?.structuredData||[]).flatMap(x=>[].concat(x['@type']||[]));
   const editorialType=types.length>0&&types.every(x=>/^(?:Blog|BlogPosting|NewsArticle|Article|PodcastSeries|PodcastEpisode)$/i.test(x));
   const nonProduct=/\b(?:podcast|newsletter|article|course|training|conference|event|community|series|blog|publication)\b/i.test(identityText)
    ||/\b(?:is a blog|blog dedicated to|listen to .{0,180} on spotify)\b/i.test(description)||editorialType
    ||/podcasts?\.apple\.com|open\.spotify\.com\/(?:show|episode)\/|substack\.com|buttondown\.(?:email|com)\/[^/]+\/archive\/|\/news\/|\/blog\/|\/events?/i.test(String(record.url||''));
   if(nonProduct||/creativework|series|podcast|newsletter/i.test(String(record.kind||''))){skipped.failedEvidenceChecks++;continue;}
   if(!safeUrl(record.url)||String(record.desc).length<70){skipped.failedEvidenceChecks++;continue}
  }
  const sourceField=sourceFields[category],recordUrl=record[sourceField];
  if(!safeUrl(recordUrl)||new URL(recordUrl).hostname!==new URL(source.url).hostname){skipped.failedEvidenceChecks++;continue}
  const identity=canonical(recordUrl);
  const programme=category==='opportunities'?programmeKey(record):null;
  if(knownIds.has(record.id)||knownUrls.has(identity)||programme&&knownProgrammes.has(programme)&&!publishedExact.has(String(record.id)+'|'+identity)){skipped.duplicate++;continue}
  if(programme)knownProgrammes.add(programme);
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
 let published=[];
 if(fs.existsSync('data/opportunities.js')){const vm=require('node:vm'),ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('data/opportunities.js','utf8'),ctx);published=ctx.window.RADAR_PARTS.opportunities||[];}
 const result=buildAutomaticPublications(JSON.parse(fs.readFileSync(draftPath,'utf8')),JSON.parse(fs.readFileSync(manualPath,'utf8')),new Date(),published);
 fs.writeFileSync(outPath,JSON.stringify(result.manifest,null,2)+'\n');
 console.log(JSON.stringify(result.summary));
}
module.exports={buildAutomaticPublications};
