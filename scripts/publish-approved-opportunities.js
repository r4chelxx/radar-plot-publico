#!/usr/bin/env node
// Editorially approved opportunities only. Never scrape or infer approval from discovery.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=path.join(process.cwd(),'data/opportunities.js');
const queue=path.join(process.cwd(),'editorial/approved-opportunities.json');
const changes=path.join(process.cwd(),'data/changelog.js');
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const url=x=>typeof x==='string'&&/^https:\/\/[^\s/]+/i.test(x);
const load=(p,key)=>{const ctx={window:{RADAR_PARTS:{}}};vm.runInNewContext(fs.readFileSync(p,'utf8'),ctx);return JSON.parse(JSON.stringify(ctx.window.RADAR_PARTS[key]||[]));};
const pending=JSON.parse(fs.readFileSync(queue,'utf8'));
if(!Array.isArray(pending))throw Error('Approved queue must be an array');
const existing=load(file,'opportunities'),logs=load(changes,'changelog');
const known=new Set(existing.map(x=>x.id));const added=[];
for(const o of pending){
  if(!o||typeof o!=='object')throw Error('Invalid approved item');
  if(!o.editorialApproval||o.editorialApproval.approved!==true||!o.editorialApproval.reviewer||!o.editorialApproval.date)throw Error('Explicit editorial approval required: '+o.id);
  if(o.editorialApproval.date>date)throw Error('Future approval date: '+o.id);
  if(!o.verified||!url(o.rules)||!url(o.apply))throw Error('Official verification and application URLs required: '+o.id);
  if(!Array.isArray(o.verificationHistory)||!o.verificationHistory.some(v=>v.date===o.verified&&url(v.source)))throw Error('Verification history required: '+o.id);
  if(!['aberta','monitorar','preparar'].includes(o.status))throw Error('Only actionable statuses allowed: '+o.id);
  if(o.status==='aberta'&&(!o.deadline||o.deadline<date))throw Error('Open item requires future deadline: '+o.id);
  if(!o.eligibility||!Array.isArray(o.restrictions)||!o.restrictions.length)throw Error('Eligibility and restrictions required: '+o.id);
  if(!o.id||known.has(o.id))throw Error('Duplicate or missing opportunity id: '+o.id);
  known.add(o.id);added.push(o);
}
if(!added.length){console.log('No approved opportunities to publish');process.exit(0);}
const serialize=(key,items)=>'window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.'+key+'='+JSON.stringify(items,null,2)+';\n';
const cleaned=added.map(({editorialApproval,...o})=>o);
logs.unshift({date,type:'nova-oportunidade',title:'Oportunidades aprovadas e publicadas',items:cleaned.map(o=>({id:o.id,title:o.title})),detail:'Registros com aprovação editorial explícita, elegibilidade, prazos e fontes oficiais verificados.'});
fs.writeFileSync(file,serialize('opportunities',[...cleaned,...existing]));
fs.writeFileSync(changes,serialize('changelog',logs));
fs.writeFileSync(queue,'[]\n');
console.log('Published '+cleaned.length+' editorially approved opportunities');
