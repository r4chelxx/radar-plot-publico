#!/usr/bin/env node
// Compare actual deployed assets with the current main checkout; no credentials or private data.
const fs=require('node:fs');
const crypto=require('node:crypto');
const files=['index.html','app.js','styles.css','data/opportunities.js','data/datasets.js','data/tools.js','data/changelog.js','data/sources.js','data.js'];
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function checkRevision({base=process.env.RADAR_PUBLIC_URL||'https://r4chelxx.github.io/radar-plot-publico/',read=path=>fs.readFileSync(path),request=fetch,assets=files,retries=Number(process.env.RADAR_DEPLOY_RETRIES||12),delayMs=Number(process.env.RADAR_DEPLOY_DELAY_MS||10000)}={}){
 const attempts=Math.max(1,Math.min(20,retries));
 let missing=[];
 for(let attempt=1;attempt<=attempts;attempt++){
  missing=[];
  for(const asset of assets){
   const expected=hash(read(asset));
   try{
    const url=new URL(asset,base);url.searchParams.set('radar_revision_check',String(Date.now()));
    const response=await request(url.toString(),{headers:{'cache-control':'no-cache'},signal:AbortSignal.timeout(15000)});
    if(!response.ok){missing.push({asset,status:response.status});continue}
    const actual=hash(Buffer.from(await response.arrayBuffer()));
    if(actual!==expected)missing.push({asset,status:'content-mismatch'});
   }catch(e){missing.push({asset,status:'request-error',message:String(e.message).slice(0,120)})}
  }
  console.log(JSON.stringify({attempt,assets:assets.length,outOfSync:missing}));
  if(!missing.length)return {ok:true,attempt,assets:assets.length};
  if(attempt<attempts)await sleep(Math.max(0,delayMs));
 }
 throw new Error('Public deploy does not match checked-out main: '+missing.map(x=>x.asset+' ('+x.status+')').join(', '));
}
module.exports={checkRevision};
if(require.main===module)checkRevision().then(x=>console.log(JSON.stringify(x))).catch(e=>{console.error(e.message);process.exitCode=1});
