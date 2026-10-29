const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve('scripts/load-persisted-editorial-queue.js');
test('loads valid persisted queue with provenance',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-queue-'));
 try{
  const input=path.join(dir,'in.json'),out=path.join(dir,'out.json');
  fs.writeFileSync(input,JSON.stringify({schemaVersion:1,updatedAt:'2026-10-29T12:00:00Z',candidates:[{id:'a',status:'pending'}]}));
  cp.execFileSync(process.execPath,[script,input,out]);
  const result=JSON.parse(fs.readFileSync(out));
  assert.equal(result.source,'radar-state');assert.equal(result.candidates.length,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('missing persisted queue is flagged unavailable, not mistaken for empty',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-queue-'));
 try{
  const out=path.join(dir,'out.json');
  cp.execFileSync(process.execPath,[script,path.join(dir,'missing.json'),out]);
  assert.equal(JSON.parse(fs.readFileSync(out)).source,'unavailable');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
