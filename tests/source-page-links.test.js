const test=require('node:test'),assert=require('node:assert/strict');
const {extractLinks,selectExpansionLinks,relevant}=require('../scripts/source-page-links');
test('extracts same-page links and selects bounded pagination',()=>{
 const html='<a href="/grants?page=2" rel="next">Next</a><a href="https://other.example/x">More</a><a href="/grant">Grant</a>';
 const links=extractLinks(html,'https://official.example/');
 assert.equal(links.length,3);assert.deepEqual(selectExpansionLinks(links,'https://official.example/',2),['https://official.example/grants?page=2']);assert.equal(relevant('Open grant'),true);
});
test('recognizes relevant URL slugs even when link label is generic',()=>{
 assert.equal(relevant('Read more','https://official.example/opportunities/cega-visiting-fellowship-2027'),true);
 assert.equal(relevant('Read more','https://official.example/about'),false);
});

test('does not follow external or unrelated links',()=>{
 const links=extractLinks('<a href="https://evil.example/x">Next</a><a href="/about">About</a>','https://official.example/');
 assert.deepEqual(selectExpansionLinks(links,'https://official.example/'),[]);
});

test('extracts cards with whitespace before closing tags and keeps accessible product names',()=>{
 const html='<a class="glue-card__outer" data-tracking="card_select" href="/pinpoint" aria-label="Pinpoint"  >Analyze documents</a\n >';
 const [link]=extractLinks(html,'https://journaliststudio.google.com/');
 assert.equal(link.url,'https://journaliststudio.google.com/pinpoint');
 assert.match(link.label,/Pinpoint/);
 assert.equal(relevant(link.label,link.url,{includeToolCards:true,attrs:link.attrs}),true);
 assert.equal(relevant(link.label,'https://example.org/pinpoint'),false,'non-editorial product cards should require a known tool catalog');
});
