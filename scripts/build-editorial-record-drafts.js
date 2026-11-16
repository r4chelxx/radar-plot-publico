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
const decodeHtmlEntities=x=>String(x||'').replace(/&mdash;|&#8212;|&#x2014;/gi,'—').replace(/&ndash;|&#8211;|&#x2013;/gi,'–').replace(/&amp;/gi,'&').replace(/&quot;/gi,'\"').replace(/&#39;|&apos;/gi,"'");
const clean=x=>decodeHtmlEntities(String(x||'').replace(/\s+/g,' ').trim());
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
 const source=clean(text);
 const labeled=source.match(/(?:organisation|organization|organizer|organiser|funder|provider)\s*:\s*([^.!?]{2,160}?)(?=\s+(?:status|type|theme|deadline|eligibility|target region|application language|funding size|how to apply)\s*:|[.!?]|$)/i);
 if(labeled?.[1])return clean(labeled[1]);
 const unlabeled=source.match(/(?:organisation|organization|organizer|organiser|funder|provider)\s+([^.!?]{2,160}?)(?=\s+(?:status|type|theme|deadline|eligibility|target region|application language|funding size|how to apply|focus area|subject area|award size|career stage|editor'?s note|apply here|location|funding type)\b|[.!?]|$)/i);
 if(unlabeled?.[1])return clean(unlabeled[1]);
 const host=source.match(/\b(?:[Bb]ased at|[Hh]osted by|[Aa]dministered by|[Oo]rganized by|[Oo]rganised by|[Ss]ediad[ao] (?:na|no)|[Rr]ealizad[ao] pel[ao])\s+([A-Z][\w’'&-]*(?:\s+[A-Z][\w’'&-]*){0,7})/);
 if(host?.[1])return clean(host[1]);
 const m=source.match(/(?:^|[.!?]\s+)(?:The\s+)?([A-Z][A-Za-z0-9&.'’-]*(?:\s+[A-Z][A-Za-z0-9&.'’-]*){0,3})\s+(?:invites|is pleased to announce|announces)\b/);
 return clean(m?.[1])||null;
}
function eligibilityScope(text){
 const normalized=String(text||'').replace(/\bU\.S\./g,'US');
 const scope=sentence(normalized,/applicants?[^.!?]{0,180}(?:globally|worldwide|world-wide)[^.!?]*(?:may enter|can apply|eligible)/i)
  ||sentence(normalized,/(eligible|eligibility|who can (?:apply|enter|participate)|participants must|entry requirements|age(?:d)? 18 and up|18 years and older|globally may enter|open to|elegibilidade|elegível|podem se candidatar)/i);
 const restrictions=normalized.split(/(?<=[.!?])\s+/).filter(x=>/citizens?|green card|permanent residen|eligible countries|must (?:be|reside)|nacionalidade/i.test(x));
 return scope?[...new Set([scope,...restrictions])].join(' ').slice(0,2200):null;
}
function editorialFit(title,text){
 const evidence=String(title||'')+' '+String(text||'');
 let score=4;
 if(/data journalism|data visualization|investigative journalism|jornalismo de dados|jornalismo investigativo|visualização de dados/i.test(evidence))score+=2;
 else if(/journalis(?:m|ts?)|jornalismo|jornalistas?/i.test(evidence))score+=1;
 if(/mapping|maps|geospatial|cartograph|storymaps|mapeamento|cartografia/i.test(evidence))score+=1;
 if(/worldwide|globally|international|global(?:ly)?|mundial|globalmente/i.test(evidence))score+=1;
 return Math.min(10,score);
}
function evidenceSummary(text,description){
 const meta=clean(description);
 if(meta.length>=120)return meta.slice(0,1200);
 const matches=String(text||'').split(/(?<=[.!?])\s+/).filter(x=>!/(?:skip to|primary navigation|close menu|view full list)/i.test(x)&&/(grant|fellowship|funding|award|scholarship|prize|contest|competition|application|deadline|eligib|journalism|reporting|bolsa|edital|inscri[cç][aã]o|jornalismo)/i.test(x));
 const value=clean(matches.join(' '));
 return value.length>=120?value.slice(0,1200):null;
}
function toolKind(text,applicationCategory,titleKind){
 if(applicationCategory)return clean(applicationCategory);
 if(titleKind)return clean(titleKind);
 if(/\b(?:is an? R package for|pacote (?:do|para) R para)\b/i.test(text))return 'pacote R';
 if(/programming language/i.test(text))return 'linguagem de programação';
 if(/statistical computing|statistical analysis/i.test(text))return 'computação estatística e análise de dados';
 if(/data analytics|business intelligence/i.test(text))return 'plataforma de análise de dados';
 if(/mapping|maps|cartography|mapeamento/i.test(text))return 'mapeamento e cartografia';
 if(/data visualization|data visuali[sz]ation/i.test(text))return 'visualização de dados';
 return null;
}
function normalizeToolName(title,text,url){
 let value=clean(title).replace(/:\s*(?:the|your|a|an)\s+.*$/i,'').replace(/\s*[|—–]\s*.+$/,'').replace(/\s+-\s+.+$/,'').trim();
 const rules=[
  [/^welcome to python(?:\.org)?$/i,'Python'],
  [/^r:\s*the r project for statistical computing$/i,'R'],
  [/^the r project for statistical computing$/i,'R'],
  [/^pandas\s*[-–—:]\s*python data analysis library$/i,'pandas'],
  [/^power bi theme generator\b/i,'Power BI Theme Generator'],
  [/^plotly(?:\.js)?\s+for\s+python$/i,'Plotly para Python'],
  [/^microsoft power bi\b/i,'Microsoft Power BI'],
  [/^vega(?:\s*[-–—:].*)?$/i,'Vega'],
  [/^tableau(?:\s*[-–—:].*)?$/i,'Tableau'],
  [/^sigma(?:\s*[-–—:].*)?$/i,'Sigma'],
  [/^quanteda(?:\s*[-–—:].*)?$/i,'Quanteda'],
  [/^python record linkage toolkit documentation$/i,'Python Record Linkage Toolkit'],
 ];
 for(const [rx,name] of rules)if(rx.test(clean(title)))return name;
 const host=(()=>{try{return new URL(url).hostname.replace(/^www\./,'')}catch{return ''}})();
 if(host==='python.org'||host.endsWith('.python.org'))return 'Python';
 if(host==='r-project.org'||host.endsWith('.r-project.org'))return 'R';
 if(host==='pandas.pydata.org'||host.endsWith('.pandas.pydata.org'))return 'pandas';
 if(host==='github.com'||host.endsWith('.github.com')){
  const repo=String(new URL(url).pathname.split('/').filter(Boolean)[1]||'').toLowerCase();
  const known={tabulapdf:'TabulaPDF',maigret:'Maigret'};
  if(known[repo])return known[repo];
  return repo.replace(/[-_]+(.)/g,(_,c)=>' '+c.toUpperCase()).replace(/^./,c=>c.toUpperCase())||value||clean(title);
 }
 return value||clean(title);
}
function todayBahia(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
}
function buildDrafts(queue,review,generatedAt=new Date().toISOString()){
 const candidates=new Map((queue.candidates||[]).map(x=>[x.id,x]));
 const eligible=(review.records||[]).filter(x=>x.decision==='evidence_complete_for_record_draft'&&x.publicationReady===false&&candidates.has(x.id));
 const drafts=eligible.map(result=>{
  const candidate=candidates.get(result.id),audit=candidate.audit||{},rawText=clean(audit.evidenceText),text=clean([rawText,audit.pageDescription].filter(Boolean).join(' ')),url=audit.finalUrl||candidate.url;
  let pageTitle=clean(audit.pageTitle||candidate.title);
  if(result.category==='opportunities'&&/^(?:how to apply|about(?: the fellowship)?|application)$/i.test(pageTitle)){
   pageTitle=(rawText.match(/\b(?:[A-Z][\w’'&-]*\s+){1,8}(?:Fellowship|Grant|Award|Competition)\b(?:\s+for(?:\s+[A-Z][\w’'&-]*){1,5})?/)?.[0]||pageTitle).replace(/^The\s+/,'');
  }
  const organization=structured(audit,/organization|dataset|softwareapplication|softwareproduct/i);
  const org=publisherName(organization)||null;
  const id=slug(candidate.id||url);
  const record={id};
  if(result.category==='opportunities'){
   record.title=clean(pageTitle).replace(/\s*[-–—|]\s*(?:Opportunity Desk|GFMD|Grants for Journalists)\s*$/i,'');record.org=org||explicitOrganization(text);
   record.summary=evidenceSummary(text,audit.pageDescription);
   const typeMatch=/(fellowship|grant|scholarship|award|prize|contest|competition|bolsa|edital|premia[cç][aã]o)/i.exec(pageTitle+' '+text);
   record.type=typeMatch?typeMatch[0]:'Chamada editorial com financiamento ou prêmio';
   const topicMap=[[/climate|environment|clima|ambiental/i,'Meio ambiente'],[/data journalism|data visualization|dados|visualiza[cç][aã]o/i,'Jornalismo de dados'],[/investigativ|investiga[cç][aã]o/i,'Jornalismo investigativo'],[/gender|women|gênero|mulheres/i,'Gênero'],[/photo|fotografia/i,'Fotografia'],[/journalism|journalist|jornalismo|jornalista/i,'Jornalismo']];
   record.themes=[...new Set(topicMap.filter(([rx])=>rx.test(pageTitle+' '+text)).map(([,label])=>label))];
   if(!record.themes.length)record.themes=['Oportunidades editoriais'];
   record.scope=eligibilityScope(text);
   record.fit=editorialFit(pageTitle,text+' '+record.scope);
   record.deadline=result.checks.deadline||null;
   record.deadlineStatus=record.deadline?'Prazo confirmado na fonte consultada; conferir horário e fuso no edital.':null;
   record.eligibility=record.scope?(/must (?:also )?be US citizens?|green card holders/i.test(record.scope)?'restrita':'parcial'):null;
   record.status=record.deadline&&record.deadline>=todayBahia()&&result.checks.callSignal?'aberta':null;
   record.rules=url;record.apply=url;
  }else if(result.category==='datasets'){
   const data=structured(audit,/dataset/i),formats=[data.encodingFormat,data.distribution?.encodingFormat].flat().filter(Boolean);
   record.name=pageTitle;record.org=org||explicitOrganization(text);
   // An institutional suffix is attributable only when structured organization
   // identity points to this official site's own section, not a discovery feed.
   if(!record.org&&organization.url){
    try{
     const owner=new URL(organization.url),page=new URL(url);
     const suffix=pageTitle.match(/\s+[—–|]\s+((?:Ministério|Secretaria|Instituto|Ministry|Department)\s+[^|—–]{3,100})$/i)?.[1];
     if(suffix&&owner.origin===page.origin&&(page.pathname===owner.pathname||page.pathname.startsWith(owner.pathname.replace(/\/$/,'')+'/')))record.org=suffix;
    }catch{}
   }
   if(record.org)for(const separator of [' — ',' – ',' | ',' - '])if(record.name.endsWith(separator+record.org))record.name=record.name.slice(0,-(separator+record.org).length).trim();
   // Administrative scale does not identify a country, state or city.
   record.territoryTier='Outros';
   record.kind=/catalog|catálogo/i.test(pageTitle+' '+text)?'catalog':/portal/i.test(pageTitle+' '+text)?'portal':/system/i.test(pageTitle+' '+text)?'system':'dataset';
   record.themes=['Dados abertos'];
   record.coverage=sentence(text,/(?:\b20\d{2}\b|annual|monthly|municipal|national|global|covering|cobre|abrange)/i)||clean(audit.pageDescription)||null;
   const geography=[pageTitle,audit.pageDescription,JSON.stringify(data.spatialCoverage||''),record.coverage].filter(Boolean).join(' ');
   if(!/\b(global|worldwide)\b/i.test(geography))record.territoryTier=/\b(?:munic[ií]pio de Salvador|Salvador[, ]+(?:Bahia|\(?BA\)?))\b/i.test(geography)?'Salvador':/\bBahia\b/i.test(geography)?'Bahia':/\b(?:Brasil|Brazil)\b/i.test(geography)?'Brasil':'Outros';
   record.frequency=sentence(text,/(?:update frequency|updated|monthly|annual|quarterly|atualiza[cç][aã]o|mensal|anual|trimestral)/i)||unknown;
   const fileFormat=/\.(csv|tsv|json|geojson|xml|parquet|zip|xlsx?|gpkg|geotiff|tiff?|vrt)(?:$|[?#])/i;
   const linkedFormats=[...new Set((audit.resourceLinks||[]).map(x=>String(x.url||'').match(fileFormat)?.[1]?.toUpperCase()).filter(Boolean))];
   const textFormats=[...new Set((text.match(/\b(?:csv|tsv|json|xml|parquet|shapefile|geojson|zip|xlsx?|gpkg|geotiff|tiff?|vrt)\b/gi)||[]).map(x=>x.toUpperCase()))];
   record.format=clean(formats.join(', '))||linkedFormats.join(', ')||textFormats.join(', ')||(/\bapi\b/i.test(text)?'API':null);
   record.period=clean(data.temporalCoverage)||sentence(text,/\b20\d{2}\b.{0,30}\b20\d{2}\b/i)||unknown;
   record.granularity=sentence(text,/(?:record-level|individual records|row-level|granular|microdata|microdados|nível de registro)/i)||unknown;
   record.geoUnit=clean(data.spatialCoverage)||sentence(text,/(?:municipal|city|county|state|province|national|global|munic[ií]pio|estado|pa[ií]s)/i)||unknown;
   const resources=(audit.resourceLinks||[]).filter(x=>/^https:\/\//i.test(x.url||''));
   const resource=resources.find(x=>fileFormat.test(x.url))||resources.find(x=>(/\/(?:api|download|data|datasets?)(?:\/|$)/i.test(new URL(x.url).pathname)||(/^api\./i.test(new URL(x.url).hostname)&&/\bAPI\b/i.test(x.label||'')))&&x.url!==url),distribution=data.distribution||{};
   record.api=distribution.contentUrl||distribution.url||resource?.url||null;
   record.docs=url;
   record.limitations='A página consultada não detalha todas as limitações, a atualização e a qualidade do recurso; conferir documentação e licença antes do uso editorial.';
   record.lastChecked=(audit.checkedAt||'').slice(0,10)||null;
   record.url=url;record.description=clean(data.description)||clean(audit.pageDescription)||sentence(text,/(?:dataset|data|dados|records|statistics|estat[ií]sticas)/i)||null;
  }else{
   const data=structured(audit,/softwareapplication|softwareproduct|software/i);
   const titleKind=pageTitle.split(/[-—–]/).slice(1).join(' ').trim()||null;
   const sourceDescription=clean(data.description)||clean(audit.pageDescription)||sentence(text,/\b(?:tool|software|application|library|platform|programming language|statistical computing|data analytics)\b/i);
   record.name=normalizeToolName(clean(data.name)||pageTitle,text,url);
   record.kind=toolKind(text,data.applicationCategory,titleKind)
     || (/record\s*linkage|matching two|un-linked data|linkage toolkit/i.test(text)?'record linkage e correspondência de dados':'software para análise de dados');
   record.url=url;
   record.desc=sourceDescription?sourceDescription+' Source note: detailed usage limitations are not fully stated in the captured page; consult official documentation and license before use.':null;
   if(!record.desc)record.desc='Documentação oficial de '+record.name+' para uso em análise e tratamento de dados. Source note: consultar a documentação e a licença antes do uso editorial.';
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
