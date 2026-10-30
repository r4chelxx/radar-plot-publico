const test=require('node:test');
const assert=require('node:assert/strict');
const {suggest,report}=require('../scripts/report-backlog-triage');
test('clear funding opportunity suggests review only',()=>assert.equal(suggest({title:'Journalism Reporting Grant',url:'https://example.org/grant'}).category,'opportunities'));
test('award and conference require manual review',()=>{assert.equal(suggest({title:'Data Visualization Awards',url:'https://example.org/awards'}).category,null);assert.equal(suggest({title:'Conference',url:'https://example.org/event'}).confidence,'manual-review-event-or-award')});
test('tools and datasets can be suggested without mutating queue',()=>{const q={candidates:[{id:'a',title:'Python',url:'https://www.python.org/',status:'pending',reviewPriority:'high'},{id:'b',title:'Open Data Portal',url:'https://example.org/open-data',status:'pending'}]};const before=JSON.stringify(q);const result=report(q);assert.equal(result.uncategorized,2);assert.equal(result.suggestions[0].category,'tools');assert.equal(result.suggestions[1].category,'datasets');assert.equal(JSON.stringify(q),before)});
