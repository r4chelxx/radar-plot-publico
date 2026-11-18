#!/usr/bin/env node
// Discover candidate datasets through public catalog APIs.
// This is a lead source only; each page is fetched and independently validated later.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');

const sources=[
 {name:'World Bank Open Data',url:'https://api.worldbank.org/v2/indicator?format=json&per_page=25',parse:json=>{
   const rows=Array.isArray(json)?json[1]||[]:[];
   return rows.map(x=>({url:'https://data.worldbank.org/indicator/'+encodeURIComponent(x.id),title:x.name||x.id,resourceLinks:[{url:'https://api.worldbank.org/v2/country/all/indicator/'+encodeURIComponent(x.id)+'?format=json&per_page=1000',label:'World Bank API'}],sourceEvidence:'Organization: World Bank. Dataset: official indicator API with annual country-level observations in JSON format; indicator code '+x.id+'. Coverage: country-level annual observations.'}));
 }},
 {name:'GBIF Dataset Search',url:'https://api.gbif.org/v1/dataset/search?limit=25',parse:json=>(json.results||[]).map(x=>({url:x.homepage||('https://www.gbif.org/dataset/'+x.key),title:x.title||x.key})).filter(x=>x.url)},
 {name:'Data.gov Catalog API',url:'https://api.gsa.gov/technology/datagov/v4/search?q=data&per_page=25',requiresApiKey:'DATA_GOV_API_KEY',parse:json=>(json.results||[]).map(x=>({url:x.landingPage||('https://catalog.data.gov/dataset/'+x.slug),title:x.title||x.slug})).filter(x=>x.url)},
 {name:'European Data Portal',url:'https://data.europa.eu/api/hub/search/search?limit=25&q=data&filters=dataset',parse:json=>{const result=json.result;const rows=Array.isArray(result)?result:(result?.results||result?.datasets||result?.items||json.results||json.datasets||[]);return rows.map(x=>({url:x.landingPage||x.uri||x.url||x.id,title:x.title||x.name})).filter(x=>x.url)}}
];

async function collect(fetcher=fetch){
 const leads=[],health=[];
 for(const source of sources){
  try{
   const headers={accept:'application/json','user-agent':'Radar-PLOT-Discovery/1.0'};
   if(source.requiresApiKey){
    const key=String(process.env[source.requiresApiKey]||'').trim();
    if(!key){health.push({source:source.name,status:'needs-configuration',items:0,reason:'Missing '+source.requiresApiKey});continue;}
    headers['X-Api-Key']=key;
   }
   const r=await fetcher(source.url,{signal:AbortSignal.timeout(15000),headers});
   if(!r.ok)throw Error('HTTP '+r.status);
   const json=await r.json();
   const found=[];
   for(const item of source.parse(json)||[]){
    try{const url=canonical(item.url);if(!/^https:\/\//.test(url)||found.some(x=>x.url===url))continue;found.push({url,title:String(item.title||'Dataset candidate').slice(0,220),category:'datasets',sourceName:source.name,editorialStatus:'unverified',resourceLinks:Array.isArray(item.resourceLinks)?item.resourceLinks.slice(0,20):[],sourceEvidence:String(item.sourceEvidence||'').slice(0,1200)});}catch{}
   }
   leads.push(...found);health.push({source:source.name,status:'ok',items:found.length});
  }catch(e){health.push({source:source.name,status:'error',items:0,reason:String(e.message||e).slice(0,140)})}
 }
 const unique=[...new Map(leads.map(x=>[x.url,x])).values()];
 return {source:'web',leads:unique,health};
}
if(require.main===module)collect().then(result=>{
 fs.mkdirSync('intake',{recursive:true});
 fs.writeFileSync('intake/public-dataset-discovery.json',JSON.stringify({source:result.source,leads:result.leads},null,2)+'\n');
 fs.writeFileSync('intake/public-dataset-health.json',JSON.stringify({generatedAt:new Date().toISOString(),health:result.health},null,2)+'\n');
 console.log(JSON.stringify({candidates:result.leads.length,health:result.health}));
 if(result.health.every(x=>x.status==='error'))process.exitCode=1;
}).catch(e=>{console.error(e);process.exitCode=1});
module.exports={collect,sources};
