// Order evidence gathering by public link history, not by source position.
const {identity}=require('./lead-identity');
function orderForInspection(leads,previous){
 const hasHistory=Boolean(previous&&previous.schemaVersion===1&&previous.leads&&!Array.isArray(previous.leads));
 const scored=leads.map((lead,index)=>{
  let id=null;try{id=identity(lead.url).id}catch{}
  const old=id&&hasHistory?previous.leads[id]:null;
  const changed=old&&(old.title!==lead.title||old.category!==lead.category||old.classification!==lead.classification);
  const status=!hasHistory?'uninitialized':!old?'new':changed?'changed':'returning';
  const priority={changed:0,new:1,returning:2,uninitialized:3}[status];
  return {lead,index,status,priority};
 });
 scored.sort((a,b)=>a.priority-b.priority||a.index-b.index);
 return scored;
}
module.exports={orderForInspection};
