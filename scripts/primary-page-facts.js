'use strict';
const {cleanText}=require('./editorial-text');
function decode(value){
 return String(value||'')
  .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
  .replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ')
  .replace(/<(?:header|nav|footer|aside)\b[^>]*>[\s\S]*?<\/(?:header|nav|footer|aside)\s*>/gi,' ')
  .replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/&(?:amp|and);/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
  .replace(/&nbsp;|&#160;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
  .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
  .replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)))
  .replace(/\s+/g,' ').trim();
}
function isoDate(raw){
 const s=String(raw||'').trim();let m=s.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})\b/);
 if(m)return validDate(+m[1],+m[2],+m[3]);
 m=s.match(/\b(\d{1,2})[-\/.](\d{1,2})[-\/.](20\d{2})\b/);
 if(m)return validDate(+m[3],+m[2],+m[1]);
 const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12,janeiro:1,fevereiro:2,'março':3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
 m=s.match(/\b([a-zç]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i)||s.match(/\b(\d{1,2})\s+de?\s+([a-zç]+)\s+de?\s+(20\d{2})\b/i);
 if(!m)return null;
 const month=months[String(m[1]).toLowerCase()]||months[String(m[2]).toLowerCase()];
 const day=Number(months[String(m[1]).toLowerCase()]?m[2]:m[1]),year=Number(m[3]);
 return month?validDate(year,month,day):null;
}
function validDate(year,month,day){
 const d=new Date(Date.UTC(year,month-1,day));
 return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day
  ? [String(year),String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-'):null;
}
function todayBahia(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(x=>[x.type,x.value]));
 return parts.year+'-'+parts.month+'-'+parts.day;
}
function visibleFactText(html){
 let source=String(html||'').slice(0,500000)
  .replace(/<script\b[\s\S]*?<\/script>/gi,' ')
  .replace(/<style\b[\s\S]*?<\/style>/gi,' ')
  .replace(/<noscript\b[\s\S]*?<\/noscript>/gi,' ')
  .replace(/<(?:header|nav|footer|aside)\b[^>]*>[\s\S]*?<\/(?:header|nav|footer|aside)\s*>/gi,' ')
  .replace(/<!--[\s\S]*?-->/g,' ');
 const main=source.match(/<(?:article|main)\b[^>]*>([\s\S]*?)<\/(?:article|main)\s*>/i);
 return cleanText(decode(main?main[1]:source),20000);
}
function explicitPageFacts(html,now=new Date()){
 const text=visibleFactText(html);
 const deadlineMatch=text.match(/(?:application\s+deadline|deadline|apply\s+by|applications?\s+(?:close|end)|closing\s+date|submissions?\s+(?:close|end)|due\s+date|final\s+date|prazo(?:\s+final)?|inscri(?:ções|coes)\s+(?:vão|vao)\s+até|até\s+o\s+dia)(?:\s*[:\-–]\s*|\s+)([^.]{0,120})/i);
 const contextualDeadline=isoDate(deadlineMatch?.[1]||'');
 const futureContext=[...text.matchAll(/(?:apply|application|applications|submission|submissions|deadline|closing|close|due|prazo|inscri(?:ção|cao|ções|coes)|candidatura)[^\n.]{0,120}?((?:20\d{2}[-\/.]\d{1,2}[-\/.]\d{1,2})|(?:\d{1,2}[\s-]+(?:jan(?:uary|eiro)?|feb(?:ruary|eiro)?|mar(?:ch|ço|co)?|apr(?:il|abril)?|may|mai|jun(?:e|ho)?|jul(?:y|ho)?|aug(?:ust|osto)?|sep(?:tember|tembro)?|oct(?:ober|ubro)?|nov(?:ember|embro)?|dec(?:ember|embro)?)[\s,]+20\d{2})|(?:(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|janeiro|fevereiro|março|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)\s+\d{1,2}(?:st|nd|rd|th)?[,]?\s+20\d{2}))/ig)].map(x=>isoDate(x[1])).filter(Boolean);
 const deadline=contextualDeadline||futureContext.find(x=>x>=todayBahia(now))||null;
 const eligibilityContext=text.match(/\b(?:journalists?|reporters?|newsrooms?|media organizations?|researchers?)[^.]{0,240}\b(?:can|may|are eligible|qualify)\b[^.]{0,120}/i)
  ||text.match(/\b(?:jornalistas?|repórteres?|redações?|pesquisadores?)[^.]{0,240}\b(?:podem|poderão|são elegíveis|estão habilitados)\b[^.]{0,120}/i);
 const eligibilityMatch=text.match(/(?:eligib(?:ility|le)|who\s+(?:can|may)\s+apply|who\s+is\s+eligible\s+to\s+apply|eligible\s+applicants?|elegibilidade|quem\s+pod(?:e|em)\s+se\s+inscrever|open\s+to|available\s+to|for\s+(?:all\s+)?(?:journalists?|reporters?|newsrooms?|media\s+organizations?|researchers?))([^.]{0,320})/i);
 const eligibility=eligibilityContext|| (eligibilityMatch&&/\b(?:for|open to|available to|eligible|eligibility|who|jornalistas?|repórteres?|redações?|pesquisadores?)\b/i.test(eligibilityMatch[0])?eligibilityMatch[0]:null);
 const organizationMatch=text.match(/\b(?:organized|organised|administered|hosted|offered|provided|funded|run|held)\s+by\s+((?:the\s+)?[\p{L}][\p{L}\d&.'’\-]*(?:\s+[\p{L}][\p{L}\d&.'’\-]*){1,6}?)(?=\s+(?:annually|since|for|in|on|to|which|that)\b|[,.!?]|$)/iu);
 const organizationCandidate=organizationMatch?.[1]?.trim()||null;
 const organization=organizationCandidate&&/[A-Z]/.test(organizationCandidate.replace(/^the\s+/i,''))?organizationCandidate:null;
 const openMatch=text.match(/\b(?:applications?|submissions?|entries?|inscrições|inscricoes)\s+(?:are\s+)?(?:now\s+)?open\b|\b(?:call|fellowship|grant|award|edital|bolsa)\s+(?:is\s+)?open\b/i);
 const closedMatch=text.match(/\b(?:applications?|submissions?|entries?|inscrições|inscricoes)\s+(?:are\s+)?closed\b|\b(?:call|fellowship|grant|award|edital|bolsa)\s+(?:is\s+)?closed\b/i);
 const status=openMatch?'aberta':closedMatch?'encerrada':deadline&&!closedMatch?'aberta':null;
 return {deadline:deadline||null,eligibility:eligibility?decode(eligibility).slice(0,320):null,eligibilityExplicit:Boolean(eligibility),organization,status};
}
module.exports={isoDate,todayBahia,visibleFactText,explicitPageFacts};
