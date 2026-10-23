#!/usr/bin/env node
// Join the PUBLIC unified discovery queue to the historical daily inspection rotation.
// Does not approve or publish candidates. Existing editorial decisions remain authoritative.
const fs=require('node:fs');
const {identity}=require('./lead-identity');
const triagePath=process.argv[2]||'intake/candidate-triage.json';
const queuePath=process.argv[3]||'intake/editorial-queue-public.json';
const triage=JSON.parse(fs.readFileSync(triagePath,'utf8'));
const queue=JSON.parse(fs.readFileSync(queuePath,'utf8'));
if(queue.schemaVersion!==1||!Array.isArray(queue.candidates)||!Array.isArray(triage.leads))throw Error('Invalid public queue or source triage');
const seen=new Set();
for(const lead of triage.leads){try{seen.add(identity(lead.url).id)}catch{}}
const totals={queue:queue.candidates.length,added:0,alreadyInTriage:0,excluded:0,byProvider:{}};
for(const item of queue.candidates){
 if(item.status!=='pending'&&item.status!=='in-review'){totals.excluded++;continue}
 if(!item.url||!item.title){totals.excluded++;continue}
 let id,url;try{({id,url}=identity(item.url))}catch{totals.excluded++;continue}
 if(!url.startsWith('https://')){totals.excluded++;continue}
 if(seen.has(id)){totals.alreadyInTriage++;continue}
 const providers=(item.providers||[]).filter(x=>typeof x==='string').slice(0,10);
 const source=providers.join(' / ').slice(0,200)||'Public web discovery';
 const title=String(item.title).replace(/[\r\n]+/g,' ').trim().slice(0,220);
 if(title.length<3){totals.excluded++;continue}
 const category=/grant|fellowship|scholarship|funding|bolsa|edital|prize|award|call for/i.test(title)?'opportunities':/dataset|database|dados abertos|open data|data portal/i.test(title)?'datasets':/tool|software|platform|visualization|visualisation|chart|map/i.test(title)?'tools':'uncategorized';
 triage.leads.push({source,title,url,category,classification:'needs-editorial-review',possibleMatches:[],deadline:null,eligibility:null,editoriallyVerified:false,discoveryOrigin:'public-editorial-queue'});
 seen.add(id);totals.added++;
 for(const provider of providers)totals.byProvider[provider]=(totals.byProvider[provider]||0)+1;
}
triage.publicQueueImport=totals;
fs.writeFileSync(triagePath,JSON.stringify(triage,null,2)+'\n');
console.log(JSON.stringify(totals));
