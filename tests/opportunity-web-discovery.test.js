'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {extract,collect,queries}=require('../scripts/discover-opportunity-web');
test('accepts funding calls for journalism but excludes unrelated grants and datasets',()=>{
 const xml='<rss><channel>'+
 '<item><title>Investigative journalism grant applications open</title><link>https://example.org/journalism-grant</link></item>'+
 '<item><title>University physics research grant</title><link>https://example.org/physics</link></item>'+
 '<item><title>Open journalism dataset</title><link>https://example.org/data</link></item>'+
 '</channel></rss>';
 const leads=extract(xml);
 assert.equal(leads.length,1);
 assert.equal(leads[0].category,'opportunities');
 assert.equal(leads[0].editorialStatus,'unverified');
});
test('failed search query does not discard successful independent queries',async()=>{
 let i=0;
 const result=await collect(async url=>{i++;return i===1?{ok:false,status:429}:{ok:true,status:200,text:async()=>'<item><title>Journalism fellowship applications open</title><link>https://example.org/fellowship</link></item>'}});
 assert.equal(result.health.length,queries.length);
 assert.equal(result.health.filter(x=>x.status==='error').length,1);
 assert.equal(result.leads.length,1);
});
