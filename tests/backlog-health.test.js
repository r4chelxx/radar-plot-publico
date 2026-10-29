const test=require('node:test'),assert=require('node:assert/strict');
const {summarizeBacklog}=require('../scripts/backlog-health');
const now=new Date('2026-10-29T12:00:00Z');
test('counts overdue opportunities separately and excludes terminal decisions',()=>{
 const leads={
  a:{category:'opportunities',classification:'needs-editorial-review',firstSeen:'2026-10-01',lastInspectedAt:'2026-10-20T12:00:00Z'},
  b:{category:'datasets',classification:'needs-editorial-review',firstSeen:'2026-10-01',lastInspectedAt:'2026-10-20T12:00:00Z'},
  c:{category:'opportunities',classification:'needs-editorial-review',firstSeen:'2026-10-19'},
  d:{category:'opportunities',classification:'needs-editorial-review',editorialStatus:'published'}
 };
 const r=summarizeBacklog(leads,now);
 assert.equal(r.pending,3);assert.equal(r.overdueOpportunities,1);
 assert.equal(r.overdueRechecks,1);assert.equal(r.neverInspected,1);
 assert.equal(r.oldestUninspectedDays,10);
});
test('retries failed links after three days',()=>{
 const r=summarizeBacklog({a:{category:'tools',classification:'needs-editorial-review',pageStatus:'http-error',lastInspectedAt:'2026-10-25T12:00:00Z'}},now);
 assert.equal(r.overdueRechecks,1);
});
