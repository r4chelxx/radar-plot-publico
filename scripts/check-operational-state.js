#!/usr/bin/env node
// Read-only verification of public daily discovery and editorial state.
const fs=require('node:fs');
const assert=require('node:assert/strict');
const {identity}=require('./lead-identity');
const terminal=new Set(['published','rejected','duplicate','archived']);
function audit(queueData,historyData,decisionsData){
 const candidates=queueData.candidates||[];
 const leads=historyData.leads||{};
 const decisions=decisionsData.decisions||[];
 assert(Array.isArray(candidates),'Editorial queue must be an array');
 assert(leads&&!Array.isArray(leads),'Historical leads must be a dictionary');
 const decisionById=new Map();
 for(const d of decisions){
  if(d.url&&d.status)decisionById.set(identity(d.url).id,d.status);
 }
 const seen=new Set(),errors=[],statuses={},providers={};
 for(const item of candidates){
  if(!item.id||!item.url){errors.push('Queue item missing id or URL');continue}
  if(seen.has(item.id))errors.push('Duplicate queue ID '+item.id);
  seen.add(item.id);
  let canonicalId;
  try{canonicalId=identity(item.url).id}catch(e){errors.push('Unsafe queue URL '+item.id);continue}
  if(item.id!==canonicalId)errors.push('Noncanonical queue ID '+item.id);
  const history=leads[item.id];
  if(!history){errors.push('Missing historical lead '+item.id);continue}
  const decision=decisionById.get(item.id);
  const expected=terminal.has(history.editorialStatus)?history.editorialStatus:terminal.has(decision)?decision:null;
  if(expected&&item.status!==expected)errors.push('Resolved item incorrectly queued '+item.id+' '+item.status+' vs '+expected);
  if(item.status==='published'&&history.editorialStatus!=='published'&&decision!=='published')errors.push('Unsubstantiated publication '+item.id);
  statuses[item.status]=(statuses[item.status]||0)+1;
  for(const p of item.providers||[])providers[p]=(providers[p]||0)+1;
 }
 return {ok:errors.length===0,errors,checkedAt:new Date().toISOString(),historyCount:Object.keys(leads).length,queueCount:candidates.length,statuses,providers,decisionCount:decisions.length};
}
module.exports={audit};
if(require.main===module){
 try{
  const read=file=>JSON.parse(fs.readFileSync(file,'utf8'));
  const result=audit(read(process.argv[2]||'intake/editorial-queue.json'),read(process.argv[3]||'state/lead-history.json'),read(process.argv[4]||'intake/historical-decisions.json'));
  console.log(JSON.stringify(result,null,2));
  if(!result.ok)process.exitCode=1;
 }catch(e){console.error(e.stack||e.message);process.exitCode=1}
}
