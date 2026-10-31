#!/usr/bin/env node
// Read-only editorial triage suggestions; never changes queue status or publication.
const fs=require('node:fs');
function suggest(item){
 const url=String(item.url||'').toLowerCase(),title=String(item.title||'').toLowerCase();
 const text=title+' '+url;
 const patterns=[
  ['opportunities',/\b(grant|grants|fellowship|scholarship|funding|reporting.fund|journalism.prize|journalism.award)\b|\/fundings?\//],
  ['tools',/\b(tool|software|visualization|mapping|chart|editor|scraping|python|javascript|gis)\b|mapbox\.com|figma\.com/],
  ['datasets',/\b(dataset|datasets|open.data|data.portal|statistics|data.catalog)\b/]
 ];
 // An award or competition is not necessarily a journalism funding opportunity.
 if(/\b(award|awards|competition|contest|conference)\b/.test(text)&&! /\b(grant|fellowship|funding|scholarship)\b/.test(text))return {category:null,confidence:'manual-review-event-or-award'};
 const matches=patterns.filter(([,p])=>p.test(text)).map(([c])=>c);
 return matches.length===1?{category:matches[0],confidence:'heuristic-review-required'}:{category:null,confidence:matches.length?'ambiguous':'insufficient-evidence'};
}
function isIndirectSource(item){return /^https:\/\/news\.google\.com\/rss\/articles\//i.test(String(item.url||''));}
function reviewRank(item){
 const priority=item.priority==='high'?0:1;
 const category=item.category==='opportunities'?0:item.category==='tools'?1:item.category==='datasets'?2:3;
 const evidence=item.inspectionStatus==='html-fetched'?0:1;
 const certainty=item.historyConflict?2:item.category?0:1;
 return [priority,certainty,Number(isIndirectSource(item)),evidence,category];
}
function compareReview(a,b){
 const x=reviewRank(a),y=reviewRank(b);
 for(let i=0;i<x.length;i++)if(x[i]!==y[i])return x[i]-y[i];
 return String(a.title||'').localeCompare(String(b.title||''));
}
function selectDailyReview(items,limit=24){
 const pool=items.filter(x=>x.priority==='high'&&x.category&&!x.historyConflict&&!x.indirectSource);
 const groups=['opportunities','tools','datasets'];
 const selected=[],seen=new Set();
 // Reserve category coverage before filling remaining slots in review order.
 for(const category of groups)for(const item of pool.filter(x=>x.category===category).slice(0,4)){
  if(selected.length>=limit)break;
  if(!seen.has(item.id)){selected.push(item);seen.add(item.id);}
 }
 for(const item of pool){if(selected.length>=limit)break;if(!seen.has(item.id)){selected.push(item);seen.add(item.id);}}
 return selected;
}
function selectInspectedReview(items,limit=24){
 return selectDailyReview(items.filter(x=>x.inspectionStatus==='html-fetched'),limit);
}
function ageBuckets(candidates,now=new Date()){
 const today=Date.parse(now);
 const buckets={over7Days:0,over14Days:0,over30Days:0,missingFirstSeen:0};
 for(const item of candidates){
  const seen=Date.parse(item.firstSeen||'');
  if(!Number.isFinite(seen)){buckets.missingFirstSeen++;continue;}
  const days=(today-seen)/86400000;
  if(days>7)buckets.over7Days++;
  if(days>14)buckets.over14Days++;
  if(days>30)buckets.over30Days++;
 }
 return buckets;
}
function compareQueues(current,previous){
 if(!previous||!Array.isArray(previous.candidates))return null;
 const old=new Map(previous.candidates.map(x=>[x.id,x.status]));
 const now=new Map((current.candidates||[]).map(x=>[x.id,x.status]));
 const wasPending=new Set([...old].filter(([,s])=>s==='pending').map(([id])=>id));
 const isPending=new Set([...now].filter(([,s])=>s==='pending').map(([id])=>id));
 const resolved=[...wasPending].filter(id=>now.has(id)&&!isPending.has(id));
 return {previousPending:wasPending.size,currentPending:isPending.size,netChange:isPending.size-wasPending.size,newPending:[...isPending].filter(id=>!old.has(id)).length,reopened:[...isPending].filter(id=>old.has(id)&&!wasPending.has(id)).length,resolved:resolved.length,removedFromQueue:[...wasPending].filter(id=>!now.has(id)).length};
}
function report(queue,historyData={},previousQueue=null){
 const history=historyData.leads||{};
 const pending=(queue.candidates||[]).filter(x=>x.status==='pending');
 const uncategorized=pending.filter(x=>!['opportunities','tools','datasets'].includes(x.category));
 const items=pending.map(x=>{
  const lead=history[x.id]||{};
  const proposal=['opportunities','tools','datasets'].includes(x.category)?{category:x.category,confidence:'existing-category-review-required'}:suggest(x);
  const historyCategory=['opportunities','tools','datasets'].includes(lead.category)?lead.category:null;
  const historyConflict=Boolean(historyCategory&&proposal.category&&historyCategory!==proposal.category);
  return {id:x.id,title:x.title,url:x.url,priority:x.reviewPriority||'normal',...proposal,historyCategory,historyConflict,historySource:lead.source||null,inspectionStatus:lead.pageStatus||null,lastInspectedAt:lead.lastInspectedAt||null,indirectSource:isIndirectSource(x),requiresSourceReview:historyConflict||!proposal.category||isIndirectSource(x)};
 });
 const counts=items.filter(x=>x.confidence!=='existing-category-review-required').reduce((a,x)=>(a[x.category||x.confidence]=(a[x.category||x.confidence]||0)+1,a),{});
 return {pending:pending.length,uncategorized:uncategorized.length,backlogAge:ageBuckets(pending),backlogChange:compareQueues(queue,previousQueue),counts,historyCoverage:{categorized:items.filter(x=>x.historyCategory).length,inspectedHtml:items.filter(x=>x.inspectionStatus==='html-fetched').length,conflicts:items.filter(x=>x.historyConflict).length},reviewOrderPolicy:'priority > unambiguous suggestion > direct primary link > inspected HTML > opportunity/tool/dataset > title; indirect links require source resolution',indirectPending:items.filter(x=>x.indirectSource).length,reviewReady:{highPriority:items.filter(x=>x.priority==='high'&&x.category&&!x.historyConflict&&!x.indirectSource).length,highPriorityWithHtml:items.filter(x=>x.priority==='high'&&x.category&&!x.historyConflict&&!x.indirectSource&&x.inspectionStatus==='html-fetched').length},dailyReview:selectDailyReview(items.slice().sort(compareReview)),inspectedReview:selectInspectedReview(items.slice().sort(compareReview),24),suggestions:items.filter(x=>x.confidence!=='existing-category-review-required').sort(compareReview)};
}
module.exports={suggest,report};
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(process.argv[2]||'intake/editorial-queue.json','utf8'));
 const history=process.argv[3]&&fs.existsSync(process.argv[3])?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):{};
 const previous=process.argv[4]&&fs.existsSync(process.argv[4])?JSON.parse(fs.readFileSync(process.argv[4],'utf8')):null;
 process.stdout.write(JSON.stringify(report(data,history,previous),null,2)+'\n');
}
