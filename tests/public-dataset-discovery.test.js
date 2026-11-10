'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {collect}=require('../scripts/discover-public-datasets');
test('dataset discovery emits only canonical dataset candidates from official APIs',async()=>{
 const fetcher=async url=>{
  if(String(url).includes('worldbank'))return {ok:true,json:async()=>[{},[{id:'SP.POP.TOTL',name:'Population, total'}]]};
  if(String(url).includes('gbif'))return {ok:true,json:async()=>({results:[{key:'abc',title:'Biodiversity records',homepage:'https://example.org/gbif/abc'}]})};
  if(String(url).includes('catalog.data.gov'))return {ok:true,json:async()=>({result:{results:[{name:'air-quality',title:'Air quality',url:'https://catalog.data.gov/dataset/air-quality'}]}})};
  return {ok:true,json:async()=>({result:[]})};
 };
 const r=await collect(fetcher);
 assert.equal(r.leads.length,3);
 assert(r.leads.every(x=>x.category==='datasets'&&x.editorialStatus==='unverified'));
 assert(r.leads.some(x=>x.url.includes('data.worldbank.org/indicator/SP.POP.TOTL')));
 assert(r.health.every(x=>x.status==='ok'));
});
test('dataset discovery reports a source failure without hiding healthy sources',async()=>{
 const fetcher=async url=>{
  if(String(url).includes('worldbank'))return {ok:false,status:503,json:async()=>({})};
  return {ok:true,json:async()=>({results:[],result:[]})};
 };
 const r=await collect(fetcher);
 assert.equal(r.health.find(x=>x.source==='World Bank Open Data').status,'error');
 assert(r.health.some(x=>x.status==='ok'));
});
