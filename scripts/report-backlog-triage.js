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
function report(queue){
 const pending=(queue.candidates||[]).filter(x=>x.status==='pending');
 const items=pending.filter(x=>!['opportunities','tools','datasets'].includes(x.category)).map(x=>({id:x.id,title:x.title,url:x.url,priority:x.reviewPriority||'normal',...suggest(x)}));
 const counts=items.reduce((a,x)=>(a[x.category||x.confidence]=(a[x.category||x.confidence]||0)+1,a),{});
 return {pending:pending.length,uncategorized:items.length,counts,suggestions:items.sort((a,b)=>(a.priority==='high'?0:1)-(b.priority==='high'?0:1)||a.title.localeCompare(b.title))};
}
module.exports={suggest,report};
if(require.main===module){
 const data=JSON.parse(fs.readFileSync(process.argv[2]||'intake/editorial-queue.json','utf8'));
 process.stdout.write(JSON.stringify(report(data),null,2)+'\n');
}
