#!/usr/bin/env node
// Audits persisted candidate URLs in bounded batches. Reachability is not editorial approval.
const fs=require('node:fs');
const path=require('node:path');
const queuePath=process.argv[2]||'intake/editorial-queue.json';
const reportPath=process.argv[3]||'intake/editorial-queue-audit.json';
const maxItems=Math.min(250,Math.max(1,Number(process.env.RADAR_QUEUE_AUDIT_LIMIT||150)));
const maxAgeDays=Math.max(1,Number(process.env.RADAR_QUEUE_AUDIT_MAX_AGE_DAYS||7));
const now=new Date(),cutoff=now.getTime()-maxAgeDays*86400000;
const queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
if(!Array.isArray(queue.candidates))throw Error('Queue requires candidates[]');
const pending=queue.candidates.filter(x=>x.status==='pending'&&/^https:\/\//i.test(x.url||''));
const due=pending.filter(x=>!x.audit?.checkedAt||Date.parse(x.audit.checkedAt)<cutoff)
 .sort((a,b)=>String(a.firstSeen||'').localeCompare(String(b.firstSeen||''))).slice(0,maxItems);
const excludedPath=/\/(?:blog|news|press|events?|conference|people|team|authors?|profiles?)\//i;
const badTitle=/^(?:home|inicio|in[ií]cio|events?|eventos?|news|notícias|about|sobre|contact|contato|menu|blog|resources?)$/i;
function meta(html,key){const escaped=key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');const r=new RegExp('<meta[^>]+(?:name|property)=["\\']'+escaped+'["\\'][^>]+content=["\\']([^"\\']*)["\\']|<meta[^>]+content=["\\']([^"\\']*)["\\'][^>]+(?:name|property)=["\\']'+escaped+'["\\']','i').exec(html);return (r?.[1]||r?.[2]||'').replace(/&amp;/g,'&').trim()}
async function inspect(item){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),12000);
 try{
  const res=await fetch(item.url,{redirect:'follow',signal:ctrl.signal,headers:{'user-agent':'Radar-PLOT-Queue-Audit/1.0','accept':'text/html,application/json;q=0.9,*/*;q=0.8'}});
  const type=res.headers.get('content-type')||'';
  const body=await res.text(),html=body.slice(0,500000);
  const title=(/<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]||meta(html,'og:title')||item.title||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
  const description=(meta(html,'description')||meta(html,'og:description')).slice(0,800);
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
  return{...item,audit:{checkedAt:now.toISOString(),httpStatus:res.status,finalUrl:res.url,contentType:type,pageTitle:title,pageDescription:description,result,reason}}
 }catch(e){return{...item,audit:{checkedAt:now.toISOString(),httpStatus:null,result:'inconclusive',reason:e.name==='AbortError'?'Timeout; tentar em auditoria futura.':'Falha de rede; tentar em auditoria futura.'}}}
 finally{clearTimeout(timer)}
}
async function main(){
 let cursor=0;const workers=Array.from({length:8},async()=>{while(cursor<due.length){const i=cursor++;queue.candidates[queue.candidates.findIndex(x=>x.id===due[i].id)]=await inspect(due[i])}});
 await Promise.all(workers);
 const audited=due.map(x=>queue.candidates.find(y=>y.id===x.id));
 const counts={};for(const x of audited)counts[x.audit.result]=(counts[x.audit.result]||0)+1;
 queue.updatedAt=now.toISOString();
 fs.writeFileSync(queuePath,JSON.stringify(queue,null,2)+'\n');
 const report={checkedAt:now.toISOString(),batchLimit:maxItems,intervalDays:maxAgeDays,due:due.length,pending:pending.length,remainingDue:Math.max(0,pending.length-due.length),counts,results:audited.map(({id,title,url,category,audit})=>({id,title,url,category,...audit}))};
 fs.mkdirSync(path.dirname(reportPath),{recursive:true});fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({checked:due.length,pending:pending.length,remainingDue:report.remainingDue,counts}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
