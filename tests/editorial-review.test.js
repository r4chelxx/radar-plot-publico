const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const script=path.resolve(__dirname,'../scripts/build-editorial-review.js');
test('legacy source approvals use the same semantic resource check as unified intake',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-legacy-gate-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const rows=[{id:'tutorial',url:'https://example.org/docs/tutorial',pageTitle:'Writing plugins to add new embedding models',pageDescription:'A tutorial showing software library tools for data analysis. Install online with documentation.',evidenceText:'This tutorial describes a software library plugin with data analysis functions. Download and install online.',structuredData:[]},{id:'product',url:'https://example.org/product',pageTitle:'Data analysis software',pageDescription:'Software for data analysis. Download and install online.',evidenceText:'This software provides data analysis functions. Download and install online.',structuredData:[]}];
  rows[0].url='https://llm.datasette.io/en/stable/embeddings/writing-plugins.html';
  rows[0].pageDescription='Plugins and extensions for machine learning software. Install online with documentation.';
  fs.writeFileSync(path.join(dir,'intake/candidate-triage.json'),JSON.stringify({leads:rows.map(x=>({category:'tools',classification:'needs-editorial-review',title:x.pageTitle,url:x.url}))}));
  rows[1].evidenceText+=' It supports importing tables, cleaning records and exporting charts for investigative journalism.';
  fs.writeFileSync(path.join(dir,'intake/lead-evidence.json'),JSON.stringify({generatedAt:new Date().toISOString(),results:rows.map(x=>({...x,pageStatus:'html-fetched',httpStatus:200,contentType:'text/html',checkedAt:new Date().toISOString()}))}));
  cp.execFileSync(process.execPath,[script],{cwd:dir});const r=JSON.parse(fs.readFileSync(path.join(dir,'intake/editorial-review.json')));
  assert.equal(r.candidates[0].publicationReviewV1,null);assert.equal(r.candidates[1].checks.editorialApproval,true);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
test('catalog duplicate-key check ignores examples in descriptions but rejects actual duplicate keys',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-validator-'));
 try{
  fs.mkdirSync(dir+'/data');for(const key of ['tools','datasets','sources','opportunities','changelog'])fs.copyFileSync(path.resolve('data/'+key+'.js'),dir+'/data/'+key+'.js');
  const write=body=>fs.writeFileSync(dir+'/data/tools.js','window.RADAR_PARTS.tools=['+body+'];');
  write(JSON.stringify({id:'sample',name:'Software',kind:'analysis',url:'https://example.org/',desc:'Documentation example: {key: 1, key: 2}'}));
  let r=cp.spawnSync(process.execPath,[path.resolve('scripts/validate-data.js')],{cwd:dir,encoding:'utf8'});assert.equal(r.status,0,r.stdout+r.stderr);
  write('{"id":"one","id":"two","name":"Software","kind":"analysis","url":"https://example.org/"}');
  r=cp.spawnSync(process.execPath,[path.resolve('scripts/validate-data.js')],{cwd:dir,encoding:'utf8'});assert.notEqual(r.status,0);assert.match(r.stdout+r.stderr,/duplicate key/);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
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

test('canonical evidence is associated even when tracking parameters differ',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-review-evidence-'));
 try{
  fs.mkdirSync(path.join(dir,'intake'));
  const url='https://example.org/call?utm_source=newsletter';
  fs.writeFileSync(path.join(dir,'intake/candidate-triage.json'),JSON.stringify({leads:[{classification:'needs-editorial-review',category:'opportunities',url,title:'Call',source:'Test'}]}));
  fs.writeFileSync(path.join(dir,'intake/lead-evidence.json'),JSON.stringify({results:[{url:'https://example.org/call',pageStatus:'accessible',pageTitle:'Official call',dateMentionsUnclassified:['2026']}]}));
  cp.execFileSync(process.execPath,[script],{cwd:dir});
  const out=JSON.parse(fs.readFileSync(path.join(dir,'intake/editorial-review.json')));
  assert.equal(out.candidates[0].pageStatus,'accessible');
  assert.equal(out.candidates[0].pageTitle,'Official call');
  assert.equal(out.candidates[0].publicationReady,false);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('plugin author documentation is not an independently catalogable tool',()=>{
 const {reviewCandidate}=require('../scripts/review-editorial-evidence');
 const result=reviewCandidate({category:'tools',url:'https://docs.datasette.io/en/latest/plugin_telemetry.html',title:'Telemetry for plugin authors - Datasette documentation',audit:{pageTitle:'Telemetry for plugin authors - Datasette documentation',httpStatus:200,contentType:'text/html',evidenceText:'Datasette core emits OpenTelemetry spans and metrics. This page explains instrumenting the work your plugin does. Use your own instrumentation scope. Create a tracer and meter using your plugin package.',structuredData:[]}});
 assert.notEqual(result.decision,'evidence_complete_for_record_draft');
});
