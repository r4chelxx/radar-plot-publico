const test=require('node:test'),assert=require('node:assert/strict');
const {editorialFunnel}=require('../scripts/editorial-funnel');
test('distinguishes pending leads, approved manifest and confirmed publications',()=>{
 const r=editorialFunnel({candidates:[{status:'pending',reviewPriority:'high'},{status:'pending'},{status:'published'}]},{approved:[{category:'opportunities'},{category:'tools'}]});
 assert.equal(r.pending,2);assert.equal(r.highPriorityPending,1);
 assert.equal(r.approvedManifestByCategory.opportunities,1);
 assert.equal(r.publicationConfirmedByThisReport,false);
});
