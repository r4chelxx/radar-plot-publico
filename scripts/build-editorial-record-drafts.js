#!/usr/bin/env node
'use strict';
// Build traceable catalog-record drafts from complete source reviews.
// Drafts are not approvals; only the independent evidence gate can authorize publication.
const fs=require('node:fs');
const categoryFields={
 opportunities:['title','org','summary','type','themes','scope','deadline','deadlineStatus','eligibility','status','rules'],
 datasets:['name','org','territoryTier','kind','themes','coverage','frequency','format','period','granularity','geoUnit','api','docs','limitations','lastChecked','url','description'],
 tools:['name','kind','url','desc']
};
const slug=value=>String(value||'candidate').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80)||'candidate';
const sentence=(text,re)=>String(text||'').split(/(?<=[.!?])\s+/).find(x=>re.test(x))?.trim().slice(0,900)||null;
const clean=x=>String(x||'').replace(/\s+/g,' ').trim();
const unknown='Não informado pela fonte oficial';
function structured(audit,pattern){
 return (audit.structuredData||[]).find(x=>String(Array.isArray(x['@type'])?x['@type'].join(' '):x['@type']||'').toLowerCase().match(pattern))||{};
}
function publisherName(data){
 const raw=data.publisher||data.author||data.creator||data.provider||{};
 const type=String(Array.isArray(data['@type'])?data['@type'].join(' '):data['@type']||'').toLowerCase();
 return clean(typeof raw==='string'?raw:raw.name)||(/organization/.test(type)?clean(data.name):'')||null;
}
function explicitOrganization(text){
 const m=String(text||'').match(/(?:^|[.!?]\s+)(?:The\s+)?([A-Z][A-Za-z0-9&.'’-]*(?:\s+[A-Z][A-Za-z0-9&.'’-]*){0,3})\s+(?:invites|is pleased to announce|announces)\b/);
 return clean(m?.[1])||null;
}
function eligibilityScope(text){
 return sentence(text,/applicants?[^.!?]{0,180}(?:globally|worldwide|world-wide)[^.!?]*(?:may enter|can apply|eligible)/i)
  ||sentence(text,/(eligible|eligibility|who can (?:apply|enter|participate)|participants must|entry requirements|age(?:d)? 18 and up|18 years and older|globally may enter|open to|elegibilidade|elegível|podem se candidatar)/i);
}
function evidenceSummary(text,description){
 const meta=clean(description);
 if(meta.length>=120)return meta.slice(0,1200);
 const matches=String(text||'').split(/(?<=[.!?])\s+/).filter(x=>/(grant|fellowship|funding|award|scholarship|prize|contest|competition|application|deadline|eligib|journalism|reporting|bolsa|edital|inscri[cç][aã]o|jornalismo)/i.test(x));
 const value=clean(matches.join(' '));
 return value.length>=120?value.slice(0,1200):null;
}
function toolKind(text,applicationCategory,titleKind){
 if(applicationCategory)return clean(applicationCategory);
 if(titleKind)return clean(titleKind);
 if(/programming language/i.test(text))return 'linguagem de programação';
 if(/statistical computing|statistical analysis/i.test(text))return 'computação estatística e análise de dados';
 if(/data analytics|business intelligence/i.test(text))return 'plataforma de análise de dados';
 if(/mapping|maps|cartography|mapeamento/i.test(text))return 'mapeamento e cartografia';
 if(/data visualization|data visuali[sz]ation/i.test(text))return 'visualização de dados';
 return null;
}
function todayBahia(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
}
function buildDrafts(queue,review,generatedAt=new Date().toISOString()){
 const candidates=new Map((queue.candidates||[]).map(x=>[x.id,x]));
 const eligible=(review.records||[]).filter(x=>x.decision==='evidence_complete_for_record_draft'&&x.publicationReady===false&&candidates.has(x.id));
 const drafts=eligible.map(result=>{
  const candidate=candidates.get(result.id),audit=candidate.audit||{},rawText=clean(audit.evidenceText),text=clean([rawText,audit.pageDescription].filter(Boolean).join(' ')),url=candidate.url;
  const pageTitle=clean(audit.pageTitle||candidate.title);
  const organization=structured(audit,/organization|dataset|softwareapplication|softwareproduct/i);
  const org=publisherName(organization)||null;
  const id=slug(candidate.id||url);
  const record={id};
  if(result.category==='opportunities'){
   record.title=pageTitle;record.org=org||explicitOrganization(text);
   record.summary=evidenceSummary(text,audit.pageDescription);
   const typeMatch=/(fellowship|grant|scholarship|award|prize|contest|competition|bolsa|edital|premia[cç][aã]o)/i.exec(pageTitle+' '+text);
   record.type=typeMatch?typeMatch[0]:'Chamada editorial com financiamento ou prêmio';
   const topicMap=[[/climate|environment|clima|ambiental/i,'Meio ambiente'],[/data journalism|data visualization|dados|visualiza[cç][aã]o/i,'Jornalismo de dados'],[/investigativ|investiga[cç][aã]o/i,'Jornalismo investigativo'],[/gender|women|gênero|mulheres/i,'Gênero'],[/photo|fotografia/i,'Fotografia'],[/journalism|journalist|jornalismo|jornalista/i,'Jornalismo']];
   record.themes=[...new Set(topicMap.filter(([rx])=>rx.test(pageTitle+' '+text)).map(([,label])=>label))];
   if(!record.themes.length)record.themes=['Oportunidades editoriais'];
   record.scope=eligibilityScope(text);
   record.deadline=result.checks.deadline||null;
   record.deadlineStatus=record.deadline?'Confirmado na página oficial; fuso horário não informado.':null;
   record.eligibility=record.scope?'parcial':null;
   record.status=record.deadline&&record.deadline>=todayBahia()&&result.checks.callSignal?'aberta':null;
   record.rules=url;record.apply=url;
  }else if(result.category==='datasets'){
   const data=structured(audit,/dataset/i),formats=[data.encodingFormat,data.distribution?.encodingFormat].flat().filter(Boolean);
   const lower=text.toLowerCase();
   record.name=pageTitle;record.org=org;
   record.territoryTier=/\b(global|worldwide|international|globalmente)\b/.test(lower)?'Global':/\b(national|countrywide|nacional)\b/.test(lower)?'Nacional':/\b(statewide|state|estadual)\b/.test(lower)?'Estadual':/\b(municipal|citywide|cidade)\b/.test(lower)?'Municipal':'Outros';
   record.kind=/catalog|catálogo/i.test(pageTitle+' '+text)?'catalog':/portal/i.test(pageTitle+' '+text)?'portal':/system/i.test(pageTitle+' '+text)?'system':'dataset';
   record.themes=['Dados abertos'];
   record.coverage=sentence(text,/(?:\b20\d{2}\b|annual|monthly|municipal|national|global|covering|cobre|abrange)/i)||clean(audit.pageDescription)||null;
   record.frequency=sentence(text,/(?:update frequency|updated|monthly|annual|quarterly|atualiza[cç][aã]o|mensal|anual|trimestral)/i)||unknown;
   record.format=clean(formats.join(', '))||sentence(text,/\b(csv|tsv|json|xml|parquet|shapefile|geojson|api)\b/i);
   record.period=clean(data.temporalCoverage)||sentence(text,/\b20\d{2}\b.{0,30}\b20\d{2}\b/i)||unknown;
   record.granularity=sentence(text,/(?:record-level|individual records|row-level|granular|microdata|microdados|nível de registro)/i)||unknown;
   record.geoUnit=clean(data.spatialCoverage)||sentence(text,/(?:municipal|city|county|state|province|national|global|munic[ií]pio|estado|pa[ií]s)/i)||unknown;
   const resource=(audit.resourceLinks||[]).find(x=>/^https:\/\//i.test(x.url||'')),distribution=data.distribution||{};
   record.api=distribution.contentUrl||distribution.url||resource?.url||null;
   record.docs=url;
   record.limitations='A página consultada não detalha todas as limitações, a atualização e a qualidade do recurso; conferir documentação e licença antes do uso editorial.';
   record.lastChecked=(audit.checkedAt||'').slice(0,10)||null;
   record.url=url;record.description=clean(data.description)||clean(audit.pageDescription)||sentence(text,/(?:dataset|data|dados|records|statistics|estat[ií]sticas)/i)||null;
  }else{
   const data=structured(audit,/softwareapplication|softwareproduct|software/i);
   const titleKind=pageTitle.split(/[-—–]/).slice(1).join(' ').trim()||null;
   const sourceDescription=clean(data.description)||clean(audit.pageDescription)||sentence(text,/\b(?:tool|software|application|library|platform|programming language|statistical computing|data analytics)\b/i);
   record.name=pageTitle;record.kind=toolKind(text,data.applicationCategory,titleKind);record.url=url;
   record.desc=sourceDescription?sourceDescription+' Source note: detailed usage limitations are not fully stated in the captured page; consult official documentation and license before use.':null;
  }
  const missingFields=(categoryFields[result.category]||[]).filter(field=>{
   const value=record[field];return value==null||value===''||(Array.isArray(value)&&!value.length);
  });
  return {
   schemaVersion:1,id,category:result.category,status:'draft_only',publicationReady:false,
   source:{url,discoveryProviders:(candidate.providers||[]).map(clean).filter(Boolean),pageTitle,checkedAt:audit.checkedAt||null,httpStatus:audit.httpStatus??null,contentType:audit.contentType||null},
   evidence:{checks:result.checks||{},sourceExcerpt:rawText.slice(0,4000),structuredData:audit.structuredData||[],resourceLinks:audit.resourceLinks||[]},
   recordDraft:record,missingFields,reviewDecision:result.decision,
   note:'Ficha preliminar baseada no conteúdo capturado da página. Campos sem evidência permanecem ausentes; a aprovação depende do gate independente de publicação.'
  };
 });
 const byCategory={opportunities:0,datasets:0,tools:0};
 for(const item of drafts)if(Object.hasOwn(byCategory,item.category))byCategory[item.category]++;
 return {schemaVersion:1,generatedAt,sourceQueueUpdatedAt:queue.updatedAt||null,policy:'Evidence-complete drafts only; the separate deterministic evidence gate must independently approve before publication.',summary:{eligibleForDrafting:eligible.length,drafts:drafts.length,byCategory,publicationReady:0},drafts};
}
if(require.main===module){
 const queuePath=process.argv[2]||'intake/editorial-queue.json',reviewPath=process.argv[3]||'intake/editorial-evidence-review.json',outPath=process.argv[4]||'intake/publication-drafts.json';
 const result=buildDrafts(JSON.parse(fs.readFileSync(queuePath,'utf8')),JSON.parse(fs.readFileSync(reviewPath,'utf8')));
 fs.writeFileSync(outPath,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify(result.summary));
}
module.exports={buildDrafts};
