const {URL}=require('node:url');
function clean(value,max=500){return String(value||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function isoDate(value){
 const s=clean(value,80);
 let m=s.match(/\b(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\b/);
 if(m)return [m[1],String(m[2]).padStart(2,'0'),String(m[3]).padStart(2,'0')].join('-');
 m=s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
 if(m)return [m[3],String(m[2]).padStart(2,'0'),String(m[1]).padStart(2,'0')].join('-');
 return null;
}
function flatten(value,out=[]){
 if(Array.isArray(value))for(const x of value)flatten(x,out);
 else if(value&&typeof value==='object'){out.push(value);for(const x of Object.values(value))if(x&&typeof x==='object')flatten(x,out)}
 return out;
}
function extractStructuredMetadata(html,baseUrl){
 const items=[];
 for(const match of String(html||'').matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
  try{items.push(...flatten(JSON.parse(match[1].trim())))}catch{}
 }
 const base=new URL(baseUrl);
 return items.map(item=>{
  const rawUrl=item.url||item['@id']||item.mainEntityOfPage;
  let url=null;try{url=rawUrl?new URL(typeof rawUrl==='object'?rawUrl['@id']||rawUrl.url:rawUrl,base).toString():null}catch{}
  const org=item.organizer||item.publisher||item.provider||item.author;
  const organization=typeof org==='string'?clean(org,180):clean(org?.name,180);
  const offer=item.offers||item.isPartOf;
  const deadline=isoDate(item.endDate||item.deadline||item.applicationDeadline||offer?.validThrough);
  const eligibilityExplicit=Boolean(item.eligibility||item.eligibleFor||item.eligibilityCriteria);
  const eligibility=clean(item.eligibility||item.eligibleFor||item.eligibilityCriteria||item.eligibleRegion||item.audience||'',300);
  const title=clean(item.name||item.headline||item.alternateName,240);
  const description=clean(item.description||item.abstract,700);
  if(!title&&!description&&!url&&!deadline&&!eligibility)return null;
  return {url,title,description,organization,deadline,eligibility,eligibilityExplicit,sourceType:item['@type']||null};
 }).filter(Boolean);
}
function metadataForLink(metadata,url){
 const canonical=String(url||'').replace(/\/$/,'');
 return metadata.find(x=>x.url&&x.url.replace(/\/$/,'')===canonical)||metadata.find(x=>x.url&&canonical.startsWith(x.url.replace(/\/$/,'')+'/'))||null;
}
module.exports={extractStructuredMetadata,metadataForLink};
