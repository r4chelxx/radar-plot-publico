#!/usr/bin/env node
// Conservative bridge from inspected candidates to explicit editorial decisions.
// It only approves records when every deterministic gate is present; otherwise it
// records the blocker and leaves the candidate in review.
const fs=require('node:fs'),crypto=require('node:crypto');
const {cleanTitle,cleanSummary,cleanText}=require('./editorial-text');
const evidence=JSON.parse(fs.readFileSync(process.argv[2]||'intake/lead-evidence.json','utf8'));
const review=JSON.parse(fs.readFileSync(process.argv[3]||'intake/editorial-review.json','utf8'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const allowedEligibility=new Set(['elegível','parcial']);
const allowedStatus=new Set(['aberta','monitorar']);
const isoDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
const host=x=>{try{return new URL(x).hostname.toLowerCase()}catch{return null}};
const future=x=>isoDate(x)&&x>=today;
const derivedId=url=>'auto-'+crypto.createHash('sha256').update(String(url)).digest('hex').slice(0,16);
function validPublicationReview(proof,category,url){
 if(!proof||proof.reviewedBy!=='Radar evidence gate v1'||proof.reviewPolicyVersion!=='radar-evidence-v1'||proof.decision!=='approved')return false;
 if(proof.officialUrl!==url||proof.sourceStatus!==200||!/^text\/html\b/i.test(proof.contentType||''))return false;
 const checkedAt=Date.parse(proof.checkedAt||''),age=Date.now()-checkedAt;
 if(!Number.isFinite(checkedAt)||age<0||age>24*60*60*1000||proof.reviewedAt!==String(proof.checkedAt).slice(0,10))return false;
 const evidence=String(proof.evidence||'');
 if(evidence.length<25||crypto.createHash('sha256').update(evidence).digest('hex')!==proof.evidenceHash)return false;
 const required={opportunities:['callSignal','eligibility'],datasets:['datasetSignal','directResource','webAccess','format','coverage'],tools:['productSignal','function','access']}[category]||[];
 return required.length>0&&required.every(key=>proof.evidenceChecks?.[key]===true);
}
function radarRelevantOpportunity(title,text){
 return /\b(journalis\w*|jornalismo|jornalistas?|reporters?|reporting|newsrooms?|investigative journalism|data journalism|data visuali\w*|story grants?|documentary|photojournal\w*|freelance writers?|science communication)\b/i.test(String(title||'')+' '+String(text||''));
}
function deriveOpportunity(lead,url){
 const se=lead.structuredEvidence||{};
 const organization=se.organization||lead.organization||lead.source;
 const title=cleanTitle(se.title||lead.pageTitle||lead.sourcePageTitle,organization);
 const description=cleanSummary(se.description||lead.pageDescription,title,organization);
 if(lead.category!=='opportunities'||!se.eligibilityExplicit||se.status!=='aberta'||!title||!description||description.length<60||!organization||!future(se.deadline)||!radarRelevantOpportunity(title,description))return null;
 return {id:derivedId(url),title,org:organization,summary:description,type:se.sourceType||'Oportunidade editorial',themes:['Oportunidade editorial'],scope:cleanText(se.eligibility||lead.eligibility,600),deadline:se.deadline,deadlineStatus:'prazo extraído de metadado estruturado da fonte oficial; horário e condições devem ser conferidos na página',eligibility:'parcial',fit:5,status:'aberta',value:'Não informado na fonte estruturada',duration:'Não informado na fonte estruturada',modality:se.sourceType||'Não especificado',documents:[],restrictions:[],rules:url,apply:url,verified:today,desc:se.description,discoveryUrl:lead.url,verificationHistory:[{date:today,status:'aberta',source:url}]};
}
function deriveDataset(lead,url){
 const se=lead.structuredEvidence||{};
 const title=cleanTitle(se.title||lead.pageTitle||lead.sourcePageTitle,lead.source||'');
 const description=cleanSummary(se.description||lead.pageDescription,title,lead.source||'');
 const organization=se.organization||lead.organization||null;
 if(lead.category!=='datasets'||!title||!description||description.length<80||!organization)return null;
 const sourceType=String(se.sourceType||'').toLowerCase();
 const evidenceText=[title,description,url,se.sourceType||'',lead.pageTitle||'',lead.pageDescription||''].join(' ');
 const genericTitle=/^(in[ií]cio|inicio|home|start|eventos?|events?|about|sobre|contact|contato|menu|search|login|register|news|blog|resources?|opportunities?|calend[áa]rio|calendar|data sources|data dictionary|our bulk data distributions)$/i.test(String(title).trim());
 const navigationNoise=/ir para o (conte[uú]do|menu|navega[cç][aã]o|rodap[eé]|mapa do site|in[ií]cio|p[aá]gina inicial|busca)|aten[cç][aã]o! seu navegador|nome do site/i.test(String(description));
 const excludedPage=new RegExp("calendly\\.com|github\\.com/[^\\s]+/(?:security/advisories|blob/)[^\\s]*(?:CODE_OF_CONDUCT|code_of_conduct)|opensanctions\\.org/docs/metadata","i").test(String(url)+' '+String(description));
 if(excludedPage)return null;
 const datasetSignal=/(dataset|data[- ]?catalog|open[- ]?data|dados?[- ]abertos?|database|base de dados|catalog|cat[aá]logo de dados|api|csv|json|estat[ií]stic|indicador|microdados|portal(?:.{0,20})dados|data portal|geodados|datacatalog|\/datasets?\/)/i.test(evidenceText);
 const nonDataset=/(?:podcast|youtube|ranking|rankings|top ai companies|newsletter|blog|article|press release)/i.test(evidenceText);
 if(nonDataset)return null;
 if(genericTitle||navigationNoise||!datasetSignal)return null;
 if(sourceType&&!/dataset|datacatalog|catalog|data[- ]?catalog/.test(sourceType))return null;
 return {id:derivedId(url),name:title,org:organization,territoryTier:'Outros',kind:'dataset',themes:['Dados abertos'],coverage:description,frequency:'Não informado na fonte estruturada',format:se.encodingFormat||se.distribution?.encodingFormat||((lead.evidenceText||description).match(/\b(?:CSV|JSON|XML|Parquet|GeoJSON|shapefile)\b/i)||[])[0]||'',period:'Não informado na fonte estruturada',granularity:'Não informado na fonte estruturada',geoUnit:'Não informado na fonte estruturada',api:se.distribution?.contentUrl||se.distribution?.url||null,docs:url,limitations:'Metadados estruturados confirmam a existência do recurso, mas cobertura, atualização, licença e qualidade devem ser conferidas antes do uso editorial.',lastChecked:today,url,discoveryUrl:lead.url,description};
}
function deriveTool(lead,url){
 const se=lead.structuredEvidence||{};
 const metaTitle=se.title||lead.pageTitle||lead.sourcePageTitle;
 const cardTitle=cleanTitle(String(lead.title||'').split(/\s*,\s*/)[0],se.organization||lead.source||'');
 const genericProductTitle=/^(?:fact check tools|tools?|resources?|home|in[ií]cio)$/i;
 const title=cardTitle&&!genericProductTitle.test(cardTitle)?cardTitle:metaTitle;
 const meta=cleanText(se.description||lead.pageDescription,1200);
 const body=cleanText(lead.evidenceText,4000);
 const description=meta.length>=80?meta:cleanText(body,1200);
 const machineNoise=/(?:this\.gbar_|_DumpException|document\.querySelector|\bfunction\s*\(|\b(?:var|const|let)\s+[\w$]+\s*=|\bwindow\.[\w$]+\s*=)/i;
 if(machineNoise.test(meta)||machineNoise.test(body)||machineNoise.test(description))return null;
 const excludedToolPage=new RegExp("mediawiki\\.org|wikidata\\.org/wiki/Special:NewItem|github\\.com/[^\\s]+/blob/|/(?:news|articles?|item|program|blog|tv|conference|events?)(?:/|$)|substack\\.com","i").test(String(url));
 const navigationTool=/jump to content|main menu|navigation|create account|log in|personal tools|toggle the table|page discussion|read edit view history|contents move to sidebar|search search/i.test(String(description));
 if(excludedToolPage||navigationTool)return null;
 if(lead.category!=='tools'||!title||!description||description.length<80)return null;
 const sourceType=String(se.sourceType||'').toLowerCase();
 if(sourceType&&!/software|application|tool|product|softwareapplication/.test(sourceType))return null;
 const evidenceText=[title,description,url].join(' ');
 const nonProduct=/\b(?:podcast|newsletter|article|course|training|conference|event|curated list|blog|publication)\b/i.test(title||'')||/buttondown\.com|substack\.com|\/using\/|\/wiki\/|\/products\/tools|\/advancedsearch|\/20\d{2}\//i.test(url);
 if(nonProduct)return null;
 if(/\b(book|handbook|toolkits?|specialist|developer|portfolio|profile|resources|directory)\b/i.test(title||'')||/skip to main content|select language|all topics|photo library/i.test(description))return null;
 const inferredKind=/\bplugin\b/i.test(evidenceText)?'plugin de dados':/\b(?:library|biblioteca)\b/i.test(evidenceText)?'biblioteca de software':/\b(?:api|sdk|cli)\b/i.test(evidenceText)?'API/SDK/CLI para dados':/\b(?:framework|plataforma|platform)\b/i.test(evidenceText)?'plataforma de dados':null;
 if(!sourceType&&!inferredKind)return null;
 const name=cleanTitle(title,se.organization||'').split(/\s*[|:]\s*/)[0].replace(/\s+-\s+a (?:plugin|library|platform)\b.*$/i,'').trim();
 if(!name||/^(github|home|tools|resources|início)$/i.test(name))return null;
 return {id:derivedId(url),name,kind:inferredKind||se.sourceType,url,desc:description+' Consultar documentação e licença antes do uso editorial.',discoveryUrl:lead.url};
}
const results=(evidence.results||[]);
const byId=new Map((review.candidates||[]).map(x=>[x.id,x]));
const urlKey=value=>{try{const u=new URL(value);u.hash='';return u.toString().replace(/\/$/,'')}catch{return value}};
const byUrl=new Map((review.candidates||[]).map(x=>[urlKey(x.url),x]));
const decisions=[], blockers=[];
for(const lead of results){
 const r=byId.get(lead.historicalId||lead.id)||byUrl.get(urlKey(lead.url))||lead;
 const url=lead.finalUrl||lead.url;
 const base={url:lead.url||url,category:lead.category,reviewedBy:'Radar PLOT — auditoria automática conservadora',reviewedAt:today};
 // Fresh inspections use the same review, card builder and publication gate as
 // unified discovery. Legacy supplied records below retain their proof checks.
 if(lead.checkedAt&&typeof lead.evidenceText==='string'){
  const {reviewCandidate}=require('./review-editorial-evidence');
  const {buildDrafts}=require('./build-editorial-record-drafts');
  const {buildAutomaticPublications}=require('./build-automated-publications');
  const candidate={...lead,id:derivedId(url),status:'pending',audit:lead};
  const semantic=reviewCandidate(candidate);
  const drafts=buildDrafts({candidates:[candidate]},{records:[semantic]});
  const matches=lead.possibleMatches||r?.possibleMatches||[];
  const result=buildAutomaticPublications(drafts);
  const approved=result.manifest.approved[0];
  if(approved&&!matches.length&&lead.pageStatus==='html-fetched'){
   decisions.push({...base,category:approved.category,status:'approved',officialUrl:url,publicationReviewV1:approved.review,reason:'Source evidence passed the shared category review, record builder and independent publication gate.',record:approved.record});
  }else{
   const reasons=[...(lead.pageStatus!=='html-fetched'?['página não inspecionada como HTML']:[]),...semantic.missing,...(drafts.drafts[0]?.missingFields||[]).map(x=>'campo da ficha ausente: '+x)];
   if(matches.length)reasons.push('possível duplicidade ainda não resolvida');
   for(const [key,value] of Object.entries(result.summary.skipped||{}))if(value)reasons.push('gate de publicação: '+key);
   blockers.push({url:lead.url,category:semantic.category,blockers:reasons.length?reasons:['evidência insuficiente para ficha']});
  }
  continue;
 }
 const fail=[];
 if(lead.pageStatus!=='html-fetched')fail.push('página não inspecionada como HTML');
 if(!url||!/^https:\/\//.test(url))fail.push('fonte final não é HTTPS');
 if(host(url)!==host(lead.url)&&!(lead.sourceResolution?.primaryUrl&&lead.sourceResolution.primaryUrl===url))fail.push('redirecionamento para host diferente');
 if((lead.possibleMatches||r?.possibleMatches||[]).length)fail.push('possível duplicidade ainda não resolvida');
 let record=lead.publicationRecord||lead.record||r?.publicationRecord||r?.record;
 if(!record){record=deriveOpportunity(lead,url)||deriveDataset(lead,url)||deriveTool(lead,url);}
 if(!record)fail.push('ficha pública estruturada ausente');
 if(lead.category==='opportunities'){
  if(String(record?.id||'').startsWith('auto-')&&!radarRelevantOpportunity(record?.title,record?.summary||lead.evidenceText||lead.pageDescription))fail.push('oportunidade fora do escopo editorial do Radar');
  const deadline=lead.deadline||record?.deadline;
  const eligibility=lead.eligibility||record?.eligibility;
  const status=lead.status||lead.structuredEvidence?.status||record?.status;
  const eligibilityText=String(eligibility||'').trim();
  const explicitEligibility=Boolean(lead.structuredEvidence?.eligibilityExplicit)&&eligibilityText.length>=20;
  const eligibilityOk=allowedEligibility.has(eligibilityText.toLowerCase())||explicitEligibility;
  if(!future(deadline))fail.push('prazo futuro confirmado ausente');
  if(!eligibilityOk)fail.push('elegibilidade não confirmada');
  if(!allowedStatus.has(String(status||'').toLowerCase()))fail.push('status editorial não confirmado');
  if(!record?.title||!record?.org||!record?.summary||!record?.rules)fail.push('campos editoriais obrigatórios ausentes');
  if(record?.rules&&host(record.rules)!==host(url))fail.push('URL oficial não coincide com a fonte auditada');
 } else if(lead.category==='datasets'){
  const format=String(record?.format||'').trim();
  const datasetIndexPath=(()=>{try{const p=new URL(url||'').pathname.toLowerCase();return p==='/datasets/sources'||p==='/datasets/sources/'||p==='/reference'||p==='/reference/'}catch{return false}})();
  if(/^(?:data sources|data dictionary|our bulk data distributions)$/i.test(String(record?.name||''))||datasetIndexPath)fail.push('página de índice ou dicionário, não um recurso de dados');
  if(!format||/^(?:n\/?a|unknown|not provided|não informado(?: na fonte estruturada)?|não disponível|desconhecido)$/i.test(format))fail.push('formato de acesso da base não comprovado');
  if(/^forum$/i.test(String(record?.org||''))||/forum\.ecmwf\.int\/t\/|\/(?:blog|articles?|news|posts?)\//i.test(url||''))fail.push('página de discussão ou artigo não é recurso de dados');
  for(const k of ['name','org','kind','coverage','limitations','docs','url'])if(!record?.[k])fail.push('campo de base ausente: '+k);
  if(record?.url&&host(record.url)!==host(url))fail.push('URL oficial não coincide com a fonte auditada');
 } else if(lead.category==='tools'){
  for(const k of ['name','kind','desc','url'])if(!record?.[k])fail.push('campo de ferramenta ausente: '+k);
  if(record?.desc&&/(?:this[.]gbar_|_DumpException|document[.]querySelector|function[(]|window[.][A-Za-z_$][A-Za-z0-9_$]*[ ]*=)/i.test(String(record.desc)))fail.push('descrição contém código ou conteúdo técnico da interface, não texto editorial');
  if(record?.url&&host(record.url)!==host(url))fail.push('URL oficial não coincide com a fonte auditada');
 } else fail.push('categoria não classificada');
 const publicationReviewV1=lead.publicationReviewV1||r?.publicationReviewV1;
 if(!validPublicationReview(publicationReviewV1,lead.category,url))fail.push('comprovante individual compatível com Radar evidence gate v1 ausente ou inválido');
 if(fail.length){blockers.push({url:lead.url,category:lead.category,blockers:fail});continue}
 decisions.push({...base,status:'approved',officialUrl:url,publicationReviewV1,reason:record.id.startsWith('auto-')?'Fonte primária HTTPS, página HTML acessível, domínio preservado e metadados estruturados explícitos da própria fonte confirmam os campos publicados; o registro neutro não infere dados ausentes.':'Fonte primária HTTPS, página HTML acessível, domínio preservado, prazo/eligibilidade/status e duplicidade verificados automaticamente; ficha pública completa anexada.',record});
}
const out={schemaVersion:1,generatedAt:new Date().toISOString(),policy:'Aprovação automática somente com ficha completa e comprovante individual Radar evidence gate v1 validado; demais itens permanecem em revisão.',decisions,blockers,summary:{inspected:results.length,autoApproved:decisions.length,blocked:blockers.length,byBlocker:blockers.reduce((a,x)=>{for(const b of x.blockers)a[b]=(a[b]||0)+1;return a},{}),today}};
fs.writeFileSync(process.argv[4]||'intake/auto-editorial-decisions.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.summary));
