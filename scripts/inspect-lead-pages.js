// Evidence gathering only: NEVER confirms a deadline, eligibility or publication.
const fs=require('node:fs'),crypto=require('node:crypto');
const {selectBacklog}=require('./select-historical-backlog');
const {auditCapacity}=require('./audit-capacity');
const input=JSON.parse(fs.readFileSync('intake/candidate-triage.json','utf8'));
const limit=Math.min(50,Math.max(1,Number(process.env.LEAD_PAGE_LIMIT||15)));
function allowed(raw){
 try{
  const u=new URL(raw);const h=u.hostname.toLowerCase();
  return u.protocol==='https:'&&!u.username&&!u.password&&h!=='localhost'&&!h.endsWith('.local')&&!h.endsWith('.internal')&&!/^\d+\.\d+\.\d+\.\d+$/.test(h)&&!h.includes(':');
 }catch{return false}
}
async function inspect(lead){
 if(!allowed(lead.url))return {...lead,pageStatus:'blocked-url',editoriallyVerified:false};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 try{
  const response=await fetch(lead.url,{signal:controller.signal,redirect:'manual',headers:{'user-agent':'RadarPLOT-monitor/1.0'}});
  const contentType=response.headers.get('content-type')||'';
  if(!response.ok||!contentType.includes('text/html'))return {...lead,pageStatus:response.ok?'non-html':'http-error',httpStatus:response.status,editoriallyVerified:false};
  const html=(await response.text()).slice(0,120000);
  const title=((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
  const description=((html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']{1,500})/i)||[])[1]||'').trim();
  const dateMentions=[...html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').matchAll(/\b20\d{2}[-\/]\d{2}[-\/]\d{2}\b/g)].slice(0,12).map(x=>x[0]);
  return {...lead,pageStatus:'html-fetched',httpStatus:response.status,pageTitle:title,pageDescription:description,dateMentionsUnclassified:[...new Set(dateMentions)],fingerprint:crypto.createHash('sha256').update(html).digest('hex').slice(0,16),editoriallyVerified:false};
 }catch(e){return {...lead,pageStatus:'fetch-failed',error:String(e).slice(0,200),editoriallyVerified:false}}
 finally{clearTimeout(timer)}
}
(async()=>{
 const previous=fs.existsSync('intake/lead-history-previous.json')?JSON.parse(fs.readFileSync('intake/lead-history-previous.json','utf8')):null;
 const capacity=previous?auditCapacity(previous.leads):{limit,pressure:null,policy:'no-history'};
 const effectiveLimit=Math.min(50,Math.max(limit,capacity.limit));
 const backlog=selectBacklog(previous,input.leads||[],effectiveLimit);
 const selected=backlog.selected;
 const results=[];
 for(const item of selected)results.push({...await inspect(item),historicalId:item.id,historyAtSelection:item.origin,archivedRecheck:item.editorialStatus==='archived',requiresReopeningReview:item.editorialStatus==='archived'});
 const out={generatedAt:new Date().toISOString(),policy:'Unverified evidence only. Date mentions are NOT deadlines.',eligibleForPublication:0,eligibleCandidates:backlog.total,inspected:results.length,archivedRechecks:results.filter(x=>x.archivedRecheck).length,capacity:{configured:limit,effective:effectiveLimit,pressure:capacity.pressure,policy:capacity.policy},selection:{historyLoaded:previous!==null,backlogTotal:backlog.total,ready:backlog.ready,waiting:backlog.waiting,priorities:selected.reduce((a,x)=>(a[x.origin]=(a[x.origin]||0)+1,a),{})},results};
 fs.writeFileSync('intake/lead-evidence.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({inspected:results.length,htmlFetched:results.filter(x=>x.pageStatus==='html-fetched').length}));
})().catch(e=>{console.error(e);process.exitCode=1});
