#!/usr/bin/env node
// Persist public candidate metadata across daily discovery runs without approval by inference.
const fs=require('node:fs');
const {identity}=require('./lead-identity');
const current=JSON.parse(fs.readFileSync(process.argv[2]||'intake/discovery-quality.json','utf8'));
const dest=process.argv[3]||'intake/editorial-queue.json';
let previous={candidates:[]};
if(fs.existsSync(dest))previous=JSON.parse(fs.readFileSync(dest,'utf8'));
const queue=new Map((previous.candidates||[]).map(x=>[x.id,x]));
const now=new Date().toISOString();
const historyPath=process.argv[4]||'state/lead-history.json';
const decisionsPath=process.argv[5]||'intake/historical-decisions.json';
const history=fs.existsSync(historyPath)?JSON.parse(fs.readFileSync(historyPath,'utf8')).leads||{}:{};
const decisions=fs.existsSync(decisionsPath)?JSON.parse(fs.readFileSync(decisionsPath,'utf8')).decisions||[]:[];
const byUrl=new Map();
for(const d of decisions){try{byUrl.set(identity(d.url).id,d.status)}catch{}}
const terminal=new Set(['published','rejected','duplicate','archived']);
function resolvedStatus(candidate){
 const hist=history[candidate.id]||history[identity(candidate.url).id];
 const decision=byUrl.get(candidate.id)||byUrl.get(identity(candidate.url).id);
 if(terminal.has(hist?.editorialStatus))return hist.editorialStatus;
 if(terminal.has(decision))return decision;
 if(decision==='approved'||hist?.editorialStatus==='approved')return 'in-review';
 return null;
}
for(const [id,item] of queue){
 const status=resolvedStatus(item);
 if(status)queue.set(id,{...item,status});
}
for(const candidate of current.review||[]){
 if(candidate.classification!=='needs-editorial-review')continue;
 if(!candidate.id||!/^https:\/\//.test(candidate.url||''))continue;
 const old=queue.get(candidate.id);
 if(old&&terminal.has(old.status))continue;
 const providers=[...new Set([...(old?.providers||[]),...(candidate.providers||[])])].slice(0,30);
 queue.set(candidate.id,{id:candidate.id,title:candidate.title,url:candidate.url,category:candidate.category||old?.category||'uncategorized',providers,firstSeen:old?.firstSeen||now,lastSeen:now,status:resolvedStatus(candidate)||old?.status||'pending',reviewPriority:candidate.reviewPriority||'normal'});
}
const out={schemaVersion:1,updatedAt:now,policy:'Public web leads only; pending does not mean verified or approved.',candidates:[...queue.values()].sort((a,b)=>a.firstSeen.localeCompare(b.firstSeen))};
fs.mkdirSync(require('node:path').dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({persisted:out.candidates.length,pending:out.candidates.filter(x=>x.status==='pending').length,resolved:out.candidates.filter(x=>terminal.has(x.status)).length}));
