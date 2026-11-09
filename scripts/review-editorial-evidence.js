#!/usr/bin/env node
'use strict';
// Conservative, evidence-based triage. "Complete" means eligible for record drafting only;
// it never grants publication approval.
const fs=require('node:fs');
const queuePath=process.argv[2]||'intake/editorial-queue.json';
const outPath=process.argv[3]||'intake/editorial-evidence-review.json';
const q=JSON.parse(fs.readFileSync(queuePath,'utf8'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v||'');
const excluded=/\b(conference|webinar|festival|newsletter|podcast|blog post|news article|event|symposium|perfil|profile|portfolio|directory|diretório)\b/i;
function inferCategory(c,text,title){
 const supplied=['opportunities','tools','datasets'].includes(c.category)?c.category:null;
 if(supplied)return supplied;
 if(excluded.test(title))return 'uncategorized';
 const url=String(c.url||'').toLowerCase();
 const opportunity=/(grant|fellowship|funding|award|prize|scholarship|bolsa|edital|call for applications|apply now)/i.test(title+' '+text);
 const deadline=/(deadline|closing date|close(?:s|d)?\\s+(?:on|by|\d)|applications?[^.!?]{0,60}clos(?:e|es|ed)|prazo|inscri[cç][aã]o(?:s)?[^.!?]{0,50}até)/i.test(text);
 const eligibility=/(eligib|who can apply|open to|elegibilidade|podem se candidatar)/i.test(text);
 if(opportunity&&deadline&&eligibility)return 'opportunities';
 const dataset=/(dataset|data catalog|open data|dados abertos|base de dados|microdata|microdados|data portal)/i.test(title+' '+text);
 const dataAccess=/(download|\.csv|\.json|\.zip|api endpoint|api access|bulk data|baixar|export data)/i.test(text+' '+url);
 if(dataset&&dataAccess)return 'datasets';
 const tool=/(software|tool|platform|application|library|framework|ferramenta|plataforma|biblioteca)/i.test(title+' '+text);
 const productFunction=/(visuali[sz]|map|chart|analy[sz]|scrap|geospatial|data processing|ferramenta|permite|enables|supports)/i.test(text);
 if(tool&&productFunction&& !/\/(?:blog|news|events?|conference|courses?)\b/i.test(url))return 'tools';
 return 'uncategorized';
}
function dateCandidates(text){
 const out=[];
 for(const m of text.matchAll(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g))out.push(m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'));
 for(const m of text.matchAll(/\b(0?[1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2})\b/g))out.push(m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'));
 return [...new Set(out)].filter(d=>{const x=new Date(d+'T00:00:00Z');return !Number.isNaN(x.valueOf())&&x.toISOString().slice(0,10)===d});
}
function review(c){
 const a=c.audit||{}, raw=String(a.evidenceText||''), text=raw.toLowerCase(), title=String(a.pageTitle||c.title||'').toLowerCase(), docs=a.structuredData||[];
 const ld=docs.map(x=>({type:flat(x['@type']).toLowerCase(),data:x}));
 const category=inferCategory(c,text,title),checks={},missing=[];
 const hardStatus=a.httpStatus===200&&/text\/html|application\/json/i.test(a.contentType||'');
 if(!hardStatus)missing.push('página primária acessível com conteúdo compatível');
 if(category==='opportunities'){
  checks.callSignal=/(grant|fellowship|funding|award|prize|scholarship|bolsa|edital|call for applications|apply now)/i.test(title+' '+text)&&!excluded.test(title);
  checks.deadline=dateCandidates(text).find(d=>d>=today)||null;
  checks.eligibility=/\b(eligib|eligible|eligibility|who can apply|open to|elegibilidade|elegível|podem se candidatar)\b/i.test(text);
  if(!checks.callSignal)missing.push('chamada de financiamento/bolsa identificável');
  if(!checks.deadline)missing.push('prazo futuro confirmado em formato de data reconhecido');
  if(!checks.eligibility)missing.push('elegibilidade expressa na fonte');
 }else if(category==='datasets'){
  const d=ld.find(x=>/dataset/.test(x.type))?.data;
  const distribution=d?.distribution;
  checks.datasetSignal=!!d||/(dataset|data catalog|open data|dados abertos|base de dados|microdata|microdados|data portal)/i.test(title+' '+text);
  checks.directResource=!!(distribution&&/https?:\/\//i.test(flat(distribution)))||/(download|\.csv|\.json|\.zip|api endpoint|api access|export data|baixar)/i.test(text+' '+c.url);
  checks.format=!!(distribution&&/(csv|json|xml|parquet|zip|api)/i.test(flat(distribution)))||/\b(csv|json|xml|parquet|shapefile|geojson)\b/i.test(text);
  checks.coverage=!!(d?.temporalCoverage||d?.spatialCoverage)||/(\b20\d{2}\b|annual|monthly|municipal|national|global|covering|cobre|abrange)/i.test(text);
  checks.license=!!(d?.license)||/(license|licen[çc]a|cc by|cc0|public domain|terms of use)/i.test(text);
  checks.licenseStatus=checks.license?'stated':'not stated in captured source';
  if(!checks.datasetSignal)missing.push('evidência de conjunto ou catálogo de dados');
  if(!checks.directResource)missing.push('download, API ou acesso direto ao recurso');
  if(!checks.format)missing.push('formato identificável');
  if(!checks.coverage)missing.push('cobertura temporal/geográfica');
 }else if(category==='tools'){
  const d=ld.find(x=>/softwareapplication|softwareproduct|software/.test(x.type))?.data;
  checks.productSignal=!!d||/(software|tool|platform|application|library|framework|ferramenta|plataforma|biblioteca)/i.test(title+' '+text);
  checks.function=!!(d?.applicationCategory||d?.featureList||d?.description)||/(visuali[sz]|map|chart|analy[sz]|scrap|geospatial|data processing|permite|enables|supports|documentation|documenta)/i.test(text);
  checks.access=!!(d?.offers||d?.operatingSystem)||/(free|open source|pricing|subscription|account|download|install|web app|browser|gratuito|licença|conta|preço|instala)/i.test(text);
  checks.license=!!d?.license||/(license|licen[çc]a|mit license|apache license|gpl|bsd license)/i.test(text);
  checks.licenseStatus=checks.license?'stated':'not stated in captured source';
  if(!checks.productSignal)missing.push('produto ou software identificável');
  if(!checks.function)missing.push('função documentada na fonte');
  if(!checks.access)missing.push('condições de acesso minimamente descritas');
 }else missing.push('categoria específica sem evidência suficiente');
 const enough=hardStatus&&missing.length===0;
 return{id:c.id,url:c.url,category,originalCategory:c.category||'uncategorized',checkedAt:a.checkedAt||null,checks,missing,decision:enough?'evidence_complete_for_record_draft':'pending_more_evidence',publicationReady:false};
}
const records=(q.candidates||[]).filter(c=>c.status==='pending'&&c.audit).map(review);
const counts={};for(const x of records)counts[x.decision]=(counts[x.decision]||0)+1;
const categoryCounts={};for(const x of records)categoryCounts[x.category]=(categoryCounts[x.category]||0)+1;
const out={generatedAt:new Date().toISOString(),policy:'Evidence-based category triage. Missing license is recorded as unknown when not found; complete means draft eligibility only, never approval or publication.',counts,categoryCounts,records};
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({reviewed:records.length,counts,categoryCounts,publicationReady:0}));
