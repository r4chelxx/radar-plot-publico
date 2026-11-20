'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {interleaveByHost,classify,withHistory,shouldRetry}=require('../scripts/link-audit-policy');

test('interleaves links so one host cannot dominate a request burst',()=>{
 const links=[
  {url:'https://a.example/1'},{url:'https://a.example/2'},{url:'https://a.example/3'},
  {url:'https://b.example/1'},{url:'https://b.example/2'},{url:'https://c.example/1'}
 ];
 assert.deepEqual(interleaveByHost(links).map(x=>x.url),[
  'https://a.example/1','https://b.example/1','https://c.example/1',
  'https://a.example/2','https://b.example/2','https://a.example/3'
 ]);
});

test('keeps access blocks and network errors inconclusive',()=>{
 assert.equal(classify({status:403},null),'blocked');
 assert.equal(classify({status:null},null),'network');
 assert.equal(classify({status:503},null),'server');
 assert.equal(shouldRetry({status:503}),true);
 assert.equal(shouldRetry({status:403}),false);
});

test('records persistent inconclusive streak without calling a live URL broken',()=>{
 const second=withHistory({class:'network'},{class:'network',streak:1});
 const third=withHistory({class:'network'},{class:'network',streak:2});
 assert.equal(second.streak,2);assert.equal(second.persistent,false);
 assert.equal(third.streak,3);assert.equal(third.persistent,true);
 assert.equal(third.class,'network');
});

test('requires repeated definitive 404 before declaring a link broken',()=>{
 assert.equal(classify({status:404},null),'suspect');
 assert.equal(classify({status:404},{class:'suspect'}),'broken');
 assert.equal(classify({status:200},{class:'suspect'}),'ok');
});
