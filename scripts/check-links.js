#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path");
const {isArcgisRest,validateArcgisPayload}=require("./validate-arcgis-rest");
const files=["data/opportunities.js","data/datasets.js","data/sources.js","data/tools.js"];
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const file of files)vm.runInContext(fs.readFileSync(path.join(process.cwd(),file),"utf8"),ctx,{filename:file});
const D=ctx.window.RADAR_PARTS;
const {collectCatalogLinks}=require("./collect-catalog-links");
const {interleaveByHost,classify,withHistory,shouldRetry}=require("./link-audit-policy");
const unique=interleaveByHost(collectCatalogLinks(D)),results=[];
let previous={results:[]};
try{previous=JSON.parse(fs.readFileSync("audit/link-audit-latest.json","utf8"))}catch{}
const prior=new Map((previous.results||[]).map(x=>[x.url,x]));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(url,variant=0){
 const timeouts=[10000,15000,22000];
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),timeouts[variant]||22000);
 try{
  const headers=variant?{"user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36","accept":"text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8","accept-language":"pt-BR,pt;q=0.9,en;q=0.8","cache-control":"no-cache"}:{"user-agent":"Mozilla/5.0 Radar-PLOT-Link-Audit/2.1","accept":"text/html,application/json;q=0.9,*/*;q=0.8"};
  const target=isArcgisRest(url)?new URL(url):null;
  if(target&&!target.searchParams.has("f"))target.searchParams.set("f","json");
  const r=await fetch(target?target.toString():url,{method:"GET",redirect:"follow",signal:ctrl.signal,headers});
  if(target&&r.ok){
   const payload=await r.text();
   const checked=validateArcgisPayload(payload);
   return{status:r.status,finalUrl:r.url,error:checked.valid?null:checked.reason,serviceError:!checked.valid,serviceMessage:checked.message};
  }
  return{status:r.status,finalUrl:r.url,error:null};
 }catch(e){return{status:null,finalUrl:null,error:e.name+":"+e.message,networkCode:e.cause?.code||null}}
 finally{clearTimeout(timer)}
}
async function check(x){
 const attempts=[await request(x.url,0)];
 let last=attempts[0];
 if(shouldRetry(last)){
  await pause(400);
  last=await request(x.url,1);attempts.push(last);
 }
 const old=prior.get(x.url);
 if(shouldRetry(last)&&old&&['network','server','suspect','broken'].includes(old.class)){
  await pause(900);
  last=await request(x.url,2);attempts.push(last);
 }
 const base={...x,status:last.status,finalUrl:last.finalUrl,class:classify(last,old),error:last.error||undefined,networkCode:last.networkCode||undefined,serviceMessage:last.serviceMessage||undefined,attempts:attempts.map(a=>a.serviceError?a.error:(a.status??a.error))};
 return withHistory(base,old);
}
async function main(){
 const concurrency=12;
 for(let i=0;i<unique.length;i+=concurrency)results.push(...await Promise.all(unique.slice(i,i+concurrency).map(check)));
 const counts={};for(const r of results)counts[r.class]=(counts[r.class]||0)+1;
 const persistentInconclusive=results.filter(x=>x.persistent);
 counts.persistentInconclusive=persistentInconclusive.length;
 console.log("Radar PLOT link audit");console.log("Unique URLs:",unique.length,counts);
 for(const cls of ["broken","suspect","server","network","warning","blocked"]){
  const list=results.filter(x=>x.class===cls);if(list.length){console.log("\n"+cls.toUpperCase());for(const x of list)console.log(" -",x.type,x.id,"=>",x.status||x.error,x.url,x.finalUrl&&x.finalUrl!==x.url?"-> "+x.finalUrl:"")}
 }
 fs.writeFileSync("link-audit.json",JSON.stringify({checkedAt:new Date().toISOString(),policy:"404/410 and ArcGIS application errors within HTTP 200 become broken only after appearing as suspect or broken in the previous audit. Bot blocks, network failures and 5xx responses remain inconclusive; streak and persistent fields expose recurring access failures without falsely deleting valid catalog records.",counts,diagnostics:{persistentInconclusive:persistentInconclusive.map(x=>({type:x.type,id:x.id,url:x.url,class:x.class,streak:x.streak,networkCode:x.networkCode||null,status:x.status||null}))},results},null,2));
 if(results.some(x=>x.class==="broken"))process.exitCode=1;
}
main();
