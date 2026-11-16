'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),crypto=require('node:crypto');
const publisher=path.resolve('scripts/publish-approved.js');
const primary={id:'official',title:'Spencer Fellowship for Education Reporting',org:'Columbia Journalism School',summary:'Journalism fellowship for education reporting.',type:'Fellowship',scope:'US citizens or permanent resident/green card holders.',deadline:'2099-02-04',deadlineStatus:'Confirmed on the official call.',eligibility:'restrita',status:'aberta',rules:'https://spencerfellows.org/about-the-fellowship/'};
const alias={...primary,id:'aggregator',title:'Spencer Fellowship for Education Reporting 2099 (Funded)',org:'Opportunity Desk',eligibility:'parcial',rules:'https://opportunitydesk.org/2098/11/06/spencer-fellowship'};
function fixture(){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-alias-'));fs.mkdirSync(path.join(root,'data'));fs.mkdirSync(path.join(root,'intake'));
 for(const [key,items] of Object.entries({opportunities:[primary,alias],sources:[{url:primary.rules,category:'oportunidades/financiamento',type:'Programa de fellowship'}],tools:[],datasets:[],changelog:[{date:'2026-11-16',type:'nova-oportunidade',items:[{id:alias.id,title:alias.title}]}]}))fs.writeFileSync(path.join(root,'data',key+'.js'),'window.RADAR_PARTS.'+key+'='+JSON.stringify(items,null,2)+';');
 return root;
}
function run(root,approved=[]){fs.writeFileSync(path.join(root,'intake/approved-publications.json'),JSON.stringify({approved}));return JSON.parse(cp.execFileSync(process.execPath,[publisher],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}));}
function load(root,key){const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(root,'data',key+'.js'),'utf8'),ctx);return ctx.window.RADAR_PARTS[key];}
test('same call and deadline retain only the primary record and its restrictions',()=>{
 const root=fixture();try{
  const result=run(root);assert.equal(result.published,0);
  assert.deepEqual(result.publicationAliases,[{category:'opportunities',id:'aggregator',primaryId:'official'}]);
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(root,'intake/publication-aliases.json'),'utf8')).aliases,result.publicationAliases);
  const calls=load(root,'opportunities');assert.equal(calls.length,1);assert.equal(calls[0].id,'official');assert.equal(calls[0].eligibility,'restrita');assert.match(calls[0].scope,/green card/);assert.equal(load(root,'changelog').length,0);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('a different host alone does not establish an official source for deduplication',()=>{
 const root=fixture();try{
  fs.writeFileSync(path.join(root,'data/sources.js'),'window.RADAR_PARTS.sources=[];');
  run(root);assert.equal(load(root,'opportunities').length,2);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('a repeated aggregator approval cannot reinsert its alias; a different deadline stays distinct',()=>{
 const root=fixture();try{
  const entry=record=>({category:'opportunities',record,review:{decision:'approved',reviewedBy:'Editorial QA',reviewedAt:'2026-11-16',officialUrl:record.rules,evidence:'The application deadline and eligibility were checked on the referenced page.'}});
  run(root);assert.equal(run(root,[entry(alias)]).published,0);assert.equal(load(root,'opportunities').length,1);
  const checkedAt=new Date(Date.now()-48*3600000).toISOString(),evidence='Applications and eligibility for this journalism fellowship were documented in the original source.';
  const oldMachine={...entry(alias),review:{decision:'approved',reviewedBy:'Radar evidence gate v1',reviewPolicyVersion:'radar-evidence-v1',officialUrl:alias.rules,checkedAt,reviewedAt:checkedAt.slice(0,10),sourceStatus:200,contentType:'text/html',evidence,evidenceHash:crypto.createHash('sha256').update(evidence).digest('hex'),evidenceChecks:{callSignal:true,eligibility:true}}};
  assert.equal(run(root,[oldMachine]).published,0);assert.equal(load(root,'opportunities').length,1);
  const next={...alias,id:'next-edition',deadline:'2098-02-04',rules:'https://opportunitydesk.org/next-edition'};
  assert.equal(run(root,[entry(next)]).published,1);assert.equal(load(root,'opportunities').length,2);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('historical machine evidence remains valid for existing records but never authorizes a new stale record',()=>{
 const root=fixture();try{
  const tool={id:'known',name:'Example software',kind:'data analysis',url:'https://software.example/',desc:'This software provides documented data analysis functions and is available for installation with an open source license.'};
  fs.writeFileSync(path.join(root,'data/tools.js'),'window.RADAR_PARTS.tools='+JSON.stringify([tool])+';');
  const checkedAt=new Date(Date.now()-48*3600000).toISOString(),evidence='This software provides data analysis functions. Install instructions and license details are in the official documentation.';
  const proof={decision:'approved',reviewedBy:'Radar evidence gate v1',reviewPolicyVersion:'radar-evidence-v1',checkedAt,reviewedAt:checkedAt.slice(0,10),officialUrl:tool.url,evidence,evidenceHash:crypto.createHash('sha256').update(evidence).digest('hex'),sourceStatus:200,contentType:'text/html',evidenceChecks:{productSignal:true,function:true,access:true}};
  assert.equal(run(root,[{category:'tools',record:tool,review:proof}]).published,0);
  const other={...tool,id:'new',url:'https://new.example/'};
  assert.throws(()=>run(root,[{category:'tools',record:other,review:{...proof,officialUrl:other.url}}]),/item-level editorial verification/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('deployment verification requires the primary record and rejects both a live duplicate and a missing primary',()=>{
 const root=fixture();try{
  run(root,[{category:'opportunities',record:alias,review:{decision:'approved',reviewedBy:'Editorial QA',reviewedAt:'2026-11-16',officialUrl:alias.rules,evidence:'The application deadline and eligibility were checked on the referenced page.'}}]);
  const preload=path.join(root,'mock-fetch.cjs');
  fs.writeFileSync(preload,"global.fetch=async()=>({ok:true,text:async()=>require('node:fs').readFileSync('served.json','utf8')});");
  const verify=()=>cp.execFileSync(process.execPath,['--require',preload,path.resolve('scripts/verify-published-records.js')],{cwd:root,env:{...process.env,RADAR_DEPLOY_RETRIES:'1'},encoding:'utf8',stdio:['ignore','pipe','pipe']});
  fs.writeFileSync(path.join(root,'served.json'),JSON.stringify([primary]));assert.match(verify(),/contains all approved/);
  fs.writeFileSync(path.join(root,'served.json'),JSON.stringify([primary,alias]));assert.throws(verify,/duplicate:aggregator/);
  fs.writeFileSync(path.join(root,'served.json'),'[]');assert.throws(verify,/missing approved records/);
  fs.writeFileSync(path.join(root,'served.json'),JSON.stringify([primary]));
  fs.writeFileSync(path.join(root,'intake/approved-publications.json'),JSON.stringify({approved:[{category:'opportunities',record:{id:'unknown'}}]}));assert.throws(verify,/unknown/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
