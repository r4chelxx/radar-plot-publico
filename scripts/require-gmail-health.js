#!/usr/bin/env node
// Fail scheduled/manual intake when the required read-only Gmail source is unavailable.
const fs=require('node:fs');
function assertGmailAvailable(report){
 const item=report?.health?.[0];
 if(item?.status!=='ok'){
  const reason=String(item?.reason||item?.status||'missing health report').replace(/[\r\n]/g,' ').slice(0,180);
  throw new Error('Required Gmail source unavailable: '+reason);
 }
 return {source:item.source||'Gmail Radar PLOT',scanned:Number(item.scanned)||0,items:Number(item.items)||0,coverageStatus:item.coverageStatus||'unknown'};
}
if(require.main===module){
 const report=JSON.parse(fs.readFileSync(process.argv[2]||'intake/gmail-health.json','utf8'));
 const result=assertGmailAvailable(report);
 console.log(JSON.stringify(result));
}
module.exports={assertGmailAvailable};
