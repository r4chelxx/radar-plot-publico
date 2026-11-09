#!/usr/bin/env node
'use strict';
// Build traceable catalog-record drafts from complete source reviews.
// Drafts are not approvals and can never be used as the approved-publications manifest.
const fs=require('node:fs');

const categoryFields={
 opportunities:['title','org','summary','type','themes','scope','deadline','deadlineStatus','eligibility','fit','status','rules'],
 datasets:['name','org','territoryTier','kind','themes','coverage','frequency','format','period','granularity','geoUnit','api','docs','limitations','lastChecked','url','description'],
 tools:['name','kind','url','desc']
};
const slug=value=>String(value||'candidate').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'candidate';
const sentence=(text,re)=>String(text||'').split(/(?<=[.!?])\s+/).find(x=>re.test(x))?.trim().slice(0,700)||null;
const clean=x=>String(x||'').replace(/\s+/g,' ').trim();
function structured(audit,pattern){
 return (audit.structuredData||[]).find(x=>String(Array.isArray(x['@type'])?x['@type'].join(' '):x['@type']||'').toLowerCase().match(pattern))||{};
}
function buildDrafts(queue,review,generatedAt=new Date().toISOString()){
 const candidates=new Map((queue.candidates||[]).map(x=>[x.id,x]));
 const eligible=(review.records||[]).filter(x=>x.decision==='evidence_complete_for_record_draft'&&x.publicationReady===false&&candidates.has(x.id));
 const drafts=eligible.map(result=>{
  const candidate=candidates.get(result.id),audit=candidate.audit||{},text=clean(audit.evidenceText),url=candidate.url;
  const pageTitle=clean(audit.pageTitle||candidate.title);
  const organization=structured(audit,/organization|dataset|softwareapplication|softwareproduct/i);
  const publisher=organization.publisher||organization.author||{};
  const org=clean(typeof publisher==='string'?publisher:publisher.name)||null;
  const discoveryProviders=(candidate.providers||[]).map(clean).filter(Boolean);
  const id=slug(candidate.id||url);
  const record={id};
  if(result.category==='opportunities'){
   record.title=pageTitle;record.org=org;
   record.summary=null;record.type=null;record.themes=[];
   record.scope=sentence(text,/(eligible|eligibility|who can apply|open to|elegibilidade|elegível|podem se candidatar)/i);
   record.deadline=result.checks.deadline||null;
   record.deadlineStatus=result.checks.deadline?'Date found in primary-page evidence; time zone and call context require review.':null;
   record.eligibility=record.scope;
   record.fit=null;record.status=null;record.rules=url;record.apply=url;
  }else if(result.category==='datasets'){
   const data=structured(audit,/dataset/i);
   const formats=[data.encodingFormat,data.distribution?.encodingFormat].flat().filter(Boolean);
   record.name=pageTitle;record.org=org;record.territoryTier=null;record.kind=null;record.themes=[];
   record.coverage=sentence(text,/(?:\b20\d{2}\b|annual|monthly|municipal|national|global|covering|cobre|abrange)/i);
   record.frequency=null;
   record.format=clean(formats.join(', '))||sentence(text,/\b(csv|tsv|json|xml|parquet|shapefile|geojson|api)\b/i);
   record.period=null;record.granularity=null;record.geoUnit=null;
   const resource=(audit.resourceLinks||[]).find(x=>/^https:\/\//i.test(x.url||''));
   const distribution=data.distribution||{};
   record.api=distribution.contentUrl||distribution.url||resource?.url||null;
   record.docs=url;record.limitations=null;record.lastChecked=(audit.checkedAt||'').slice(0,10)||null;
   record.url=url;record.description=null;
  }else{
   const data=structured(audit,/softwareapplication|softwareproduct|software/i);
   const titleKind=pageTitle.split(/[-—–]/).slice(1).join(' ').trim()||null;
   const sourceDescription=clean(data.description)||sentence(text,/\b(?:tool|software|application|library|platform)\b/i);
   record.name=pageTitle;record.kind=clean(data.applicationCategory||titleKind)||null;record.url=url;
   record.desc=sourceDescription?sourceDescription+' Source note: the captured page does not state detailed usage limitations; consult the official documentation and license before use.':null;
  }
  const missingFields=categoryFields[result.category].filter(field=>{
   const value=record[field];return value==null||value===''||(Array.isArray(value)&&!value.length);
  });
  return {
   schemaVersion:1,id,category:result.category,status:'draft_only',publicationReady:false,
   source:{url,discoveryProviders,pageTitle,checkedAt:audit.checkedAt||null,httpStatus:audit.httpStatus??null,contentType:audit.contentType||null},
   evidence:{checks:result.checks||{},sourceExcerpt:text.slice(0,4000),structuredData:audit.structuredData||[],resourceLinks:audit.resourceLinks||[]},
   recordDraft:record,missingFields,reviewDecision:result.decision,
   note:'Ficha preliminar baseada no conteúdo capturado da página. Campos ausentes permanecem vazios; esta ficha não autoriza publicação.'
  };
 });
 const byCategory={opportunities:0,datasets:0,tools:0};
 for(const item of drafts)if(Object.hasOwn(byCategory,item.category))byCategory[item.category]++;
 return {schemaVersion:1,generatedAt,sourceQueueUpdatedAt:queue.updatedAt||null,policy:'Drafts only; evidence completeness is not editorial approval or publication authorization.',summary:{eligibleForDrafting:eligible.length,drafts:drafts.length,byCategory,publicationReady:0},drafts};
}
if(require.main===module){
 const queuePath=process.argv[2]||'intake/editorial-queue.json';
 const reviewPath=process.argv[3]||'intake/editorial-evidence-review.json';
 const outPath=process.argv[4]||'intake/publication-drafts.json';
 const result=buildDrafts(JSON.parse(fs.readFileSync(queuePath,'utf8')),JSON.parse(fs.readFileSync(reviewPath,'utf8')));
 fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result.summary));
}
module.exports={buildDrafts};
