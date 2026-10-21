const test=require('node:test'),assert=require('node:assert/strict');
const {normalizeLink}=require('../scripts/normalize-lead-link');
test('LinkedIn outbound redirect is unwrapped to publisher URL',()=>{
 const raw='https://www.linkedin.com/redir/redirect?url=https%3A%2F%2Fgrantsforjournalists.com%2F&amp;urlhash=abc';
 assert.equal(normalizeLink(raw,'https://www.linkedin.com'),'https://grantsforjournalists.com/');
});
test('HTML ampersand entities in normal links are decoded',()=>{
 const raw='https://www.mediawiki.org/w/index.php?title=XTools&amp;oldid=8626113';
 assert.equal(normalizeLink(raw,'https://www.mediawiki.org'),'https://www.mediawiki.org/w/index.php?title=XTools&oldid=8626113');
});
test('relative URLs resolve against source and reject unsafe protocols',()=>{
 assert.equal(normalizeLink('/grant','https://example.org/page'),'https://example.org/grant');
 assert.throws(()=>normalizeLink('javascript:alert(1)','https://example.org'));
});
