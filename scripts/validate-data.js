#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path");
const files=["data/opportunities.js","data/datasets.js","data/sources.js","data/tools.js","data/changelog.js"];
let errors=[],warnings=[];
function duplicateKeys(file,src){
  const objectRx=/\{[^{}]*\}/g;
  for(const m of src.matchAll(objectRx)){
    const keys=[...m[0].matchAll(/(?:^|[,\{])\s*([A-Za-z_$][\w$]*)\s*:/g)].map(x=>x[1]);
    const dup=[...new Set(keys.filter((k,i)=>keys.indexOf(k)!==i))];
    if(dup.length) errors.push(file+": duplicate key(s) "+dup.join(", ")+" near "+m[0].slice(0,90));
  }
}
const ctx={window:{}};ctx.window.RADAR_PARTS={};vm.createContext(ctx);
for(const file of files){
  const src=fs.readFileSync(path.join(process.cwd(),file),"utf8");
  duplicateKeys(file,src);
  try{vm.runInContext(src,ctx,{filename:file})}catch(e){errors.push(file+": JavaScript parse/runtime error: "+e.message)}
}
const D=ctx.window.RADAR_PARTS, opps=D.opportunities||[], datasets=D.datasets||[], tools=D.tools||[];
const dateRx=/^\d{4}-\d{2}-\d{2}$/;
const opportunityStatuses=new Set(["aberta","monitorar","preparar","encerrada","descartada"]);
const eligibilityStatuses=new Set(["elegível","parcial","inelegível"]);
const investigationStageStatuses=new Set(["estruturado","em_apuracao","parcial","planejado"]);
const investigationSourceStatuses=new Set(["usada","planejada","nao_obtida"]);
const todayInBahia=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Bahia",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
function checkPastDate(label,value){if(value&&value>todayInBahia)errors.push(label+": future verification date "+value)}
const seen=new Set();
for(const o of opps){
  if(!o.id) errors.push("opportunity: missing id"); else if(seen.has(o.id)) errors.push("opportunity "+o.id+": duplicate id"); else seen.add(o.id);
  for(const k of ["title","org","type","scope","status","eligibility"]) if(!o[k]) errors.push("opportunity "+(o.id||"?")+": missing "+k);
  if(typeof o.fit!=="number"||o.fit<0||o.fit>10) errors.push("opportunity "+o.id+": fit outside 0–10");
  if(!opportunityStatuses.has(o.status)) errors.push("opportunity "+o.id+": invalid status "+o.status);
  if(!eligibilityStatuses.has(o.eligibility)) errors.push("opportunity "+o.id+": invalid eligibility "+o.eligibility);
  if(!o.rules||!/^https?:\/\//.test(o.rules)) errors.push("opportunity "+o.id+": invalid official source");
  if(!Array.isArray(o.themes)||!o.themes.length) errors.push("opportunity "+o.id+": themes must be a non-empty array");
  if(Object.prototype.hasOwnProperty.call(o,"story")) errors.push("opportunity "+o.id+": private story links must not be public");
  if(o.apply!==undefined&&o.apply!==null&&!/^https?:\/\//.test(o.apply)) errors.push("opportunity "+o.id+": invalid apply URL");
  if(o.status==="aberta"&&o.deadline&&o.deadline<todayInBahia) errors.push("opportunity "+o.id+": open status with past deadline "+o.deadline);
  for(const k of ["deadline","opens","verified"]) if(o[k]&&!dateRx.test(o[k])) errors.push("opportunity "+o.id+": invalid "+k);
  checkPastDate("opportunity "+o.id+" verified",o.verified);
  if(!o.summary) warnings.push("opportunity "+o.id+": missing editorial summary");
}
const sourceNames=new Set();
for(const s of D.sources||[]){
  if(!s.name) errors.push("source: missing name"); else if(sourceNames.has(s.name)) errors.push("source "+s.name+": duplicate name"); else sourceNames.add(s.name);
  for(const k of ["type","scope","priority","cadence","category","lastChecked"]) if(!s[k]) errors.push("source "+(s.name||"?")+": missing "+k);
  if(s.url&&!/^https?:\/\//.test(s.url)) errors.push("source "+s.name+": invalid URL");
  if(!["diária","semanal","quinzenal","mensal"].includes(s.cadence)) errors.push("source "+s.name+": invalid cadence "+s.cadence);
  if(s.lastChecked&&!dateRx.test(s.lastChecked)) errors.push("source "+s.name+": invalid lastChecked");
  checkPastDate("source "+s.name+" lastChecked",s.lastChecked);
}
// Discovery provenance is explicit. A publisher name or newsletter mention does not prove origin.
for(const item of [...opps,...datasets,...tools]){
  if(item.discoveryUrl&&!/^https?:\/\//.test(item.discoveryUrl)) errors.push((item.id||"item")+": invalid discoveryUrl");
  if(item.discoveredVia!==undefined && (!Array.isArray(item.discoveredVia)||item.discoveredVia.some(name=>!sourceNames.has(name)))) errors.push((item.id||"item")+": discoveredVia must reference monitored source names");
}
for(const d of datasets){
  if((D.sources||[]).some(s=>s.name.toLowerCase()===String(d.name||"").toLowerCase()&&s.role==="curadoria")||/quantum of sollazzo|datawrapper/i.test(d.name||"")) errors.push("dataset "+d.id+": newsletter or tool cannot be catalogued as data");
}
const toolIds=new Set();
for(const t of tools){
  if(!t.id||toolIds.has(t.id)) errors.push("tool: missing or duplicate id "+t.id); else toolIds.add(t.id);
  if(!t.name||!t.kind||!t.url||!/^https?:\/\//.test(t.url)) errors.push("tool "+t.id+": missing metadata or invalid URL");
}
const dseen=new Set();
for(const [di,d] of datasets.entries()){
  if(!d){errors.push("dataset array: empty item at index "+di);continue}
  const kinds=["dataset","portal","catalog","system","curated-source"];
  if(!d.id) errors.push("dataset: missing id"); else if(dseen.has(d.id)) errors.push("dataset "+d.id+": duplicate id"); else dseen.add(d.id);
  if(!d.kind||!kinds.includes(d.kind)) errors.push("dataset "+d.id+": invalid or missing kind");
  if(!["Salvador","Bahia","Brasil","Outros"].includes(d.territoryTier)) errors.push("dataset "+d.id+": invalid or missing territoryTier");
  if(d.url&&!/^https?:\/\//.test(d.url)) errors.push("dataset "+d.id+": invalid URL");
  checkPastDate("dataset "+d.id+" lastChecked",d.lastChecked);
  if(Object.prototype.hasOwnProperty.call(d,"story")) errors.push("dataset "+d.id+": private story links must not be public");
  const required=d.kind==="dataset"?["period","granularity","geoUnit","docs","lastChecked"]:d.kind==="system"?["docs","lastChecked"]:["docs","limitations","lastChecked"];
  for(const k of required) if(!d[k]) warnings.push("dataset "+d.id+": pending "+k);
}
const changes=D.changelog||[], changeSeen=new Set();
for(const [ci,x] of changes.entries()){
  if(!x){errors.push("changelog array: empty item at index "+ci);continue}
  for(const k of ["date","type","title","detail"]) if(!x[k]) warnings.push("changelog item "+ci+": missing "+k);
  if(x.date&&!dateRx.test(x.date)) errors.push("changelog item "+ci+": invalid date");
  const key=[x.date,x.type,x.title,x.detail].join("|");
  if(changeSeen.has(key)) errors.push("changelog: exact duplicate "+(x.title||ci)); else changeSeen.add(key);
}
console.log("Radar PLOT validation");
console.log("Checked:",opps.length,"opportunities,",datasets.length,"data records,",(D.sources||[]).length,"sources,",tools.length,"tools");
console.log("Errors:",errors.length,"Warnings:",warnings.length);
if(warnings.length) console.log("\nWARNINGS\n"+warnings.map(x=>" - "+x).join("\n"));
if(errors.length){console.error("\nERRORS\n"+errors.map(x=>" - "+x).join("\n"));process.exit(1)}
