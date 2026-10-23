const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('historical editorial batch is limited, persistent and never auto-approves',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-history-batch-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const leads={};
  for(let i=0;i<25;i++)leads['id'+i]={url:'https://example.org/'+i,title:'Candidate '+i,category:'opportunities',source:'official',classification:'needs-editorial-review',editorialStatus:i===0?'published':'unverified',lastInspectedAt:i<8?'2026-10-23T10:00:00Z':null};
  fs.writeFileSync(path.join(dir,'intake/lead-history-next.json'),JSON.stringify({leads}));
  fs.writeFileSync(path.join(dir,'intake/editorial-review.json'),JSON.stringify({candidates:[]}));
  fs.writeFileSync(path.join(dir,'intake/lead-evidence.json'),JSON.stringify({results:[]}));
  cp.execFileSync(process.execPath,[path.resolve('scripts/build-historical-review-batch.js')],{cwd:dir,env:{...process.env,EDITORIAL_BATCH_LIMIT:'15'}});
  const result=JSON.parse(fs.readFileSync(path.join(dir,'intake/historical-editorial-batch.json')));
  assert.equal(result.candidates.length,15);
  assert.equal(result.counts.needsEditorialReview,24);
  assert(!result.candidates.some(x=>x.title==='Candidate 0'));
  assert(result.candidates.every(x=>x.editorialStatus!=='approved'&&x.nextAction.includes('Verify official')));
  assert(result.candidates.slice(0,7).every(x=>x.lastInspectedAt));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
