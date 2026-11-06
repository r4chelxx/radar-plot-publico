const test=require('node:test'),assert=require('node:assert/strict');
const {extractLinks,selectExpansionLinks,relevant}=require('../scripts/source-page-links');
test('extracts same-page links and selects bounded pagination',()=>{
 const html='<a href="/grants?page=2" rel="next">Next</a><a href="https://other.example/x">More</a><a href="/grant">Grant</a>';
 const links=extractLinks(html,'https://official.example/');
 assert.equal(links.length,3);assert.deepEqual(selectExpansionLinks(links,'https://official.example/',2),['https://official.example/grants?page=2']);assert.equal(relevant('Open grant'),true);
});
test('does not follow external or unrelated links',()=>{
 const links=extractLinks('<a href="https://evil.example/x">Next</a><a href="/about">About</a>','https://official.example/');
 assert.deepEqual(selectExpansionLinks(links,'https://official.example/'),[]);
});
