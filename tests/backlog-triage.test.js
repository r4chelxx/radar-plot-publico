const test=require('node:test');
const assert=require('node:assert/strict');
const {suggest,report}=require('../scripts/report-backlog-triage');
test('clear funding opportunity suggests review only',()=>assert.equal(suggest({title:'Journalism Reporting Grant',url:'https://example.org/grant'}).category,'opportunities'));
test('award and conference require manual review',()=>{assert.equal(suggest({title:'Data Visualization Awards',url:'https://example.org/awards'}).category,null);assert.equal(suggest({title:'Conference',url:'https://example.org/event'}).confidence,'manual-review-event-or-award')});
test('tools and datasets can be suggested without mutating queue',()=>{const q={candidates:[{id:'a',title:'Python',url:'https://www.python.org/',status:'pending',reviewPriority:'high'},{id:'b',title:'Open Data Portal',url:'https://example.org/open-data',status:'pending'}]};const before=JSON.stringify(q);const result=report(q);assert.equal(result.uncategorized,2);assert.equal(result.suggestions[0].category,'tools');assert.equal(result.suggestions[1].category,'datasets');assert.equal(JSON.stringify(q),before)});

test('historical category and inspection are evidence, not automatic approval',()=>{
 const q={candidates:[{id:'z',title:'Reporting Grant',url:'https://example.org/reporting-grant',status:'pending'}]};
 const h={leads:{z:{category:'tools',source:'DVS',pageStatus:'html-fetched',lastInspectedAt:'2026-10-30T12:00:00Z'}}};
 const x=report(q,h);assert.equal(x.historyCoverage.inspectedHtml,1);assert.equal(x.historyCoverage.conflicts,1);assert.equal(x.suggestions[0].historyConflict,true);assert.equal(q.candidates[0].category,undefined);
});

test('review order favors high-priority opportunities and preserves other categories',()=>{
 const q={candidates:[{id:'a',title:'Dataset',url:'https://example.org/dataset',status:'pending',reviewPriority:'high'},{id:'b',title:'Reporting Grant',url:'https://example.org/grant',status:'pending',reviewPriority:'high'},{id:'c',title:'Python Tool',url:'https://example.org/python',status:'pending',reviewPriority:'normal'}]};
 const result=report(q);
 assert.deepEqual(result.suggestions.map(x=>x.id),['b','a','c']);
 assert.equal(result.reviewReady.highPriority,2);
 assert.equal(q.candidates[0].category,undefined);
});
