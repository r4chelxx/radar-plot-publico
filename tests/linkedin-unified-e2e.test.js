'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const {convert}=require('../scripts/import-linkedin-public-posts');
test('public LinkedIn lead enters unified queue once alongside matching web lead',()=>{
 const root=path.resolve(__dirname,'..');
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'radar-linkedin-e2e-'));
 try{
  const official='https://example.org/journalism-grants';
  const imported=convert([{postUrl:'https://www.linkedin.com/posts/grants-for-journalists_activity-123',officialUrl:official,title:'Journalism grants for reporting projects'}]);
  assert.deepEqual(imported.errors,[]);
  fs.writeFileSync(path.join(temp,'linkedin.json'),JSON.stringify({source:'linkedin',leads:imported.leads}));
  fs.writeFileSync(path.join(temp,'web.json'),JSON.stringify({source:'web',leads:[{url:official,title:'Journalism grants for reporting projects',sourceName:'Official grants site'}]}));
  const result=spawnSync(process.execPath,[path.join(root,'scripts/unify-discovery.js'),path.join(temp,'web.json'),path.join(temp,'linkedin.json')],{cwd:temp,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const data=JSON.parse(fs.readFileSync(path.join(temp,'intake/unified-discovery.json'),'utf8'));
  assert.equal(data.candidates.length,1);
  assert.deepEqual(data.candidates[0].origins.sort(),['linkedin','web']);
  assert.equal(data.candidates[0].publicationReady,false);
  assert.equal(data.candidates[0].providers.length,2);
 }finally{fs.rmSync(temp,{recursive:true,force:true})}
});
