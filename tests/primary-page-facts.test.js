const test=require('node:test'),assert=require('node:assert/strict');
const {explicitPageFacts,visibleFactText,todayBahia}=require('../scripts/primary-page-facts');
test('reads eligibility from explicit primary-page body wording',()=>{
 const facts=explicitPageFacts('<main><h1>Fellowship</h1><p>Journalists at risk from abroad can apply for this program.</p></main>');
 assert.match(facts.eligibility,/Journalists at risk from abroad can apply/i);
 assert.equal(facts.eligibilityExplicit,true);
});
test('ignores navigation and footer text when extracting eligibility',()=>{
 const html='<nav><a>Eligibility: only registered members</a></nav><main><p>Applications open for reporters.</p></main><footer>Eligible applicants include staff only.</footer>';
 const facts=explicitPageFacts(html);
 assert.equal(facts.eligibility,null);
});
test('extracts organization stated in the primary source narrative',()=>{
 const facts=explicitPageFacts('<main><p>The program has been held by the taz Panter Foundation annually since 2015.</p></main>');
 assert.equal(facts.organization,'the taz Panter Foundation');
});
test('matches daily cutoff in Bahia local date',()=>{
 const now=new Date('2026-11-28T02:30:00Z');
 assert.equal(todayBahia(now),'2026-11-27');
 assert.equal(explicitPageFacts('<main><p>Apply by November 27, 2026.</p></main>',now).deadline,'2026-11-27');
});
test('rejects impossible ISO dates',()=>assert.equal(require('../scripts/primary-page-facts').isoDate('2026-02-31'),null));
