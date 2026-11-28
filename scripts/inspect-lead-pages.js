// Evidence gathering only: NEVER confirms a deadline, eligibility or publication.
const fs=require('node:fs'),crypto=require('node:crypto');
const {cleanText,cleanTitle}=require('./editorial-text');
const {officialOpportunityTarget}=require('./opportunity-primary-target');
const {selectBacklog}=require('./select-historical-backlog');
const {auditCapacity}=require('./audit-capacity');
const {inspectionHealth}=require('./inspection-health');
const {extractStructuredMetadata,metadataForLink}=require('./structured-lead-metadata');
const {extractEvidence}=require('./editorial-page-evidence');
const input=JSON.parse(fs.readFileSync('intake/candidate-triage.json','utf8'));
const limit=Math.min(480,Math.max(1,Number(process.env.LEAD_PAGE_LIMIT||480)));
function decode(value){return String(value||'').replace(/&(?:amp|and);/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&nbsp;/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function visibleText(html){return cleanText(String(html||'')).slice(0,1200);}
function editorialText(html){
 const source=String(html||'');
 const match=source.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)>/i)||source.match(/<div[^>]+(?:entry-content|post-content|article-content|td-post-content)[^>]*>([\s\S]*?)<\/div>/i);
 return cleanText(match?match[1]:source,3000);
}
const {isoDate,explicitPageFacts}=require('./primary-page-facts');
function structuredPageFacts(html){
 const out={};
 const scripts=[...String(html||'').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
 const values=[];
 const visit=value=>{
  if(!value)return;
  if(Array.isArray(value)){value.forEach(visit);return}
  if(typeof value==='object'){values.push(value);Object.values(value).forEach(visit)}
 };
 for(const match of scripts){
  try{visit(JSON.parse(match[1].replace(/<!--[\s\S]*?-->/g,' ').trim()))}catch{}
 }
 const first=(keys)=>{
  for(const item of values){
   for(const key of keys){
    const value=item[key];
    if(typeof value==='string'&&value.trim())return value.trim();
    if(Array.isArray(value)&&value.some(x=>typeof x==='string'))return value.filter(x=>typeof x==='string').join('; ').slice(0,320);
   }
  }
  return null;
 };
 const rawDeadline=first(['applicationDeadline','submissionDeadline','closingDate','validThrough','deadline','dueDate']);
 const deadline=isoDate(rawDeadline||'');
 const eligibility=first(['eligibility','eligibilityCriteria','eligibleApplicants','applicantType','audience']);
 const rawStatus=first(['applicationStatus','availability','status']);
 const status=/closed|ended|expired|encerrad/i.test(String(rawStatus||''))?'encerrada':/open|active|available|aberta/i.test(String(rawStatus||''))?'aberta':null;
 return {deadline:deadline||null,eligibility:eligibility?decode(eligibility).slice(0,320):null,eligibilityExplicit:Boolean(eligibility),status};
}
function allowed(raw){
 try{
  const u=new URL(raw);const h=u.hostname.toLowerCase();
  return u.protocol==='https:'&&!u.username&&!u.password&&h!=='localhost'&&!h.endsWith('.local')&&!h.endsWith('.internal')&&!/^\d+\.\d+\.\d+\.\d+$/.test(h)&&!h.includes(':');
 }catch{return false}
}
function primaryResourceTarget(html,baseUrl,category){
 const source=String(html||''); let base;try{base=new URL(baseUrl)}catch{return null}
 const social=/^(?:instagram|facebook|linkedin|tiktok|x|twitter|youtube|youtu|threads|reddit|pinterest|t\.me)(?:\.|$)/i;
 const labels=category==='datasets'
  ? /(?:dataset|data\s+(?:catalog|set|resource)|view\s+dataset|dataset\s+details|access\s+data|download\s+data|open\s+data|data\s+portal|api\s+documentation)/i
  : /(?:official(?:\s+(?:website|page|site))?|product\s+(?:page|details)|use\s+the\s+tool|tool\s+documentation|documentation|docs|view\s+tool|software\s+page)/i;
 const samePage=base.href.replace(/#.*$/,'').replace(/\/$/,'');
 for(const m of source.matchAll(/<a\b[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a\s*>/gi)){
  const label=decode(m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
  if(!labels.test(label))continue;
  try{
   const raw=decode(m[1]).trim(); if(/^(?:mailto:|javascript:|#)/i.test(raw))continue;
   const u=new URL(raw,base); const normalized=u.href.replace(/#.*$/,'').replace(/\/$/,'');
   if(u.protocol!=='https:'||normalized===samePage||social.test(u.hostname))continue;
   if(/\.(?:pdf|docx?|xlsx?|zip|csv|json)(?:$|[?#])/i.test(u.pathname))continue;
   return u.href;
  }catch{}
 }
 return null;
}

async function inspect(lead,options={}){
 if(!allowed(lead.url))return {...lead,pageStatus:'blocked-url',editoriallyVerified:false};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 try{
  const response=await fetch(lead.url,{signal:controller.signal,redirect:'follow',headers:{'user-agent':'RadarPLOT-monitor/1.0','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'}});
  const contentType=response.headers.get('content-type')||'';
  if(!response.ok||!/(text\/html|application\/xhtml\+xml)/i.test(contentType))return {...lead,pageStatus:response.ok?'non-html':'http-error',httpStatus:response.status,finalUrl:response.url||lead.url,editoriallyVerified:false};
  const html=(await response.text()).slice(0,120000);
  const structuredMetadata=extractStructuredMetadata(html,response.url||lead.url);
  const pageEvidence=extractEvidence(html,response.url||lead.url);
  const metadata=metadataForLink(structuredMetadata,response.url||lead.url)||metadataForLink(structuredMetadata,lead.url)||null;
  const rawTitle=((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'');
 const metadataTitle=metadata?.title||rawTitle;
 const title=cleanTitle(metadataTitle,metadata?.organization||lead.source||'');
 const metaDescription=((html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']{1,1200})/i)||[])[1]||'').trim();
 const description=cleanText(metadata?.description||metaDescription||editorialText(html),1200);
 const pageFacts=explicitPageFacts(html);
 const structuredFacts=structuredPageFacts(html);
 const facts={deadline:pageFacts.deadline||structuredFacts.deadline||null,eligibility:pageFacts.eligibility||structuredFacts.eligibility||null,eligibilityExplicit:Boolean(pageFacts.eligibility||structuredFacts.eligibility),organization:structuredFacts.organization||pageFacts.organization||metadata?.organization||null,status:pageFacts.status||structuredFacts.status||null};
 const structuredEvidence={...(metadata||{}),...structuredFacts,title:cleanTitle(metadata?.title||title,metadata?.organization||lead.source||''),description,...(facts.deadline?{deadline:facts.deadline}:{}),...(facts.eligibility?{eligibility:facts.eligibility,eligibilityExplicit:true}:{}),...(facts.organization?{organization:facts.organization}:{}),...(facts.status?{status:facts.status}:{})};
 // Aggregator/listing pages are discovery surfaces, not sufficient evidence by
 // themselves. Follow one clearly labelled external official/application link
 // once, then use the primary page's facts for the draft.
 if(['opportunities','datasets','tools'].includes(lead.category)&&!options.followed){
  const primaryUrl=lead.category==='opportunities' ? officialOpportunityTarget(html,response.url||lead.url) : primaryResourceTarget(html,response.url||lead.url,lead.category);
  if(primaryUrl){
   const primary=await inspect({...lead,url:primaryUrl},{followed:true});
   if(primary.pageStatus==='html-fetched'){
    return {...primary,discoveryUrl:lead.url,sourceResolution:{discoveryUrl:lead.url,primaryUrl,primaryFinalUrl:primary.finalUrl||primaryUrl,kind:lead.category},sourceEvidence:lead.sourceEvidence||'',providers:lead.providers};
   }
  }
 }
 const dateMentions=[...html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').matchAll(/\b20\d{2}[-\/]\d{2}[-\/]\d{2}\b/g)].slice(0,12).map(x=>x[0]);
 return {...lead,tabularData:pageEvidence.tabularData,resourceLinks:pageEvidence.resourceLinks,structuredData:pageEvidence.structuredData,pageStatus:'html-fetched',httpStatus:response.status,contentType,finalUrl:response.url||lead.url,checkedAt:new Date().toISOString(),pageTitle:title,pageDescription:description||null,evidenceText:pageEvidence.evidenceText,structuredEvidence,deadline:lead.deadline||structuredEvidence?.deadline||null,eligibility:lead.eligibility||structuredEvidence?.eligibility||null,status:lead.status||structuredEvidence?.status||null,dateMentionsUnclassified:[...new Set(dateMentions)],fingerprint:crypto.createHash('sha256').update(html).digest('hex').slice(0,16),editoriallyVerified:false};
 }catch(e){return {...lead,pageStatus:'fetch-failed',error:String(e).slice(0,200),editoriallyVerified:false}}
 finally{clearTimeout(timer)}
}
(async()=>{
 const previous=fs.existsSync('intake/lead-history-previous.json')?JSON.parse(fs.readFileSync('intake/lead-history-previous.json','utf8')):null;
 const capacity=previous?auditCapacity(previous.leads):{limit,pressure:null,policy:'no-history'};
 const effectiveLimit=Math.min(480,Math.max(limit,capacity.limit));
 const backlog=selectBacklog(previous,input.leads||[],effectiveLimit,new Date(),{rotate:true});
 const selected=backlog.selected.length?backlog.selected:backlog.total?selectBacklog(previous,input.leads||[],effectiveLimit,new Date('2999-01-01T00:00:00Z'),{rotate:true}).selected:[];
 const selectionFallback=backlog.selected.length===0&&backlog.total>0;
 const results=[];
 const concurrency=Math.min(12,Math.max(1,Number(process.env.LEAD_INSPECTION_CONCURRENCY||12)));
 let cursor=0;
 async function worker(){
  while(true){
   const index=cursor++;
   if(index>=selected.length)return;
   const item=selected[index];
   results[index]={...await inspect(item),historicalId:item.id,historyAtSelection:item.origin,archivedRecheck:item.editorialStatus==='archived',requiresReopeningReview:item.editorialStatus==='archived'};
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,selected.length)},()=>worker()));
 const statusCounts=results.reduce((a,x)=>(a[x.pageStatus]=(a[x.pageStatus]||0)+1,a),{});
 const httpStatusCounts=results.reduce((a,x)=>(x.httpStatus&&(a[x.httpStatus]=(a[x.httpStatus]||0)+1),a),{});
 const health=inspectionHealth(statusCounts,results.length);
 const htmlFetched=health.htmlFetched;
 const out={statusCounts,httpStatusCounts,degraded:health.degraded,inspectionHealth:health,generatedAt:new Date().toISOString(),policy:'Unverified evidence only. Date mentions are NOT deadlines.',eligibleForPublication:0,eligibleCandidates:backlog.total,inspected:results.length,archivedRechecks:results.filter(x=>x.archivedRecheck).length,capacity:{configured:limit,effective:effectiveLimit,pressure:capacity.pressure,policy:capacity.policy},selection:{historyLoaded:previous!==null,backlogTotal:backlog.total,ready:backlog.ready,waiting:backlog.waiting,fallbackUsed:selectionFallback,priorities:selected.reduce((a,x)=>(a[x.origin]=(a[x.origin]||0)+1,a),{})},results};
 fs.writeFileSync('intake/lead-evidence.json',JSON.stringify(out,null,2)+'\n');
 const resolutions=results.filter(x=>x.sourceResolution?.primaryUrl);
 const resolutionHosts=resolutions.reduce((a,x)=>{try{const h=new URL(x.sourceResolution.primaryUrl).hostname;a[h]=(a[h]||0)+1}catch{}return a},{});
 console.log(JSON.stringify({inspected:results.length,htmlFetched,statusCounts,httpStatusCounts,degraded:out.degraded,inspectionStatus:health.status,successRate:health.successRate,officialResolutions:resolutions.length,resolutionHosts}));
})().catch(e=>{console.error(e);process.exitCode=1});
