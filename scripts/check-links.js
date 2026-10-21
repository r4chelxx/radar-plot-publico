#!/usr/bin/env node
const fs=require("fs"),vm=require("vm"),path=require("path");
const files=["data/opportunities.js","data/datasets.js","data/sources.js","data/tools.js"];
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const file of files)vm.runInContext(fs.readFileSync(path.join(process.cwd(),file),"utf8"),ctx,{filename:file});
const D=ctx.window.RADAR_PARTS,rows=[];
for(const x of D.opportunities||[])if(x.rules)rows.push({type:"opportunity",id:x.id||x.title,url:x.rules});
for(const x of D.datasets||[])if(x?.url)rows.push({type:"dataset",id:x.id||x.name,url:x.url});
for(const x of D.sources||[])if(x?.url)rows.push({type:"source",id:x.name,url:x.url});
for(const x of D.tools||[])if(x?.url)rows.push({type:"tool",id:x.id,url:x.url});
const unique=[...new Map(rows.map(x=>[x.url,x])).values()],results=[];
let previous={results:[]};
try{previous=JSON.parse(fs.readFileSync("audit/link-audit-latest.json","utf8"))}catch{}
const prior=new Map((previous.results||[]).map(x=>[x.url,x]));
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function request(url,variant=0){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),variant?14000:10000);
 try{
  const headers=variant?{"user-agent":"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36","accept":"text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8","cache-control":"no-cache"}:{"user-agent":"Mozilla/5.0 Radar-PLOT-Link-Audit/2.0","accept":"text/html,application/json;q=0.9,*/*;q=0.8"};
  const r=await fetch(url,{method:"GET",redirect:"follow",signal:ctrl.signal,headers});
  return{status:r.status,finalUrl:r.url,error:null};
 }catch(e){return{status:null,finalUrl:null,error:e.name+":"+e.message}}
 finally{clearTimeout(timer)}
}
function classify(url,r){
 if(r.status>=200&&r.status<400)return"ok";
 if([401,403,405,406,429].includes(r.status))return"blocked";
 if(r.status===404||r.status===410){const old=prior.get(url);return old&&["suspect","broken"].includes(old.class)?"broken":"suspect"}
 if(r.status>=500)return"server";
 if(r.status===null)return"network";
 return"warning";
}
async function check(x){
 const attempts=[await request(x.url,0)];
 let last=attempts[0];
 if(last.status===null||last.status>=500||last.status===429||last.status===404||last.status===410){
  await pause(250);
  last=await request(x.url,1);attempts.push(last);
 }
 return{...x,status:last.status,finalUrl:last.finalUrl,class:classify(x.url,last),error:last.error||undefined,attempts:attempts.map(a=>a.status??a.error)};
}
async function main(){
 const concurrency=12;
 for(let i=0;i<unique.length;i+=concurrency)results.push(...await Promise.all(unique.slice(i,i+concurrency).map(check)));
 const counts={};for(const r of results)counts[r.class]=(counts[r.class]||0)+1;
 console.log("Radar PLOT link audit");console.log("Unique URLs:",unique.length,counts);
 for(const cls of ["broken","suspect","server","network","warning","blocked"]){
  const list=results.filter(x=>x.class===cls);if(list.length){console.log("\n"+cls.toUpperCase());for(const x of list)console.log(" -",x.type,x.id,"=>",x.status||x.error,x.url,x.finalUrl&&x.finalUrl!==x.url?"-> "+x.finalUrl:"")}
 }
 fs.writeFileSync("link-audit.json",JSON.stringify({checkedAt:new Date().toISOString(),policy:"404/410 becomes broken only after appearing as suspect or broken in the previous audit; blocked and network results are inconclusive",counts,results},null,2));
 if(results.some(x=>x.class==="broken"))process.exitCode=1;
}
main();