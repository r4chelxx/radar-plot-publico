'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {convert}=require('../scripts/import-linkedin-public-posts');
test('valid public LinkedIn post produces only unverified candidate',()=>{
 const x=convert([{postUrl:'https://www.linkedin.com/posts/example_activity-123?trk=foo',officialUrl:'https://example.org/call?utm_source=linkedin',title:'Journalism grant application for reporters'}]);
 assert.equal(x.errors.length,0);assert.equal(x.leads.length,1);assert.equal(x.leads[0].editorialStatus,'unverified');assert.equal(x.coverageStatus,'partial');
 assert.ok(!x.leads[0].url.includes('utm_source'));
});
test('rejects non-LinkedIn, profile and unsafe links',()=>{
 const x=convert([{postUrl:'https://evil-linkedin.com/posts/x',officialUrl:'https://example.org/grant',title:'A journalism grant for reporting'},{postUrl:'https://www.linkedin.com/in/user',officialUrl:'https://example.org/grant',title:'A journalism grant for reporting'},{postUrl:'https://www.linkedin.com/posts/a',officialUrl:'javascript:alert(1)',title:'A journalism grant for reporting'}]);
 assert.equal(x.leads.length,0);assert.equal(x.errors.length,3);
});
test('deduplicates candidates by official destination',()=>{
 const x=convert([{postUrl:'https://linkedin.com/posts/first',officialUrl:'https://example.org/grant',title:'Reporting grants for journalists'},{postUrl:'https://linkedin.com/posts/second',officialUrl:'https://example.org/grant',title:'Reporting grants for journalists'}]);
 assert.equal(x.leads.length,1);
});
