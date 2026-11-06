#!/usr/bin/env node
// Conservative bridge from inspected candidates to explicit editorial decisions.
// It only approves records when every deterministic gate is present; otherwise it
// records the blocker and leaves the candidate in review.
const fs=require('node:fs');
const evidence=JSON.parse(fs.readFileSync(process.argv[2]||'intake/lead-evidence.json','utf8'));
const review=JSON.parse(fs.readFileSync(process.argv[3]||'intake/editorial-review.json','utf8'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const allowedEligibility=new Set(['elegível','parcial']);
const allowedStatus=new Set(['aberta','monitorar']);
const isoDate=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
const host=x=>{try{return new URL(x).hostname.toLowerCase()}catch{return null}};
const future=x=>isoDate(x)&&x>=today;
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
 const record=lead.publicationRecord||lead.record||r?.publicationRecord||r?.record;
 if(!record)fail.push('ficha pública estruturada ausente');
 if(lead.category==='opportunities'){
  const deadline=lead.deadline||record?.deadline;
  const eligibility=lead.eligibility||record?.eligibility;
  const status=lead.status||record?.status;
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
 decisions.push({...base,status:'approved',officialUrl:url,reason:'Fonte primária HTTPS, página HTML acessível, domínio preservado, prazo/eligibilidade/status e duplicidade verificados automaticamente; ficha pública completa anexada.',record});
}
const out={schemaVersion:1,generatedAt:new Date().toISOString(),policy:'Aprovação automática somente quando todos os gates determinísticos estão completos; itens ambíguos permanecem em revisão.',decisions,summary:{inspected:results.length,autoApproved:decisions.length,blocked:blockers.length,byBlocker:blockers.reduce((a,x)=>{for(const b of x.blockers)a[b]=(a[b]||0)+1;return a},{}),today}};
fs.writeFileSync(process.argv[4]||'intake/auto-editorial-decisions.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify(out.summary));
