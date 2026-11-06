const test=require('node:test'),assert=require('node:assert/strict');
const {mergeApprovedManifests}=require('../scripts/merge-approved-manifests');
const entry=(id,url)=>({category:'tools',record:{id,url},review:{decision:'approved',officialUrl:url,evidence:'Fonte oficial verificada com evidência editorial suficiente.'}});
test('preserves concurrent current approvals and adds incoming approval',()=>{
 const r=mergeApprovedManifests({approved:[entry('current','https://a.example/tool')]},{approved:[entry('incoming','https://b.example/tool')]});
 assert.deepEqual(r.approved.map(x=>x.record.id),['current','incoming']);
});
test('is idempotent for an identical incoming approval',()=>{
 const e=entry('same','https://same.example/tool');
 assert.equal(mergeApprovedManifests({approved:[e]},{approved:[e]}).approved.length,1);
});
test('fails on conflicting approval with same official URL',()=>{
 const a=entry('one','https://same.example/tool'),b={...entry('two','https://same.example/tool'),review:{...entry('two','https://same.example/tool').review,evidence:'Conflito'}};
 assert.throws(()=>mergeApprovedManifests({approved:[a]},{approved:[b]}),/Conflicting approved publication entry/);
});
