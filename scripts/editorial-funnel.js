// Operational funnel diagnostics. Never approves or publishes records.
function editorialFunnel(queue,manifest,discovery={}){
 const items=queue.candidates||[];
 const byStatus={};for(const x of items)byStatus[x.status||'pending']=(byStatus[x.status||'pending']||0)+1;
 const approved=(manifest.approved||[]);
 const byCategory={opportunities:0,datasets:0,tools:0};
 for(const x of approved)if(Object.hasOwn(byCategory,x.category))byCategory[x.category]++;
 const pending=items.filter(x=>x.status==='pending');
 const high=pending.filter(x=>x.reviewPriority==='high');
 const byProvider={};for(const x of pending)for(const provider of new Set(x.providers||[]))byProvider[provider]=(byProvider[provider]||0)+1;
 const oldestPending=pending.reduce((old,x)=>!x.firstSeen?old:(!old||x.firstSeen<old?x.firstSeen:old),null);
 const opportunitySignals=pending.filter(x=>/grant|fund|fellowship|opportun|journalist|bolsa|edital|financiamento/i.test([x.title,...(x.providers||[])].join(' '))).length;
 const current=(discovery.review||[]).filter(x=>x.classification==='needs-editorial-review'&&x.id);
 const existing=new Set(items.map(x=>x.id));
 const newCandidates=current.filter(x=>!existing.has(x.id));
 return {currentRunReviewCandidates:current.length,currentRunNewCandidates:new Set(newCandidates.map(x=>x.id)).size,projectedQueueTotal:items.length+new Set(newCandidates.map(x=>x.id)).size,queueTotal:items.length,pending:pending.length,oldestPendingFirstSeen:oldestPending,opportunitySignalPending:opportunitySignals,pendingByProvider:Object.entries(byProvider).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([provider,count])=>({provider,count})),highPriorityPending:high.length,queueStatuses:byStatus,approvedManifestTotal:approved.length,approvedManifestByCategory:byCategory,publicationConfirmedByThisReport:false,warning:'Manifest approval and queue status do not confirm actual catalog publication or live deployment.'};
}
module.exports={editorialFunnel};
