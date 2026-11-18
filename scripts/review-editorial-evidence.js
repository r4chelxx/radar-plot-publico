#!/usr/bin/env node
'use strict';
// Conservative, evidence-based triage. "Complete" means eligible for record drafting only;
// it never grants publication approval.
const fs=require('node:fs');
const {rollingApplicationEvidence}=require('./editorial-page-evidence');
const queuePath=process.argv[2]||'intake/editorial-queue.json';
const outPath=process.argv[3]||'intake/editorial-evidence-review.json';
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const flat=v=>Array.isArray(v)?v.map(flat).join(' '):v&&typeof v==='object'?Object.values(v).map(flat).join(' '):String(v||'');
const genericOpportunityTitle=/^(?:how to apply|about(?: the fellowship)?|application|apply now)$/i;
function socialPostUrl(value){try{const host=new URL(value).hostname.toLowerCase().replace(/^www\./,'');return /^(?:instagram\.com|facebook\.com|linkedin\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|threads\.net|reddit\.com|pinterest\.com|t\.me)$/.test(host)}catch{return false}}
function jlabPublicationPage(value){try{const u=new URL(value),host=(u.hostname.toLowerCase().startsWith('www.')?u.hostname.slice(4):u.hostname.toLowerCase()),path=u.pathname.toLowerCase();return (host==='j-lab.org'&&path.startsWith('/publications/'))||(host==='sej.org'&&(path==='/library/reporting-tools/overview'||path==='/library/reporting-tools/overview/'))}catch{return false}}
function editorialReportPage(c,title=''){
 const a=c.audit||{},text=[title,c.title||'',a.pageTitle||'',a.pageDescription||'',a.evidenceText||'',c.url||'',a.finalUrl||''].join(' ');
 // A title or article route is not the product itself, even when the story
 // discusses real software and repeats its features throughout the article.
 if(/[?؟]\s*$/.test(String(a.pageTitle||title).trim())||/\/wiki\//i.test(String(c.url||'')+' '+String(a.finalUrl||''))||/\/(?:analysis|nerds)\//i.test(String(c.url||'')+' '+String(a.finalUrl||''))||/\bin this piece\b/i.test(text))return true;
 const types=(a.structuredData||[]).flatMap(x=>Array.isArray(x['@type'])?x['@type']:[x['@type']]).map(x=>String(x||''));
 const editorialTypes=types.length>0&&types.every(x=>/^(?:NewsArticle|Article|BlogPosting)$/i.test(x));
 return types.some(x=>/^(?:Report|ScholarlyArticle)$/i.test(x))||editorialTypes
  ||/\b(?:news|research) report\s+20\d{2}\b/i.test(text)
  ||/\/reports?\/20\d{2}\//i.test(String(c.url||'')+' '+String(a.finalUrl||''));
}
function genericToolListing(c,title=''){
 const a=c.audit||{},value=[title,c.title||'',a.pageTitle||''].join(' ').replace(/\s*[|—–-]\s*(?:data|who|world health organization).*$/i,'').trim();
 return /^(?:tools?(?: and resources)?|resources and tools|data portals? (?:&|and) tools|world bank open data)$/i.test(value)
  ||/who\.int\/data\/inequality-monitor\/tools-resources|data\.worldbank\.org\/products\/tools/i.test(String(c.url||''));
}
function newsStoryPage(c){
 const a=c.audit||{},text=[a.pageTitle||'',a.pageDescription||'',a.evidenceText||''].join(' ');
 const fusionStory=/globalContent\s*=\s*\{[\s\S]{0,1400}?["']type["']\s*:\s*["']story["'][\s\S]{0,300}?["']subtype["']\s*:\s*["']news["']/i.test(text);
 const articleSchema=/(?:["']@type["']\s*:\s*["'](?:NewsArticle|Article|BlogPosting)["'])/i.test(text);
 return fusionStory||articleSchema;
}
const excluded=/\b(conference|webinar|festival|newsletter|podcast|blog post|news article|event|symposium|perfil|profile|portfolio|directory|diretório|tutorial|guide|how[- ]to|call for pitches|press release|article|agency|agência|consult(?:ancy|ing|oria)|membership|archive|arquivo|research advisory|academic library|biblioteca acadêmica)\b/i;
const excludedPath=/\/(?:blog|news|press|articles?|posts?|podcasts?|pitch|process|tutorials?|guides?|learn|courses?|events?|conference|community|about|people|team|authors?|profiles?|jobs?|docs|20\d{2}\/(?:0?[1-9]|1[0-2]))(?:\/|$)/i;
const excludedToolUrl=/(?:creativeapplications\.net(?:\/|$)|propublica\.org\/data(?:\/|$)|poynter\.org\/(?:shop|mediawise\/programs)(?:\/|$)|mailchimp\.com\/signup(?:\/|$)|indicator\.media(?:\/|$)|soxoj\.com\/?$|(?:www\.)?dw\.com\/|(?:www\.)?wired\.com\/story\/|(?:www\.)?reuters\.com\/|(?:www\.)?bbc\.com\/|(?:www\.)?theguardian\.com\/|(?:www\.)?apnews\.com\/|mediawiki\.org\/wiki\/(?:Moderator_Tools|Toolserver:)|wikidata\.org\/wiki\/(?:Special:NewItem|Wikidata:Tools\/))/i;
const excludedToolContent=/\b(?:community of creative practitioners|critical making|published \d{2,}[,\d]* articles|membership plans?|research advisory|consulting services|course|training program|newsroom archive)\b/i;
function toolIdentity(c,title,docs){
 if(jlabPublicationPage(c.url))return false;
 if(newsStoryPage(c)||editorialReportPage(c,title)||genericToolListing(c,title))return false;
 // A product mentioned inside a book, author profile or directory does not
 // change the identity of the inspected page.
 if(/\b(?:book|handbook|specialist|portfolio|profile|directory)\b|^(?:tools|resources)(?: and toolkits)?$/i.test(title))return false;
 if(/\b(?:for (?:plugin|extension) (?:authors|developers)|plugin authoring|writing (?:custom )?plugins)\b/i.test(title))return false;
 if(/^(?:writing|creating)\s+(?:plugins?|extensions?|an? embedding model)\b/i.test(title))return false;
 const structured=docs.some(x=>/softwareapplication|softwareproduct/.test(flat(x['@type']).toLowerCase()));
 // Editorial pages may describe many real tools. Those references do not make
 // the blog or podcast itself a software product.
 const editorialTypes=/^(?:blog|blogposting|newsarticle|article|podcastseries|podcastepisode)$/i;
 const types=docs.flatMap(x=>Array.isArray(x['@type'])?x['@type']:[x['@type']]).filter(Boolean);
 const editorialIdentity=types.length>0&&types.every(type=>editorialTypes.test(String(type)));
 const editorialDescription=/\b(?:is a blog|blog dedicated to|listen to .{0,180} on spotify)\b/i.test(String(c.audit?.pageDescription||''));
 const audioPage=/^https:\/\/(?:open\.spotify\.com\/(?:show|episode)\/|podcasts\.apple\.com\/)/i.test(String(c.url||''));
 if(audioPage||(!structured&&(editorialIdentity||editorialDescription)))return false;
 let cranPackage=false;
 try{const u=new URL(c.audit?.finalUrl||c.url);cranPackage=/(^|\.)r-project\.org$/.test(u.hostname)&&(/^[A-Za-z][A-Za-z0-9.]{0,79}$/.test(u.searchParams.get('package')||'')||/^\/package=[A-Za-z][A-Za-z0-9.]{0,79}\/?$|\/packages\/[A-Za-z][A-Za-z0-9.]{0,79}(?:\/|$)/.test(u.pathname));}catch{}
 const newsletterSource=/Gmail Radar PLOT/i.test([c.sourceName||'',...(c.providers||[])].join(' '));
 const surface=[newsletterSource?'':title,newsletterSource?'':String(c.title||''),String(c.url||'').split('/').filter(Boolean).slice(-1)[0]||'',String(c.audit?.pageTitle||''),String(c.audit?.pageDescription||'')].join(' ');
 return structured||cranPackage||(!excluded.test(surface)&&/(software|tool|platform|application|library|framework|plugin|extension|programming language|statistical computing|ferramenta|plataforma|aplicativo|biblioteca)/i.test(surface));
}
function toolFunction(text,docs){
 if(/\b(?:screen.scraping HTML|HTML parsing|parsing HTML|parse tree)\b/i.test(text))return true;
 if(/\b(?:browser automation tool|automates browsers|(?:headless )?graphics framework|javascript 3d library|create responsive graphics)\b/i.test(text))return true;
 const structured=docs.some(x=>{const type=flat(x['@type']).toLowerCase();return /softwareapplication|softwareproduct/.test(type)&&(x.featureList||x.applicationCategory||x.description)});
 return structured||/(data visualization|visuali[sz]a(?:tion|ção) de dados|create (?:interactive )?(?:maps|charts|dashboards)|build (?:interactive )?(?:maps|charts|dashboards)|mapping software|programming language|statistical computing|statistical analysis|data analytics|business intelligence|query language|geospatial analysis|spatial analysis|web scraping|scrape (?:websites|data)|data cleaning|data processing|data analysis|data matching|record linkage|text analysis|network analysis|design tool|design platform|collaborative design|prototype|vector graphics|illustration|visual development|interactive (?:maps|charts|dashboards)|dashboard|pdf(?: processing| extraction)?|machine learning|open source library|package for R|mapeamento interativo|análise geoespacial|visualização de dados|raspagem de dados|permite criar (?:mapas|gráficos|painéis)|lets users create|enables users to create|helps (?:you|users) (?:design|analy[sz]e|visuali[sz]e|create)|biblioteca (?:JavaScript|Python|R)|plataforma de análise)/i.test(text);
}
function inferCategory(c,text,title){
 const url=String(c.url||'').toLowerCase();
 const pathname=new URL(url||'https://invalid.local').pathname;
 const surface=/^(?:how to apply|about(?: the fellowship)?|application)$/i.test(title)?String(c.audit?.pageDescription||c.title||title):title||String(c.title||'');
 const journalisticCall=actionableOpportunity(surface,text)&&/journalis|jornalismo|reporting|reporters|newsrooms|photojournal|documentary|storymaps|geospatial story|data visuali|visual storytelling/i.test(surface+' '+String(c.audit?.pageDescription||''));
 if(journalisticCall&&!/newsletter|podcast|directory|portfolio/i.test(surface))return 'opportunities';
 // Product documentation is a valid source only when identity AND function are evidenced.
 const documentation=/\/(?:docs|documentation|learn)(?:\/|$)/i.test(pathname)||/^(?:docs|developer)\./i.test(new URL(url).hostname);
 if(documentation&&toolIdentity(c,title,c.audit?.structuredData||[])&&toolFunction(text,c.audit?.structuredData||[]))return 'tools';
 if(excluded.test(surface)||excludedPath.test(pathname))return 'uncategorized';
 const supplied=['opportunities','tools','datasets'].includes(c.category)?c.category:null;
 if(supplied==='tools')return (!excludedToolUrl.test(url)&&!excludedToolContent.test(text)&&toolIdentity(c,title,c.audit?.structuredData||[]))?'tools':'uncategorized';
 if(supplied==='opportunities'&&c.verificationStatus==='official-web-search')return 'opportunities';
 if(supplied)return supplied;
 const opportunity=actionableOpportunity(title,text);
 const deadline=/(deadline|closing date|close(?:s|d)?\s+(?:on|by|\d)|applications?[^.!?]{0,60}clos(?:e|es|ed)|prazo|inscri[cç][aã]o(?:s)?[^.!?]{0,50}até)/i.test(text);
 const eligibility=/(eligib|who can apply|who can enter|who can participate|participants must|entry requirements|open to|elegibilidade|podem se candidatar)/i.test(text);
 if(opportunity&&deadline&&eligibility)return 'opportunities';
 const dataset=/(dataset|data catalog|open data|dados abertos|base de dados|microdata|microdados|data portal)/i.test(title+' '+text);
 const datasetNoise=/(?:podcast|youtube|ranking|rankings|top ai companies|newsletter|blog|article|press release)/i.test(title+' '+text+' '+url);
 const dataAccess=/(download|\.csv|\.json|\.zip|api endpoint|api access|bulk data|baixar|export data)/i.test(text+' '+url)||(c.audit?.tabularData||[]).some(x=>x.rows>=3&&x.columns>=2);
 if(dataset&&dataAccess&&!datasetNoise)return 'datasets';
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
 const noun=/\b(grants?|fellowships?|funding|scholarships?|journalism awards?|awards?|prizes?|contests?|competitions?|bolsas?|editais|edital|financiamento|premia[cç][aã]o|pr[eê]mios?|concursos?|mentorship|mentoria|journalism training|reporting workshop|journalism internship|journalism residency|pitches|pitch)\b/i;
 const action=/\b(applications?\b[^.!?]{0,100}\b(?:open|accepted|closing|close|closes|closed|deadline)|call for (?:applications?|entries?|submissions?|proposals?)|apply(?:ing)?(?: now| today| by)?|enter(?: now| by)?|submit (?:an? )?(?:application|proposal|entry|entries|story)|entries? (?:are )?(?:open|accepted|closing|close|closes|closed)|submissions? (?:are )?(?:open|accepted|closing|close|closes|closed)|inscri[cç][oõ]es? abertas|candidaturas? abertas|candidatar-se até|submiss[oõ]es? abertas)\b/i;
 const sentences=String(text||'').split(/(?<=[.!?])\s+/);
 const pitchAction=/\b(?:accept(?:s|ing)? (?:freelance )?pitches|pitch us|send (?:us )?(?:your )?pitch|pitches (?:are )?(?:open|accepted))\b/i;
 return (noun.test(title||'')&&(action.test(text||'')||pitchAction.test(text||'')))||sentences.some(s=>noun.test(s)&&(action.test(s)||pitchAction.test(s)));
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
function deadlineDates(text,confirmedCall=false){
 const cues=/(?:deadline|prazo(?: final)?\s*:|closing date|enter by|entries?[^.!?]{0,70}(?:close|due|deadline)|submissions?[^.!?]{0,70}(?:close|due|deadline)|applications?[^.!?]{0,70}(?:clos(?:e|es|ed)|until|by)|application period[^.!?]{0,70}(?:ends?|closes?)|apply by|submit by|prazo[^.!?]{0,70}(?:até|final)|inscri[cç][oõ]es?[^.!?]{0,70}até)/i;
 return dateCandidates(text).filter(date=>{
  const months=['january','february','march','april','may','june','july','august','september','october','november','december'],ptMonths=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],month=months[Number(date.slice(5,7))-1],ptMonth=ptMonths[Number(date.slice(5,7))-1],day=String(Number(date.slice(8))),year=date.slice(0,4);
  const forms=[date,date.replaceAll('-','/'),date.slice(8)+'/'+date.slice(5,7)+'/'+date.slice(0,4),String(Number(date.slice(8)))+'/'+String(Number(date.slice(5,7)))+'/'+date.slice(0,4),month+' '+day+', '+year,day+' '+month+' '+year,day+' de '+ptMonth+' de '+year];
  return text.split(/(?<=[.!?])\s+/).some(sentence=>forms.some(form=>sentence.includes(form))&&cues.test(sentence)&&(confirmedCall&&/^(?:deadline|closing date|prazo(?: final)?)\s*:/i.test(sentence.trim())||/(apply|application|grant|fellowship|scholarship|submit|submission|entry|entries|inscri[cç][oõ]|candidatura|bolsa|edital)/i.test(sentence)));
 });
}
function review(c){
 const a=c.audit||{}, docs=a.structuredData||[], raw=[a.pageDescription||'',a.evidenceText||'',flat(docs)].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
 const months={jan:'january',feb:'february',mar:'march',apr:'april',jun:'june',jul:'july',aug:'august',sep:'september',sept:'september',oct:'october',nov:'november',dec:'december'};
 const text=raw.toLowerCase().replace(/\b([ap])\.m\./g,'$1m').replace(/\b(jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\.?\s+(?=\d)/g,(_,m)=>months[m]+' '),title=String(a.pageTitle||c.title||'').toLowerCase();
 const ld=docs.map(x=>({type:flat(x['@type']).toLowerCase(),data:x}));
 const category=socialPostUrl(c.url)?'uncategorized':genericOpportunityTitle.test(title.trim())?'opportunities':inferCategory(c,text,title),checks={},missing=[];
 const datasetIndex=/^(?:data sources|data dictionary|our bulk data distributions)$/i.test(title.trim())||(()=>{try{const p=new URL(c.url||'').pathname.toLowerCase();return p==='/datasets/sources'||p==='/datasets/sources/'||p==='/reference'||p==='/reference/'}catch{return false}})();
 const hardStatus=(a.httpStatus===200&&/text\/html|application\/json/i.test(a.contentType||''))
  ||(c.verificationStatus==='official-web-search'&&String(c.sourceEvidence||'').length>=120&&Array.isArray(c.resourceLinks)&&c.resourceLinks.length>0);
 if(!hardStatus)missing.push('página primária acessível com conteúdo compatível');
 if(category==='opportunities'){
  const genericPage=genericOpportunityTitle.test(title.trim());
  const namedCall=raw.match(/\b(?:[A-Z][\w’'&-]*\s+){1,8}(?:Fellowship|Grant|Award|Competition)\b(?:\s+for(?:\s+[A-Z][\w’'&-]*){1,5})?/u)?.[0]||null;
  const callTitle=namedCall|| (genericPage?String(a.pageDescription||c.title||title):title);
  const editorialScope=/\b(?:journalis\w*|jornalismo|jornalistas?|reporting|reporters?|newsrooms?|photojournal\w*|documentary|storymaps|geospatial story|data visuali\w*|visual storytelling)\b/i.test(title+' '+String(a.pageDescription||'')+' '+String(a.evidenceText||''));
  if(!editorialScope)missing.push('escopo jornalístico ausente no título e descrição da chamada');
  const verifiedOpportunityEvidence=c.verificationStatus==='official-web-search' &&
   /\b(grant|fellowship|funding|scholarship|journalism award|award|prize|contest|competition|bolsa|edital|financiamento|premia[cç][aã]o|pr[eê]mio|concurso)\b/i.test(text) &&
   /\b(applications?\b[^.!?]{0,120}\b(?:open|accepted|closing|close|closes|closed|deadline|until|by)|call for (?:applications?|entries?|submissions?|proposals?)|apply(?:ing)?(?: now| today| by)?|inscri[cç][oõ]es? abertas|candidaturas? abertas|candidatar-se até|submiss[oõ]es? abertas)\b/i.test(text);
  checks.callSignal=(!genericPage||!!namedCall)&&(verifiedOpportunityEvidence||actionableOpportunity(callTitle,text))&&!/newsletter|podcast|directory|portfolio/i.test(title);
  if(genericPage&&!namedCall)missing.push('nome específico da chamada ausente; página genérica de inscrição não pode ser publicada como oportunidade');
  checks.deadline=deadlineDates(text,checks.callSignal).find(d=>d>=today)||structuredDeadline(docs); if(checks.deadline&&checks.deadline<today)checks.deadline=null;
  checks.eligibility=/\b(eligib|eligible|eligibility|who can apply|who can enter|who can participate|participants must|entry requirements|age(?:d)? 18 and up|18 years and older|globally may enter|open to|elegibilidade|elegível|podem se candidatar)\b/i.test(text);
  if(/\b(?:applications?|submissions?|entries?)\b[^.!?]{0,120}\bclosed\b|inscri[cç][oõ]es\s+encerradas/i.test(text))missing.push('chamada explicitamente encerrada');
  if(!checks.callSignal)missing.push('chamada de financiamento/bolsa identificável');
  checks.rolling=!checks.deadline&&rollingApplicationEvidence(text);
  if(!checks.deadline&&!checks.rolling)missing.push('prazo futuro ou fluxo contínuo confirmado na chamada');
  if(!checks.eligibility)missing.push('elegibilidade expressa na fonte');
 }else if(category==='datasets'){
  if(datasetIndex)missing.push('página de índice ou dicionário, não um recurso de dados');
  const d=ld.find(x=>/dataset/.test(x.type))?.data;
  if(/\/indicator\//i.test(c.url||'')&&/^(?:world bank open data|open data|data catalog)$/i.test(title)&&!d?.name)missing.push('nome específico do indicador ausente na página inspecionada');
  const distribution=d?.distribution;
  checks.datasetSignal=!!d||/(dataset|data catalog|open data|dados abertos|base de dados|microdata|microdados|data portal)/i.test(title+' '+text);
  const fileFormat=/\.(?:csv|tsv|json|geojson|xml|parquet|zip|xlsx?|gpkg|geotiff|tiff?|vrt)(?:$|[?#])/i;
  const linkedResource=(a.resourceLinks||[]).some(x=>{const u=String(x.url||'');return fileFormat.test(u)||((/\/(?:api|download|dataset|datasets|data)(?:\/|$)/i.test(u)||/^https:\/\/api\./i.test(u))&&/download|dataset|data|api/i.test(String(x.label||'')));});
  checks.directResource=!!(distribution&&/https?:\/\//i.test(flat(distribution)))||linkedResource;
  checks.webAccess=(a.tabularData||[]).some(x=>x.rows>=3&&x.columns>=2)&&!excludedPath.test(new URL(c.url).pathname);
  checks.directResource=checks.directResource||checks.webAccess;
  checks.format=!!(distribution&&/(csv|json|xml|parquet|zip|xlsx?|gpkg|geotiff|tiff?|vrt|api)/i.test(flat(distribution)))||/\b(csv|tsv|json|xml|parquet|shapefile|geojson|zip|xlsx?|gpkg|geotiff|tiff?|vrt)\b/i.test(text)||(a.resourceLinks||[]).some(x=>fileFormat.test(String(x.url||'')));
  checks.coverage=!!(d?.temporalCoverage||d?.spatialCoverage)||/(\b20\d{2}\b|annual|monthly|municipal|national|global|covering|cobre|abrange)/i.test(text);
  checks.format=checks.format||checks.webAccess;
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
 }else missing.push(socialPostUrl(c.url)?'post de rede social não comprova produto, base de dados ou oportunidade em fonte primária':'categoria específica sem evidência suficiente');
 const enough=hardStatus&&missing.length===0;
 return{id:c.id,url:c.url,category,originalCategory:c.category||'uncategorized',checkedAt:a.checkedAt||null,checks,missing,decision:enough?'evidence_complete_for_record_draft':'pending_more_evidence',publicationReady:false};
}
function main(){
const q=JSON.parse(fs.readFileSync(queuePath,'utf8'));
const records=(q.candidates||[]).filter(c=>c.status==='pending'&&c.audit).map(review);
const counts={};for(const x of records)counts[x.decision]=(counts[x.decision]||0)+1;
const categoryCounts={};for(const x of records)categoryCounts[x.category]=(categoryCounts[x.category]||0)+1;
const out={generatedAt:new Date().toISOString(),policy:'Evidence-based category triage. Missing license is recorded as unknown when not found; complete means draft eligibility only, never approval or publication.',counts,categoryCounts,records};
fs.writeFileSync(outPath,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({reviewed:records.length,counts,categoryCounts,publicationReady:0}));
}
if(require.main===module)main();
module.exports={reviewCandidate:review};
