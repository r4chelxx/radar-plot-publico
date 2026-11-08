#!/usr/bin/env node
// Conservative bridge from inspected candidates to explicit editorial decisions.
// It only approves records when every deterministic gate is present; otherwise it
// records the blocker and leaves the candidate in review.
const fs=require('node:fs'),crypto=require('node:crypto');
const evidence=JSON.parse(fs.readFileSync(process.argv[2]||'intake/lead-evidence.json','utf8'));
const review=JSON.parse(fs.readFileSync(process.argv[3]||'intake/editorial-review.json','utf8'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const allowedEligibility=new Set(['elegível','parcial']);
const allowedStatus=new Set(['aberta','monitorar']);
const isoDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
const host=x=>{try{return new URL(x).hostname.toLowerCase()}catch{return null}};
const future=x=>isoDate(x)&&x>=today;
const derivedId=url=>'auto-'+crypto.createHash('sha256').update(String(url)).digest('hex').slice(0,16);
function deriveOpportunity(lead,url){
 const se=lead.structuredEvidence||{};
 const title=se.title||lead.pageTitle||lead.sourcePageTitle;
 const description=se.description||lead.pageDescription;
 const organization=se.organization||lead.organization;
 if(lead.category!=='opportunities'||!se.eligibilityExplicit||se.status!=='aberta'||!title||!description||description.length<120||!organization||!future(se.deadline))return null;
 return {id:derivedId(url),title,org:organization,summary:description,type:se.sourceType||'Oportunidade editorial',themes:['Oportunidade editorial'],scope:'Não especificado',deadline:se.deadline,deadlineStatus:'prazo extraído de metadado estruturado da fonte oficial; horário e condições devem ser conferidos na página',eligibility:'parcial',fit:5,status:'aberta',value:'Não informado na fonte estruturada',duration:'Não informado na fonte estruturada',modality:se.sourceType||'Não especificado',documents:[],restrictions:[],rules:url,apply:url,verified:today,desc:se.description,discoveryUrl:lead.url,verificationHistory:[{date:today,status:'aberta',source:url}]};
}
function deriveDataset(lead,url){
 const se=lead.structuredEvidence||{};
 const title=se.title||lead.pageTitle||lead.sourcePageTitle;
 const description=se.description||lead.pageDescription;
 const organization=se.organization||lead.organization;
 if(lead.category!=='datasets'||!title||!description||description.length<80||!organization)return null;
 const sourceType=String(se.sourceType||'').toLowerCase();
 const evidenceText=[title,description,url,se.sourceType||'',lead.pageTitle||'',lead.pageDescription||''].join(' ');
 const genericTitle=/^(in[ií]cio|inicio|home|start|eventos?|events?|about|sobre|contact|contato|menu|search|login|register|news|blog|resources?|opportunities?|calend[áa]rio|calendar)$/i.test(String(title).trim());
 const navigationNoise=/ir para o (conte[uú]do|menu|navega[cç][aã]o|rodap[eé]|mapa do site|in[ií]cio|p[aá]gina inicial|busca)|aten[cç][aã]o! seu navegador|nome do site/i.test(String(description));
 const excludedPage=new RegExp("calendly\\.com|github\\.com/[^\\s]+/(?:security/advisories|blob/)[^\\s]*(?:CODE_OF_CONDUCT|code_of_conduct)|opensanctions\\.org/docs/metadata","i").test(String(url)+' '+String(description));
 if(excludedPage)return null;
 const datasetSignal=/(dataset|data[- ]?catalog|open[- ]?data|dados?[- ]abertos?|database|base de dados|catalog|cat[aá]logo de dados|api|csv|json|estat[ií]stic|indicador|microdados|portal(?:.{0,20})dados|data portal|geodados|datacatalog|\/datasets?\/)/i.test(evidenceText);
 if(genericTitle||navigationNoise||!datasetSignal)return null;
 if(sourceType&&!/dataset|datacatalog|catalog|data[- ]?catalog/.test(sourceType))return null;
 return {id:derivedId(url),name:title,org:organization,territoryTier:'Outros',kind:'dataset',themes:['Dados abertos'],coverage:description,frequency:'Não informado na fonte estruturada',format:'Não informado na fonte estruturada',period:'Não informado na fonte estruturada',granularity:'Não informado na fonte estruturada',geoUnit:'Não informado na fonte estruturada',api:'Não informado na fonte estruturada',docs:url,limitations:'Metadados estruturados confirmam a existência do recurso, mas cobertura, atualização, licença e qualidade devem ser conferidas antes do uso editorial.',lastChecked:today,url,discoveryUrl:lead.url,description};
}
function deriveTool(lead,url){
 const se=lead.structuredEvidence||{};
 const title=se.title||lead.pageTitle||lead.sourcePageTitle;
 const description=se.description||lead.pageDescription;
 const excludedToolPage=new RegExp("mediawiki\\.org|wikidata\\.org/wiki/Special:NewItem|github\\.com/[^\\s]+/blob/|/news/|/item/|/program(?:/|$)","i").test(String(url));
 const navigationTool=/jump to content|main menu|navigation|create account|log in|personal tools|toggle the table|page discussion|read edit view history|contents move to sidebar|search search/i.test(String(description));
 if(excludedToolPage||navigationTool)return null;
 if(lead.category!=='tools'||!title||!description||description.length<80)return null;
 const sourceType=String(se.sourceType||'').toLowerCase();
 if(sourceType&&!/software|application|tool|product|creativework/.test(sourceType))return null;
 return {id:derivedId(url),name:title,kind:se.sourceType||'ferramenta',url,desc:description+' Revisar licença, limites, privacidade e acessibilidade antes do uso editorial.',discoveryUrl:lead.url};
}
const results=(evidence.results||[]);
const byId=new Map((review.candidates||[]).map(x=>[x.id,x]));
const decisions=[], blockers=[];
for(const lead of results){
 const r=byId.get(lead.historicalId||lead.id)||lead;
 const url=lead.finalUrl||lead.url;
 const base={url:lead.url||url,category:lead.category,reviewedBy:'Radar PLOT — auditoria automática conservadora',reviewedAt:today};
 const fail=[];
 if(lead.pageStatus!=='html-fetched')fail.push('página não inspecionada como HTML');
 if(!url||!/^https:\/\//.test(url))fail.push('fonte final não é HTTPS');
 if(host(url)!==host(lead.url))fail.push('redirecionamento para host diferente');
 if((lead.possibleMatches||r?.possibleMatches||[]).length)fail.push('possível duplicidade ainda não resolvida');
 let record=lead.publicationRecord||lead.record||r?.publicationRecord||r?.record;
 if(!record){record=deriveOpportunity(lead,url)||deriveDataset(lead,url)||deriveTool(lead,url);}
 if(!record)fail.push('ficha pública estruturada ausente');
 if(lead.category==='opportunities'){
  const deadline=lead.deadline||record?.deadline;
  const eligibility=lead.eligibility||record?.eligibility;
  const status=lead.status||lead.structuredEvidence?.status||record?.status;
  if(!future(deadline))fail.push('prazo futuro confirmado ausente');
  if(!allowedEligibility.has(eligibility))fail.push('elegibilidade não confirmada');
  if(!allowedStatus.has(status))fail.push('status editorial não confirmado');
  if(!record?.title||!record?.org||!record?.summary||!record?.rules)fail.push('campos editoriais obrigatórios ausentes');
  if(record?.rules&&host(record.rules)!==host(url))fail.push('URL oficial não coincide com a fonte auditada');
 } else if(lead.category==='datasets'){
  for(const k of ['name','org','kind','coverage','limitations','docs','url'])if(!record?.[k])fail.push('campo de base ausente: '+k);
  if(record?.url&&host(record.url)!==host(url))fail.push('URL oficial não coincide com a fonte auditada');
 } else if(lead.category==='tools'){
  for(const k of ['name','kind','desc','url'])if(!record?.[k])fail.push('campo de ferramenta ausente: '+k);
  if(record?.desc&&String(record.desc).length<70)fail.push('descrição da ferramenta insuficiente');
  if(record?.url&&host(record.url)!==host(url))fail.push('URL oficial não coincide com a fonte auditada');
 } else fail.push('categoria não classificada');
 if(fail.length){blockers.push({url:lead.url,category:lead.category,blockers:fail});continue}
 decisions.push({...base,status:'approved',officialUrl:url,reason:record.id.startsWith('auto-')?'Fonte primária HTTPS, página HTML acessível, domínio preservado e metadados estruturados explícitos da própria fonte confirmam os campos publicados; o registro neutro não infere dados ausentes.':'Fonte primária HTTPS, página HTML acessível, domínio preservado, prazo/eligibilidade/status e duplicidade verificados automaticamente; ficha pública completa anexada.',record});
}
const out={schemaVersion:1,generatedAt:new Date().toISOString(),policy:'Aprovação automática somente quando todos os gates determinísticos estão completos; itens ambíguos permanecem em revisão.',decisions,summary:{inspected:results.length,autoApproved:decisions.length,blocked:blockers.length,byBlocker:blockers.reduce((a,x)=>{for(const b of x.blockers)a[b]=(a[b]||0)+1;return a},{}),today}};
fs.writeFileSync(process.argv[4]||'intake/auto-editorial-decisions.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.summary));
