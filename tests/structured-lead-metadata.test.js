const test=require('node:test'),assert=require('node:assert/strict');
const {extractStructuredMetadata,metadataForLink}=require('../scripts/structured-lead-metadata');
test('extracts explicit JSON-LD deadline and eligibility without inventing fields',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({"@type":"Event",name:'Grant 2027',description:'Official call',endDate:'2027-02-03',organizer:{name:'Official Org'},eligibleRegion:'Brazil',url:'https://official.example/grant'})+'</script>';
 const all=extractStructuredMetadata(html,'https://official.example/');
 assert.ok(all.length>=1);const grant=metadataForLink(all,'https://official.example/grant');assert.equal(grant.deadline,'2027-02-03');assert.equal(grant.eligibility,'Brazil');assert.equal(grant.title,'Grant 2027');
});
test('extracts abbreviated month deadline from JSON-LD',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({"@type":"Event",name:'Grant',description:'Official call',endDate:'30 Nov 2027',organizer:{name:'Org'},url:'https://official.example/grant'})+'</script>';
 const all=extractStructuredMetadata(html,'https://official.example/');
 const grant=metadataForLink(all,'https://official.example/grant');
 assert.equal(grant.deadline,'2027-11-30');
});

test('ignores malformed or unrelated JSON-LD safely',()=>{
 const all=extractStructuredMetadata('<script type="application/ld+json">{bad</script><script type="application/ld+json">'+JSON.stringify({name:'Only title'})+'</script>','https://example.org');
 assert.equal(all.length,1);assert.equal(all[0].title,'Only title');assert.equal(all[0].deadline,null);
});

test('extracts OpenGraph metadata from the audited page root',()=>{
 const html='<meta property="og:title" content="Grant 2027"><meta property="og:description" content="Official opportunity description"><meta property="og:site_name" content="Official Org">';
 const all=extractStructuredMetadata(html,'https://official.example/grant');
 const page=metadataForLink(all,'https://official.example/grant');
 assert.equal(page.title,'Grant 2027');assert.equal(page.description,'Official opportunity description');assert.equal(page.organization,'Official Org');
});

test('extracts OpenGraph metadata when content appears before property',()=>{
 const html='<meta content="Grant 2027" property="og:title"><meta content="Official opportunity description" property="og:description"><meta content="Official Org" property="og:site_name">';
 const all=extractStructuredMetadata(html,'https://official.example/grant');
 const page=metadataForLink(all,'https://official.example/grant');
 assert.equal(page.title,'Grant 2027');assert.equal(page.description,'Official opportunity description');assert.equal(page.organization,'Official Org');
});
