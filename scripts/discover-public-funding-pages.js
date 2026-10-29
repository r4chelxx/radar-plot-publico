#!/usr/bin/env node
// Public pages are discovery leads, never proof of an open application.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');
const {isRelevant}=require('./public-feed-relevance');
const sources=[
 {name:'Grants for Journalists',url:'https://grantsforjournalists.com/grants-for-journalists/'},
 {name:'GFMD funding',url:'https://gfmd.info/fundings/',fallback:'https://gfmd.info/find-funding/'},
 {name:'Opportunity Desk',url:'https://opportunitydesk.org/latest-posts/',fallback:'https://opportunitydesk.org/category/fellowships/'},
 {name:'NewsFuel',url:'https://newsfuel.org/opportunities'},
 {name:'Pulitzer Center',url:'https://pulitzercenter.org/opportunities/grants-fellowships'}
];
function decode(s){return String(s||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim()}
function extract(html,base,name){
 const seen=new Set(),leads=[];
 for(const match of html.matchAll(/<a\b([^>]*?)>([\s\S]*?)<\/a>/gi)){
  const href=match[1].match(/\bhref\s*=\s*["']([^"']+)["']/i)?.[1];
  const title=decode(match[2]).slice(0,220);
  if(!href)continue;
  try{
   const url=canonical(new URL(href,base).toString());
   const host=new URL(url).hostname;
   const path=new URL(url).pathname;
   if(name==='GFMD funding'&&host==='gfmd.info'&&/^\/(?:fundings|find-funding)\/?$/.test(path))continue;
   // Category/directory navigation is not an individual funding opportunity.
   if(name==='Grants for Journalists'&&['grantsforjournalists.com','www.grantsforjournalists.com'].includes(host)&&['/grants-for-journalists','/all-grants','/grants-for-journalists/','/all-grants/'].includes(path))continue;
   const isOpportunityDeskDetail=name==='Opportunity Desk'&&['opportunitydesk.org','www.opportunitydesk.org'].includes(host)&&/^\/20\d{2}\/\d{2}\/\d{2}\/[^/]+\/?$/.test(path);
   if(name==='Opportunity Desk'&&!isOpportunityDeskDetail)continue;
   if(name==='NewsFuel'&&!(['newsfuel.org','www.newsfuel.org'].includes(host)&&/^\/opportunities?\/[^/]+\/?$/.test(path)))continue;
   if(name==='Pulitzer Center'&&!(['pulitzercenter.org','www.pulitzercenter.org'].includes(host)&&(/\/opportunities\/(?:reporting-grants-fellowships|grants-fellowships)\/[^/]+\/?$/.test(path)||/\/grants-fellowships\/[^/]+\/?$/.test(path))))continue;
   const isGfmdDetail=name==='GFMD funding'&&host==='gfmd.info'&&/^\/fundings\/[^/]+\/?$/.test(path);
   if(!isRelevant(title)&&!(isGfmdDetail&&title.length>=12)&&!(['NewsFuel','Pulitzer Center'].includes(name)&&title.length>=12))continue;
   if(/^(?:home|about(?: us)?|contact|sign in|log in|register|subscribe|privacy|terms|browse|view all|learn more|read more|next|previous)$/i.test(title))continue;
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
   if(!response.ok){
    if(source.fallback){
     try{
      const alternate=await fetcher(source.fallback,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'text/html'}});
      if(alternate.ok){
       const found=extract((await alternate.text()).slice(0,1200000),alternate.url||source.fallback,source.name);
       leads.push(...found);
       health.push({source:source.name,status:'fallback',items:found.length,coverageStatus:found.length?'partial':'no-relevant-static-links',fallbackStatus:'primary-http-'+response.status,primaryHttpStatus:response.status,needsReview:found.length===0});
       continue;
      }
     }catch{}
    }
    throw Error('HTTP '+response.status);
   }
   const html=(await response.text()).slice(0,1200000);
   let found=extract(html,response.url||source.url,source.name);
   let fallbackStatus='not-needed';
   // A page may contain generic relevant links but no individual GFMD funding detail.
   const hasGfmdDetail=found.some(item=>{
    const u=new URL(item.url);
    return u.hostname==='gfmd.info'&&new RegExp('^/fundings/[^/]+/?$').test(u.pathname);
   });
   if(source.fallback&&(source.name==='Opportunity Desk'?found.length===0:!hasGfmdDetail)){
    try{
     const alternate=await fetcher(source.fallback,{signal:AbortSignal.timeout(12000),headers:{'user-agent':'Radar-PLOT-Discovery/1.0','accept':'text/html'}});
     if(!alternate.ok)throw Error('HTTP '+alternate.status);
     const alternateLeads=extract((await alternate.text()).slice(0,1200000),alternate.url||source.fallback,source.name);
     found=[...new Map([...found,...alternateLeads].map(item=>[item.url,item])).values()];
     fallbackStatus=alternateLeads.length?'found-candidates':'no-relevant-static-links';
    }catch(error){fallbackStatus='error: '+String(error.message||error).slice(0,100)}
   }
   leads.push(...found);
   health.push({source:source.name,status:'ok',items:found.length,coverageStatus:found.length?'partial':'no-relevant-static-links',fallbackStatus,needsReview:found.length===0});
  }catch(e){health.push({source:source.name,status:'error',items:0,coverageStatus:'partial',reason:String(e.message||e).slice(0,160),needsReview:true})}
 }
 return {source:'web',leads,health};
}
if(require.main===module){
 collect().then(result=>{
  fs.mkdirSync('intake',{recursive:true});
  fs.writeFileSync('intake/public-funding-pages.json',JSON.stringify({source:result.source,leads:result.leads},null,2)+'\n');
  fs.writeFileSync('intake/public-funding-health.json',JSON.stringify({generatedAt:new Date().toISOString(),health:result.health},null,2)+'\n');
  console.log(JSON.stringify({candidates:result.leads.length,productiveSources:result.health.filter(x=>x.items>0).length,emptySources:result.health.filter(x=>x.items===0&&x.status!=='error').map(x=>x.source),failedSources:result.health.filter(x=>x.status==='error').map(x=>({source:x.source,reason:x.reason})),health:result.health}));
 }).catch(e=>{console.error(e);process.exitCode=1});
}
module.exports={extract,collect};
