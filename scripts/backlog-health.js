// Non-publishing operational metrics for persistent public lead backlog.
function summarizeBacklog(leads,now=new Date()){
 const values=Object.values(leads||{}).filter(x=>x.classification==='needs-editorial-review'&&!['published','rejected','duplicate','archived'].includes(x.editorialStatus));
 const days=x=>x.lastInspectedAt?(now.getTime()-Date.parse(x.lastInspectedAt))/86400000:null;
 const overdue=values.filter(x=>{const age=days(x);return age!==null&&Number.isFinite(age)&&age>=(x.pageStatus==='fetch-failed'||x.pageStatus==='http-error'?3:x.category==='opportunities'?7:21)});
 const unseen=values.filter(x=>!x.lastInspectedAt);
 const opportunities=values.filter(x=>x.category==='opportunities');
 const oldestUninspectedDays=unseen.reduce((n,x)=>{const age=(now.getTime()-Date.parse(x.firstSeen||''))/86400000;return Number.isFinite(age)?Math.max(n,Math.max(0,Math.floor(age))):n},0);
 const inspectedToday=values.filter(x=>{const age=days(x);return age!==null&&age>=0&&age<1}).length;
 return {pending:values.length,neverInspected:unseen.length,oldestUninspectedDays,overdueRechecks:overdue.length,overdueOpportunities:overdue.filter(x=>x.category==='opportunities').length,pendingOpportunities:opportunities.length,inspectedLast24Hours:inspectedToday,capacityTarget:40,estimatedFirstPassDays:Math.ceil(unseen.length/40),status:unseen.length>120||overdue.length>120?'backlog-pressure':'normal'};
}
module.exports={summarizeBacklog};
