#!/usr/bin/env node
'use strict';
const fs=require('node:fs'),vm=require('node:vm');
const {extractEvidence}=require('./editorial-page-evidence');
function activeRecords(records){return records.filter(x=>x.status==='aberta');}
async function inspectActive(record,fetcher=fetch,now=new Date()){
 const checkedAt=now.toISOString(),url=record.rules;
 const base={id:record.id,title:record.title,url,checkedAt,storedDeadline:record.deadline||null};
 if(!/^https:\/\//i.test(url||''))return {...base,result:'invalid-source'};
 try{
  const response=await fetcher(url,{signal:AbortSignal.timeout(12000),redirect:'follow',headers:{'user-agent':'RadarPLOT-active-review/1.0'}});
  if(!response.ok)return {...base,result:'unreachable',httpStatus:response.status};
  if(!/text\/html/i.test(response.headers.get('content-type')||''))return {...base,result:'unsupported-content',httpStatus:response.status};
  const snapshot=extractEvidence((await response.text()).slice(0,500000),response.url||url);
  const text=snapshot.evidenceText;
  const closed=/\b(?:applications?|submissions?|entries?)\s+(?:are\s+)?(?:now\s+)?closed\b|inscri[cç][oõ]es\s+encerradas/i.test(text);
  const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
  const expired=/^\d{4}-\d{2}-\d{2}$/.test(record.deadline||'')&&record.deadline<today;
  return {...base,finalUrl:response.url||url,httpStatus:response.status,result:expired?'stored-deadline-expired':closed?'closure-needs-review':'source-rechecked',closureSignal:closed,evidenceText:text.slice(0,5000),resourceLinks:snapshot.resourceLinks};
 }catch(error){return {...base,result:'unreachable',errorClass:error.name||'Error'};}
}
async function run(){
 const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('data/opportunities.js','utf8'),ctx);
 const active=activeRecords(ctx.window.RADAR_PARTS.opportunities||[]),results=new Array(active.length);
 let cursor=0;
 await Promise.all(Array.from({length:Math.min(8,active.length)},async()=>{while(cursor<active.length){const i=cursor++;results[i]=await inspectActive(active[i]);}}));
 const counts=results.reduce((out,x)=>(out[x.result]=(out[x.result]||0)+1,out),{});
 const report={generatedAt:new Date().toISOString(),policy:'Every published open opportunity is rechecked by the same process. Reachability is not renewed eligibility approval; failures and closure signals require evidence review, never automatic rejection.',active:active.length,checked:results.length,counts,results};
 fs.mkdirSync('intake',{recursive:true});fs.writeFileSync('intake/active-opportunity-review.json',JSON.stringify(report,null,2)+'\n');
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,'### Rechecagem das oportunidades publicadas abertas\n'+JSON.stringify({active:active.length,checked:results.length,counts})+'\nFalha de rede não significa chamada encerrada.\n');
 console.log(JSON.stringify({active:active.length,checked:results.length,counts}));
 if(results.length!==active.length)throw Error('Incomplete active opportunity review');
}
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1});
module.exports={activeRecords,inspectActive};
