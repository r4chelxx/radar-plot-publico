'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {officialOpportunityTarget}=require('../scripts/opportunity-primary-target');

test('follows an official eligibility FAQ before a generic application button',()=>{
 const html='<a href="/apply">Apply now</a><a href="/become-a-fellow/faq">Application FAQ</a>';
 assert.equal(officialOpportunityTarget(html,'https://jsk.stanford.edu/become-a-fellow'),'https://jsk.stanford.edu/become-a-fellow/faq');
});

test('does not follow social or document links as an opportunity evidence page',()=>{
 const html='<a href="https://facebook.com/example">Eligibility FAQ</a><a href="/guidelines.pdf">Application requirements</a><a href="/apply">Apply now</a>';
 assert.equal(officialOpportunityTarget(html,'https://example.org/fellowship'),'https://example.org/apply');
});
