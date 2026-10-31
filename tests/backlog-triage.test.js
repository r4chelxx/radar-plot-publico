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

test('daily review is capped, high-priority and balanced across categories',()=>{
 const q={candidates:[...Array.from({length:30},(_,i)=>({id:'g'+i,title:'Reporting Grant '+i,url:'https://example.org/grant/'+i,status:'pending',reviewPriority:'high'})),{id:'tool',title:'Python Tool',url:'https://example.org/python',status:'pending',reviewPriority:'high'},{id:'data',title:'Open Data Portal',url:'https://example.org/open-data',status:'pending',reviewPriority:'high'},{id:'low',title:'Reporting Grant',url:'https://example.org/grant',status:'pending',reviewPriority:'normal'}]};
 const before=JSON.stringify(q),x=report(q);
 assert.equal(x.dailyReview.length,24);
 assert.ok(x.dailyReview.some(y=>y.id==='tool'));
 assert.ok(x.dailyReview.some(y=>y.id==='data'));
 assert.ok(x.dailyReview.every(y=>y.priority==='high'));
 assert.equal(JSON.stringify(q),before);
});

test('backlog aging is cumulative and does not mutate candidates',()=>{
 const q={candidates:[{id:'old',status:'pending',firstSeen:'2026-09-01T00:00:00Z'},{id:'new',status:'pending',firstSeen:new Date().toISOString()},{id:'done',status:'published',firstSeen:'2020-01-01T00:00:00Z'},{id:'unknown',status:'pending'}]};
 const before=JSON.stringify(q),r=report(q);
 assert.equal(r.backlogAge.over7Days,1);
 assert.equal(r.backlogAge.over14Days,1);
 assert.equal(r.backlogAge.over30Days,1);
 assert.equal(r.backlogAge.missingFirstSeen,1);
 assert.equal(JSON.stringify(q),before);
});

test('queue delta distinguishes new, resolved, reopened and removed candidates',()=>{
 const prev={candidates:[{id:'a',status:'pending'},{id:'b',status:'pending'},{id:'c',status:'published'},{id:'d',status:'pending'}]};
 const curr={candidates:[{id:'a',status:'pending'},{id:'b',status:'published'},{id:'c',status:'pending'},{id:'e',status:'pending'}]};
 const d=report(curr,{},prev).backlogChange;
 assert.deepEqual(d,{previousPending:3,currentPending:3,netChange:0,newPending:1,reopened:1,resolved:1,removedFromQueue:1});
 assert.equal(report(curr).backlogChange,null);
});

test('inspected review excludes uninspected leads and retains category coverage',()=>{
 const q={candidates:[{id:'grant',title:'Reporting Grant',url:'https://example.org/grant',status:'pending',reviewPriority:'high'},{id:'tool',title:'Python Tool',url:'https://example.org/python',status:'pending',reviewPriority:'high'},{id:'data',title:'Open Data Portal',url:'https://example.org/open-data',status:'pending',reviewPriority:'high'}]};
 const h={leads:{grant:{pageStatus:'html-fetched'},tool:{pageStatus:'html-fetched'},data:{pageStatus:'fetch-error'}}};
 const x=report(q,h);
 assert.deepEqual(x.inspectedReview.map(y=>y.id).sort(),['grant','tool']);
 assert.equal(x.dailyReview.length,3);
});

test('already categorized pending leads participate in review without becoming heuristic suggestions',()=>{
 const q={candidates:[{id:'known',title:'Official Journalism Grant',url:'https://example.org/funding',category:'opportunities',reviewPriority:'high',status:'pending'},{id:'unknown',title:'Python Tool',url:'https://example.org/python',reviewPriority:'high',status:'pending'}]};
 const r=report(q,{leads:{known:{pageStatus:'html-fetched'}}});
 assert.equal(r.pending,2);
 assert.equal(r.uncategorized,1);
 assert.deepEqual(r.dailyReview.map(x=>x.id).sort(),['known','unknown']);
 assert.deepEqual(r.inspectedReview.map(x=>x.id),['known']);
 assert.deepEqual(r.suggestions.map(x=>x.id),['unknown']);
});

test('indirect news URLs require primary-source resolution before daily review',()=>{
 const q={candidates:[{id:'news',title:'Reporting Grant',url:'https://news.google.com/rss/articles/abc',category:'opportunities',reviewPriority:'high',status:'pending'},{id:'official',title:'Official Reporting Grant',url:'https://example.org/grants',category:'opportunities',reviewPriority:'high',status:'pending'}]};
 const r=report(q);
 assert.equal(r.indirectPending,1);
 assert.deepEqual(r.dailyReview.map(x=>x.id),['official']);
 assert.equal(r.suggestions.length,0);
 assert.equal(r.reviewReady.highPriority,1);
});

test('indirect candidates remain in source-resolution batch',()=>{
 const q={candidates:[{id:'news',title:'Journalism Grant',url:'https://news.google.com/rss/articles/example',category:'opportunities',reviewPriority:'high',status:'pending'}]};
 const r=report(q);
 assert.equal(r.sourceResolution.length,1);
 assert.equal(r.sourceResolution[0].id,'news');
 assert.equal(r.dailyReview.length,0);
});
