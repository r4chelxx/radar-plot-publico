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
function selectBacklog(previous,current,limit=10,now=new Date(),options={}){
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
 const categoryRank=x=>({opportunities:0,datasets:1,tools:2,uncategorized:3}[x.category]??4);
 const accessibilityRank=x=>['http-error','fetch-failed','non-html','blocked-url'].includes(x.pageStatus)?1:0;
 const nowMs=now.getTime();
 const all=[...seen.values()];
 // Keep the technical inspection budget focused on publishable categories.
 // Uncategorized/navigation pages remain in history but must not displace
 // opportunities, datasets, or tools from the rotating evidence batch.

 function isNoiseCandidate(x){
  const title=String(x.title||'').trim();
  const url=String(x.url||'');
  if(x.category==='tools'&&(/^(?:skip to main content|related changes|what links here|visit tool|all tools|li(?:n|nked)i)/i.test(title)||/linkedin\.com\/(?:company|in)\//i.test(url)||/mediawiki\.org\/wiki\/(?:Special:|Moderator_Tools|Toolserver:)/i.test(url)||/wikidata\.org\/wiki\/Wikidata:Tools\//i.test(url)||/(?:\/(?:courses?|tv|news|articles?|blog|events?)(?:\/|$)|#content$)/i.test(url)))return true;
  if(x.category==='datasets'&&(/^(?:skip to main content|related changes|what links here|dados abertos|datasets?\s*\(\d[\d,.]*\)|research group|in[ií]cio|home|data sources|data dictionary|our bulk data distributions)$/i.test(title)||/mediawiki\.org\/wiki\/Special:/i.test(url)||/opensanctions\.org\/datasets\/sources\/?|opensanctions\.org\/reference\/?/i.test(url)||/#content$/i.test(url)))return true;
  return false;
 }
 const actionable=all.filter(x=>['opportunities','datasets','tools'].includes(x.category)&&!isNoiseCandidate(x));
// First visit every historical lead; retries and recurring checks follow afterwards.
 const inspectedAnchor=x=>{
  if(!isArchivedOpportunity(x))return x.lastInspectedAt;
  const timestamps=[x.reviewedAt,x.lastInspectedAt].map(v=>Date.parse(v||'')).filter(Number.isFinite);
  return timestamps.length?new Date(Math.max(...timestamps)).toISOString():null;
 };
 const ready=actionable.filter(x=>{const at=inspectedAnchor(x);return !at||(Number.isFinite(Date.parse(at))&&nowMs-Date.parse(at)>=recheckDays(x)*86400000)});
 ready.sort((a,b)=>Number(isArchivedOpportunity(a))-Number(isArchivedOpportunity(b))||
  categoryRank(a)-categoryRank(b)||
  accessibilityRank(a)-accessibilityRank(b)||
  Number(Boolean(a.lastInspectedAt))-Number(Boolean(b.lastInspectedAt))||
  indirect(a)-indirect(b)||
  Number(a.origin==='historical')-Number(b.origin==='historical')||
  String(a.lastInspectedAt||a.firstSeen||'').localeCompare(String(b.lastInspectedAt||b.firstSeen||''))||
  String(a.id).localeCompare(String(b.id)));
 const cap=Math.min(Math.max(1,limit),480);
 const balancedTake=(items,n)=>{
  const categories=['opportunities','datasets','tools'];
  const selected=[],used=new Set();
  const base=Math.floor(n/categories.length),remainder=n%categories.length;
  categories.forEach((category,index)=>{
   const quota=base+(index<remainder?1:0);
   for(const item of items){
    if(selected.length>=n||used.has(item.id)||item.category!==category)continue;
    selected.push(item);used.add(item.id);
    if(selected.filter(x=>x.category===category).length>=quota)break;
   }
  });
  for(const item of items){if(selected.length>=n)break;if(!used.has(item.id)){selected.push(item);used.add(item.id)}}
  return selected;
 };
 const selectedReady=balancedTake(ready,cap);
 if(!options.rotate) return {selected:selectedReady,total:all.length,ready:ready.length,waiting:all.length-ready.length,rotation:0};
 // Keep the inspection pipeline productive even while all remaining leads are
 // inside their recheck window: fill unused capacity with the oldest historical
 // candidates. This is evidence refresh only; it never bypasses approval gates.
 const selectedIds=new Set(selectedReady.map(x=>x.id));
 const rotation=actionable.filter(x=>!selectedIds.has(x.id)).sort((a,b)=>
  Number(isArchivedOpportunity(a))-Number(isArchivedOpportunity(b))||
  categoryRank(a)-categoryRank(b)||
  Number(Boolean(a.lastInspectedAt))-Number(Boolean(b.lastInspectedAt))||
  indirect(a)-indirect(b)||
  String(a.lastInspectedAt||a.firstSeen||'').localeCompare(String(b.lastInspectedAt||b.firstSeen||''))||
  String(a.id).localeCompare(String(b.id)));
 const selected=selectedReady.concat(balancedTake(rotation,Math.max(0,cap-selectedReady.length)));
 return {selected,total:all.length,ready:ready.length,waiting:all.length-ready.length,rotation:Math.max(0,selected.length-selectedReady.length)};
}
module.exports={selectBacklog,recheckDays};
