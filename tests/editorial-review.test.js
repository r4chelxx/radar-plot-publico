const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/build-editorial-review.js');
test('category-specific editorial checks and distinct candidate IDs',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-review-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const leads=['opportunities','datasets','tools'].map((category,i)=>({classification:'needs-editorial-review',category,url:'https://example.org/'+i,title:'Candidate '+i,source:'Test'}));
  fs.writeFileSync(path.join(dir,'intake/candidate-triage.json'),JSON.stringify({leads}));
  fs.writeFileSync(path.join(dir,'intake/lead-evidence.json'),JSON.stringify({results:[]}));
  cp.execFileSync(process.execPath,[script],{cwd:dir});
  const out=JSON.parse(fs.readFileSync(path.join(dir,'intake/editorial-review.json')));
  assert.equal(out.candidates.length,3);
  assert.equal(new Set(out.candidates.map(x=>x.id)).size,3);
  const [o,d,t]=out.candidates;
  assert.equal(o.checks.deadlineVerified,false);
  assert.equal(o.checks.eligibilityVerified,false);
  assert.equal(d.checks.producerVerified,false);
  assert.equal(d.checks.deadlineVerified,undefined);
  assert.equal(t.checks.functionalityVerified,false);
  assert.equal(t.checks.eligibilityVerified,undefined);
  assert.ok(out.candidates.every(x=>!x.publicationReady));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('canonical URLs are deduplicated and malformed URLs excluded',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-review-dedupe-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const leads=[
   {classification:'needs-editorial-review',category:'opportunities',url:'https://example.org/call?utm_source=mail',title:'First',source:'Newsletter'},
   {classification:'needs-editorial-review',category:'opportunities',url:'https://example.org/call',title:'Duplicate',source:'Website'},
   {classification:'needs-editorial-review',category:'tools',url:'javascript:alert(1)',title:'Invalid',source:'Unknown'}
  ];
  fs.writeFileSync(path.join(dir,'intake/candidate-triage.json'),JSON.stringify({leads}));
  fs.writeFileSync(path.join(dir,'intake/lead-evidence.json'),JSON.stringify({results:[]}));
  cp.execFileSync(process.execPath,[script],{cwd:dir});
  const out=JSON.parse(fs.readFileSync(path.join(dir,'intake/editorial-review.json')));
  assert.equal(out.candidates.length,1);
  assert.equal(out.candidates[0].title,'First');
  assert.equal(out.candidates[0].publicationReady,false);
  assert.equal(out.counts.opportunities,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
