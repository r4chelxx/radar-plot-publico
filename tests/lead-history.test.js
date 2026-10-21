const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/update-lead-history.js');
test('history persists firstSeen and counts recurring links without duplicating them',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-history-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const triage={leads:[{url:'https://example.org/grant/?utm_source=mail',title:'Grant 2026',source:'Public site',category:'opportunities',classification:'needs-editorial-review'}]};
  fs.writeFileSync(path.join(dir,'intake/candidate-triage.json'),JSON.stringify(triage));
  cp.execFileSync(process.execPath,[script],{cwd:dir});
  const first=JSON.parse(fs.readFileSync(path.join(dir,'intake/lead-history-next.json')));
  assert.equal(Object.keys(first.leads).length,1);
  const id=Object.keys(first.leads)[0];
  assert.equal(first.leads[id].seenCount,1);
  assert.equal(first.leads[id].url,'https://example.org/grant');
  fs.copyFileSync(path.join(dir,'intake/lead-history-next.json'),path.join(dir,'intake/lead-history-previous.json'));
  triage.leads[0].title='Grant 2026 - updated';
  fs.writeFileSync(path.join(dir,'intake/candidate-triage.json'),JSON.stringify(triage));
  cp.execFileSync(process.execPath,[script],{cwd:dir});
  const second=JSON.parse(fs.readFileSync(path.join(dir,'intake/lead-history-next.json')));
  const delta=JSON.parse(fs.readFileSync(path.join(dir,'intake/lead-history-delta.json')));
  assert.equal(Object.keys(second.leads).length,1);
  assert.equal(second.leads[id].firstSeen,first.leads[id].firstSeen);
  assert.equal(second.leads[id].seenCount,2);
  assert.equal(delta.summary.new,0);
  assert.equal(delta.summary.returning,1);
  assert.equal(delta.summary.changed,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
