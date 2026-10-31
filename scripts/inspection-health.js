// Report partial outages, not only the complete absence of HTML.
function inspectionHealth(statusCounts={},inspected=0){
 const htmlFetched=statusCounts['html-fetched']||0;
 const failures=Math.max(0,inspected-htmlFetched);
 const successRate=inspected?Number((htmlFetched/inspected).toFixed(3)):null;
 const degraded=inspected>0&&(htmlFetched===0||(inspected>=10&&successRate<0.5));
 const status=!inspected?'no-inspections':htmlFetched===0?'unavailable':degraded?'degraded':'healthy';
 return {htmlFetched,failures,successRate,degraded,status};
}
module.exports={inspectionHealth};
