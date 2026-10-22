#!/usr/bin/env node
// Daily public web discovery from explicitly approved RSS/Atom feeds.
// Candidate-only: never claims a call is open or editorially verified.
import fs from 'node:fs';
import identityModule from './lead-identity.js';
const {canonical}=identityModule;
const feeds=[
 {name:'GIJN',url:'https://gijn.org/feed/'},
 {name:'Journalism.co.uk',url:'https://www.journalism.co.uk/rss/news'},
 {name:'Data Is Plural',url:'https://www.data-is-plural.com/feed.xml'}
];
const deadline=AbortSignal.timeout(12000);
const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
const pick=(xml,tag)=>{const m=xml.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i'));return m?decode(m[1]):''};
const leads=[],health=[];
for(const feed of feeds){
 try{
  const response=await fetch(feed.url,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'application/rss+xml,application/atom+xml,application/xml,text/xml'}});
  if(!response.ok)throw Error('HTTP '+response.status);
  const xml=(await response.text()).slice(0,1000000);
  const blocks=[...xml.matchAll(/<(item|entry)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/gi)].slice(0,40);
  let count=0;
  for(const [,kind,body] of blocks){
   const title=pick(body,'title');
   const atom=body.match(/<link\b[^>]*href=["']([^"']+)["']/i);
   const raw=kind.toLowerCase()==='entry'?(atom?.[1]||pick(body,'link')):pick(body,'link');
   if(!raw||!title)continue;
   try{leads.push({url:canonical(raw),title,category:'uncategorized'});count++}catch{}
  }
  health.push({source:feed.name,status:'ok',items:count});
 }catch(e){health.push({source:feed.name,status:'error',reason:String(e.message||e).slice(0,160),items:0})}
}
const seen=new Set(),unique=leads.filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true});
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/live-web-discovery.json',JSON.stringify({source:'web',leads:unique},null,2)+'\n');
fs.writeFileSync('intake/live-web-health.json',JSON.stringify({generatedAt:new Date().toISOString(),health},null,2)+'\n');
console.log(JSON.stringify({feeds:health.length,candidates:unique.length,health}));
if(health.every(x=>x.status==='error'))process.exitCode=1;
