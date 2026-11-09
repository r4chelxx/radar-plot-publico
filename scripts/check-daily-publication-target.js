#!/usr/bin/env node
'use strict';
// Verify cumulative public catalog additions for the current Bahia calendar day.
const fs=require('node:fs');
const cp=require('node:child_process');
const vm=require('node:vm');
const categories=['opportunities','tools','datasets'];
function parseCatalog(source,key){
 const context={window:{RADAR_PARTS:{}}};
 vm.createContext(context);
 vm.runInContext(source,context);
 return context.window.RADAR_PARTS[key]||[];
}
function addedCounts(before,after){
 return Object.fromEntries(categories.map(category=>{
  const known=new Set((before[category]||[]).map(x=>String(x.id)));
  const unique=new Set((after[category]||[]).map(x=>String(x.id)));
  let added=0;
  for(const id of unique)if(!known.has(id))added++;
  return [category,added];
 }));
}
function targetMet(counts,minimum=2){
 return categories.every(category=>Number(counts[category]||0)>=minimum);
}
function bahiaDate(now=new Date()){
 const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).filter(x=>x.type!=='literal').map(x=>[x.type,x.value]));\n return parts.year+'-'+parts.month+'-'+parts.day;
}
function loadAt(commit,category){
 const source=cp.execFileSync('git',['show',commit+':data/'+category+'.js'],{encoding:'utf8'});
 return parseCatalog(source,category);
}
function run(){
 const day=process.env.RADAR_BAHIA_DATE||bahiaDate();
 const midnightUtc=new Date(day+'T00:00:00-03:00').toISOString();
 let baseline='';
 try{baseline=cp.execFileSync('git',['rev-list','-1','--before='+midnightUtc,'origin/main'],{encoding:'utf8'}).trim()}catch{}
 const before=Object.fromEntries(categories.map(category=>[category,baseline?loadAt(baseline,category):[]]));
 const after=Object.fromEntries(categories.map(category=>[category,parseCatalog(fs.readFileSync('data/'+category+'.js','utf8'),category)]));
 const counts=addedCounts(before,after);
 const met=targetMet(counts,Number(process.env.RADAR_DAILY_MINIMUM||2));
 const minimum=Number(process.env.RADAR_DAILY_MINIMUM||2);
 const lines=['### Meta diária cumulativa — fuso de Salvador','- Data local: '+day,...categories.map(category=>'- '+category+': '+counts[category]+' novo(s) no catálogo hoje'),'- Meta: pelo menos '+minimum+' por categoria','- Resultado: '+(met?'atingida':'não atingida')];
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,lines.join('\n')+'\n');
 fs.appendFileSync(process.env.GITHUB_OUTPUT,'target_met='+met+'\ncounts='+JSON.stringify(counts)+'\ndate='+day+'\n');
 console.log(JSON.stringify({date:day,counts,targetMet:met,baseline:baseline||null}));
 return {date:day,counts,targetMet:met};
}
if(require.main===module)run();
module.exports={addedCounts,targetMet,bahiaDate,parseCatalog};
