#!/usr/bin/env node
// Promote explicitly verified editorial records to public catalogs and the dated changelog.
// No candidate is considered approved merely because a collector found it.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const {cleanText,cleanTitle,cleanSummary}=require('./editorial-text');
const {rollingApplicationEvidence}=require('./editorial-page-evidence');
const {normalizeToolName,eligibilityScope}=require('./build-editorial-record-drafts');
const manifest=process.argv[2]||'intake/approved-publications.json';
const source=JSON.parse(fs.readFileSync(manifest,'utf8'));
if(!Array.isArray(source.approved))throw Error('Manifest requires approved[]');
const spec={
 opportunities:{path:'data/opportunities.js',type:'nova-oportunidade',field:'rules',title:'title'},
 datasets:{path:'data/datasets.js',type:'dados',field:'url',title:'name'},
 tools:{path:'data/tools.js',type:'ferramentas',field:'url',title:'name'}
};
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const name of [...Object.keys(spec).map(x=>spec[x].path),'data/changelog.js'])vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
if(fs.existsSync('data/sources.js'))vm.runInContext(fs.readFileSync('data/sources.js','utf8'),ctx,{filename:'data/sources.js'});
const D=ctx.window.RADAR_PARTS,insertions={opportunities:[],datasets:[],tools:[]},log=[],rejected=[];
const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
const today=[dateParts.year,dateParts.month,dateParts.day].join('-');
const safeUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!!u.hostname}catch{return false}};
const safeOrganization=x=>{
 const value=String(x||'').trim();
 return value.length>0&&value.length<=120&&/^[A-ZÀ-Þ]/u.test(value)
  &&!/^(?:that|which|who|this|these|those)\b/i.test(value)
  &&!/\b(?:will assume|must assume|can apply|should apply|is open to|are open to)\b/i.test(value);
};
const newsStoryEvidence=value=>{
 const text=String(value||'');
 return /globalContent\s*=\s*\{[\s\S]{0,1400}?["']type["']\s*:\s*["']story["'][\s\S]{0,300}?["']subtype["']\s*:\s*["']news["']/i.test(text)
  ||/["']@type["']\s*:\s*["'](?:NewsArticle|Article|BlogPosting|Report|ScholarlyArticle)["']/i.test(text)
  ||/\b(?:news|research) report\s+20\d{2}\b/i.test(text);
};
const genericToolListingEvidence=(record,proof)=>{
 const text=[record.name||'',record.url||'',record.desc||'',proof.evidence||''].join(' ');
 return /^(?:tools?(?: and resources)?|resources and tools|data portals? (?:&|and) tools|world bank open data)$/i.test(String(record.name||'').trim())
  ||/who\.int\/data\/inequality-monitor\/tools-resources|data\.worldbank\.org\/products\/tools/i.test(String(record.url||''))
  ||/\bdata portals? (?:&|and) tools\b/i.test(text);
};
const genericOpportunityTitle=/^(?:how to apply|about(?: the fellowship)?|application|apply now)$/i;

const placeholder=x=>!String(x||'').trim()||/^(?:n\/?a|unknown|not provided|não informado(?: na fonte estruturada)?|não disponível|desconhecido)$/i.test(String(x).trim());
const canonicalUrl=x=>{const u=new URL(x);u.hash='';u.hostname=u.hostname.toLowerCase();u.pathname=u.pathname.replace(new RegExp('/+$'),'')||'/';return u.toString()};
const programSources=new Set((D.sources||[]).filter(x=>/oportunidad/i.test(x.category||'')&&/^(?:programa (?:de )?(?:fellowship|bolsas?|financiamento)|pr[eê]mio|edital)/i.test(x.type||'')).filter(x=>safeUrl(x.url)).map(x=>canonicalUrl(x.url)));
const primaryCall=record=>!aggregator(record)&&safeUrl(record.rules)&&programSources.has(canonicalUrl(record.rules));
const existingUrls=new Map();
for(const [category,rule] of Object.entries(spec))for(const existing of D[category]||[]){const value=existing[rule.field];if(safeUrl(value))existingUrls.set(canonicalUrl(value),existing.id)}
const approvedIds=new Set();
for(const entry of source.approved){
 try{
 const category=entry.category,rule=spec[category],record=entry.record||{},proof=entry.review||{};
 if(category==='opportunities'){
  record.title=cleanTitle(record.title,record.org);
  record.summary=cleanSummary(record.summary,record.title,record.org);
  if(record.desc)record.desc=record.summary;
 }else if(category==='datasets'){
  record.name=cleanTitle(record.name,record.org);
  if(record.description)record.description=cleanText(record.description,1200);
 }else if(category==='tools'){
  record.name=cleanTitle(record.name,record.org);
  record.desc=cleanText(record.desc,1600);
 }
 if(!rule)throw Error('Unknown publication category: '+category);
 if(!record.id||!/^[-a-z0-9]+$/.test(record.id))throw Error('Invalid record ID');
 if(approvedIds.has(record.id))throw Error('Duplicate approval: '+record.id);
 approvedIds.add(record.id);
 const historicalRecord=D[category].find(x=>x.id===record.id&&x[rule.field]===record[rule.field])
  ||(category==='opportunities'&&aggregator(record)&&editionKey(record)&&D.opportunities.some(x=>primaryCall(x)&&editionKey(x)===editionKey(record)));
 const machinePolicy=proof.reviewPolicyVersion==='radar-evidence-v1'||proof.reviewedBy==='Radar evidence gate v1';
 const automatedReview=/auditoria automática|automatic(?:ally|ed)?|automated|\b(?:bot|robot)\b/i.test(String(proof.reviewedBy||''));
 const boilerplateEvidence=/metadados estruturados explícitos da própria fonte confirmam os campos publicados|fonte primária https, página html acessível/i.test(String(proof.evidence||''));
 let machineValid=false;
 if(machinePolicy){
  const requiredChecks={opportunities:['callSignal','eligibility'],datasets:['datasetSignal','directResource','format','coverage'],tools:['productSignal','function','access']}[category]||[];
  const checkedAt=Date.parse(proof.checkedAt||''),age=Date.now()-checkedAt;
  const digest=crypto.createHash('sha256').update(String(proof.evidence||'')).digest('hex');
  machineValid=proof.reviewedBy==='Radar evidence gate v1'&&proof.reviewPolicyVersion==='radar-evidence-v1'
   &&proof.decision==='approved'&&proof.sourceStatus===200&&/^text\/html\b/i.test(proof.contentType||'')
   &&Number.isFinite(checkedAt)&&age>=0&&(age<=24*60*60*1000||Boolean(historicalRecord))
   &&proof.reviewedAt===String(proof.checkedAt).slice(0,10)
   &&digest===proof.evidenceHash&&requiredChecks.length>0
   &&requiredChecks.every(key=>proof.evidenceChecks?.[key]===true);
 }
 if(proof.decision!=='approved'||!proof.reviewedBy||(automatedReview&&!machineValid)||(machinePolicy&&!machineValid)||boilerplateEvidence||!/^\d{4}-\d{2}-\d{2}$/.test(proof.reviewedAt||'')||!safeUrl(proof.officialUrl)||!proof.evidence||String(proof.evidence).length<25)throw Error('Missing item-level editorial verification: '+record.id);
 if(!record[rule.title]||!safeUrl(record[rule.field]))throw Error('Missing public record fields: '+record.id);
 if(new URL(proof.officialUrl).hostname!==new URL(record[rule.field]).hostname)throw Error('Official source does not match record: '+record.id);
 if(category==='opportunities'&&genericOpportunityTitle.test(String(record.title||'').trim()))throw Error('Opportunity requires a specific named program, not a generic application page: '+record.id);
 if(category==='opportunities'&&record.org&&!safeOrganization(record.org))throw Error('Opportunity organization field is not a valid organization name: '+record.id);
 if(category==='opportunities'&&(!record.deadlineStatus||!record.eligibility||!record.status))throw Error('Opportunity requires deadline status, eligibility and status: '+record.id);
 if(category==='datasets'){
  if(!record.coverage||!record.limitations)throw Error('Dataset requires coverage and limitations: '+record.id);
  const datasetText=[record[rule.title],record[rule.field],record.coverage,record.description,record.kind].join(' ');
  const genericTitle=/^(in[ií]cio|inicio|home|start|eventos?|events?|about|sobre|contact|contato|menu|search|login|register|news|blog|resources?|opportunities?|calend[áa]rio|calendar)$/i.test(String(record[rule.title]).trim());
  const navNoise=/ir para o (conte[uú]do|menu|navega[cç][aã]o|rodap[eé]|mapa do site|in[ií]cio|p[aá]gina inicial|busca)|aten[cç][aã]o! seu navegador|nome do site/i.test(String(record.coverage));
  const datasetSignal=/(dataset|data[- ]?catalog|open[- ]?data|dados?[- ]abertos?|database|base de dados|catalog|cat[aá]logo de dados|api|csv|json|estat[ií]stic|indicador|microdados|portal(?:.{0,20})dados|data portal|geodados|datacatalog|\/datasets?\/)/i.test(datasetText);
  const excludedPage=/calendly\.com|github\.com\/[^\s]+\/(?:security\/advisories|blob\/)[^\s]*(?:CODE_OF_CONDUCT|code_of_conduct)|opensanctions\.org\/docs\/metadata|forum\.ecmwf\.int\/t\/|\/(?:blog|articles?|news|posts?)\//i.test(String(record[rule.field])+' '+datasetText);
  const unverifiedFormat=placeholder(record.format);
  const announcementOrArticle=/\b(feedback[- ]gathering survey|new dataset published|dataset transparency mandates|how we.ve built|data sources)\b/i.test(String(record[rule.title]));
  if(excludedPage||announcementOrArticle||!['dataset','catalog','portal','system'].includes(String(record.kind||'').toLowerCase())||!record.org||/^forum$/i.test(String(record.org))||unverifiedFormat)throw Error('Dataset lacks a direct, usable resource and verified access format: '+record.id);
  if(genericTitle||navNoise||!datasetSignal)throw Error('Dataset evidence is insufficient or page is generic/navigation: '+record.id);
 }
 if(category==='tools'){
  if(!record.kind||!record.desc||record.desc.length<70)throw Error('Tool requires kind and substantive description with limitations: '+record.id);
  if(newsStoryEvidence(proof.evidence)||newsStoryEvidence(record.name+' '+record.url))throw Error('Tool evidence identifies a news story or report, not a software product: '+record.id);
  if(genericToolListingEvidence(record,proof))throw Error('Tool evidence identifies a directory or index page, not a software product: '+record.id);
  const jlabPublicationPage=(()=>{try{const u=new URL(record.url),host=(u.hostname.toLowerCase().startsWith('www.')?u.hostname.slice(4):u.hostname.toLowerCase()),path=u.pathname.toLowerCase();return (host==='j-lab.org'&&path.startsWith('/publications/'))||(host==='sej.org'&&(path==='/library/reporting-tools/overview'||path==='/library/reporting-tools/overview/'))}catch{return false}})();
  const socialPlatformPage=/^https?:\/\/(?:www\.)?(?:instagram\.com|facebook\.com|linkedin\.com|tiktok\.com|x\.com|twitter\.com|youtube\.com|youtu\.be|threads\.net|reddit\.com|pinterest\.com|t\.me)(?:\/|$)/i.test(String(record.url));
  const excludedToolPage=jlabPublicationPage||socialPlatformPage||new RegExp("mediawiki\\.org|wikidata\\.org/wiki/Special:NewItem|github\\.com/[^\\s]+/blob/|/news/|/item/|/program(?:/|$)|substack\\.com|/blog/|/conference(?:/|$)|/events?(?:/|$)","i").test(String(record.url));
  const genericToolKind=/^(?:tool|ferramenta|software|application|aplicativo)$/i.test(String(record.kind||'').trim());
  const nonToolTitle=/\b(?:blog|newsletter|conference|festival|portfolio|curated list|course|tutorial|researcher|designer|artist|interactive news)\b/i.test(String(record.name||''));
  const navigationTool=/jump to content|main menu|navigation|create account|log in|personal tools|toggle the table|page discussion|read edit view history|contents move to sidebar|search search/i.test(String(record.desc));
  if(excludedToolPage||genericToolKind||nonToolTitle||navigationTool)throw Error('Tool evidence is insufficient or page is navigation, article, profile or event: '+record.id);
 }
 const old=D[category].find(x=>x.id===record.id);
 const canonical=canonicalUrl(record[rule.field]);
 const matchingId=existingUrls.get(canonical);
 if(matchingId&&matchingId!==record.id)throw Error('Official URL already published under '+matchingId+': '+record.id);
 if(!old)existingUrls.set(canonical,record.id);
 if(old){
  if(old[rule.field]!==record[rule.field])throw Error('Existing record requires explicit update workflow: '+record.id);
  // Refresh only source-derived eligibility fields, with fresh hashed evidence
  // on the identical source URL. This is a correction, never a new publication.
  if(category==='opportunities'&&machinePolicy&&Date.now()-Date.parse(proof.checkedAt)<=86400000&&record.scope===eligibilityScope(proof.evidence)&&['elegível','parcial','inelegível','restrita'].includes(record.eligibility)&&(old.scope!==record.scope||old.eligibility!==record.eligibility)){
   old.scope=record.scope;old.eligibility=record.eligibility;
   fs.writeFileSync(spec.opportunities.path,'window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.opportunities='+JSON.stringify(D.opportunities,null,2)+';\n');
  }
  continue;
 }
 // Validate category-specific facts for every new record before it can reach the catalog.
 if(category==='opportunities'){
  const allowedEligibility=new Set(['elegível','parcial','inelegível','restrita']);
  if(record.status!=='aberta')throw Error('Opportunity is not confirmed open: '+record.id);
  if(machinePolicy&&!record.deadline&&!rollingApplicationEvidence(proof.evidence))throw Error('Continuous opportunity requires explicit application evidence: '+record.id);
  if(!allowedEligibility.has(String(record.eligibility||'').toLowerCase()))throw Error('Opportunity eligibility must use a validated catalog status: '+record.id);
  if(!record.scope||String(record.scope).trim().length<10)throw Error('Opportunity requires a substantive eligibility scope: '+record.id);
  if(!record.deadlineStatus||!/confirm|oficial|official|fluxo contínuo|prazo contínuo|ongoing|rolling/i.test(String(record.deadlineStatus)))throw Error('Opportunity deadline state is not evidenced by the primary source: '+record.id);
  if(record.deadline){
   if(!/^\d{4}-\d{2}-\d{2}$/.test(record.deadline)||new Date(record.deadline+'T00:00:00Z').toISOString().slice(0,10)!==record.deadline)throw Error('Opportunity has an invalid deadline date: '+record.id);
   if(record.deadline<today)throw Error('Opportunity deadline has passed: '+record.id);
  }else if(!/fluxo contínuo|prazo contínuo|ongoing|rolling|sem (?:data|prazo)|no deadline/i.test(String(record.deadlineStatus)))throw Error('Opportunity without a date must have an explicitly continuous or no-deadline status: '+record.id);
 }
 if(category==='datasets'){
  if(!safeUrl(record.docs))throw Error('Dataset requires official access documentation: '+record.id);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(record.lastChecked||'')||record.lastChecked>today)throw Error('Dataset requires a valid non-future lastChecked date: '+record.id);
 }
 if(category==='tools'){
  const proofText=String(proof.evidence||'');
  if(!/(?:feature|function|capabilit|funcional|permite|provides|supports|documentation|documenta|generator|generates?|writes?|creates?|builds?|theme editor|programming language|statistical computing|statistical analysis|data analytics|business intelligence|query language|file,? track and share public records requests|browser automation tool|graphics framework|javascript 3d library)/i.test(proofText))throw Error('Tool evidence must describe a confirmed product function: '+record.id);
  if(!/(?:access|free|paid|license|licen[çc]a|account|conta|demo|demonstra[cç][aã]o|availability|available|install|download|limitations|limita[cç][oõ]es|documentation|docs|github|cran|npm|python|browser|web app|online|cloud|desktop|api|open source|pricing|subscription|commercial|trial|gratuito|disponível|acesso)/i.test(proofText))throw Error('Tool evidence must record access, license or availability terms and limitations: '+record.id);
 }
 insertions[category].push(record);
 log.push({type:rule.type,id:record.id,title:record[rule.title],date:today,detail:proof.evidence});
 }catch(error){if(entry?.record?.id)approvedIds.delete(entry.record.id);rejected.push({id:entry?.record?.id||null,category:entry?.category||null,reason:String(error.message||error).slice(0,300)});}
}
// Reconcile an aggregator alias only when a primary record for the same named
// programme and exact deadline already exists or has passed publication checks.
let toolNamesRepaired=0;
for(const record of D.tools){
 try{
  const u=new URL(record.url);
  if(!/(^|\.)r-project\.org$/.test(u.hostname)||!u.searchParams.has('package')&&!/\/(?:packages\/|package=)/.test(u.pathname))continue;
  const name=normalizeToolName(record.name,record.desc,u.href);
  if(name&&name!==record.name){record.name=name;toolNamesRepaired++;for(const entry of D.changelog)for(const item of entry.items||[])if(item.id===record.id)item.title=name;}
 }catch{}
}
if(toolNamesRepaired){
 fs.writeFileSync(spec.tools.path,'window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.tools='+JSON.stringify(D.tools,null,2)+';\n');
 fs.writeFileSync('data/changelog.js','window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.changelog='+JSON.stringify(D.changelog,null,2)+';\n');
}
function aggregator(record){try{return /(^|\.)(?:opportunitydesk\.org|gfmd\.info|grantsforjournalists\.com)$/.test(new URL(record.rules).hostname)}catch{return false}}
function editionKey(record){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(record.deadline||''))return null;
 const name=cleanTitle(record.title,record.org).replace(/\([^)]*(?:funded|paid|stipend)[^)]*\)/gi,'').replace(/\b20\d{2}(?:\s*[-–/]\s*(?:20)?\d{2})?\b/g,'').replace(/^the\s+/i,'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
 return name.length>=12?name+'|'+record.deadline:null;
};
const allCalls=[...D.opportunities,...insertions.opportunities];
const primaryKeys=new Set(allCalls.filter(primaryCall).map(editionKey).filter(Boolean));
const aliases=[...allCalls,...source.approved.filter(x=>x.category==='opportunities').map(x=>x.record)].filter(x=>aggregator(x)&&primaryKeys.has(editionKey(x)));
const duplicateAliases=new Set(aliases.map(x=>x.id));
const publicationAliases=[...new Map(aliases.map(alias=>[alias.id,{category:'opportunities',id:alias.id,primaryId:allCalls.find(call=>primaryCall(call)&&editionKey(call)===editionKey(alias)).id}])).values()];
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/publication-aliases.json',JSON.stringify({aliases:publicationAliases},null,2)+'\n');
if(duplicateAliases.size){
 D.opportunities=D.opportunities.filter(x=>!duplicateAliases.has(x.id));
 insertions.opportunities=insertions.opportunities.filter(x=>!duplicateAliases.has(x.id));
 log.splice(0,log.length,...log.filter(x=>!duplicateAliases.has(x.id)));
 D.changelog=D.changelog.map(entry=>Array.isArray(entry.items)?{...entry,items:entry.items.filter(x=>!duplicateAliases.has(x.id))}:entry).filter(entry=>!Array.isArray(entry.items)||entry.items.length);
 fs.writeFileSync(spec.opportunities.path,'window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.opportunities='+JSON.stringify(D.opportunities,null,2)+';\n');
 fs.writeFileSync('data/changelog.js','window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.changelog='+JSON.stringify(D.changelog,null,2)+';\n');
}
// Archive existing calls after their stated local deadline without counting them as new.
const pacificToday=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Los_Angeles',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const expired=new Set(D.opportunities.filter(record=>record.status==='aberta'&&
 /^\d{4}-\d{2}-\d{2}$/.test(record.deadline)&&
 record.deadline<(/23h59 do Pacífico/i.test(record.deadlineStatus)?pacificToday:today)).map(record=>record.id));
const archived=expired.size;
if(archived){
 const file=spec.opportunities.path;
 const updated=fs.readFileSync(file,'utf8').replace(/^([ \t]*)\{[ \t]*\r?\n[\s\S]*?^\1\}(?=,|\s*\])/gm,block=>{
  const property=/^([ \t]*)"id":\s*"([^"]+)"/m.exec(block);
  if(!property||!expired.has(property[2]))return block;
  const [ ,indent,id]=property;
  const statusLine=new RegExp('^('+indent+'"status":\\s*)"aberta"','m');
  const closed=block.replace(statusLine,'$1"encerrada"');
  if(closed!==block)expired.delete(id);
  return closed;
 });
 if(expired.size)throw Error('Could not archive expired opportunities: '+[...expired].join(', '));
 fs.writeFileSync(file,updated);
}
function prepend(path,variable,records){
 if(!records.length)return;
 let content=fs.readFileSync(path,'utf8'),marker='window.RADAR_PARTS.'+variable+'=[',pos=content.indexOf(marker);
 if(pos<0)throw Error('Missing catalog array: '+path);
 pos+=marker.length;
 content=content.slice(0,pos)+'\n'+records.map(x=>JSON.stringify(x,null,2)).join(',\n')+', '+content.slice(pos);
 fs.writeFileSync(path,content);
}
for(const [category,records] of Object.entries(insertions))prepend(spec[category].path,category,records);
const updates=Object.values(spec).map(rule=>({rule,items:log.filter(x=>x.type===rule.type)})).filter(x=>x.items.length).map(({rule,items})=>({
 date:today,type:rule.type,title:'Publicação editorial verificada — '+today,
 items:items.map(x=>({id:x.id,title:x.title})),
 detail:'Registros aprovados individualmente com documentação oficial e evidência editorial: '+items.map(x=>x.title).join('; ')+'.'
}));
prepend('data/changelog.js','changelog',updates);
console.log(JSON.stringify({date:today,approved:source.approved.length,published:log.length,rejected,archived,publicationAliases,duplicateAliasesRemoved:duplicateAliases.size,alreadyPresent:source.approved.length-log.length,byCategory:Object.fromEntries(Object.entries(insertions).map(([k,v])=>[k,v.length]))}));
