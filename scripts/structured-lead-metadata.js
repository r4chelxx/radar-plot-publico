const {URL}=require('node:url');
function clean(value,max=500){return String(value||'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,max)}
function isoDate(value){
 const s=clean(value,80);
 let m=s.match(/\b(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\b/);
 if(m)return [m[1],String(m[2]).padStart(2,'0'),String(m[3]).padStart(2,'0')].join('-');
 m=s.match(/\b(\d{1,2})[\/.-](\d{1,2})[\/.-](20\d{2})\b/);
 if(m)return [m[3],String(m[2]).padStart(2,'0'),String(m[1]).padStart(2,'0')].join('-');
 const months={january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,sept:9,oct:10,nov:11,dec:12,janeiro:1,fevereiro:2,março:3,marco:3,abril:4,maio:5,junho:6,julho:7,agosto:8,setembro:9,outubro:10,novembro:11,dezembro:12};
 m=s.match(/\b(\d{1,2})\s+([a-zç.]+)\s+(20\d{2})\b/i)||s.match(/\b([a-zç.]+)\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})\b/i);
 if(!m)return null;
 const first=String(m[1]).toLowerCase().replace('.',''),second=String(m[2]).toLowerCase().replace('.','');
 const day=Number(m[1])||Number(m[2]),month=months[first]||months[second],year=Number(m[3]);
 return month&&day>=1&&day<=31?[String(year),String(month).padStart(2,'0'),String(day).padStart(2,'0')].join('-'):null;
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
 const meta={};
 // HTML permits attributes in either order; parse each tag before validating metadata.
 for(const tag of String(html||'').matchAll(/<meta\b[^>]*>/gi)){
  const attrs={};
  for(const attr of tag[0].matchAll(/([a-zA-Z:-]+)\s*=\s*[\"']([^\"']*)[\"']/g))attrs[String(attr[1]).toLowerCase()]=attr[2];
  const key=String(attrs.property||attrs.name||'').toLowerCase(),value=clean(attrs.content,700);
  if(value&&(key==='og:title'||key==='twitter:title'||key==='title'))meta.title=meta.title||value;
  if(value&&(key==='og:description'||key==='twitter:description'||key==='description'))meta.description=meta.description||value;
  if(value&&(key==='og:site_name'||key==='application-name'))meta.organization=meta.organization||value;
  if(value&&(key==='article:published_time'||key==='article:expiration_time'))meta.publishedOrExpiry=meta.publishedOrExpiry||value;
 }
 if(meta.title||meta.description||meta.organization)items.push({__pageMeta:true,...meta,url:base.toString()});
 return items.map(item=>{
  const rawUrl=item.url||item['@id']||item.mainEntityOfPage;
  let url=null;try{url=rawUrl?new URL(typeof rawUrl==='object'?rawUrl['@id']||rawUrl.url:rawUrl,base).toString():null}catch{}
  const org=item.organizer||item.publisher||item.provider||item.author||item.isPartOf||item.sourceOrganization;
  const organization=typeof org==='string'?clean(org,180):clean(org?.name,180)||clean(item.organization,180);
  const offer=item.offers||item.isPartOf;
  const deadline=isoDate(item.endDate||item.deadline||item.applicationDeadline||offer?.validThrough);
  const eligibilityExplicit=Boolean(item.eligibility||item.eligibleFor||item.eligibilityCriteria);
  const eligibility=clean(item.eligibility||item.eligibleFor||item.eligibilityCriteria||item.eligibleRegion||item.audience||'',300);
  const title=clean(item.name||item.headline||item.alternateName||item.title,240);
  const description=clean(item.description||item.abstract,700);
  if(!title&&!description&&!url&&!deadline&&!eligibility)return null;
  return {url,title,description,organization,deadline,eligibility,eligibilityExplicit,sourceType:item['@type']||null};
 }).filter(Boolean);
}
function metadataForLink(metadata,url){
 const canonical=String(url||'').replace(/\/$/,'');
 return metadata.find(x=>x.url&&x.url.replace(/\/$/,'')===canonical)||metadata.find(x=>x.url&&canonical.startsWith(x.url.replace(/\/$/,'')+'/'))||metadata.find(x=>x.__pageMeta)||null;
}
module.exports={extractStructuredMetadata,metadataForLink};
