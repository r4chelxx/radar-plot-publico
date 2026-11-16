'use strict';
// Extract a bounded, auditable snapshot from a public page. This is evidence input,
// never an approval decision. Keep only fields relevant to category-specific review.
const FIELDS=['@type','name','description','url','license','publisher','author','creator','provider','organizer','distribution','datePublished','dateModified','startDate','endDate','validThrough','applicationDeadline','closingDate','deadline','temporalCoverage','spatialCoverage','encodingFormat','contentUrl','applicationCategory','operatingSystem','offers','featureList','softwareVersion'];
function decode(text){return String(text||'').replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));}
function compact(value,depth=0){
 if(depth>3||value==null)return undefined;
 if(typeof value==='string'||typeof value==='number'||typeof value==='boolean')return String(value).slice(0,600);
 if(Array.isArray(value))return value.slice(0,8).map(x=>compact(x,depth+1)).filter(x=>x!==undefined);
 if(typeof value==='object'){
  const out={};
  for(const key of FIELDS)if(Object.prototype.hasOwnProperty.call(value,key)){
   const v=compact(value[key],depth+1);if(v!==undefined)out[key]=v;
  }
  return Object.keys(out).length?out:undefined;
 }
}
function extractEvidence(html,baseUrl=''){
 const source=String(html||'').slice(0,500000);
 const jsonLd=[];
 for(const match of source.matchAll(/<script\b[^>]*type\s*=\s*['"]application\/ld\+json['"][^>]*>([\s\S]*?)<\/script\s*>/gi)){
  try{
   const parsed=JSON.parse(decode(match[1]).trim());
   const roots=Array.isArray(parsed)?parsed:[parsed];
   for(const root of roots){
    const values=[root,...(Array.isArray(root?.['@graph'])?root['@graph']:[])];
    for(const item of values){const clean=compact(item);if(clean)jsonLd.push(clean);if(jsonLd.length>=12)break;}
    if(jsonLd.length>=12)break;
   }
  }catch{/* malformed third-party structured data is recorded as absent */}
  if(jsonLd.length>=12)break;
 }
 const resourceLinks=[];
 for(const match of source.matchAll(/<a\b[^>]*href\s*=\s*['"]([^'"]+)['"][^>]*>([\s\S]*?)<\/a\s*>/gi)){
  const href=decode(match[1]).trim(),label=decode(match[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')).trim().slice(0,200);
  try{
   const url=new URL(href,baseUrl||undefined);
   if(url.protocol!=='https:')continue;
   if(/(?:\.(?:csv|tsv|json|geojson|xml|parquet|zip|xlsx?|gpkg|geotiff|tiff?|vrt)(?:$|[?#])|\/(?:api|download|dataset|datasets|data)(?:\/|$))/i.test(url.pathname+url.search)||/(?:download|dataset|data portal|api|csv|json|microdata|dados abertos|base de dados)/i.test(label)){
    resourceLinks.push({url:url.href,label});if(resourceLinks.length>=30)break;
   }
  }catch{/* invalid or relative links without a base URL are ignored */}
 }
 const visible=decode(source
  .replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<(script|style|noscript|svg|template|header|footer|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/\s+/g,' ')).trim().slice(0,20000);
 const tabularData=[];
 const tableSource=source.replace(/<(script|style|template)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ');
 for(const table of tableSource.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)){
  const rows=[...table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const columns=Math.max(0,...rows.map(r=>(r[1].match(/<(?:td|th)\b/gi)||[]).length));
  if(rows.length>=3&&columns>=2&&(table[1].match(/<th\b/gi)||[]).length>=2)tabularData.push({rows:rows.length,columns});
  if(tabularData.length>=5)break;
 }
 return {evidenceText:visible,structuredData:jsonLd,resourceLinks,tabularData};
}
function rollingApplicationEvidence(text){
 return String(text||'').split(/(?<=[.!?])\s+/).some(sentence=>
  /\b(?:applications?|apply|submissions?|proposals?|pitches|candidaturas?|inscri[cç][oõ]es)\b/i.test(sentence)
  &&(/\b(?:no (?:(?:fixed|specific) )?(?:application |closing )?(?:deadline|date)|sem (?:prazo|data) (?:final|limite)|fluxo cont[ií]nuo|(?:accepted|accepts?|open|recebidas?|abertas?)\b.{0,60}(?:year.round|todo o ano))\b/i.test(sentence)
   ||/\b(?:applications?|submissions?|proposals?|pitches)\b.{0,100}\b(?:accepted|accepting|reviewed|considered|received)\b.{0,40}\b(?:on a )?rolling basis\b(?![^.!?]*(?:until|through|before|by\s+\d))/i.test(sentence)
   ||/\baccepting (?:applications?|submissions?|proposals?|pitches)\b.{0,60}\bon a rolling basis\b(?![^.!?]*(?:until|through|before|by\s+\d))/i.test(sentence)));
}
module.exports={extractEvidence,rollingApplicationEvidence};
