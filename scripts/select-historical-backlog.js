// Deterministic backlog rotation across historical public leads, not just today's discovery.
const {identity}=require('./lead-identity');
const TERMINAL=new Set(['published','duplicate','rejected']);
const isArchivedOpportunity=lead=>lead.editorialStatus==='archived'&&lead.archiveKind==='closed-opportunity';
function recheckDays(lead){
 if(isArchivedOpportunity(lead))return 30;
 if(lead.pageStatus==='http-error'&&Number(lead.httpStatus)===404)return 14;
 if(lead.pageStatus==='fetch-failed'||lead.pageStatus==='http-error')return 3;
 if(lead.category==='opportunities')return 7;
 return 21;
}
function selectBacklog(previous,current,limit=10,now=new Date()){
 const seen=new Map();
 for(const [id,lead] of Object.entries(previous?.leads||{})){
  if(lead.classification!=='needs-editorial-review'||TERMINAL.has(lead.editorialStatus)||(lead.editorialStatus==='archived'&&!isArchivedOpportunity(lead)))continue;
  seen.set(id,{...lead,id,origin:'historical'});
 }
 for(const lead of current||[]){
  if(lead.classification!=='needs-editorial-review')continue;
  let id;try{id=identity(lead.url).id}catch{continue}
  const historical=previous?.leads?.[id];
  if(historical&&(TERMINAL.has(historical.editorialStatus)||historical.editorialStatus==='archived'))continue;
  if(!seen.has(id))seen.set(id,{...lead,id,origin:'new'});
 }
 const indirect=x=>/^https:\/\/news\.google\.com\/rss\/articles\//i.test(x.url||'')?1:0;
 const nowMs=now.getTime();
 const all=[...seen.values()];
 // First visit every historical lead; retries and recurring checks follow afterwards.
 const inspectedAnchor=x=>{
  if(!isArchivedOpportunity(x))return x.lastInspectedAt;
  const timestamps=[x.reviewedAt,x.lastInspectedAt].map(v=>Date.parse(v||'')).filter(Number.isFinite);
  return timestamps.length?new Date(Math.max(...timestamps)).toISOString():null;
 };
 const ready=all.filter(x=>{const at=inspectedAnchor(x);return !at||(Number.isFinite(Date.parse(at))&&nowMs-Date.parse(at)>=recheckDays(x)*86400000)});
 ready.sort((a,b)=>Number(isArchivedOpportunity(a))-Number(isArchivedOpportunity(b))||Number(Boolean(a.lastInspectedAt))-Number(Boolean(b.lastInspectedAt))||
  indirect(a)-indirect(b)||
  Number(a.origin!=='historical')-Number(b.origin!=='historical')||
  String(a.lastInspectedAt||a.firstSeen||'').localeCompare(String(b.lastInspectedAt||b.firstSeen||''))||
  String(a.id).localeCompare(String(b.id)));
 return {selected:ready.slice(0,Math.min(Math.max(1,limit),50)),total:all.length,ready:ready.length,waiting:all.length-ready.length};
}
module.exports={selectBacklog,recheckDays};
