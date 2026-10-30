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

test('daily workflow reloads the confirmed remote queue rather than the main checkout',()=>{
 const yaml=fs.readFileSync(path.resolve('.github/workflows/unified-web-intake.yml'),'utf8');
 const step=yaml.split('      - name: Reload current persisted editorial queue for reporting')[1]?.split('      - name: Summarize collector reliability')[0]||'';
 assert.match(step,/git fetch --depth=1 origin radar-state/);
 assert.match(step,/git show FETCH_HEAD:intake\/editorial-queue\.json/);
 assert.doesNotMatch(step,/node scripts\/load-persisted-editorial-queue\.js intake\/editorial-queue\.json/);
});
