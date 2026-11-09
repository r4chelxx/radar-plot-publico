#!/usr/bin/env node
// Promote explicitly verified editorial records to public catalogs and the dated changelog.
// No candidate is considered approved merely because a collector found it.
const fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
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
const D=ctx.window.RADAR_PARTS,insertions={opportunities:[],datasets:[],tools:[]},log=[];
const dateParts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
const today=[dateParts.year,dateParts.month,dateParts.day].join('-');
const safeUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!!u.hostname}catch{return false}};
const placeholder=x=>!String(x||'').trim()||/^(?:n\/?a|unknown|not provided|não informado(?: na fonte estruturada)?|não disponível|desconhecido)$/i.test(String(x).trim());
const canonicalUrl=x=>{const u=new URL(x);u.hash='';u.hostname=u.hostname.toLowerCase();u.pathname=u.pathname.replace(new RegExp('/+$'),'')||'/';return u.toString()};
const existingUrls=new Map();
for(const [category,rule] of Object.entries(spec))for(const existing of D[category]||[]){const value=existing[rule.field];if(safeUrl(value))existingUrls.set(canonicalUrl(value),existing.id)}
const approvedIds=new Set();
for(const entry of source.approved){
 const category=entry.category,rule=spec[category],record=entry.record||{},proof=entry.review||{};
 if(!rule)throw Error('Unknown publication category: '+category);
 if(!record.id||!/^[-a-z0-9]+$/.test(record.id))throw Error('Invalid record ID');
 if(approvedIds.has(record.id))throw Error('Duplicate approval: '+record.id);
 approvedIds.add(record.id);
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
   &&Number.isFinite(checkedAt)&&age>=0&&age<=24*60*60*1000
   &&proof.reviewedAt===String(proof.checkedAt).slice(0,10)
   &&digest===proof.evidenceHash&&requiredChecks.length>0
   &&requiredChecks.every(key=>proof.evidenceChecks?.[key]===true);
 }
 if(proof.decision!=='approved'||!proof.reviewedBy||(automatedReview&&!machineValid)||(machinePolicy&&!machineValid)||boilerplateEvidence||!/^\d{4}-\d{2}-\d{2}$/.test(proof.reviewedAt||'')||!safeUrl(proof.officialUrl)||!proof.evidence||String(proof.evidence).length<25)throw Error('Missing item-level editorial verification: '+record.id);
 if(!record[rule.title]||!safeUrl(record[rule.field]))throw Error('Missing public record fields: '+record.id);
 if(new URL(proof.officialUrl).hostname!==new URL(record[rule.field]).hostname)throw Error('Official source does not match record: '+record.id);
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
  const excludedToolPage=new RegExp("mediawiki\\.org|wikidata\\.org/wiki/Special:NewItem|github\\.com/[^\\s]+/blob/|/news/|/item/|/program(?:/|$)|substack\\.com|/blog/|/conference(?:/|$)|/events?(?:/|$)","i").test(String(record.url));
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
 if(old){if(old[rule.field]!==record[rule.field])throw Error('Existing record requires explicit update workflow: '+record.id);continue}
 // Validate category-specific facts for every new record before it can reach the catalog.
 if(category==='opportunities'){
  const allowedEligibility=new Set(['elegível','parcial','inelegível','restrita']);
  if(record.status!=='aberta')throw Error('Opportunity is not confirmed open: '+record.id);
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
  if(!/(?:feature|function|capabilit|funcional|permite|provides|supports|documentation|documenta)/i.test(proofText))throw Error('Tool evidence must describe a confirmed product function: '+record.id);
  if(!/(?:access|free|paid|license|licen[çc]a|account|conta|demo|demonstra[cç][aã]o|availability|available|limitations|limita[cç][oõ]es)/i.test(proofText))throw Error('Tool evidence must record access, license or availability terms and limitations: '+record.id);
 }
 insertions[category].push(record);
 log.push({type:rule.type,id:record.id,title:record[rule.title],date:today,detail:proof.evidence});
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
console.log(JSON.stringify({date:today,approved:source.approved.length,published:log.length,alreadyPresent:source.approved.length-log.length,byCategory:Object.fromEntries(Object.entries(insertions).map(([k,v])=>[k,v.length]))}));
