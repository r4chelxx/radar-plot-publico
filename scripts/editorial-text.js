'use strict';

const namedEntities={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ',ndash:'–',mdash:'—',hellip:'…',laquo:'«',raquo:'»',rsquo:'’',lsquo:'‘',ldquo:'“',rdquo:'”',trade:'™',copy:'©',reg:'®'};

function decodeEntities(value){
 return String(value||'').replace(/&\s*(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]+);/gi,(match,code)=>{
  const lower=String(code).toLowerCase();
  if(lower[0]==='#'){
   const n=lower[1]==='x'?parseInt(lower.slice(2),16):parseInt(lower.slice(1),10);
   return Number.isFinite(n)?String.fromCodePoint(Math.min(n,0x10ffff)):match;
  }
  return Object.prototype.hasOwnProperty.call(namedEntities,lower)?namedEntities[lower]:match;
 });
}

function cleanText(value,max=4000){
 return decodeEntities(String(value||'').replace(/<script\b[\s\S]*?<\/script>/gi,' ').replace(/<style\b[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()).slice(0,max);
}

function cleanTitle(value,organization=''){
 let title=cleanText(value,240);
 const org=cleanText(organization,120);
 if(org){
  const escapedOrg=org.replace(/[|\\{}()[\]^$+*?.-]/g,'\\$&');
  title=title.replace(new RegExp('\\\\s*(?:[-–—|:]\\\\s*)?'+escapedOrg+'\\\\s*$','i'),'').trim();
 }
 title=title.replace(/\s*(?:[-–—|:]\s*)?(?:GFMD|Opportunity Desk|Arcmira|Arcimra)\s*$/i,'').trim();
 return title.replace(/\s+[-–—|:]\s*$/,'').trim();
}

function cleanSummary(value,title,organization=''){
 const raw=cleanText(value,1600);
 const markers=[/\bclose menu\b/i,/\bskip to (?:content|main content)\b/i,/\bview full list\b/i,/\bhome conferences?\b/i];
 let text=raw;
 for(const marker of markers){const m=text.search(marker);if(m>0)text=text.slice(0,m).trim();}
 text=cleanText(text,900);
 const cleanedTitle=cleanTitle(title,organization);
 if(!text||text.length<60||/^(?:home|menu|in[ií]cio|skip to)/i.test(text))return cleanedTitle+'. Consulte a página oficial para verificar prazo, elegibilidade, financiamento e instruções de inscrição.';
 return text;
}

module.exports={decodeEntities,cleanText,cleanTitle,cleanSummary};
