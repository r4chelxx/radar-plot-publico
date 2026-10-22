// Daily source discovery: records leads for editorial verification, never publishes unverified opportunities.
const fs = require('node:fs');
const crypto = require('node:crypto');
const {normalizeLink}=require('./normalize-lead-link');

const {sources:unique,registryCount,invalidOrDuplicate}=require('./load-source-catalog').loadSources();
// Inspect all daily sources every run; rotate a separate batch of other sources.
// SOURCE_LIMIT controls the rotating batch only, not the daily source count.
const limit = Math.max(1, Number(process.env.SOURCE_LIMIT || 15));
const daily = unique.filter(s=>s.cadence==='diária');
const rotating = unique.filter(s=>s.cadence!=='diária');
const batchCount = Math.max(1,Math.ceil(rotating.length / limit));
// Stable round-robin: changing the batch count must not skip source groups.
const batchIndex = Math.floor(Date.now()/86400000) % batchCount;
const selected = rotating.slice(batchIndex*limit, (batchIndex+1)*limit);
const selectedSources = [...new Map([...daily,...selected].map(s=>[s.url,s])).values()];
const dailyExpected = daily.length;
async function inspect(s) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),12000);
  try {
    const response = await fetch(s.url,{signal:controller.signal,headers:{'user-agent':'RadarPLOT-monitor/1.0'}});
    const body = (await response.text()).slice(0,100000);
    const title = (body.match(/<title[^>]*>([^<]{3,200})<\/title>/i)||[])[1] || '';
    const links=[...body.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)].slice(0,300).map(m=>{try{return {url:normalizeLink(m[1],response.url),label:m[2].replace(/<[^>]+>/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim().slice(0,160)}}catch{return null}}).filter(x=>x&&/^https?:/.test(x.url)&&x.label.length>=12);
    const leads=links.filter(x=>/grant|fellowship|bolsa|financiamento|funding|call for|chamada|edital|application|apply|dataset|dados abertos|open data|tool|ferramenta/i.test(x.label)).slice(0,25);
    return {name:s.name,url:s.url,leads,httpStatus:response.status,accessStatus:response.ok?'accessible':'http-error',extractionStatus:title?'html-title-only':'no-title',editorialStatus:'unverified',title:title.replace(/\s+/g,' ').trim(),fingerprint:crypto.createHash('sha256').update(body).digest('hex').slice(0,16),checkedAt:new Date().toISOString(),reviewRequired:true};
  } catch(error) {
    return {name:s.name,url:s.url,accessStatus:'failed',extractionStatus:'not-attempted',editorialStatus:'unverified',error:String(error),checkedAt:new Date().toISOString(),reviewRequired:true};
  } finally {clearTimeout(timer);}
}
(async()=>{
  const results=[];
  for (const s of selectedSources) results.push(await inspect(s));
  fs.mkdirSync('intake',{recursive:true});
  const accessSummary=results.reduce((summary,item)=>{summary[item.accessStatus]=(summary[item.accessStatus]||0)+1;return summary;},{});
  const dailyResults=results.filter(item=>daily.some(source=>source.url===item.url));
  const dailyFailures=dailyResults.filter(item=>item.accessStatus!=='accessible').map(item=>({name:item.name,url:item.url,status:item.accessStatus,httpStatus:item.httpStatus||null,error:item.error||null}));
  const leadsFound=results.reduce((total,item)=>total+(item.leads||[]).length,0);
  fs.writeFileSync('intake/source-review.json',JSON.stringify({note:'Leads only: no opportunities or deadlines verified. HTTP success does not imply successful content extraction.',coverage:{totalSources:unique.length,registryCount,invalidOrDuplicate,batchIndex:batchIndex+1,batchCount,checked:results.length,unreviewed:unique.length-results.length,dailySources:daily.map(s=>s.name),dailyExpected,dailySelected:dailyResults.length,dailyAccessible:dailyResults.filter(item=>item.accessStatus==='accessible').length,dailyFailures,accessSummary,leadsFound,rotatingBatchSize:selected.length,prioritySources:daily.map(s=>s.name),limitations:'LinkedIn, JavaScript-rendered and paginated content may be inaccessible; HTTP success does not imply complete coverage'},results},null,2)+'\n');
  console.log('Sources inspected:',results.length,'of',unique.length,'batch',batchIndex+1,'of',batchCount);\n  console.log('Coverage summary:',JSON.stringify({dailyExpected,dailySelected:dailyResults.length,dailyAccessible:dailyResults.filter(item=>item.accessStatus==='accessible').length,dailyFailures:dailyFailures.length,accessSummary,leadsFound}));
})().catch(e=>{console.error(e);process.exitCode=1});
