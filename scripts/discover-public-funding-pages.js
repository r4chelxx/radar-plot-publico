#!/usr/bin/env node
// Public pages are discovery leads, never proof of an open application.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');
const {isRelevant}=require('./public-feed-relevance');
const sources=[
 {name:'Grants for Journalists',url:'https://grantsforjournalists.com/grants-for-journalists/'},
 {name:'GFMD funding',url:'https://gfmd.info/fundings/'}
];
function decode(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()}
function extract(html,base,name){
 const seen=new Set(),leads=[];
 for(const match of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
  const href=match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  const title=decode(match[2]).slice(0,220);
  if(!href||!isRelevant(title))continue;
  try{
   const url=canonical(new URL(href,base).toString());
   const host=new URL(url).hostname;
   if(/(?:^|\.)(?:linkedin\.com|facebook\.com|instagram\.com|x\.com|twitter\.com)$/.test(host))continue;
   if(seen.has(url))continue;
   seen.add(url);leads.push({url,title,category:'uncategorized',sourceName:name,editorialStatus:'unverified'});
  }catch{}
  if(leads.length>=60)break;
 }
 return leads;
}
async function collect(fetcher=fetch){
 const leads=[],health=[];
 for(const source of sources){
  try{
   const response=await fetcher(source.url,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'text/html'}});
   if(!response.ok)throw Error('HTTP '+response.status);
   const html=(await response.text()).slice(0,1200000);
   const found=extract(html,response.url||source.url,source.name);
   leads.push(...found);
   health.push({source:source.name,status:'ok',items:found.length,coverageStatus:found.length?'partial':'no-relevant-static-links'});
  }catch(e){health.push({source:source.name,status:'error',items:0,coverageStatus:'partial',reason:String(e.message||e).slice(0,160)})}
 }
 return {source:'web',leads,health};
}
if(require.main===module){
 collect().then(result=>{
  fs.mkdirSync('intake',{recursive:true});
  fs.writeFileSync('intake/public-funding-pages.json',JSON.stringify({source:result.source,leads:result.leads},null,2)+'\n');
  fs.writeFileSync('intake/public-funding-health.json',JSON.stringify({generatedAt:new Date().toISOString(),health:result.health},null,2)+'\n');
  console.log(JSON.stringify({candidates:result.leads.length,health:result.health}));
 }).catch(e=>{console.error(e);process.exitCode=1});
}
module.exports={extract,collect};
