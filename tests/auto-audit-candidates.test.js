const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
function publicationReviewV1(category,url,evidence='Applications are open to journalists; product function and access terms are documented on the official source.'){
 const checkedAt=new Date().toISOString();
 const checks={opportunities:{callSignal:true,eligibility:true},datasets:{datasetSignal:true,directResource:true,format:true,coverage:true},tools:{productSignal:true,function:true,access:true}}[category];
 return {reviewedBy:'Radar evidence gate v1',reviewPolicyVersion:'radar-evidence-v1',decision:'approved',reviewedAt:checkedAt.slice(0,10),officialUrl:url,evidence,checkedAt,evidenceHash:require('node:crypto').createHash('sha256').update(evidence).digest('hex'),sourceStatus:200,contentType:'text/html; charset=utf-8',evidenceChecks:checks};
}
test('auto-audit approves only a complete future opportunity',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-auto-audit-'));
 try{
  fs.mkdirSync(path.join(d,'intake'));
  fs.mkdirSync(path.join(d,'scripts'));
  fs.copyFileSync('scripts/auto-audit-candidates.js',path.join(d,'scripts/auto-audit-candidates.js'));
  const future=new Date(Date.now()+86400000*30).toISOString().slice(0,10);
  const record={id:'future-grant',title:'Future Grant',org:'Official',summary:'Complete opportunity',rules:'https://official.example/grant',deadline:future,eligibility:'elegível',status:'aberta',type:'Grant',scope:'Internacional'};
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results:[{historicalId:'x',url:'https://official.example/grant',finalUrl:'https://official.example/grant',pageStatus:'html-fetched',category:'opportunities',deadline:future,eligibility:'elegível',status:'aberta',publicationRecord:record,publicationReviewV1:publicationReviewV1('opportunities','https://official.example/grant')}]}));
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
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results:[{url:'https://official.example/grant',finalUrl:'https://official.example/grant',pageStatus:'html-fetched',category:'opportunities',structuredEvidence:{title:'Grant 2027',description:'Applications are open to journalists. '+'A'.repeat(120),organization:'Official Org',deadline:future,eligibility:'Journalists may apply',eligibilityExplicit:true,status:'aberta',sourceType:'Event'},publicationReviewV1:publicationReviewV1('opportunities','https://official.example/grant','Applications are open to journalists; the official source describes eligibility and grant terms.')}]}));
  fs.writeFileSync(path.join(d,'intake/editorial-review.json'),JSON.stringify({candidates:[]}));
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:d});
  const out=JSON.parse(fs.readFileSync(path.join(d,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,1);assert.equal(out.decisions[0].record.eligibility,'parcial');assert.match(out.decisions[0].record.id,/^auto-/);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});

test('auto-audit blocks derived opportunity without explicit open status',()=>{
 const d=fs.mkdtempSync(path.join(os.tmpdir(),'radar-auto-audit-status-'));
 try{
  fs.mkdirSync(path.join(d,'intake'));fs.mkdirSync(path.join(d,'scripts'));
  fs.copyFileSync('scripts/auto-audit-candidates.js',path.join(d,'scripts/auto-audit-candidates.js'));
  const future=new Date(Date.now()+86400000*30).toISOString().slice(0,10);
  fs.writeFileSync(path.join(d,'intake/lead-evidence.json'),JSON.stringify({results:[{url:'https://official.example/grant',finalUrl:'https://official.example/grant',pageStatus:'html-fetched',category:'opportunities',structuredEvidence:{title:'Grant 2027',description:'A'.repeat(140),organization:'Official Org',deadline:future,eligibility:'Journalists may apply',eligibilityExplicit:true}}]}));
  fs.writeFileSync(path.join(d,'intake/editorial-review.json'),JSON.stringify({candidates:[]}));
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:d});
  const out=JSON.parse(fs.readFileSync(path.join(d,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,0);assert.match(JSON.stringify(out.summary.byBlocker),/ficha pública estruturada ausente/);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});

test('legacy dataset and tool metadata without v1 proof remain blocked',()=>{
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
  assert.equal(out.decisions.length,0);assert.equal(out.summary.autoApproved,0);assert.equal(out.summary.blocked,2);assert.match(JSON.stringify(out.summary.byBlocker),/comprovante individual compatível/);
 }finally{fs.rmSync(d,{recursive:true,force:true})}
});
