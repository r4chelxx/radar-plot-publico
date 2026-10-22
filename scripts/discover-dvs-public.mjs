#!/usr/bin/env node
// Discover candidate tool and dataset links on DVS public guide pages.
// This is discovery, not independent verification of linked products.
import fs from 'node:fs';
import identityModule from './lead-identity.js';
const {canonical}=identityModule;
const pages=[
 'https://datavisualizationsociety.org/new-to-data-viz/',
 'https://new.datavisualizationsociety.org/familiar-with-data-viz/'
];
const leads=[],health=[],seen=new Set();
for(const page of pages){
 try{
  const r=await fetch(page,{signal:AbortSignal.timeout(14000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'text/html'}});
  if(!r.ok)throw Error('HTTP '+r.status);
  const html=(await r.text()).slice(0,1800000);
  let added=0;
  for(const m of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
   const href=m[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
   if(!href)continue;
   let url;
   try{url=canonical(new URL(href,page).toString())}catch{continue}
   const host=new URL(url).hostname;
   if(host.endsWith('datavisualizationsociety.org')||host.endsWith('nightingaledvs.com'))continue;
   if(/(?:^|\\.)(?:facebook|instagram|linkedin|twitter|x|youtube|tiktok|pinterest|discord|medium)\\.com$/i.test(host)||host==='youtu.be')continue;
   if(seen.has(url))continue;
   const title=m[2].replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();
   if(title.length<3||title.length>180)continue;
   if(/^(?:subscribe|log in|sign in|share|follow|contact|donate|privacy|terms|cookie|read more|learn more|view all)$/i.test(title))continue;
   seen.add(url);leads.push({url,title,category:'uncategorized',sourceName:'Data Visualization Society'});added++;
  }
  health.push({page,status:'ok',candidates:added});
 }catch(e){health.push({page,status:'error',reason:String(e.message||e).slice(0,120)})}
}
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/dvs-public-discovery.json',JSON.stringify({source:'web',leads},null,2)+'\n');
fs.writeFileSync('intake/dvs-public-health.json',JSON.stringify({generatedAt:new Date().toISOString(),health},null,2)+'\n');
console.log(JSON.stringify({candidates:leads.length,health}));
if(health.every(x=>x.status==='error'))process.exitCode=1;
