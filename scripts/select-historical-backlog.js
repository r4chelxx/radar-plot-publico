// Deterministic backlog rotation across historical public leads, not just today's discovery.
const {identity}=require('./lead-identity');
const TERMINAL=new Set(['published','duplicate','rejected','archived']);
function selectBacklog(previous,current,limit=10,now=new Date()){
 const seen=new Map();
 for(const [id,lead] of Object.entries(previous?.leads||{})){
  if(lead.classification!=='needs-editorial-review'||TERMINAL.has(lead.editorialStatus))continue;
  seen.set(id,{...lead,id,origin:'historical'});
 }
 for(const lead of current||[]){
  if(lead.classification!=='needs-editorial-review')continue;
  let id;try{id=identity(lead.url).id}catch{continue}
  if(!seen.has(id))seen.set(id,{...lead,id,origin:'new'});
 }
 const nowMs=now.getTime();
 const all=[...seen.values()];
 // First visit every historical lead; retries and recurring checks follow afterwards.
 const ready=all.filter(x=>!x.lastInspectedAt||Number.isFinite(Date.parse(x.lastInspectedAt))&&nowMs-Date.parse(x.lastInspectedAt)>=((x.pageStatus==='fetch-failed'||x.pageStatus==='http-error')?7:30)*86400000);
 ready.sort((a,b)=>Number(Boolean(a.lastInspectedAt))-Number(Boolean(b.lastInspectedAt))||
  String(a.lastInspectedAt||a.firstSeen||'').localeCompare(String(b.lastInspectedAt||b.firstSeen||''))||
  String(a.id).localeCompare(String(b.id)));
 return {selected:ready.slice(0,Math.min(Math.max(1,limit),50)),total:all.length,ready:ready.length,waiting:all.length-ready.length};
}
module.exports={selectBacklog};
