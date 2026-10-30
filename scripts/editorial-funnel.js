// Operational funnel diagnostics. Never approves or publishes records.
function editorialFunnel(queue,manifest,discovery={}){
 const items=queue.candidates||[];
 const byStatus={};for(const x of items)byStatus[x.status||'pending']=(byStatus[x.status||'pending']||0)+1;
 const approved=(manifest.approved||[]);
 const byCategory={opportunities:0,datasets:0,tools:0};
 for(const x of approved)if(Object.hasOwn(byCategory,x.category))byCategory[x.category]++;
 const pending=items.filter(x=>x.status==='pending');
 const high=pending.filter(x=>x.reviewPriority==='high');
 const current=(discovery.review||[]).filter(x=>x.classification==='needs-editorial-review'&&x.id);\n const existing=new Set(items.map(x=>x.id));\n const newCandidates=current.filter(x=>!existing.has(x.id));\n return {currentRunReviewCandidates:current.length,currentRunNewCandidates:new Set(newCandidates.map(x=>x.id)).size,projectedQueueTotal:items.length+new Set(newCandidates.map(x=>x.id)).size,queueTotal:items.length,pending:pending.length,highPriorityPending:high.length,queueStatuses:byStatus,approvedManifestTotal:approved.length,approvedManifestByCategory:byCategory,publicationConfirmedByThisReport:false,warning:'Manifest approval and queue status do not confirm actual catalog publication or live deployment.'};
}
module.exports={editorialFunnel};
