#!/usr/bin/env node
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const publisher=path.resolve('scripts/publish-approved-opportunities.js');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-approved-test-'));
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Bahia',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const tomorrow=new Date(Date.now()+7*86400000).toISOString().slice(0,10);
const valid={id:'synthetic-test-only',title:'Synthetic example',org:'Test',type:'grant',scope:'global',status:'aberta',eligibility:'elegível',fit:5,themes:['teste'],story:[],summary:'Only for isolated tests',restrictions:['Example only'],rules:'https://example.org/rules',apply:'https://example.org/apply',deadline:tomorrow,verified:today,verificationHistory:[{date:today,status:'aberta',source:'https://example.org/rules'}],editorialApproval:{approved:true,reviewer:'Test reviewer',date:today}};
function run(entries){
  fs.mkdirSync(path.join(root,'data'),{recursive:true});
  fs.mkdirSync(path.join(root,'editorial'),{recursive:true});
  fs.writeFileSync(path.join(root,'data/opportunities.js'),'window.RADAR_PARTS=window.RADAR_PARTS||{};window.RADAR_PARTS.opportunities=[];');
  fs.writeFileSync(path.join(root,'data/changelog.js'),'window.RADAR_PARTS=window.RADAR_PARTS||{};window.RADAR_PARTS.changelog=[];');
  fs.writeFileSync(path.join(root,'editorial/approved-opportunities.json'),JSON.stringify(entries));
  return cp.spawnSync(process.execPath,[publisher],{cwd:root,encoding:'utf8'});
}
try{
  assert.equal(run([]).status,0,'empty queue must succeed');
  assert.equal(run([{...valid,editorialApproval:undefined}]).status,1,'missing approval must fail');
  assert.equal(run([{...valid,deadline:'2020-01-01'}]).status,1,'expired opportunity must fail');
  assert.equal(run([{...valid,rules:'http://tracking.example.org'}]).status,1,'untrusted URL scheme must fail');
  assert.equal(run([valid]).status,0,'approved example should be staged');
  const published=fs.readFileSync(path.join(root,'data/opportunities.js'),'utf8');
  assert.match(published,/synthetic-test-only/);
  assert.doesNotMatch(published,/editorialApproval/,'private approval metadata should not go to public catalog');
  assert.equal(fs.readFileSync(path.join(root,'editorial/approved-opportunities.json'),'utf8').trim(),'[]');
  assert.equal(run([valid,valid]).status,1,'duplicate id must fail');
  console.log('Approved publication gates: 7 assertions passed');
}finally{fs.rmSync(root,{recursive:true,force:true});}
