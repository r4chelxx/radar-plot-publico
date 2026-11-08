// Evidence gathering only: NEVER confirms a deadline, eligibility or publication.
const fs=require('node:fs'),crypto=require('node:crypto');
const {selectBacklog}=require('./select-historical-backlog');
const {auditCapacity}=require('./audit-capacity');
const {inspectionHealth}=require('./inspection-health');
const {extractStructuredMetadata,metadataForLink}=require('./structured-lead-metadata');
const input=JSON.parse(fs.readFileSync('intake/candidate-triage.json','utf8'));
const limit=Math.min(100,Math.max(1,Number(process.env.LEAD_PAGE_LIMIT||100)));
function decode(value){return String(value||'').replace(/&(?:amp|and);/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;/gi,"'").replace(/&nbsp;/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();}
function visibleText(html){return decode(String(html||'').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ')).slice(0,1200);}
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
 const eligibilityMatch=text.match(/(?:eligib(?:ility|le)|who\\s+can\\s+apply|eligible\\s+applicants?|elegibilidade|quem\\s+pod(?:e|em)\\s+se\\s+inscrever|open\\s+to|available\\s+to|for\\s+(?:all\\s+)?(?:journalists?|reporters?|newsrooms?|media\\s+organizations?|researchers?)|jornalistas?|repórteres?|redações?|pesquisadores?)([^.]{0,320})/i);
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
async function inspect(lead){
 if(!allowed(lead.url))return {...lead,pageStatus:'blocked-url',editoriallyVerified:false};
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),9000);
 try{
  const response=await fetch(lead.url,{signal:controller.signal,redirect:'follow',headers:{'user-agent':'RadarPLOT-monitor/1.0','accept':'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'}});
  const contentType=response.headers.get('content-type')||'';
  if(!response.ok||!/(text\/html|application\/xhtml\+xml)/i.test(contentType))return {...lead,pageStatus:response.ok?'non-html':'http-error',httpStatus:response.status,finalUrl:response.url||lead.url,editoriallyVerified:false};
  const html=(await response.text()).slice(0,120000);
  const structuredMetadata=extractStructuredMetadata(html,response.url||lead.url);
  const metadata=metadataForLink(structuredMetadata,response.url||lead.url)||metadataForLink(structuredMetadata,lead.url)||null;
  const title=((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,240);
  const description=((html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']{1,700})/i)||[])[1]||'').trim()||visibleText(html);
  const facts=explicitPageFacts(html);
  const structuredEvidence={...(metadata||{}),title:metadata?.title||title||null,description:metadata?.description||description||null,...(facts.deadline?{deadline:facts.deadline}:{}),...(facts.eligibility?{eligibility:facts.eligibility,eligibilityExplicit:true}:{}),...(facts.status?{status:facts.status}:{})};
  const dateMentions=[...html.replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').matchAll(/\b20\d{2}[-\/]\d{2}[-\/]\d{2}\b/g)].slice(0,12).map(x=>x[0]);
  return {...lead,pageStatus:'html-fetched',httpStatus:response.status,finalUrl:response.url||lead.url,pageTitle:title,pageDescription:description||structuredEvidence?.description||null,structuredEvidence,deadline:lead.deadline||structuredEvidence?.deadline||null,eligibility:lead.eligibility||structuredEvidence?.eligibility||null,status:lead.status||structuredEvidence?.status||null,dateMentionsUnclassified:[...new Set(dateMentions)],fingerprint:crypto.createHash('sha256').update(html).digest('hex').slice(0,16),editoriallyVerified:false};
 }catch(e){return {...lead,pageStatus:'fetch-failed',error:String(e).slice(0,200),editoriallyVerified:false}}
 finally{clearTimeout(timer)}
}
(async()=>{
 const previous=fs.existsSync('intake/lead-history-previous.json')?JSON.parse(fs.readFileSync('intake/lead-history-previous.json','utf8')):null;
 const capacity=previous?auditCapacity(previous.leads):{limit,pressure:null,policy:'no-history'};
 const effectiveLimit=Math.min(100,Math.max(limit,capacity.limit));
 const backlog=selectBacklog(previous,input.leads||[],effectiveLimit,new Date(),{rotate:true});
 const selected=backlog.selected.length?backlog.selected:backlog.total?selectBacklog(previous,input.leads||[],effectiveLimit,new Date('2999-01-01T00:00:00Z'),{rotate:true}).selected:[];
 const selectionFallback=backlog.selected.length===0&&backlog.total>0;
 const results=[];
 for(const item of selected)results.push({...await inspect(item),historicalId:item.id,historyAtSelection:item.origin,archivedRecheck:item.editorialStatus==='archived',requiresReopeningReview:item.editorialStatus==='archived'});
 const statusCounts=results.reduce((a,x)=>(a[x.pageStatus]=(a[x.pageStatus]||0)+1,a),{});
 const httpStatusCounts=results.reduce((a,x)=>(x.httpStatus&&(a[x.httpStatus]=(a[x.httpStatus]||0)+1),a),{});
 const health=inspectionHealth(statusCounts,results.length);
 const htmlFetched=health.htmlFetched;
 const out={statusCounts,httpStatusCounts,degraded:health.degraded,inspectionHealth:health,generatedAt:new Date().toISOString(),policy:'Unverified evidence only. Date mentions are NOT deadlines.',eligibleForPublication:0,eligibleCandidates:backlog.total,inspected:results.length,archivedRechecks:results.filter(x=>x.archivedRecheck).length,capacity:{configured:limit,effective:effectiveLimit,pressure:capacity.pressure,policy:capacity.policy},selection:{historyLoaded:previous!==null,backlogTotal:backlog.total,ready:backlog.ready,waiting:backlog.waiting,fallbackUsed:selectionFallback,priorities:selected.reduce((a,x)=>(a[x.origin]=(a[x.origin]||0)+1,a),{})},results};
 fs.writeFileSync('intake/lead-evidence.json',JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({inspected:results.length,htmlFetched,statusCounts,httpStatusCounts,degraded:out.degraded,inspectionStatus:health.status,successRate:health.successRate}));
})().catch(e=>{console.error(e);process.exitCode=1});
