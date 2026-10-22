#!/usr/bin/env node
// Public-only health check: never sends credentials or reads private data.
const https=require('node:https');
const assert=require('node:assert/strict');
const url=process.env.RADAR_PUBLIC_URL||'https://r4chelxx.github.io/radar-plot-publico/';
const timeoutMs=15000;
function fetch(target,redirects=0){
 return new Promise((resolve,reject)=>{
  const req=https.get(target,{timeout:timeoutMs,headers:{'User-Agent':'Radar-PLOT-healthcheck/1.0'}},res=>{
   if([301,302,307,308].includes(res.statusCode)&&res.headers.location&&redirects<3){
    res.resume();return resolve(fetch(new URL(res.headers.location,target).toString(),redirects+1));
   }
   let body='';res.setEncoding('utf8');
   res.on('data',chunk=>{body+=chunk;if(body.length>1000000)req.destroy(new Error('Response too large'));});
   res.on('end',()=>resolve({status:res.statusCode,body,url:target}));
  });
  req.on('timeout',()=>req.destroy(new Error('Request timed out')));
  req.on('error',reject);
 });
}
(async()=>{
 const home=await fetch(url);
 assert.equal(home.status,200,'Public homepage must return HTTP 200');
 assert(home.body.includes('id="app"'),'Expected Radar application container');
 for(const asset of ['app.js','styles.css','data.js']){
  const r=await fetch(new URL(asset,url).toString());
  assert.equal(r.status,200,asset+' must return HTTP 200');
  assert(r.body.length>100,asset+' unexpectedly empty');
 }
 console.log(JSON.stringify({ok:true,checkedAt:new Date().toISOString(),url,checks:['homepage','app.js','styles.css','data.js']}));
})().catch(e=>{console.error(JSON.stringify({ok:false,checkedAt:new Date().toISOString(),url,error:e.message}));process.exitCode=1;});
