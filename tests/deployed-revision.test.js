const test=require('node:test'),assert=require('node:assert/strict');
const {checkRevision}=require('../scripts/check-deployed-revision');
function mock(data){
 return async url=>({ok:true,status:200,arrayBuffer:async()=>Buffer.from(data[new URL(url).pathname.slice(1)]||'stale')});
}
test('current public asset matches checked-out main',async()=>{
 const result=await checkRevision({base:'https://example.org/',assets:['index.html'],read:()=>Buffer.from('current'),request:mock({'index.html':'current'}),retries:1,delayMs:0});
 assert.equal(result.ok,true);
});
test('stale deploy fails instead of reporting HTTP 200 as healthy',async()=>{
 await assert.rejects(checkRevision({base:'https://example.org/',assets:['index.html'],read:()=>Buffer.from('new'),request:mock({'index.html':'old'}),retries:1,delayMs:0}),/content-mismatch/);
});
test('deployment lag resolves on a later retry',async()=>{
 let calls=0;const request=async()=>({ok:true,status:200,arrayBuffer:async()=>Buffer.from(++calls===1?'old':'new')});
 const result=await checkRevision({base:'https://example.org/',assets:['app.js'],read:()=>Buffer.from('new'),request,retries:2,delayMs:0});
 assert.equal(result.attempt,2);
});
test('missing public asset fails closed',async()=>{
 await assert.rejects(checkRevision({base:'https://example.org/',assets:['app.js'],read:()=>Buffer.from('new'),request:async()=>({ok:false,status:404}),retries:1,delayMs:0}),/404/);
});
