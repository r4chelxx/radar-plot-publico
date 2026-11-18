const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('inspected product generates proof, record and approval; article and newsletter remain blocked',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-flow-'));
 try{
  fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'intake'));
  for(const name of ['build-editorial-review','auto-audit-candidates','lead-identity','editorial-text','review-editorial-evidence','editorial-page-evidence','build-editorial-record-drafts','build-automated-publications'])fs.copyFileSync('scripts/'+name+'.js',path.join(root,'scripts',name+'.js'));
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

test('source flow accepts text-only calls, rolling deadlines, redirected products and HTML data with shared gates',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-shared-flow-'));
 try{
  fs.mkdirSync(path.join(root,'scripts'));fs.mkdirSync(path.join(root,'intake'));
  for(const name of ['build-editorial-review','auto-audit-candidates','lead-identity','editorial-text','review-editorial-evidence','editorial-page-evidence','build-editorial-record-drafts','build-automated-publications'])fs.copyFileSync('scripts/'+name+'.js',path.join(root,'scripts',name+'.js'));
  const make=(id,category,title,text,extra={})=>({id,url:'https://official.example/'+id,finalUrl:'https://official.example/'+id,category,classification:'needs-editorial-review',pageStatus:'html-fetched',httpStatus:200,contentType:'text/html',checkedAt:new Date().toISOString(),pageTitle:title,pageDescription:'',evidenceText:text,...extra});
  const results=[
   make('fixed','opportunities','Investigative Reporting Fellowship','Organization: Reporting Foundation. Applications are open for the reporting fellowship. Deadline: December 31, 2099. Eligibility: journalists worldwide may apply.'),
   make('rolling','opportunities','Journalism Story Grants','Organization: Reporting Foundation. Applications are open for journalism story grants. Eligibility: journalists worldwide may apply. '+('Reporting projects receive editorial support. '.repeat(130))+' Applications are accepted on a rolling basis with no deadline.'),
   make('tool','tools','Record Linkage Toolkit','Record Linkage Toolkit is a Python library for record linkage and data analysis. Download and install the open source software with documentation online.',{finalUrl:'https://new-official.example/tool'}),
   make('table','datasets','Municipal Data','Organization: Statistics Office. This dataset contains municipal data covering annual population indicators. Public data are available in the table below.',{tabularData:[{rows:5,columns:3,headers:3}]}),
   make('closed','opportunities','Journalism Fellowship','Organization: Reporting Foundation. Applications for this journalism fellowship are now closed. Deadline: December 31, 2099. Eligibility: journalists worldwide.'),
   make('unknown-date','opportunities','Journalism Fellowship','Organization: Reporting Foundation. Apply now for this journalism fellowship. Eligibility: journalists worldwide. Dates will be announced.'),
   make('restaurant','opportunities','Restaurant Grant','Organization: Restaurant Foundation. Applications are open for restaurant grants. Deadline: December 31, 2099. Eligibility: restaurant owners worldwide.')
  ];
  fs.writeFileSync(path.join(root,'intake/candidate-triage.json'),JSON.stringify({leads:results}));
  fs.writeFileSync(path.join(root,'intake/lead-evidence.json'),JSON.stringify({generatedAt:new Date().toISOString(),results}));
  cp.execFileSync(process.execPath,['scripts/build-editorial-review.js'],{cwd:root});
  cp.execFileSync(process.execPath,['scripts/auto-audit-candidates.js'],{cwd:root});
  const out=JSON.parse(fs.readFileSync(path.join(root,'intake/auto-editorial-decisions.json')));
  assert.equal(out.decisions.length,4,JSON.stringify(out.blockers));
  const rolling=out.decisions.find(x=>x.url.endsWith('/rolling'));
  assert.equal(rolling.record.deadline,null);
  assert.ok(rolling.publicationReviewV1.evidence.length>4000);
  assert.match(rolling.publicationReviewV1.evidence,/rolling basis/);
  assert.equal(out.decisions.find(x=>x.url.endsWith('/tool')).officialUrl,'https://new-official.example/tool');
  assert.equal(out.decisions.find(x=>x.url.endsWith('/table')).record.api,null);
  assert.equal(out.blockers.length,3);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});

test('discovery does not discard documentation or historical dataset editions before inspecting them',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-triage-contract-'));
 try{
  fs.mkdirSync(path.join(root,'data'));fs.mkdirSync(path.join(root,'intake'));
  for(const category of ['opportunities','datasets','tools'])fs.writeFileSync(path.join(root,'data',category+'.js'),'window.RADAR_PARTS.'+category+'=[];');
  const leads=[{url:'https://official.example/data/2020',label:'Municipal population dataset 2020'},{url:'https://official.example/tool/docs',label:'Linkage Toolkit documentation'},{url:'https://official.example/fellowship/about',label:'About the journalism fellowship'},{url:'https://official.example/login',label:'Read more'}];
  fs.writeFileSync(path.join(root,'intake/source-review.json'),JSON.stringify({results:[{name:'Source',url:'https://official.example/',leads}]}));
  cp.execFileSync(process.execPath,[path.resolve('scripts/triage-candidates.js')],{cwd:root});
  const result=JSON.parse(fs.readFileSync(path.join(root,'intake/candidate-triage.json')));
  for(const item of result.leads.slice(0,3))assert.equal(item.classification,'needs-editorial-review');
  assert.equal(result.leads[0].discoveryHints.historicalTitle,true);
  assert.equal(result.leads[3].classification,'generic-navigation');
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
