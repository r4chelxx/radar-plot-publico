'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {activeRecords,inspectActive}=require('../scripts/recheck-active-opportunities');
const now=new Date('2026-11-16T12:00:00Z');
test('all open records share the same review selection regardless of program',()=>{
 assert.deepEqual(activeRecords([{id:'spencer',status:'aberta'},{id:'other',status:'aberta'},{id:'closed',status:'encerrada'}]).map(x=>x.id),['spencer','other']);
});
const record={id:'grant',title:'Journalism grant',rules:'https://official.example/call',deadline:'2027-02-04'};
const page=text=>async()=>({ok:true,status:200,url:record.rules,headers:{get:()=> 'text/html'},text:async()=>'<main>'+text+'</main>'});
test('network failure does not become a closed or archived call',async()=>{
 const result=await inspectActive(record,async()=>{throw new Error('network')},now);
 assert.equal(result.result,'unreachable');assert.equal(result.closureSignal,undefined);
});
test('explicit closure is queued for review rather than silently archived',async()=>{
 const result=await inspectActive(record,page('Applications are closed.'),now);
 assert.equal(result.result,'closure-needs-review');assert.equal(record.status,undefined);
});
test('live source and expired stored deadline remain distinct results',async()=>{
 assert.equal((await inspectActive(record,page('Applications are open to journalists.'),now)).result,'source-rechecked');
 assert.equal((await inspectActive({...record,deadline:'2026-11-01'},page('Applications are open for a new cycle.'),now)).result,'stored-deadline-expired');
});
