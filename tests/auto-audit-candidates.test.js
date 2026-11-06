const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('auto-audit approves only a complete future opportunity',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-auto-audit-'));
 try{
  fs.mkdirSync(path.join(d,'intake'));
  fs.mkdirSync(path.join(d,'scripts'));
  fs.copyFileSync('scripts/auto-audit-candidates.js',path.join(d,'scripts/auto-audit-candidates.js'));
  const future=new Date(Date.now()+86400000*30).toISOString().slice(0,10);
  const record={id:'future-grant',title:'Future Grant',org:'Official',summary:'Complete opportunity',rules:'https://official.example/grant',deadline:future,eligibility:'elegível',status:'aberta',type:'Grant',scope:'Internacional'};
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results:[{historicalId:'x',url:'https://official.example/grant',finalUrl:'https://official.example/grant',pageStatus:'html-fetched',category:'opportunities',deadline:future,eligibility:'elegível',status:'aberta',publicationRecord:record}]}));
  fs.writeFileSync(path.join(d,'intake/editorial-review.json'),JSON.stringify({candidates:[{id:'x',category:'opportunities'}]}));
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:d});
  const out=JSON.parse(fs.readFileSync(path.join(d,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,1);assert.equal(out.decisions[0].status,'approved');
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
test('auto-audit blocks missing eligibility and duplicate evidence',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-auto-audit-block-'));
 try{
  fs.mkdirSync(path.join(d,'intake'));fs.mkdirSync(path.join(d,'scripts'));
  fs.copyFileSync('scripts/auto-audit-candidates.js',path.join(d,'scripts/auto-audit-candidates.js'));
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results:[{url:'https://official.example/grant',finalUrl:'https://official.example/grant',pageStatus:'html-fetched',category:'opportunities',possibleMatches:[{id:'old'}],publicationRecord:{title:'x',org:'o',summary:'s',rules:'https://official.example/grant',deadline:'2099-01-01',eligibility:null,status:'aberta'}}]}));
  fs.writeFileSync(path.join(d,'intake/editorial-review.json'),JSON.stringify({candidates:[]}));
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:d});
  const out=JSON.parse(fs.readFileSync(path.join(d,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,0);assert.ok(out.summary.blocked===1);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});

test('auto-audit creates a neutral record from complete explicit official metadata',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-auto-audit-derived-'));
 try{
  fs.mkdirSync(path.join(d,'intake'));fs.mkdirSync(path.join(d,'scripts'));
  fs.copyFileSync('scripts/auto-audit-candidates.js',path.join(d,'scripts/auto-audit-candidates.js'));
  const future=new Date(Date.now()+86400000*30).toISOString().slice(0,10);
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results:[{url:'https://official.example/grant',finalUrl:'https://official.example/grant',pageStatus:'html-fetched',category:'opportunities',structuredEvidence:{title:'Grant 2027',description:'A'.repeat(140),organization:'Official Org',deadline:future,eligibility:'Journalists may apply',eligibilityExplicit:true,sourceType:'Event'}}]}));
  fs.writeFileSync(path.join(d,'intake/editorial-review.json'),JSON.stringify({candidates:[]}));
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:d});
  const out=JSON.parse(fs.readFileSync(path.join(d,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,1);assert.equal(out.decisions[0].record.eligibility,'parcial');assert.match(out.decisions[0].record.id,/^auto-/);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});

test('auto-audit creates neutral records for complete dataset and tool metadata',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-auto-audit-catalog-'));
 try{
  fs.mkdirSync(path.join(d,'intake'));fs.mkdirSync(path.join(d,'scripts'));
  fs.copyFileSync('scripts/auto-audit-candidates.js',path.join(d,'scripts/auto-audit-candidates.js'));
  const results=[
   {url:'https://official.example/data',finalUrl:'https://official.example/data',pageStatus:'html-fetched',category:'datasets',structuredEvidence:{title:'Official Dataset',description:'B'.repeat(100),organization:'Official Data',sourceType:'Dataset'}},
   {url:'https://official.example/tool',finalUrl:'https://official.example/tool',pageStatus:'html-fetched',category:'tools',structuredEvidence:{title:'Official Tool',description:'C'.repeat(100),organization:'Official Org',sourceType:'SoftwareApplication'}}
  ];
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results}));
  fs.writeFileSync(path.join(d,'intake/editorial-review.json'),JSON.stringify({candidates:[]}));
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:d});
  const out=JSON.parse(fs.readFileSync(path.join(d,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,2);assert.deepEqual(out.decisions.map(x=>x.category).sort(),['datasets','tools']);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
