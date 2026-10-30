const test=require('node:test'),assert=require('node:assert/strict');
const {editorialFunnel}=require('../scripts/editorial-funnel');
test('distinguishes pending leads, approved manifest and confirmed publications',()=>{
 const r=editorialFunnel({candidates:[{status:'pending',reviewPriority:'high'},{status:'pending'},{status:'published'}]},{approved:[{category:'opportunities'},{category:'tools'}]});
 assert.equal(r.pending,2);assert.equal(r.highPriorityPending,1);
 assert.equal(r.approvedManifestByCategory.opportunities,1);
 assert.equal(r.publicationConfirmedByThisReport,false);
});

test('reports current-run new leads without claiming persistence',()=>{const r=editorialFunnel({candidates:[{id:'old',status:'pending'}]},{approved:[]},{review:[{id:'old',classification:'needs-editorial-review'},{id:'new',classification:'needs-editorial-review'}]});assert.equal(r.currentRunNewCandidates,1);assert.equal(r.projectedQueueTotal,2);assert.equal(r.queueTotal,1);});

test('reports opportunity signals and pending backlog without approving them',()=>{const r=editorialFunnel({candidates:[{id:'a',status:'pending',title:'Journalism fellowship',providers:['Public feed'],firstSeen:'2026-10-01'},{id:'b',status:'rejected',title:'Grant',providers:['Public feed']}]},{approved:[]});assert.equal(r.opportunitySignalPending,1);assert.equal(r.oldestPendingFirstSeen,'2026-10-01');assert.deepEqual(r.pendingByProvider,[{provider:'Public feed',count:1}]);});

test('reports categorized backlog separately from keyword signals',()=>{const r=editorialFunnel({candidates:[{id:'1',status:'pending',category:'opportunities',title:'Open call'},{id:'2',status:'pending',category:'tools',title:'Grant tool'}]},{approved:[]});assert.equal(r.pendingByCategory.opportunities,1);assert.equal(r.pendingByCategory.tools,1);});
