const test=require('node:test'),assert=require('node:assert/strict');
const {identity}=require('../scripts/lead-identity');
const {orderForInspection}=require('../scripts/order-lead-inspection');
const leads=[{url:'https://example.org/returning',title:'Same',category:'tools',classification:'needs-editorial-review'},{url:'https://example.org/new',title:'New',category:'tools',classification:'needs-editorial-review'},{url:'https://example.org/changed',title:'Updated',category:'tools',classification:'needs-editorial-review'}];
const history={schemaVersion:1,leads:{}};
for(const lead of [leads[0],leads[2]])history.leads[identity(lead.url).id]={...lead};
history.leads[identity(leads[2].url).id].title='Old title';
test('changed and new public links inspected ahead of recurring links',()=>{
 const ranked=orderForInspection(leads,history);
 assert.deepEqual(ranked.map(x=>x.status),['changed','new','returning']);
 assert.deepEqual(ranked.map(x=>x.lead.url),[leads[2].url,leads[1].url,leads[0].url]);
});
test('no previous history does not claim novelty',()=>{
 assert.deepEqual(orderForInspection(leads,null).map(x=>x.status),['uninitialized','uninitialized','uninitialized']);
});
