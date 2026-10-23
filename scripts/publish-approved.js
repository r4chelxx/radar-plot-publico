#!/usr/bin/env node
// Promote explicitly verified editorial records to public catalogs and the dated changelog.
// No candidate is considered approved merely because a collector found it.
const fs=require('node:fs'),vm=require('node:vm');
const manifest=process.argv[2]||'intake/approved-publications.json';
const source=JSON.parse(fs.readFileSync(manifest,'utf8'));
if(!Array.isArray(source.approved))throw Error('Manifest requires approved[]');
const spec={
 opportunities:{path:'data/opportunities.js',type:'nova-oportunidade',field:'rules',title:'title'},
 datasets:{path:'data/datasets.js',type:'dados',field:'url',title:'name'},
 tools:{path:'data/tools.js',type:'ferramentas',field:'url',title:'name'}
};
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const name of [...Object.keys(spec).map(x=>spec[x].path),'data/changelog.js'])vm.runInContext(fs.readFileSync(name,'utf8'),ctx,{filename:name});
const D=ctx.window.RADAR_PARTS,insertions={opportunities:[],datasets:[],tools:[]},log=[];
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const safeUrl=x=>{try{const u=new URL(x);return u.protocol==='https:'&&!!u.hostname}catch{return false}};
const approvedIds=new Set();
for(const entry of source.approved){
 const category=entry.category,rule=spec[category],record=entry.record||{},proof=entry.review||{};
 if(!rule)throw Error('Unknown publication category: '+category);
 if(!record.id||!/^[-a-z0-9]+$/.test(record.id))throw Error('Invalid record ID');
 if(approvedIds.has(record.id))throw Error('Duplicate approval: '+record.id);
 approvedIds.add(record.id);
 if(proof.decision!=='approved'||!proof.reviewedBy||!/^\d{4}-\d{2}-\d{2}$/.test(proof.reviewedAt||'')||!safeUrl(proof.officialUrl)||!proof.evidence||String(proof.evidence).length<25)throw Error('Missing editorial verification: '+record.id);
 if(!record[rule.title]||!safeUrl(record[rule.field]))throw Error('Missing public record fields: '+record.id);
 if(new URL(proof.officialUrl).hostname!==new URL(record[rule.field]).hostname)throw Error('Official source does not match record: '+record.id);
 if(category==='opportunities'&&(!record.deadlineStatus||!record.eligibility||!record.status))throw Error('Opportunity requires deadline status, eligibility and status: '+record.id);
 if(category==='datasets'&&(!record.coverage||!record.limitations))throw Error('Dataset requires coverage and limitations: '+record.id);
 if(category==='tools'&&(!record.description||!record.limitations))throw Error('Tool requires description and limitations: '+record.id);
 const old=D[category].find(x=>x.id===record.id);
 if(old){if(old[rule.field]!==record[rule.field])throw Error('Existing record requires explicit update workflow: '+record.id);continue}
 insertions[category].push(record);
 log.push({type:rule.type,id:record.id,title:record[rule.title],date:today,detail:proof.evidence});
}
function prepend(path,variable,records){
 if(!records.length)return;
 let content=fs.readFileSync(path,'utf8'),marker='window.RADAR_PARTS.'+variable+'=[',pos=content.indexOf(marker);
 if(pos<0)throw Error('Missing catalog array: '+path);
 pos+=marker.length;
 content=content.slice(0,pos)+'\n'+records.map(x=>JSON.stringify(x,null,2)).join(',\n')+', '+content.slice(pos);
 fs.writeFileSync(path,content);
}
for(const [category,records] of Object.entries(insertions))prepend(spec[category].path,category,records);
const updates=Object.values(spec).map(rule=>({rule,items:log.filter(x=>x.type===rule.type)})).filter(x=>x.items.length).map(({rule,items})=>({
 date:today,type:rule.type,title:'Publicação editorial verificada — '+today,
 items:items.map(x=>({id:x.id,title:x.title})),
 detail:'Registros aprovados individualmente com documentação oficial e evidência editorial: '+items.map(x=>x.title).join('; ')+'.'
}));
prepend('data/changelog.js','changelog',updates);
console.log(JSON.stringify({date:today,approved:source.approved.length,published:log.length,alreadyPresent:source.approved.length-log.length,byCategory:Object.fromEntries(Object.entries(insertions).map(([k,v])=>[k,v.length]))}));
