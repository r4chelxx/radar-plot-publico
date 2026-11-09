'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {selectAuditBatch}=require('../scripts/audit-editorial-queue');
test('daily audit reserves slots for opportunities, datasets and tools',()=>{
 const items=[];
 for(const category of ['uncategorized','tools','opportunities','datasets'])for(let i=0;i<100;i++)items.push({id:category+i,category,firstSeen:new Date(i).toISOString()});
 const batch=selectAuditBatch(items,20);
 const counts=Object.fromEntries(['opportunities','datasets','tools'].map(category=>[category,batch.filter(x=>x.category===category).length]));
 assert.deepEqual(counts,{opportunities:4,datasets:4,tools:4});
 assert.equal(batch.length,20);
});
test('balanced audit fills remaining capacity by oldest queue order',()=>{
 const items=[{id:'old',category:'uncategorized',firstSeen:'2020-01-01'},...['opportunities','datasets','tools'].map(c=>({id:c,category:c,firstSeen:'2025-01-01'}))];
 assert.deepEqual(selectAuditBatch(items,3).map(x=>x.category),['opportunities','datasets','tools']);
});
