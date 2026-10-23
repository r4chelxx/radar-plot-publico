const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {identity}=require('../scripts/lead-identity');
test('DVS public queue enters historical rotation without duplicates or editorial approval',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-dvs-'));
 try{
  const triage=path.join(dir,'triage.json'),queue=path.join(dir,'queue.json');
  fs.writeFileSync(triage,JSON.stringify({leads:[{url:'https://example.org/known',title:'Existing',classification:'needs-editorial-review'}]}));
  fs.writeFileSync(queue,JSON.stringify({schemaVersion:1,candidates:[
   {url:'https://example.org/known/',title:'Duplicate',providers:['Data Visualization Society'],status:'pending'},
   {url:'https://example.org/tool',title:'Visualization tool',providers:['Data Visualization Society'],status:'pending'},
   {url:'https://example.org/rejected',title:'Old tool',providers:['Data Visualization Society'],status:'rejected'},
   {url:'http://example.org/unsafe',title:'HTTP tool',providers:['Data Visualization Society'],status:'pending'}
  ]}));
  const run=()=>cp.execFileSync(process.execPath,[path.resolve('scripts/import-public-editorial-queue.js'),triage,queue],{encoding:'utf8'});
  const first=JSON.parse(run()),second=JSON.parse(run());
  assert.equal(first.added,1);assert.equal(second.added,0);
  const output=JSON.parse(fs.readFileSync(triage));
  assert.equal(output.leads.length,2);
  assert.equal(output.leads[1].classification,'needs-editorial-review');
  assert.equal(output.leads[1].editoriallyVerified,false);
  assert.equal(identity(output.leads[1].url).id,identity('https://example.org/tool').id);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
