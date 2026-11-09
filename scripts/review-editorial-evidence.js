#!/usr/bin/env node
'use strict';
// Deterministic evidence triage. It never approves or publishes; it records category-specific
// evidence and missing requirements for the next, field-completion stage.
const fs=require('node:fs');
const queuePath=process.argv[2]||'intake/editorial-queue.json';
const outPath=process.argv[3]||'intake/editorial-evidence-review.json';
const q=JSON.parse(fs.readFileSync(queuePath,'utf8'));
const today=new Date().toISOString().slice(0,10);
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v||'');
function review(c){
 const a=c.audit||{}, text=(a.evidenceText||'').toLowerCase(), docs=a.structuredData||[];
 const ld=docs.map(x=>({type:flat(x['@type']).toLowerCase(),text:flat(x).toLowerCase(),data:x}));
 const checks={}, missing=[];
 let category=c.category||'uncategorized';
 if(category==='opportunities'){
  checks.callSignal=/\b(grant|fellowship|funding|award|prize|apply|application|inscri[cç][aã]o|edital|bolsa)\b/i.test(text);
  const dates=[...text.matchAll(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g)].map(m=>m[0].replaceAll('/','-'));
  checks.deadline=dates.find(d=>d>=today)||null;
  checks.eligibility=/\b(eligib|eligible|eligibility|who can apply|elegibilidade|elegível|podem se candidatar)\b/i.test(text);
  if(!checks.callSignal)missing.push('evidência textual de chamada');
  if(!checks.deadline)missing.push('prazo futuro legível na fonte');
  if(!checks.eligibility)missing.push('critérios de elegibilidade explícitos');
 }else if(category==='datasets'){
  const d=ld.find(x=>/dataset/.test(x.type));
  checks.structuredDataset=!!d;
  checks.directDistribution=!!(d?.data?.distribution&&flat(d.data.distribution).match(/https?:\/\//));
  checks.format=!!(d?.data?.distribution&&/csv|json|xml|parquet|zip|download|api/i.test(flat(d.data.distribution.encodingFormat)+' '+flat(d.data.distribution.contentUrl)));
  checks.coverage=!!(d?.data?.temporalCoverage||d?.data?.spatialCoverage);
  checks.license=!!(d?.data?.license);
  if(!checks.structuredDataset)missing.push('Schema.org Dataset da própria fonte');
  if(!checks.directDistribution)missing.push('download/API direto');
  if(!checks.format)missing.push('formato acessível');
  if(!checks.coverage)missing.push('cobertura temporal ou geográfica');
  if(!checks.license)missing.push('licença explícita');
 }else if(category==='tools'){
  const d=ld.find(x=>/softwareapplication|softwareproduct|software/.test(x.type));
  checks.structuredProduct=!!d;
  checks.function=!!(d?.data?.applicationCategory||d?.data?.featureList||d?.data?.description);
  checks.access=!!(d?.data?.offers||d?.data?.operatingSystem);
  checks.license=!!d?.data?.license;
  if(!checks.structuredProduct)missing.push('SoftwareApplication/SoftwareProduct na fonte');
  if(!checks.function)missing.push('função documentada');
  if(!checks.access)missing.push('acesso/compatibilidade ou oferta');
  if(!checks.license)missing.push('licença declarada');
 }else missing.push('categoria específica confirmada');
 const hardStatus=a.httpStatus===200&&/text\/html|application\/json/i.test(a.contentType||'');
 if(!hardStatus)missing.push('página primária acessível com conteúdo compatível');
 const enough=hardStatus&&missing.length===0;
 return{id:c.id,url:c.url,category,checkedAt:a.checkedAt||null,checks,missing,decision:enough?'evidence_complete_for_record_draft':'pending_more_evidence',publicationReady:false};
}
const records=(q.candidates||[]).filter(c=>c.status==='pending'&&c.audit).map(review);
const counts={};for(const x of records)counts[x.decision]=(counts[x.decision]||0)+1;
const out={generatedAt:new Date().toISOString(),policy:'Deterministic checks only; evidence_complete_for_record_draft is not approval or publication.',counts,records};
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({reviewed:records.length,counts,publicationReady:0}));
