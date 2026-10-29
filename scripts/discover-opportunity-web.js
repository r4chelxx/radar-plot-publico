#!/usr/bin/env node
// Targeted public web search via Google News RSS; news links are leads, never verified grants.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');
const queries=[
 '"journalism grant" "apply" OR "applications"',
 '"journalism fellowship" "applications open"',
 '"investigative journalism" "funding" OR "grant"',
 '"data journalism" "fellowship" OR "grant"',
 '"bolsa jornalismo" inscrições OR edital',
 '"financiamento reportagem" inscrições OR chamada',
 '"journalism climate reporting grant"'
];
const opportunity=/\b(?:journalis(?:m|t|ts)|report(?:er|ers|ing)|newsroom|media|jornalism[oa]|reportagem|imprensa)\b/i;
const funding=/\b(?:grant|grants|fellowship|fellowships|funding|fund|award|scholarship|open call|applications?|bolsa|bolsas|edital|editais|financiamento|inscri[cç][aã]o|chamada)\b/i;
const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
function extract(xml){
 const leads=[],seen=new Set();
 for(const match of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const body=match[1],title=decode(body.match(/<title>([\s\S]*?)<\/title>/i)?.[1]),raw=decode(body.match(/<link>([\s\S]*?)<\/link>/i)?.[1]);
  if(!opportunity.test(title)||!funding.test(title)||!raw)continue;
  try{
   const url=canonical(raw);
   if(!/^https?:\/\//.test(url)||seen.has(url))continue;
   seen.add(url);leads.push({url,title,category:'opportunities',sourceName:'Targeted public web search',editorialStatus:'unverified',verificationRequired:true});
  }catch{}
 }
 return leads;
}
async function collect(fetcher=fetch){
 const leads=[],health=[];
 for(const query of queries){
  const url='https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl=en-US&gl=US&ceid=US:en';
  try{
   const response=await fetcher(url,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'application/rss+xml'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const found=extract((await response.text()).slice(0,1000000)).slice(0,30);
   leads.push(...found);health.push({query,status:'ok',items:found.length});
  }catch(e){health.push({query,status:'error',items:0,reason:String(e.message||e).slice(0,120)})}
 }
 return {source:'web',leads:[...new Map(leads.map(x=>[x.url,x])).values()],health};
}
if(require.main===module)collect().then(r=>{
 fs.mkdirSync('intake',{recursive:true});
 fs.writeFileSync('intake/opportunity-web-discovery.json',JSON.stringify({source:r.source,leads:r.leads},null,2)+'\n');
 fs.writeFileSync('intake/opportunity-web-health.json',JSON.stringify({health:r.health,generatedAt:new Date().toISOString()},null,2)+'\n');
 console.log(JSON.stringify({opportunityCandidates:r.leads.length,queries:r.health.length,failedQueries:r.health.filter(x=>x.status==='error').length}));
}).catch(e=>{console.error(e);process.exitCode=1});
module.exports={extract,collect,queries};
