// Select an actionable editorial batch from the persistent historical state.
// Technical inspection is evidence only, never an editorial decision.
const fs=require('node:fs');
const {identity}=require('./lead-identity');
const state=JSON.parse(fs.readFileSync(process.argv[2]||'intake/lead-history-next.json','utf8'));
const review=JSON.parse(fs.readFileSync(process.argv[3]||'intake/editorial-review.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('intake/lead-evidence.json','utf8'));
const byId=new Map((review.candidates||[]).map(x=>[x.id,x]));
const byEvidence=new Map((evidence.results||[]).flatMap(x=>{try{return [[identity(x.url).id,x]]}catch{return []}}));
const limit=Math.min(30,Math.max(1,Number(process.env.EDITORIAL_BATCH_LIMIT||15)));
const leads=Object.entries(state.leads||{}).filter(([,x])=>x.classification==='needs-editorial-review'&&!['published','rejected','duplicate','archived'].includes(x.editorialStatus));
leads.sort((a,b)=>Number(Boolean(b[1].lastInspectedAt))-Number(Boolean(a[1].lastInspectedAt))||
 String(a[1].reviewedAt||'').localeCompare(String(b[1].reviewedAt||''))||
 String(a[1].lastInspectedAt||'').localeCompare(String(b[1].lastInspectedAt||''))||
 String(a[0]).localeCompare(String(b[0])));
const candidates=leads.slice(0,limit).map(([id,x])=>{
 const ev=byEvidence.get(id),r=byId.get(id);
 return {id,url:x.url,title:x.title,category:x.category,source:x.source,firstSeen:x.firstSeen,
 lastInspectedAt:x.lastInspectedAt||null,pageStatus:ev?.pageStatus||x.pageStatus||'not-inspected',
 pageTitle:ev?.pageTitle||r?.pageTitle||null,dateMentionsUnclassified:ev?.dateMentionsUnclassified||r?.dateMentionsUnclassified||[],
 editorialStatus:x.editorialStatus||'unverified',reviewedAt:x.reviewedAt||null,
 pendingChecks:r?.missing||['primarySourceVerified','duplicateReviewed','editorialApproval'],
 nextAction:'Verify official source, active deadline, eligibility, relevance and catalog duplicates; document decision in historical-decisions.json and approved-publications.json when applicable.'};
});
const counts={totalHistorical:Object.keys(state.leads||{}).length,needsEditorialReview:leads.length,
 technicalInspections:leads.filter(([,x])=>x.lastInspectedAt).length,
 editorialDecisions:Object.values(state.leads||{}).filter(x=>x.reviewedAt).length,
 batchSize:candidates.length};
const output={generatedAt:new Date().toISOString(),policy:'Technical inspection is not editorial approval. Human/assisted evidence review required.',counts,candidates};
fs.writeFileSync('intake/historical-editorial-batch.json',JSON.stringify(output,null,2)+'\n');
const md=['# Lote editorial histórico','',...Object.entries(counts).map(([k,v])=>'- '+k+': '+v),'',
...candidates.flatMap((x,i)=>[String(i+1)+'. **'+x.title+'** ('+x.category+')','   - '+x.url,'   - Inspeção: '+x.pageStatus+'; data: '+(x.lastInspectedAt||'não realizada'),'   - Decisão: '+x.editorialStatus,''])].join('\n');
fs.writeFileSync('intake/historical-editorial-batch.md',md+'\n');
console.log(JSON.stringify(counts));
