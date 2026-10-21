const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/prioritize-editorial-review.js');
function run(loaded){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-priority-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const urls=['https://example.org/changed?utm_source=letter','https://example.org/new','https://example.org/returning'];
  const {identity}=require('../scripts/lead-identity');
  const ids=urls.map(u=>identity(u).id);
  const candidates=urls.map((url,i)=>({url,title:'Candidate '+i,category:'opportunities',publicationReady:false}));
  fs.writeFileSync(path.join(dir,'intake/editorial-review.json'),JSON.stringify({candidates}));
  fs.writeFileSync(path.join(dir,'intake/lead-history-delta.json'),JSON.stringify({summary:{stateLoaded:loaded},delta:{new:[{id:ids[1]}],changed:[{id:ids[0]}],returning:[{id:ids[0]},{id:ids[2]}]}}));
  cp.execFileSync(process.execPath,[script],{cwd:dir});
  return JSON.parse(fs.readFileSync(path.join(dir,'intake/editorial-review.json')));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
}
test('loaded history sorts changed then new then returning without approval',()=>{
 const r=run(true);
 assert.deepEqual(r.candidates.map(x=>x.historyStatus),['changed','new','returning']);
 assert.equal(r.historyPrioritization.counts.changed,1);
 assert.ok(r.candidates.every(x=>x.publicationReady===false));
});
test('no history does not mislabel candidates as newly discovered',()=>{
 const r=run(false);
 assert.ok(r.candidates.every(x=>x.historyStatus==='uninitialized'));
 assert.equal(r.historyPrioritization.counts.new,0);
});
