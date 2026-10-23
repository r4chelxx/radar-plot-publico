const test=require('node:test'),assert=require('node:assert/strict');
const {isArcgisRest,validateArcgisPayload}=require('../scripts/validate-arcgis-rest');
test('recognizes ArcGIS REST service and layer URLs',()=>{
 assert(isArcgisRest('https://www.snirh.gov.br/arcgis/rest/services/SRE/OutorgasDireitodeUso/MapServer'));
 assert(isArcgisRest('https://www.snirh.gov.br/arcgis/rest/services/SRE/OutorgasDireitodeUso/MapServer/0?f=json'));
 assert(!isArcgisRest('https://example.org/ordinary-website'));
});
test('HTTP 200 with ArcGIS JSON 404 must not pass',()=>{
 const x=validateArcgisPayload(JSON.stringify({error:{code:404,message:'Service not found'}}));
 assert.equal(x.valid,false);assert.equal(x.reason,'arcgis-error-404');
});
test('valid ANA MapServer metadata passes',()=>{
 const x=validateArcgisPayload(JSON.stringify({currentVersion:11.5,layers:[{id:0,name:'Outorgas Federais'}]}));
 assert.equal(x.valid,true);
});
test('valid layer metadata passes',()=>{
 assert.equal(validateArcgisPayload(JSON.stringify({currentVersion:11.5,id:0,name:'Outorgas Federais',type:'Feature Layer'})).valid,true);
});
test('HTML 200 and JSON without layers fail closed',()=>{
 assert.equal(validateArcgisPayload('<!doctype html>error').valid,false);
 assert.equal(validateArcgisPayload(JSON.stringify({currentVersion:11.5})).valid,false);
});
