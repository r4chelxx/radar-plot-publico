'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {addedCounts,targetMet,bahiaDate}=require('../scripts/check-daily-publication-target');
test('daily target aggregates additions across publication windows',()=>{
 const before={opportunities:[{id:'old-o'}],tools:[{id:'old-t'}],datasets:[{id:'old-d'}]};
 const after={opportunities:[{id:'old-o'},{id:'new-o1'},{id:'new-o2'}],tools:[{id:'old-t'},{id:'new-t1'},{id:'new-t2'}],datasets:[{id:'old-d'},{id:'new-d1'},{id:'new-d2'}]};
 const counts=addedCounts(before,after);
 assert.deepEqual(counts,{opportunities:2,tools:2,datasets:2});
 assert.equal(targetMet(counts),true);
});
test('target fails only for categories below two',()=>{
 assert.equal(targetMet({opportunities:8,tools:2,datasets:1}),false);
});
test('only unique catalog IDs count toward the daily target',()=>{
 const counts=addedCounts({opportunities:[],tools:[],datasets:[]},{opportunities:[{id:'x'},{id:'x'}],tools:[],datasets:[]});
 assert.equal(counts.opportunities,1);
 assert.equal(targetMet(counts),false);
});
test('Bahia date follows its local calendar across UTC midnight',()=>{
 assert.equal(bahiaDate(new Date('2026-11-10T01:30:00Z')),'2026-11-09');
});
