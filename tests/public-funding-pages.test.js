'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {extract,collect}=require('../scripts/discover-public-funding-pages');
test('extracts relevant public links without claiming editorial approval',()=>{
 const html='<a href="/funding/grant-2026">Journalism funding grant for investigations</a><a href="/about">About us</a><a href="javascript:alert(1)">Open call for journalists</a>';
 const leads=extract(html,'https://gfmd.info/fundings/','GFMD funding');
 assert.equal(leads.length,1);
 assert.equal(leads[0].url,'https://gfmd.info/funding/grant-2026');
 assert.equal(leads[0].editorialStatus,'unverified');
});
test('reports blocked pages without claiming full coverage',async()=>{
 const result=await collect(async()=>({ok:false,status:403}));
 assert.equal(result.leads.length,0);
 assert.equal(result.health.length,2);
 assert.ok(result.health.every(x=>x.status==='error'&&x.coverageStatus==='partial'));
});

test('GFMD funding detail pages are candidates even when title omits generic funding terms',()=>{
 const leads=extract('<a href="/fundings/international-nieman-2027/">International Nieman Programme 2027</a><a href="/fundings/">Browse all funding</a>','https://gfmd.info/fundings/','GFMD funding');
 assert.equal(leads.length,1);
 assert.equal(leads[0].url,'https://gfmd.info/fundings/international-nieman-2027');
});
test('GFMD fallback is attempted when archive has no relevant static links',async()=>{
 const requested=[];
 const result=await collect(async url=>{
  requested.push(url);
  return {ok:true,status:200,url,text:async()=>url.endsWith('/find-funding/')?'<a href="/fundings/international-nieman-2027/">International Nieman Programme 2027</a>':'<a href="/about/">About us</a>'};
 });
 assert.equal(requested.length,3);
 assert.equal(result.leads.length,1);
 assert.equal(result.health[1].fallbackStatus,'found-candidates');
});

test('Grants for Journalists category navigation is not treated as an individual grant',()=>{
 const html='<a href="/grants-for-journalists/">FIND A GRANT</a><a href="/all-grants/">View All Fellowships/Grants</a><a href="/opportunities/investigative-fellowship-2027/">Investigative Journalism Fellowship 2027</a>';
 const leads=extract(html,'https://grantsforjournalists.com/grants-for-journalists/','Grants for Journalists');
 assert.equal(leads.length,1);
 assert.equal(leads[0].url,'https://grantsforjournalists.com/opportunities/investigative-fellowship-2027');
});

test('GFMD fallback runs when archive has only generic relevant links',async()=>{
 const requested=[];
 const result=await collect(async url=>{
  requested.push(url);
  return {ok:true,status:200,url,text:async()=>url.endsWith('/find-funding/')?'<a href="/fundings/specific-reporting-2027/">Specific Reporting Programme 2027</a>':'<a href="/about/">Journalism funding information and resources</a>'};
 });
 assert.equal(requested.length,3);
 assert.equal(result.leads.filter(x=>x.url==='https://gfmd.info/fundings/specific-reporting-2027').length,1);
 assert.equal(result.health[1].fallbackStatus,'found-candidates');
});
