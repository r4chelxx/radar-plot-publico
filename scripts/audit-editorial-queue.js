#!/usr/bin/env node
// Audits persisted candidate URLs in bounded batches. Reachability is not editorial approval.
const fs=require('node:fs');
const path=require('node:path');
const {extractEvidence}=require('./editorial-page-evidence');
const {extractStructuredMetadata,metadataForLink}=require('./structured-lead-metadata');
const queuePath=process.argv[2]||'intake/editorial-queue.json';
const reportPath=process.argv[3]||'intake/editorial-queue-audit.json';
const maxItems=Math.min(250,Math.max(1,Number(process.env.RADAR_QUEUE_AUDIT_LIMIT||150)));
const maxAgeDays=Math.max(1,Number(process.env.RADAR_QUEUE_AUDIT_MAX_AGE_DAYS||1));
const now=new Date(),cutoff=now.getTime()-maxAgeDays*86400000;

function selectAuditBatch(items,limit=maxItems,priorityIds=new Set()){
 items=[...items].sort((a,b)=>Number(priorityIds.has(b.id))-Number(priorityIds.has(a.id)));
 const selected=[],seen=new Set(),categories=['opportunities','datasets','tools'];
 // Reserve 20% of the audit window per catalog category, then fill by oldest age.
 const reserve=Math.max(1,Math.floor(limit*0.2));
 for(const category of categories){
  for(const item of items.filter(x=>x.category===category).slice(0,reserve)){
   if(selected.length>=limit)break;
   if(!seen.has(item.id)){selected.push(item);seen.add(item.id);}
  }
 }
 for(const item of items){if(selected.length>=limit)break;if(!seen.has(item.id)){selected.push(item);seen.add(item.id);}}
 return selected;
}
const excludedPath=/\/(?:blog|news|press|events?|conference|people|team|authors?|profiles?)\//i;
const badTitle=/^(?:home|inicio|in[ií]cio|events?|eventos?|news|notícias|about|sobre|contact|contato|menu|blog|resources?)$/i;
function meta(html,key){for(const tag of html.match(/<meta[^>]*>/gi)||[]){const n=/name=["']([^"']+)["']/i.exec(tag)||/property=["']([^"']+)["']/i.exec(tag),v=/content=["']([^"']*)["']/i.exec(tag);if(n&&v&&n[1].toLowerCase()===key.toLowerCase())return v[1].replace(/&amp;/g,'&').trim()}return ''}
function primaryCallUrl(html,source){
 const base=new URL(source);
 if(!/(^|\.)(?:opportunitydesk\.org|gfmd\.info|grantsforjournalists\.com)$/.test(base.hostname))return null;
 for(const link of html.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)){
  const context=html.slice(Math.max(0,link.index-180),link.index).replace(/<[^>]+>/g,' ');
  const label=link[2].replace(/<[^>]+>/g,' ');
  if(!/official (?:website|page|call)|for more information.{0,140}(?:visit|see)?\s*$/i.test(label+' '+context))continue;
  try{
   const u=new URL(link[1].replace(/&amp;/g,'&'),source);
   if(u.protocol!=='https:'||u.username||u.password||u.hostname===base.hostname||/(?:facebook|twitter|linkedin|instagram|youtube|opportunitydesk|gfmd|grantsforjournalists)\./i.test(u.hostname)||u.hostname==='localhost'||u.hostname.endsWith('.local')||u.hostname.endsWith('.internal')||/^\d|:/.test(u.hostname))continue;
   return u.href;
  }catch{}
 }
 return null;
}
async function inspect(item,followPrimary=true){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const res=await fetch(item.url,{redirect:'follow',signal:ctrl.signal,headers:{'user-agent':'Radar-PLOT-Queue-Audit/1.0','accept':'text/html,application/json;q=0.9,*/*;q=0.8'}});
  const type=res.headers.get('content-type')||'';
  const body=await res.text(),html=body.slice(0,500000);
  const primary=followPrimary&&res.ok?primaryCallUrl(html,res.url):null;
  if(primary&&item.category==='opportunities'){
   const resolved=await inspect({...item,url:primary,sourceEvidence:'',resourceLinks:[]},false);
   return {...item,audit:resolved.audit,sourceResolution:{discoveryUrl:item.url,primaryUrl:primary}};
  }
  const metadata=metadataForLink(extractStructuredMetadata(html,res.url),res.url);
  const title=(metadata?.title||/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]||meta(html,'og:title')||item.title||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
  const description=(meta(html,'description')||meta(html,'og:description')).slice(0,800);
  const pageEvidence=extractEvidence(html,res.url);
  const normalized=(title+' '+description+' '+item.url).toLowerCase();
  let result='needs_editorial_review',reason='Página acessível; categoria e recurso ainda exigem confirmação específica.';
  if(res.status===404||res.status===410){result='unavailable';reason='Fonte retornou HTTP '+res.status+'.'}
  else if(!res.ok){result=[401,403,429].includes(res.status)?'inconclusive':'unavailable';reason='Fonte retornou HTTP '+res.status+'.'}
  else if(excludedPath.test(new URL(res.url).pathname)||badTitle.test(title)){result='likely_non_resource';reason='Página parece artigo, evento, perfil, navegação ou página genérica.'}
  else if(/text\/html/i.test(type)){
   const category=item.category||'uncategorized';
   const signals={
    opportunities:/\b(apply|application|deadline|eligibility|grant|fellowship|award|prize|bolsa|inscri[cç][aã]o|prazo|elegibilidade)\b/i.test(normalized),
    tools:/\b(software|tool|platform|application|download|documentation|pricing|ferramenta|plataforma|software)\b/i.test(normalized),
    datasets:/\b(dataset|data portal|data catalog|download|csv|json|api|microdata|open data|dados abertos|base de dados)\b/i.test(normalized)
   };
   if(category in signals&&!signals[category]){result='weak_category_evidence';reason='Metadados da página não confirmam a categoria '+category+'.'}
   else if(!title||title.length<4){result='weak_page_metadata';reason='Página sem título/metadados utilizáveis.'}
  }else if(/application\/(?:json|ld\+json)|text\/csv|application\/(?:zip|octet-stream)/i.test(type)){result='data_resource_candidate';reason='A URL entrega conteúdo estruturado/binário; validar formato, escopo, licença e uso editorial.'}
  else{result='non_html_resource_candidate';reason='URL acessível com tipo '+type+'; validar função e categoria.'}
  const inheritedLinks=Array.isArray(item.resourceLinks)?item.resourceLinks:[];
  const resourceLinks=[...inheritedLinks,...(pageEvidence.resourceLinks||[])].filter((x,i,a)=>x?.url&&!a.slice(0,i).some(y=>y.url===x.url)).slice(0,40);
  const evidenceText=[pageEvidence.evidenceText,item.sourceEvidence].filter(Boolean).join(' ').slice(0,120000);
  return{...item,audit:{checkedAt:now.toISOString(),httpStatus:res.status,finalUrl:res.url,contentType:type,pageTitle:title,pageDescription:description,evidenceText,structuredData:pageEvidence.structuredData,tabularData:pageEvidence.tabularData,resourceLinks,result,reason}}
 }catch(e){return{...item,audit:{checkedAt:now.toISOString(),httpStatus:null,contentType:'',pageTitle:item.title||'',pageDescription:'',evidenceText:String(item.sourceEvidence||''),structuredData:[],resourceLinks:Array.isArray(item.resourceLinks)?item.resourceLinks:[],result:'inconclusive',reason:e.name==='AbortError'?'Timeout; tentar em auditoria futura.':'Falha de rede; tentar em auditoria futura.'}}}
 finally{clearTimeout(timer)}
}
async function main(){
 const queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
 if(!Array.isArray(queue.candidates))throw Error('Queue requires candidates[]');
 const pending=queue.candidates.filter(x=>x.status==='pending'&&/^https:\/\//i.test(x.url||''));
 const dueCandidates=pending.filter(x=>x.verificationStatus==='official-web-search'&&x.audit?.result==='inconclusive'||!x.audit?.checkedAt||Date.parse(x.audit.checkedAt)<cutoff)
  .sort((a,b)=>String(a.firstSeen||'').localeCompare(String(b.firstSeen||'')));
 const draftsPath=path.join(path.dirname(queuePath),'publication-drafts.json');
 const previousDrafts=fs.existsSync(draftsPath)?JSON.parse(fs.readFileSync(draftsPath,'utf8')).drafts||[]:[];
 const priorityIds=new Set([...previousDrafts.map(x=>x.id),...pending.filter(x=>x.verificationStatus==='official-program-source').map(x=>x.id)]);
 const due=selectAuditBatch(dueCandidates,maxItems,priorityIds);
 let cursor=0;const workers=Array.from({length:8},async()=>{while(cursor<due.length){const i=cursor++;queue.candidates[queue.candidates.findIndex(x=>x.id===due[i].id)]=await inspect(due[i])}});
 await Promise.all(workers);
 const audited=due.map(x=>queue.candidates.find(y=>y.id===x.id));
 const counts={};for(const x of audited)counts[x.audit.result]=(counts[x.audit.result]||0)+1;
 queue.updatedAt=now.toISOString();
 fs.writeFileSync(queuePath,JSON.stringify(queue,null,2)+'\n');
 const report={checkedAt:now.toISOString(),batchLimit:maxItems,intervalDays:maxAgeDays,due:due.length,pending:pending.length,remainingDue:Math.max(0,dueCandidates.length-due.length),priorityDraftsChecked:due.filter(x=>priorityIds.has(x.id)).length,counts,results:audited.map(({id,title,url,category,audit})=>({id,title,url,category,...audit}))};
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checked:due.length,pending:pending.length,remainingDue:report.remainingDue,counts}));
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1});
module.exports={selectAuditBatch,primaryCallUrl};
