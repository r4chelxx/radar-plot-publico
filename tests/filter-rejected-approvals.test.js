'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {filterRejected}=require('../scripts/filter-rejected-approvals');
test('filters only manifest entries rejected by the production publication gate',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-filter-test-'));
 try{
  const file=path.join(dir,'manifest.json');
  const bad={category:'unknown',record:{id:'legacy-invalid'},review:{decision:'approved'}};
  const manifest={approved:[bad]};
  fs.writeFileSync(file,JSON.stringify(manifest));
  const result=filterRejected(file,path.resolve('.'));
  assert.equal(result.removed,1);
  assert.equal(result.remaining,0);
  assert.equal(result.rejected[0].id,'legacy-invalid');
  assert.deepEqual(JSON.parse(fs.readFileSync(file,'utf8')).approved,[]);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
