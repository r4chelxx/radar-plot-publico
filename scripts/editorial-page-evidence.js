'use strict';
// Extract a bounded, auditable snapshot from a public page. This is evidence input,
// never an approval decision. Keep only fields relevant to category-specific review.
const FIELDS=['@type','name','description','url','license','distribution','datePublished','dateModified','temporalCoverage','spatialCoverage','encodingFormat','contentUrl','applicationCategory','operatingSystem','offers','featureList','softwareVersion'];
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
   if(/(?:\.(?:csv|tsv|json|geojson|xml|parquet|zip)(?:$|[?#])|\/(?:api|download|dataset|datasets|data)(?:\/|$))/i.test(url.pathname+url.search)||/(?:download|dataset|data portal|api|csv|json|microdata|dados abertos|base de dados)/i.test(label)){
    resourceLinks.push({url:url.href,label});if(resourceLinks.length>=30)break;
   }
  }catch{/* invalid or relative links without a base URL are ignored */}
 }
 const visible=decode(source
  .replace(/<!--[\s\S]*?-->/g,' ')
  .replace(/<(script|style|noscript|svg|template|header|footer|nav)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
  .replace(/<[^>]+>/g,' ')
  .replace(/\\s+/g,' ')).trim().slice(0,20000);
 return {evidenceText:visible,structuredData:jsonLd,resourceLinks};
}
module.exports={extractEvidence};
