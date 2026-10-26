#!/usr/bin/env node
// Daily public web discovery from explicitly approved RSS/Atom feeds.
// Candidate-only: never claims a call is open or editorially verified.
import fs from 'node:fs';
import identityModule from './lead-identity.js';
const {canonical}=identityModule;
import relevance from './public-feed-relevance.js';
const {isRelevant}=relevance;
// Removed Journalism.co.uk endpoint after repeatable HTTP 404; retain source in catalog for manual review.
const feeds=[
 {name:'GIJN',url:'https://gijn.org/feed/',fallback:'https://gijn.org/'},
 {name:'Data Is Plural',url:'https://www.data-is-plural.com/feed.xml'},
 {name:'Nieman Lab',url:'https://www.niemanlab.org/feed/'},
 {name:'The Fix Media',url:'https://thefix.media/feed/',fallback:'https://thefix.media/'}
];
const decode=s=>String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
const pick=(xml,tag)=>{const m=xml.match(new RegExp('<(?:[\\w-]+:)?'+tag+'(?:\\s[^>]*)?>([\\s\\S]*?)<\\/(?:[\\w-]+:)?'+tag+'>','i'));return m?decode(m[1]):''};
// Official publisher homepage fallback only when RSS is blocked or missing.
async function homepageFallback(feed){
 const r=await fetch(feed.fallback,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'text/html'}});
 if(!r.ok)throw Error('Homepage HTTP '+r.status);
 const html=(await r.text()).slice(0,1000000),found=[];
 const host=new URL(feed.fallback).hostname.replace(/^www\./,'');
 for(const m of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
  const href=m[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  if(!href)continue;
  const title=decode(m[2]).replace(/\s+/g,' ').slice(0,220);
  if(!isRelevant(title))continue;
  try{
   const u=new URL(href,feed.fallback);
   if(u.hostname.replace(/^www\./,'')!==host)continue;
   const url=canonical(u.toString());
   if(!found.some(x=>x.url===url))found.push({url,title,category:'uncategorized',sourceName:feed.name});
  }catch{}
  if(found.length>=40)break;
 }
 return found;
}
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
   if(!raw||!isRelevant(title))continue;
   try{leads.push({url:canonical(raw),title,category:'uncategorized',sourceName:feed.name});count++}catch{}
  }
  health.push({source:feed.name,status:'ok',items:count,coverageStatus:count?'partial':'no-relevant-items'});
 }catch(e){
  if(feed.fallback){
   try{
    const found=await homepageFallback(feed);
    leads.push(...found);
    health.push({source:feed.name,status:'ok',mode:'official-homepage-fallback',items:found.length,feedError:String(e.message||e).slice(0,120)});
   }catch(fallbackError){
    health.push({source:feed.name,status:'error',reason:'Feed: '+String(e.message||e).slice(0,75)+'; homepage: '+String(fallbackError.message||fallbackError).slice(0,75),items:0});
   }
  }else health.push({source:feed.name,status:'error',reason:String(e.message||e).slice(0,160),items:0});
 }
}
const seen=new Set(),unique=leads.filter(x=>{if(seen.has(x.url))return false;seen.add(x.url);return true});
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/live-web-discovery.json',JSON.stringify({source:'web',leads:unique},null,2)+'\n');
fs.writeFileSync('intake/live-web-health.json',JSON.stringify({generatedAt:new Date().toISOString(),health},null,2)+'\n');
console.log(JSON.stringify({feeds:health.length,candidates:unique.length,health}));
if(health.every(x=>x.status==='error'))process.exitCode=1;
