'use strict';
const assert=require('node:assert/strict');
const {collectCatalogLinks,extractUrls}=require('../scripts/collect-catalog-links');
const duplicate='https://official.example.org/call/';
const links=collectCatalogLinks({
 opportunities:[{id:'grant-1',rules:duplicate,apply:'Apply: https://forms.example.org/submit.',source:'See https://official.example.org/source',discoveryUrl:'https://newsletter.example.org/edition'}],
 datasets:[{id:'dataset-1',url:'https://data.example.org/catalog',docs:'Docs: https://data.example.org/docs.',api:'https://api.example.org/v1/{id}',discoveryUrl:duplicate}],
 sources:[{name:'Source A',url:'https://source.example.org',discoveryUrl:'https://source.example.org/archive'}],
 tools:[{id:'tool-1',url:'https://tool.example.org',docs:'https://tool.example.org/docs',api:'API info: https://tool.example.org/api'}]
});
assert.deepEqual(links.map(x=>x.url),[
 duplicate,'https://forms.example.org/submit','https://official.example.org/source','https://newsletter.example.org/edition',
 'https://data.example.org/catalog','https://data.example.org/docs','https://source.example.org','https://source.example.org/archive',
 'https://tool.example.org','https://tool.example.org/docs','https://tool.example.org/api'
]);
assert.equal(links[0].references.length,2,'Duplicate URLs must be checked once and keep every catalog reference');
assert.deepEqual(links[0].references.map(x=>x.field),['rules','discoveryUrl']);
assert.deepEqual(extractUrls('No link; https://example.org/path). and https://api.example.org/{id}'),['https://example.org/path']);
assert.equal(collectCatalogLinks({}).length,0);
console.log(JSON.stringify({uniqueUrls:links.length,allCatalogFields:'covered',duplicateReferences:'preserved',templateUrls:'skipped'}));
