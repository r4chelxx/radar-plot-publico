const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {loadSources}=require('../scripts/load-source-catalog');
test('source loader handles url before name, deduplicates and keeps metadata',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-sources-'));
 try{
  const file=path.join(dir,'sources.js');
  fs.writeFileSync(file,'window.RADAR_PARTS=window.RADAR_PARTS||{};window.RADAR_PARTS.sources='+JSON.stringify([{url:'https://example.org/a',name:'Alpha',priority:'Alta'},{name:'Beta',url:'https://example.org/b'},{name:'Duplicate',url:'https://example.org/a'},{name:'Invalid',url:'ftp://example.org/c'}])+';');
  const result=loadSources(file);
  assert.equal(result.registryCount,4);
  assert.equal(result.sources.length,2);
  assert.equal(result.invalidOrDuplicate,2);
  assert.deepEqual(result.sources.map(x=>x.name),['Alpha','Beta']);
  assert.equal(result.sources[0].priority,'Alta');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
