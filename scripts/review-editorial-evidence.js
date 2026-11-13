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
const excluded=/\b(conference|webinar|festival|newsletter|podcast|blog post|news article|event|symposium|perfil|profile|portfolio|directory|diretório|tutorial|guide|how[- ]to|call for pitches|press release|article|agency|agência|consult(?:ancy|ing|oria)|membership|archive|arquivo|research advisory|academic library|biblioteca acadêmica)\b/i;
const excludedPath=/\/(?:blog|news|press|articles?|posts?|podcasts?|pitch|process|tutorials?|guides?|learn|courses?|events?|conference|community|about|people|team|authors?|profiles?|jobs?|docs|20\d{2}\/(?:0?[1-9]|1[0-2]))(?:\/|$)/i;
const excludedToolUrl=/(?:creativeapplications\.net(?:\/|$)|propublica\.org\/data(?:\/|$)|poynter\.org\/(?:shop|mediawise\/programs)(?:\/|$)|mailchimp\.com\/signup(?:\/|$)|indicator\.media(?:\/|$)|soxoj\.com\/?$|(?:www\.)?dw\.com\/|(?:www\.)?wired\.com\/story\/|(?:www\.)?reuters\.com\/|(?:www\.)?bbc\.com\/|(?:www\.)?theguardian\.com\/|(?:www\.)?apnews\.com\/)/i;
const excludedToolContent=/\b(?:community of creative practitioners|critical making|published \d{2,}[,\d]* articles|membership plans?|research advisory|consulting services|course|training program|newsroom archive)\b/i;
function toolIdentity(c,title,docs){
 const structured=docs.some(x=>/softwareapplication|softwareproduct/.test(flat(x['@type']).toLowerCase()));
 const surface=[title,String(c.title||''),String(c.url||'').split('/').filter(Boolean).slice(-1)[0]||'',String(c.audit?.pageDescription||'')].join(' ');
 return structured||(!excluded.test(surface)&&/(software|tool|platform|application|library|framework|plugin|extension|programming language|statistical computing|ferramenta|plataforma|aplicativo|biblioteca)/i.test(surface));
}
function toolFunction(text,docs){
 const structured=docs.some(x=>{const type=flat(x['@type']).toLowerCase();return /softwareapplication|softwareproduct/.test(type)&&(x.featureList||x.applicationCategory||x.description)});
 return structured||/(data visualization|visuali[sz]a(?:tion|ção) de dados|create (?:interactive )?(?:maps|charts|dashboards)|build (?:interactive )?(?:maps|charts|dashboards)|mapping software|programming language|statistical computing|statistical analysis|data analytics|business intelligence|query language|geospatial analysis|spatial analysis|web scraping|scrape (?:websites|data)|data cleaning|data processing|data analysis|data matching|record linkage|text analysis|network analysis|design tool|design platform|collaborative design|prototype|vector graphics|illustration|visual development|interactive (?:maps|charts|dashboards)|dashboard|reporting|pdf(?: processing| extraction)?|machine learning|open source library|package for R|mapeamento interativo|análise geoespacial|visualização de dados|raspagem de dados|permite criar (?:mapas|gráficos|painéis)|lets users create|enables users to create|helps (?:you|users) (?:design|analy[sz]e|visuali[sz]e|create)|biblioteca (?:JavaScript|Python|R)|plataforma de análise)/i.test(text);
}
function inferCategory(c,text,title){
 const url=String(c.url||'').toLowerCase();
 if(excluded.test(title+' '+String(c.title||''))||excludedPath.test(new URL(url||'https://invalid.local').pathname))return 'uncategorized';
 const supplied=['opportunities','tools','datasets'].includes(c.category)?c.category:null;
 if(supplied==='tools')return (!excludedToolUrl.test(url)&&!excludedToolContent.test(text)&&toolIdentity(c,title,c.audit?.structuredData||[]))?'tools':'uncategorized';
 if(supplied==='opportunities'&&c.verificationStatus==='official-web-search')return 'opportunities';
 if(supplied)return supplied;
 const opportunity=actionableOpportunity(title,text);
 const deadline=/(deadline|closing date|close(?:s|d)?\s+(?:on|by|\d)|applications?[^.!?]{0,60}clos(?:e|es|ed)|prazo|inscri[cç][aã]o(?:s)?[^.!?]{0,50}até)/i.test(text);
 const eligibility=/(eligib|who can apply|who can enter|who can participate|participants must|entry requirements|open to|elegibilidade|podem se candidatar)/i.test(text);
 if(opportunity&&deadline&&eligibility)return 'opportunities';
 const dataset=/(dataset|data catalog|open data|dados abertos|base de dados|microdata|microdados|data portal)/i.test(title+' '+text);
 const dataAccess=/(download|\.csv|\.json|\.zip|api endpoint|api access|bulk data|baixar|export data)/i.test(text+' '+url);
 if(dataset&&dataAccess)return 'datasets';
 const tool=toolIdentity(c,title,c.audit?.structuredData||[]);
 const productFunction=toolFunction(text,c.audit?.structuredData||[]);
 if(tool&&productFunction&&!excludedToolUrl.test(url)&&!excludedToolContent.test(text)&&!excludedPath.test(new URL(url||'https://invalid.local').pathname))return 'tools';
 return 'uncategorized';
}
function dateCandidates(text){
 const out=[],months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12};
 for(const m of text.matchAll(/\b(20\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/g))out.push(m[1]+'-'+m[2].padStart(2,'0')+'-'+m[3].padStart(2,'0'));
 for(const m of text.matchAll(/\b(0?[1-9]|[12]\d|3[01])[./-](0?[1-9]|1[0-2])[./-](20\d{2})\b/g))out.push(m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'));
 for(const m of text.matchAll(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(0?[1-9]|[12]\d|3[01])(?:st|nd|rd|th)?,?\s+(20\d{2})\b/gi))out.push(m[3]+'-'+String(months[m[1].toLowerCase()]).padStart(2,'0')+'-'+m[2].padStart(2,'0'));
 for(const m of text.matchAll(/\b(0?[1-9]|[12]\d|3[01])\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(20\d{2})\b/gi))out.push(m[3]+'-'+String(months[m[2].toLowerCase()]).padStart(2,'0')+'-'+m[1].padStart(2,'0'));
 const ptMonths={janeiro:1,fevereiro:2,março:3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
 for(const m of text.matchAll(/\b(0?[1-9]|[12]\d|3[01])\s+de\s+(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+de\s+(20\d{2})\b/gi))out.push(m[3]+'-'+String(ptMonths[m[2].toLowerCase()]).padStart(2,'0')+'-'+m[1].padStart(2,'0'));
 return [...new Set(out)].filter(d=>{const x=new Date(d+'T00:00:00Z');return !Number.isNaN(x.valueOf())&&x.toISOString().slice(0,10)===d});
}
function actionableOpportunity(title,text){
 const noun=/\b(grant|fellowship|funding|scholarship|journalism award|award|prize|contest|competition|bolsa|edital|financiamento|premia[cç][aã]o|pr[eê]mio|concurso)\b/i;
 const action=/\b(applications?\b[^.!?]{0,100}\b(?:open|accepted|closing|close|closes|closed|deadline)|call for (?:applications?|entries?|submissions?|proposals?)|apply(?:ing)?(?: now| today| by)?|enter(?: now| by)?|submit (?:an? )?(?:application|proposal|entry|entries|story)|entries? (?:are )?(?:open|accepted|closing|close|closes|closed)|submissions? (?:are )?(?:open|accepted|closing|close|closes|closed)|inscri[cç][oõ]es? abertas|candidaturas? abertas|candidatar-se até|submiss[oõ]es? abertas)\b/i;
 const sentences=String(text||'').split(/(?<=[.!?])\s+/);
 return (noun.test(title||'')&&action.test(text||''))||sentences.some(s=>noun.test(s)&&action.test(s));
}
function structuredDeadline(docs){
 const fields=['applicationDeadline','closingDate','validThrough','deadline','endDate'];
 for(const item of docs||[])for(const field of fields){
  const value=item?.[field];
  const values=Array.isArray(value)?value:[value];
  for(const candidate of values){const match=String(candidate||'').match(/\b20\d{2}[-/]\d{1,2}[-/]\d{1,2}\b/);if(match)return match[0].replaceAll('/','-');}
 }
 return null;
}
function deadlineDates(text){
 const cues=/(?:deadline|closing date|enter by|entries?[^.!?]{0,70}(?:close|due|deadline)|submissions?[^.!?]{0,70}(?:close|due|deadline)|applications?[^.!?]{0,70}(?:clos(?:e|es|ed)|until|by)|application period[^.!?]{0,70}(?:ends?|closes?)|apply by|submit by|prazo[^.!?]{0,70}(?:até|final)|inscri[cç][oõ]es?[^.!?]{0,70}até)/i;
 return dateCandidates(text).filter(date=>{
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'],ptMonths=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],month=months[Number(date.slice(5,7))-1],ptMonth=ptMonths[Number(date.slice(5,7))-1],day=String(Number(date.slice(8))),year=date.slice(0,4);
  const forms=[date,date.replaceAll('-','/'),date.slice(8)+'/'+date.slice(5,7)+'/'+date.slice(0,4),String(Number(date.slice(8)))+'/'+String(Number(date.slice(5,7)))+'/'+date.slice(0,4),month+' '+day+', '+year,day+' '+month+' '+year,day+' de '+ptMonth+' de '+year];
  return text.split(/(?<=[.!?])\s+/).some(sentence=>forms.some(form=>sentence.includes(form))&&cues.test(sentence)&&/(application|grant|fellowship|scholarship|submit|submission|entry|entries|inscri[cç][oõ]|candidatura|bolsa|edital)/i.test(sentence));
 });
}
function review(c){
 const a=c.audit||{}, docs=a.structuredData||[], raw=[a.pageDescription||'',a.evidenceText||'',flat(docs)].filter(Boolean).join(' ').replace(/\s+/g,' ').trim(), text=raw.toLowerCase(), title=String(a.pageTitle||c.title||'').toLowerCase();
 const ld=docs.map(x=>({type:flat(x['@type']).toLowerCase(),data:x}));
 const category=inferCategory(c,text,title),checks={},missing=[];
 const hardStatus=(a.httpStatus===200&&/text\/html|application\/json/i.test(a.contentType||''))
  ||(c.verificationStatus==='official-web-search'&&String(c.sourceEvidence||'').length>=120&&Array.isArray(c.resourceLinks)&&c.resourceLinks.length>0);
 if(!hardStatus)missing.push('página primária acessível com conteúdo compatível');
 if(category==='opportunities'){
  const verifiedOpportunityEvidence=c.verificationStatus==='official-web-search' &&
   /\b(grant|fellowship|funding|scholarship|journalism award|award|prize|contest|competition|bolsa|edital|financiamento|premia[cç][aã]o|pr[eê]mio|concurso)\b/i.test(text) &&
   /\b(applications?\b[^.!?]{0,120}\b(?:open|accepted|closing|close|closes|closed|deadline|until|by)|call for (?:applications?|entries?|submissions?|proposals?)|apply(?:ing)?(?: now| today| by)?|inscri[cç][oõ]es? abertas|candidaturas? abertas|candidatar-se até|submiss[oõ]es? abertas)\b/i.test(text);
  checks.callSignal=(verifiedOpportunityEvidence||actionableOpportunity(title,text))&&!excluded.test(title+' '+String(c.title||''));
  checks.deadline=deadlineDates(text).find(d=>d>=today)||structuredDeadline(docs); if(checks.deadline&&checks.deadline<today)checks.deadline=null;
  checks.eligibility=/\b(eligib|eligible|eligibility|who can apply|who can enter|who can participate|participants must|entry requirements|age(?:d)? 18 and up|18 years and older|globally may enter|open to|elegibilidade|elegível|podem se candidatar)\b/i.test(text);
  if(!checks.callSignal)missing.push('chamada de financiamento/bolsa identificável');
  if(!checks.deadline)missing.push('prazo futuro confirmado em formato de data reconhecido');
  if(!checks.eligibility)missing.push('elegibilidade expressa na fonte');
 }else if(category==='datasets'){
  const d=ld.find(x=>/dataset/.test(x.type))?.data;
  const distribution=d?.distribution;
  checks.datasetSignal=!!d||/(dataset|data catalog|open data|dados abertos|base de dados|microdata|microdados|data portal)/i.test(title+' '+text);
  const linkedResource=(a.resourceLinks||[]).some(x=>{const u=String(x.url||'');return /\.(?:csv|tsv|json|geojson|xml|parquet|zip)(?:$|[?#])|\/(?:api|download|dataset|datasets|data)(?:\/|$)/i.test(u)&&(/download|dataset|data|api|csv|json|geojson|parquet/i.test(String(x.label||''))||/\.(?:csv|tsv|json|geojson|xml|parquet|zip)(?:$|[?#])/i.test(u));});
  checks.directResource=!!(distribution&&/https?:\/\//i.test(flat(distribution)))||linkedResource;
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
  checks.productSignal=!!d||toolIdentity(c,title,docs);
  checks.function=!!(d?.applicationCategory||d?.featureList||d?.description)||toolFunction(text,docs);
  checks.access=!!(d?.offers||d?.operatingSystem)||/(free|open source|pricing|subscription|account|download|install|web app|browser|online|cloud|desktop|api|documentation|docs|github|cran|npm|python|trial|commercial|gratuito|licença|conta|preço|instala|disponível|acesso)/i.test(text);
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
