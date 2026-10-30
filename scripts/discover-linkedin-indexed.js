#!/usr/bin/env node
// Public indexed LinkedIn discovery; partial coverage, no login or scraping.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');
const queries=['site:linkedin.com/posts/ "Grants for Journalists" grant','site:linkedin.com/posts/ "Grants for Journalists" fellowship'];
function decode(s){return String(s||'').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').trim()}
function extract(xml){
 const leads=[],seen=new Set();
 for(const m of xml.matchAll(/<item\b[^>]*>([\s\S]*?)<\/item>/gi)){
  const title=decode(m[1].match(/<title>([\s\S]*?)<\/title>/i)?.[1]);
  const raw=decode(m[1].match(/<link>([\s\S]*?)<\/link>/i)?.[1]);
  if(!/grant|fellowship|funding|bolsa|edital|financiamento/i.test(title))continue;
  try{const url=canonical(raw);const u=new URL(url);if(!/(^|\.)linkedin\.com$/.test(u.hostname)||!u.pathname.startsWith('/posts/')||seen.has(url))continue;seen.add(url);leads.push({url,title:title.slice(0,220),category:'opportunities',sourceName:'LinkedIn public search (indexed)',editorialStatus:'unverified',verificationRequired:true})}catch{}
 }
 return leads;
}
async function collect(fetcher=fetch){
 const leads=[],health=[];
 for(const query of queries){try{const u='https://news.google.com/rss/search?q='+encodeURIComponent(query)+'&hl=en-US&gl=US&ceid=US:en';const r=await fetcher(u,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error('HTTP '+r.status);const found=extract((await r.text()).slice(0,1000000));leads.push(...found);health.push({source:'LinkedIn indexed search',query,status:'ok',items:found.length,coverageStatus:'partial-index-only'})}catch(e){health.push({source:'LinkedIn indexed search',query,status:'error',items:0,reason:String(e.message||e).slice(0,120),coverageStatus:'partial-index-only'})}}
 return {source:'linkedin',leads:[...new Map(leads.map(x=>[x.url,x])).values()],health};
}
if(require.main===module)collect().then(r=>{fs.mkdirSync('intake',{recursive:true});fs.writeFileSync('intake/linkedin-indexed-discovery.json',JSON.stringify({source:r.source,leads:r.leads},null,2)+'\n');fs.writeFileSync('intake/linkedin-indexed-health.json',JSON.stringify({health:r.health},null,2)+'\n');console.log(JSON.stringify({linkedinIndexedCandidates:r.leads.length,health:r.health}));});
module.exports={collect,extract};
