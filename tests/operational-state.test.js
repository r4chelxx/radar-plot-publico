const test=require('node:test'),assert=require('node:assert/strict');
const {audit}=require('../scripts/check-operational-state');
const {identity}=require('../scripts/lead-identity');
function fixture(){
 const a=identity('https://example.org/a'),b=identity('https://example.org/b');
 return {a,b,q:{candidates:[{...a,status:'pending',providers:['Data Visualization Society']},{...b,status:'rejected',providers:['Feed']}]},h:{leads:{[a.id]:{editorialStatus:'unverified'},[b.id]:{editorialStatus:'rejected'}}},d:{decisions:[{url:b.url,status:'rejected'}]}};
}
test('healthy public editorial queue passes without changing any records',()=>{
 const {q,h,d}=fixture();assert.equal(audit(q,h,d).ok,true);
});
test('rejected items cannot remain pending',()=>{
 const {q,h,d}=fixture();q.candidates[1].status='pending';
 assert.match(audit(q,h,d).errors.join(' '),/Resolved item incorrectly queued/);
});
test('published status requires an editorial record',()=>{
 const {q,h,d}=fixture();q.candidates[0].status='published';
 assert.match(audit(q,h,d).errors.join(' '),/Unsubstantiated publication/);
});
test('missing history and duplicated candidates are detected',()=>{
 const {q,h,d}=fixture();q.candidates.push({...q.candidates[0]});
 delete h.leads[q.candidates[0].id];
 assert.match(audit(q,h,d).errors.join(' '),/Duplicate queue ID/);
 assert.match(audit(q,h,d).errors.join(' '),/Missing historical lead/);
});
