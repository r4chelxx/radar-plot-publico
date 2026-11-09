const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {identity}=require('../scripts/lead-identity');
test('reviewed and published links cannot return to pending on next discovery',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-queue-'));
 try{
  const u=['https://example.org/published','https://example.org/rejected','https://example.org/new'];
  const c=u.map(url=>({...identity(url),title:url,providers:['DVS'],classification:'needs-editorial-review'}));
  const p=name=>path.join(dir,name);
  fs.writeFileSync(p('quality.json'),JSON.stringify({review:c}));
  fs.writeFileSync(p('queue.json'),JSON.stringify({candidates:c.map(x=>({...x,status:'pending',firstSeen:'2026-10-20'}))}));
  fs.writeFileSync(p('history.json'),JSON.stringify({leads:{[c[0].id]:{editorialStatus:'published'}}}));
  fs.writeFileSync(p('decisions.json'),JSON.stringify({decisions:[{url:u[1],status:'rejected'}]}));
  const run=()=>cp.execFileSync(process.execPath,[path.resolve('scripts/merge-editorial-queue.js'),p('quality.json'),p('queue.json'),p('history.json'),p('decisions.json')]);
  run();run();
  const items=JSON.parse(fs.readFileSync(p('queue.json'))).candidates;
  assert.equal(items.find(x=>x.url===c[0].url).status,'published');
  assert.equal(items.find(x=>x.url===c[1].url).status,'rejected');
  assert.equal(items.find(x=>x.url===c[2].url).status,'pending');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('pending published catalog records reconcile to published without rewriting terminal decisions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-published-catalog-'));
 try{
  const p=name=>path.join(dir,name),catalog=path.join(dir,'catalog');fs.mkdirSync(catalog);
  const published=identity('https://example.org/live-tool'),rejected=identity('https://example.org/rejected-tool'),unmatched=identity('https://example.org/not-in-catalog');
  const candidates=[
   {...published,title:'Live tool',category:'tools',status:'pending',firstSeen:'2026-10-20'},
   {...rejected,title:'Rejected tool',category:'tools',status:'rejected',firstSeen:'2026-10-20'},
   {...unmatched,title:'Unverified tool',category:'tools',status:'pending',firstSeen:'2026-10-20'}
  ];
  fs.writeFileSync(path.join(catalog,'opportunities.js'),'window.RADAR_PARTS=window.RADAR_PARTS||{};window.RADAR_PARTS.opportunities=[];');
  fs.writeFileSync(path.join(catalog,'datasets.js'),'window.RADAR_PARTS=window.RADAR_PARTS||{};window.RADAR_PARTS.datasets=[];');
  fs.writeFileSync(path.join(catalog,'tools.js'),'window.RADAR_PARTS=window.RADAR_PARTS||{};window.RADAR_PARTS.tools='+JSON.stringify([{id:'live-tool',url:'https://example.org/live-tool'},{id:'rejected-tool',url:'https://example.org/rejected-tool'}])+';');
  fs.writeFileSync(p('quality.json'),JSON.stringify({review:[]}));
  fs.writeFileSync(p('queue.json'),JSON.stringify({candidates}));
  fs.writeFileSync(p('history.json'),JSON.stringify({leads:{}}));
  fs.writeFileSync(p('decisions.json'),JSON.stringify({decisions:[]}));
  cp.execFileSync(process.execPath,[path.resolve('scripts/merge-editorial-queue.js'),p('quality.json'),p('queue.json'),p('history.json'),p('decisions.json')],{env:{...process.env,RADAR_CATALOG_DIR:catalog}});
  const out=JSON.parse(fs.readFileSync(p('queue.json'),'utf8')).candidates;
  assert.equal(out.find(x=>x.id===published.id).status,'published');
  assert.equal(out.find(x=>x.id===rejected.id).status,'rejected');
  assert.equal(out.find(x=>x.id===unmatched.id).status,'pending');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('pending uncategorized queue items recover only valid exact historical categories',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-history-category-'));
 try{
  const p=name=>path.join(dir,name), known=identity('https://example.org/resource-a'), terminal=identity('https://example.org/resource-b');
  const candidates=[
   {...known,title:'Resource from historical archive',category:'uncategorized',status:'pending',firstSeen:'2026-10-20'},
   {...terminal,title:'Another archived resource',category:'uncategorized',status:'rejected',firstSeen:'2026-10-20'}
  ];
  fs.writeFileSync(p('quality.json'),JSON.stringify({review:[]}));
  fs.writeFileSync(p('queue.json'),JSON.stringify({candidates}));
  fs.writeFileSync(p('history.json'),JSON.stringify({leads:{[known.id]:{category:'datasets'},[terminal.id]:{category:'tools'},unrelated:{category:'opportunities'}}}));
  fs.writeFileSync(p('decisions.json'),JSON.stringify({decisions:[]}));
  cp.execFileSync(process.execPath,[path.resolve('scripts/merge-editorial-queue.js'),p('quality.json'),p('queue.json'),p('history.json'),p('decisions.json')]);
  const out=JSON.parse(fs.readFileSync(p('queue.json'),'utf8')).candidates;
  assert.equal(out.find(x=>x.id===known.id).category,'datasets');
  assert.equal(out.find(x=>x.id===known.id).status,'pending');
  assert.equal(out.find(x=>x.id===terminal.id).category,'uncategorized');
  assert.equal(out.find(x=>x.id===terminal.id).status,'rejected');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('persisted pending queue reconciles known tools and excludes nonfunding grant headlines',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-category-'));
 try{
  const p=name=>path.join(dir,name);
  const records=[
   {url:'https://felt.com/',title:'Felt',category:'uncategorized'},
   {url:'https://scikit-learn.org/',title:'Scikit-learn',category:'uncategorized'},
   {url:'https://example.org/permissions',title:'Terms grant broad scraping permissions',category:'opportunities'},
   {url:'https://example.org/fellowship',title:'Investigative Journalism Fellowship',category:'opportunities'}
  ].map(x=>({...identity(x.url),...x,status:'pending',firstSeen:'2026-10-20'}));
  fs.writeFileSync(p('quality.json'),JSON.stringify({review:[]}));
  fs.writeFileSync(p('queue.json'),JSON.stringify({candidates:records}));
  fs.writeFileSync(p('history.json'),JSON.stringify({leads:{}}));
  fs.writeFileSync(p('decisions.json'),JSON.stringify({decisions:[]}));
  const run=()=>cp.execFileSync(process.execPath,[path.resolve('scripts/merge-editorial-queue.js'),p('quality.json'),p('queue.json'),p('history.json'),p('decisions.json')]);
  run();run();
  const items=JSON.parse(fs.readFileSync(p('queue.json'),'utf8')).candidates;
  const byTitle=title=>items.find(x=>x.title===title);
  assert.equal(byTitle('Felt').category,'tools');
  assert.equal(byTitle('Scikit-learn').category,'tools');
  assert.equal(byTitle('Terms grant broad scraping permissions').category,'uncategorized');
  assert.equal(byTitle('Investigative Journalism Fellowship').category,'opportunities');
  assert.ok(items.every(x=>x.status==='pending'));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
