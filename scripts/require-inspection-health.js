#!/usr/bin/env node
// Fail closed when a non-empty public backlog receives no technical inspection.
const fs=require('node:fs');
function assertInspectionCoverage(report){
 const inspected=Number(report?.inspected)||0;
 const candidates=Number(report?.eligibleCandidates)||0;
 const status=String(report?.inspectionHealth?.status||'unknown');
 if(candidates>0&&inspected===0)throw Error('Inspection coverage unavailable: '+candidates+' candidates were ready but none were inspected.');
 return {status,inspected,candidates,htmlFetched:Number(report?.inspectionHealth?.htmlFetched)||0};
}
if(require.main===module){
 const report=JSON.parse(fs.readFileSync(process.argv[2]||'intake/lead-evidence.json','utf8'));
 console.log(JSON.stringify(assertInspectionCoverage(report)));
}
module.exports={assertInspectionCoverage};
