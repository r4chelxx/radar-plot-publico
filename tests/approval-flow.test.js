const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('inspected product generates proof, record and approval; article and newsletter remain blocked',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-flow-'));
 try{
  fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'intake'));
  for(const name of ['build-editorial-review','auto-audit-candidates','lead-identity','editorial-text','review-editorial-evidence','editorial-page-evidence'])fs.copyFileSync('scripts/'+name+'.js',path.join(root,'scripts',name+'.js'));
  const urls=['https://www.crummy.com/software/BeautifulSoup/','https://example.org/2026/11/new-tool','https://buttondown.com/newsletter/archive/123','https://example.org/book','https://example.org/tools','https://person.example.org/'];
  const titles=['Beautiful Soup: We called him Tortoise because he taught us.','Newsletter about a new library','Newsletter archive','Health inequality monitoring book','Tools and toolkits','Soxoj — OSINT specialist and tool developer'];
  const text='Beautiful Soup is a Python library designed for screen-scraping HTML and XML. It provides methods for navigating, searching and modifying a parse tree. Download and install from the official documentation under the MIT license.';
  const results=urls.map((url,i)=>({id:'legacy-'+i,url,finalUrl:url,category:'tools',classification:'needs-editorial-review',pageStatus:'html-fetched',httpStatus:200,contentType:'text/html',checkedAt:new Date().toISOString(),pageTitle:titles[i],pageDescription:text,evidenceText:text,structuredEvidence:{description:text}}));
  fs.writeFileSync(path.join(root,'intake/candidate-triage.json'),JSON.stringify({leads:results}));
  fs.writeFileSync(path.join(root,'intake/lead-evidence.json'),JSON.stringify({generatedAt:new Date().toISOString(),results}));
  cp.execFileSync(process.execPath,['scripts/build-editorial-review.js'],{cwd:root});
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:root});
  const out=JSON.parse(fs.readFileSync(path.join(root,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,1);assert.equal(out.decisions[0].record.name,'Beautiful Soup');
  assert.equal(out.decisions[0].publicationReviewV1.decision,'approved');
  assert.equal(out.blockers.length,5);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
