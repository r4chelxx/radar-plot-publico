const test=require('node:test'),assert=require('node:assert/strict');
const {extractStructuredMetadata,metadataForLink}=require('../scripts/structured-lead-metadata');
test('extracts explicit JSON-LD deadline and eligibility without inventing fields',()=>{
 const html='<script type="application/ld+json">'+JSON.stringify({"@type":"Event",name:'Grant 2027',description:'Official call',endDate:'2027-02-03',organizer:{name:'Official Org'},eligibleRegion:'Brazil',url:'https://official.example/grant'})+'</script>';
 const all=extractStructuredMetadata(html,'https://official.example/');
 assert.ok(all.length>=1);const grant=metadataForLink(all,'https://official.example/grant');assert.equal(grant.deadline,'2027-02-03');assert.equal(grant.eligibility,'Brazil');assert.equal(grant.title,'Grant 2027');
});
test('ignores malformed or unrelated JSON-LD safely',()=>{
 const all=extractStructuredMetadata('<script type="application/ld+json">{bad</script><script type="application/ld+json">'+JSON.stringify({name:'Only title'})+'</script>','https://example.org');
 assert.equal(all.length,1);assert.equal(all[0].title,'Only title');assert.equal(all[0].deadline,null);
});
