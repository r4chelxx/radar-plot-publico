// Daily source discovery: records leads for editorial verification, never publishes unverified opportunities.
const fs = require('node:fs');
const crypto = require('node:crypto');
const {normalizeLink}=require('./normalize-lead-link');
const {extractStructuredMetadata,metadataForLink}=require('./structured-lead-metadata');
const {extractLinks,selectExpansionLinks,relevant}=require('./source-page-links');

const {sources:unique,registryCount,invalidOrDuplicate}=require('./load-source-catalog').loadSources();
const {selectSourceSweep}=require('./select-source-sweep');
const {limit,daily,rotating,selected,selectedSources,batchCount,batchIndex}=selectSourceSweep(unique,{limit:process.env.SOURCE_LIMIT});
const dailyExpected=daily.length;
const concurrency=Math.max(1,Math.min(12,Number(process.env.SOURCE_CONCURRENCY||8)));
async function inspect(s) {
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(),12000);
  try {
    const response = await fetch(s.url,{signal:controller.signal,headers:{'user-agent':'RadarPLOT-monitor/1.0'}});
    const body = (await response.text()).slice(0,100000);
    const title = (body.match(/<title[^>]*>([^<]{3,200})<\/title>/i)||[])[1] || '';
    const firstLinks=extractLinks(body,response.url);
    const expansionLimit=Math.min(3,Math.max(0,Number(process.env.SOURCE_EXPANSION_LIMIT||2)));
    const expansionUrls=selectExpansionLinks(firstLinks,response.url,expansionLimit);
    const pages=[{url:response.url,body}];
    for(const pageUrl of expansionUrls){
      try{
        const page=await fetch(pageUrl,{signal:controller.signal,headers:{'user-agent':'RadarPLOT-monitor/1.0'}});
        if(page.ok && /text\/(html|xhtml\+xml)/i.test(page.headers.get('content-type')||''))pages.push({url:page.url||pageUrl,body:(await page.text()).slice(0,100000)});
      }catch{}
    }
    const allLinks=pages.flatMap(page=>extractLinks(page.body,page.url));
    const structuredMetadata=pages.flatMap(page=>extractStructuredMetadata(page.body,page.url));
    const links=allLinks.map(x=>{try{return {...x,url:normalizeLink(x.url,response.url)}}catch{return null}}).filter(x=>x&&/^https?:/.test(x.url)&&x.label.length>=12);
    const leads=(response.ok?links:[]).filter(x=>relevant(x.label)).slice(0,100).map(x=>({...x,structuredEvidence:metadataForLink(structuredMetadata,x.url)}));
    return {name:s.name,url:s.url,leads,httpStatus:response.status,accessStatus:response.ok?'accessible':'http-error',extractionStatus:!response.ok?'http-error-page':title?'html-title-only':'no-title',editorialStatus:'unverified',title:title.replace(/\s+/g,' ').trim(),fingerprint:crypto.createHash('sha256').update(body).digest('hex').slice(0,16),checkedAt:new Date().toISOString(),reviewRequired:true};
  } catch(error) {
    return {name:s.name,url:s.url,accessStatus:'failed',extractionStatus:'not-attempted',editorialStatus:'unverified',error:String(error),networkCode:error.cause&&error.cause.code||null,checkedAt:new Date().toISOString(),reviewRequired:true};
  } finally {clearTimeout(timer);}
}
(async()=>{
  const results=[];
  for(let i=0;i<selectedSources.length;i+=concurrency){
    results.push(...await Promise.all(selectedSources.slice(i,i+concurrency).map(inspect)));
  }
  fs.mkdirSync('intake',{recursive:true});
  const accessSummary=results.reduce((summary,item)=>{summary[item.accessStatus]=(summary[item.accessStatus]||0)+1;return summary;},{});
  const dailyResults=results.filter(item=>daily.some(source=>source.url===item.url));
  const dailyFailures=dailyResults.filter(item=>item.accessStatus!=='accessible').map(item=>({name:item.name,url:item.url,status:item.accessStatus,httpStatus:item.httpStatus||null,error:item.error||null,networkCode:item.networkCode||null}));
  const blockedSources=results.filter(item=>item.httpStatus===403||item.httpStatus===429).map(item=>({name:item.name,url:item.url,httpStatus:item.httpStatus,followUp:'manual-or-official-feed-review',editorialStatus:'unverified'}));
  const httpFailures=results.filter(item=>item.accessStatus==='http-error').map(item=>({name:item.name,url:item.url,httpStatus:item.httpStatus,followUp:item.httpStatus===403||item.httpStatus===429?'manual-or-official-feed-review':'retry-and-review',editorialStatus:'unverified'}));
  const networkFailures=results.filter(item=>item.accessStatus==='failed').map(item=>({name:item.name,url:item.url,error:item.error||null,networkCode:item.networkCode||null,followUp:'retry-and-review',editorialStatus:'unverified'}));
  const coverageGaps=results.filter(item=>item.accessStatus!=='accessible'||!item.leads?.length).map(item=>({name:item.name,url:item.url,accessStatus:item.accessStatus,extractionStatus:item.extractionStatus,reason:item.accessStatus!=='accessible'?'blocked-or-network-failure':'no-relevant-static-links',coverageStatus:'partial',lastCheckedAt:item.checkedAt,followUp:'verify-official-sources-or-authorized-manual-import'}));
  const leadsFound=results.reduce((total,item)=>total+(item.leads||[]).length,0);
  fs.writeFileSync('intake/source-review.json',JSON.stringify({note:'Leads only: no opportunities or deadlines verified. HTTP success does not imply successful content extraction.',coverage:{totalSources:unique.length,registryCount,invalidOrDuplicate,batchIndex:batchIndex+1,batchCount,checked:results.length,unreviewed:unique.length-results.length,sourceSweepComplete:results.length===unique.length,scanMode:limit>=rotating.length?'full-catalog':'diagnostic-rotation',rotatingSourcesTotal:rotating.length,rotatingSelected:selected.length,dailySources:daily.map(s=>s.name),dailyExpected,dailySelected:dailyResults.length,dailyAccessible:dailyResults.filter(item=>item.accessStatus==='accessible').length,dailyFailures,blockedSources,httpFailures,networkFailures,coverageGaps,accessSummary,leadsFound,rotatingBatchSize:selected.length,prioritySources:daily.map(s=>s.name),limitations:'LinkedIn, JavaScript-rendered and paginated content may be inaccessible; HTTP success does not imply complete coverage'},results},null,2)+'\n');
  console.log('Sources inspected:',results.length,'of',unique.length,'batch',batchIndex+1,'of',batchCount);
  console.log('Coverage summary:',JSON.stringify({dailyExpected,dailySelected:dailyResults.length,dailyAccessible:dailyResults.filter(item=>item.accessStatus==='accessible').length,dailyFailures:dailyFailures.length,blockedSources:blockedSources.length,httpFailures:httpFailures.length,accessSummary,leadsFound}));
})().catch(e=>{console.error(e);process.exitCode=1});
