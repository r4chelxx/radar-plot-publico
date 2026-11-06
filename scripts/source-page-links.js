const {URL}=require('node:url');
function clean(s){return String(s||'').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,180)}
function extractLinks(html,baseUrl){
 const out=[];const seen=new Set();
 for(const m of String(html||'').matchAll(/<a\b([^>]*)href=["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)){
  try{const url=new URL(m[2],baseUrl).toString();if(!/^https?:$/i.test(new URL(url).protocol))continue;const label=clean(m[4]);const attrs=(m[1]+' '+m[3]).toLowerCase();const key=url.replace(/\/$/,'');if(!seen.has(key)){seen.add(key);out.push({url,label,attrs})}}catch{}
 }
 return out;
}
function selectExpansionLinks(links,baseUrl,limit=3){
 const base=new URL(baseUrl),out=[],seen=new Set();
 for(const x of links){
  try{
   const u=new URL(x.url);if(u.hostname!==base.hostname)continue;
   const text=(x.label+' '+x.attrs).toLowerCase();
   const pagination=/rel=["']?next|\b(next|older|more|load more|ver mais|mais oportunidades|próxim|pagina|page)\b/i.test(text);
   if(!pagination||seen.has(u.toString()))continue;
   seen.add(u.toString());out.push(u.toString());if(out.length>=limit)break;
  }catch{}
 }
 return out;
}
function relevant(label){return /grant|fellowship|bolsa|financiamento|funding|call for|chamada|edital|application|apply|dataset|dados abertos|open data|tool|ferramenta|award|prize|scholarship/i.test(String(label||''))}
module.exports={extractLinks,selectExpansionLinks,relevant};
