const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {identity}=require('../scripts/lead-identity');
test('reviewed and published links cannot return to pending on next discovery',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-queue-'));
 try{
  const u=['https://example.org/published','https://example.org/rejected','https://example.org/new'];
  const c=u.map(url=>({...identity(url),title:url,providers:['DVS'],classification:'needs-editorial-review'}));
  const p=name=>path.join(dir,name);
  fs.writeFileSync(p('quality.json'),JSON.stringify({review:c}));
  fs.writeFileSync(p('queue.json'),JSON.stringify({candidates:c.map(x=>({...x,status:'pending',firstSeen:'2026-10-20'}))}));
  fs.writeFileSync(p('history.json'),JSON.stringify({leads:{[c[0].id]:{editorialStatus:'published'}}}));
  fs.writeFileSync(p('decisions.json'),JSON.stringify({decisions:[{url:u[1],status:'rejected'}]}));
  const run=()=>cp.execFileSync(process.execPath,[path.resolve('scripts/merge-editorial-queue.js'),p('quality.json'),p('queue.json'),p('history.json'),p('decisions.json')]);
  run();run();
  const items=JSON.parse(fs.readFileSync(p('queue.json'))).candidates;
  assert.equal(items.find(x=>x.url===c[0].url).status,'published');
  assert.equal(items.find(x=>x.url===c[1].url).status,'rejected');
  assert.equal(items.find(x=>x.url===c[2].url).status,'pending');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
