// Evidence gathering only: NEVER confirms a deadline, eligibility or publication.
const fs=require('node:fs'),crypto=require('node:crypto');
const {cleanText,cleanTitle}=require('./editorial-text');
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
function isoDate(raw){
 const s=String(raw||'').trim();
 let m=s.match(/\b(20\d{2})[-\\/.](\d{1,2})[-\\/.](\d{1,2})\b/);
 if(m)return [m[1],String(m[2]).padStart(2,'0'),String(m[3]).padStart(2,'0')].join('-');
 m=s.match(/\b(\d{1,2})[-\\/.](\d{1,2})[-\\/.](20\d{2})\b/);
 if(m)return [m[3],String(m[2]).padStart(2,'0'),String(m[1]).padStart(2,'0')].join('-');
 const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12,janeiro:1,fevereiro:2,março:3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
 m=s.match(/\b([a-zç]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i)||s.match(/\b(\d{1,2})\s+de?\s+([a-zç]+)\s+de?\s+(20\d{2})\b/i);
 if(!m)return null;
 const month=months[String(m[1]).toLowerCase()]||months[String(m[2]).toLowerCase()];
 const day=Number(months[String(m[1]).toLowerCase()]?m[2]:m[1]),year=Number(m[3]);
 return month&&day>=1&&day<=31?[String(year),String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-'):null;
}
function explicitPageFacts(html){
 const text=decode(String(html||'').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' '));
 const deadlineMatch=text.match(/(?:application\s+deadline|deadline|apply\s+by|applications?\s+(?:close|end)|closing\s+date|submissions?\s+(?:close|end)|due\s+date|final\s+date|prazo(?:\s+final)?|inscri(?:ções|coes)\s+(?:vão|vao)\s+até|até\s+o\s+dia)(?:\s*[:\-–]\s*|\s+)([^.]{0,120})/i);
 const contextualDeadline=isoDate(deadlineMatch?.[1]||'');
 const futureContext=[...text.matchAll(/(?:apply|application|applications|submission|submissions|deadline|closing|close|due|prazo|inscri(?:ção|cao|ções|coes)|candidatura)[^\n.]{0,120}?((?:20\d{2}[-\/.]\d{1,2}[-\/.]\d{1,2})|(?:\d{1,2}[\s-]+(?:jan(?:uary|eiro)?|feb(?:ruary|ruary|eiro)?|mar(?:ch|ço|co)?|apr(?:il|abril)?|may|mai|jun(?:e|ho)?|jul(?:y|ho)?|aug(?:ust|osto)?|sep(?:tember|tembro)?|oct(?:ober|ubro)?|nov(?:ember|embro)?|dec(?:ember|embro)?)[\s,]+20\d{2}))/ig)].map(x=>isoDate(x[1])).filter(Boolean);
 const deadline=contextualDeadline||futureContext.find(x=>x>=new Date().toISOString().slice(0,10))||null;
 const eligibilityMatch=text.match(/(?:eligib(?:ility|le)|who\s+can\s+apply|eligible\s+applicants?|elegibilidade|quem\s+pod(?:e|em)\s+se\s+inscrever|open\s+to|available\s+to|for\s+(?:all\s+)?(?:journalists?|reporters?|newsrooms?|media\s+organizations?|researchers?)|jornalistas?|repórteres?|redações?|pesquisadores?)([^.]{0,320})/i);
 const eligibility=eligibilityMatch?decode(eligibilityMatch[0]).slice(0,320):null;
 const openMatch=text.match(/\b(?:applications?|submissions?|entries?|inscrições|inscricoes)\s+(?:are\s+)?(?:now\s+)?open\b|\b(?:call|fellowship|grant|award|edital|bolsa)\s+(?:is\s+)?open\b/i);
 const closedMatch=text.match(/\b(?:applications?|submissions?|entries?|inscrições|inscricoes)\s+(?:are\s+)?closed\b|\b(?:call|fellowship|grant|award|edital|bolsa)\s+(?:is\s+)?closed\b/i);
 const status=openMatch?'aberta':closedMatch?'encerrada':deadline&&!closedMatch?'aberta':null;
 return {deadline:deadline||null,eligibility:eligibility||null,eligibilityExplicit:Boolean(eligibility),status};
}
function allowed(raw){
 try{
  const u=new URL(raw);const h=u.hostname.toLowerCase();
  return u.protocol==='https:'&&!u.username&&!u.password&&h!=='localhost'&&!h.endsWith('.local')&&!h.endsWith('.internal')&&!/^\d+\.\d+\.\d+\.\d+$/.test(h)&&!h.includes(':');
 }catch{return false}
}
function officialOpportunityTarget(html,baseUrl){
 const source=String(html||'');
 let base;try{base=new URL(baseUrl)}catch{return null}
 const social=/^(?:instagram|facebook|linkedin|tiktok|x|twitter|youtube|youtu|threads|reddit|pinterest|t\.me)(?:\.|$)/i;
 const labels=/(?:official(?:\s+(?:website|page|site))?|application(?:\s+(?:form|details|page))?|apply(?:\s+(?:now|here))?|call\s+(?:details|page)|program\s+(?:details|page)|opportunity\s+(?:details|page)|view\s+(?:the\s+)?opportunity|full\s+details|learn\s+more|read\s+more|view\s+call|saiba\s+mais|ver\s+detalhes|detalhes\s+(?:da\s+)?(?:chamada|oportunidade)|inscri[cç][aã]o|candidatar|candidatura|submeter|enviar\s+inscri[cç][aã]o|aplicar)/i;
 const samePage=base.href.replace(/#.*$/,'').replace(/\/$/,'');
 for(const m of source.matchAll(/<a\b[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a\s*>/gi)){
  const label=decode(m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' '));
  if(!labels.test(label))continue;
  try{
   const raw=decode(m[1]).trim();
   if(/^(?:mailto:|javascript:|#)/i.test(raw))continue;
   const u=new URL(raw,base);
   const normalized=u.href.replace(/#.*$/,'').replace(/\/$/,'');
   if(u.protocol!=='https:'||normalized===samePage||social.test(u.hostname))continue;
   if(/\.(?:pdf|docx?|xlsx?|zip)(?:$|[?#])/i.test(u.pathname))continue;
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
 const facts=explicitPageFacts(html);
 const structuredEvidence={...(metadata||{}),title:cleanTitle(metadata?.title||title,metadata?.organization||lead.source||''),description,...(facts.deadline?{deadline:facts.deadline}:{}),...(facts.eligibility?{eligibility:facts.eligibility,eligibilityExplicit:true}:{}),...(facts.status?{status:facts.status}:{})};
 // Aggregator/listing pages are discovery surfaces, not sufficient evidence by
 // themselves. Follow one clearly labelled external official/application link
 // once, then use the primary page's facts for the draft.
 if(lead.category==='opportunities'&&!options.followed){
  const primaryUrl=officialOpportunityTarget(html,response.url||lead.url);
  if(primaryUrl){
   const primary=await inspect({...lead,url:primaryUrl},{followed:true});
   if(primary.pageStatus==='html-fetched'){
    return {...primary,discoveryUrl:lead.url,sourceResolution:{discoveryUrl:lead.url,primaryUrl,primaryFinalUrl:primary.finalUrl||primaryUrl},sourceEvidence:lead.sourceEvidence||'',providers:lead.providers};
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
