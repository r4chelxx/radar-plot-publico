'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {collect}=require('../scripts/discover-public-datasets');
test('dataset discovery emits only canonical dataset candidates from official APIs',async()=>{
 const previousKey=process.env.DATA_GOV_API_KEY;process.env.DATA_GOV_API_KEY='test-key';
 const fetcher=async (url,options={})=>{
  if(String(url).includes('worldbank'))return {ok:true,json:async()=>[{},[{id:'SP.POP.TOTL',name:'Population, total'}]]};
  if(String(url).includes('gbif'))return {ok:true,json:async()=>({results:[{key:'abc',title:'Biodiversity records',homepage:'https://example.org/gbif/abc'}]})};
  if(String(url).includes('api.gsa.gov')){assert.equal(options.headers['X-Api-Key'],'test-key');return {ok:true,json:async()=>({results:[{slug:'air-quality',title:'Air quality'}]})};}
  if(String(url).includes('data.europa.eu/api/hub/search/search'))return {ok:true,json:async()=>({result:{results:[{id:'https://data.europa.eu/id/dataset/abc',title:'EU air quality'}]}})};
  return {ok:true,json:async()=>({result:[]})};
 };
 const r=await collect(fetcher);
 if(previousKey===undefined)delete process.env.DATA_GOV_API_KEY;else process.env.DATA_GOV_API_KEY=previousKey;
 assert.equal(r.leads.length,4);
 assert(r.leads.every(x=>x.category==='datasets'&&x.editorialStatus==='unverified'));
 assert(r.leads.some(x=>x.url.includes('data.worldbank.org/indicator/SP.POP.TOTL')));
 const worldBank=r.leads.find(x=>x.url.includes('data.worldbank.org/indicator/SP.POP.TOTL'));
 assert.equal(worldBank.resourceLinks[0].label,'World Bank API');
 assert(worldBank.sourceEvidence.includes('SP.POP.TOTL'));
 assert(r.leads.some(x=>x.url.includes('data.europa.eu/id/dataset/abc')));
 assert(r.leads.some(x=>x.url.includes('catalog.data.gov/dataset/air-quality')));
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

test('Data.gov API discovery reports missing key without blocking other public catalogs',async()=>{
 const previousKey=process.env.DATA_GOV_API_KEY;delete process.env.DATA_GOV_API_KEY;
 const called=[];
 try{
  const r=await collect(async url=>{called.push(String(url));return {ok:true,json:async()=>({results:[]})};});
  assert.equal(called.some(url=>url.includes('api.gsa.gov/technology/datagov/v4/search')),false);
  assert.equal(r.health.find(x=>x.source==='Data.gov Catalog API').status,'needs-configuration');
  assert(r.health.some(x=>x.source==='European Data Portal'&&x.status==='ok'));
 }finally{if(previousKey===undefined)delete process.env.DATA_GOV_API_KEY;else process.env.DATA_GOV_API_KEY=previousKey}
});
