const test=require('node:test'),assert=require('node:assert/strict');
const gmail=require('../scripts/discover-gmail-newsletters');
const linkedin=require('../scripts/discover-linkedin-indexed');
test('Gmail without OAuth secrets explicitly reports unavailable',async()=>{const r=await gmail.collect(undefined,{});assert.equal(r.leads.length,0);assert.equal(r.health[0].status,'unconfigured')});
test('Gmail metadata links are unverified candidates',()=>{const r=gmail.extract({subject:'Journalism grant applications',snippet:'Apply https://example.org/grant'});assert.equal(r.length,1);assert.equal(r[0].editorialStatus,'unverified')});
test('Indexed LinkedIn extraction rejects unrelated URLs',()=>{const xml='<item><title>Journalism grant fellowship</title><link>https://www.linkedin.com/posts/example-grant</link></item><item><title>Journalism grant</title><link>https://example.org/grant</link></item>';const r=linkedin.extract(xml);assert.equal(r.length,1);assert.equal(r[0].category,'opportunities')});
