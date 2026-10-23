const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const {checkPublicHealth}=require('../scripts/check-public-health');
const base='https://example.org/radar/';
const html=fs.readFileSync('index.html','utf8');
function probe(home=html,override=()=>null){
 const calls=[];
 const request=async url=>{
  calls.push(url);
  return url===base?{status:200,body:home}:override(url)||{status:200,body:'/* public asset */'.repeat(10)};
 };
 return {calls,run:()=>checkPublicHealth(base,request)};
}
test('health checks every public catalog with deployed cache query and skips external scripts',async()=>{
 const p=probe();const result=await p.run();
 assert.equal(result.ok,true);
 for(const file of ['opportunities','datasets','sources','tools','changelog']){
  assert(p.calls.some(url=>new URL(url).pathname.endsWith('/data/'+file+'.js')));
 }
 assert(p.calls.slice(1).every(url=>new URL(url).search.startsWith('?v=')));
 assert(p.calls.every(url=>new URL(url).origin==='https://example.org'));
});
for(const file of ['datasets','changelog'])test('missing '+file+' reference fails health check',async()=>{
 const home=html.replace(new RegExp('<script src="data/'+file+'\\.js[^"]*"><\\/script>'),'');
 await assert.rejects(probe(home).run(),/Missing asset reference/);
});
test('catalog HTTP failure is detected',async()=>{
 await assert.rejects(probe(html,url=>url.includes('/data/tools.js')?{status:404,body:'missing'}:null).run(),/must return HTTP 200/);
});
test('HTML fallback with HTTP 200 cannot impersonate a catalog',async()=>{
 await assert.rejects(probe(html,url=>url.includes('/data/datasets.js')?{status:200,body:'<!doctype html><html>'+('fallback '.repeat(20))+'</html>'}:null).run(),/returned HTML/);
});
