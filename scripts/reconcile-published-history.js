#!/usr/bin/env node
'use strict';
// Reconcile observed publication state from the exact official URLs present in live catalogs.
// This records a public fact; it does not approve a record or claim editorial review.
const fs=require('node:fs');
const vm=require('node:vm');
const {identity}=require('./lead-identity');
const catalogKeys={opportunities:['rules','apply'],datasets:['url','api','docs'],tools:['url']};
const protectedDecisions=new Set(['rejected','duplicate','archived']);
function reconcileHistory(history,catalogs,observedAt=new Date().toISOString()){
 const leads={...(history.leads||{})};
 const published=new Map();
 for(const [category,records] of Object.entries(catalogs)){
  for(const record of records||[]){
   for(const field of catalogKeys[category]||[]){
    const raw=record[field];if(!raw)continue;
    try{const key=identity(raw).id;if(!published.has(key))published.set(key,{category,recordId:String(record.id||''),url:identity(raw).url})}catch{}
   }
  }
 }
 const summary={observedAt,catalogLinks:published.size,markedPublished:0,proofRefreshed:0,conflicts:[]};
 for(const [id,lead] of Object.entries(leads)){
  let key;try{key=identity(lead.url).id}catch{continue}
  const match=published.get(key);if(!match)continue;
  if(protectedDecisions.has(lead.editorialStatus)){
   summary.conflicts.push({id,status:lead.editorialStatus,catalogCategory:match.category,recordId:match.recordId});
   continue;
  }
  const changed=lead.editorialStatus!=='published';
  const proof={type:'observed-live-catalog-membership',category:match.category,recordId:match.recordId,officialUrl:match.url,observedAt};
  const hadProof=lead.publicationVerification?.type==='observed-live-catalog-membership';
  leads[id]={...lead,editorialStatus:'published',publicationVerification:proof};
  if(changed)summary.markedPublished++;
  if(!hadProof)summary.proofRefreshed++;
 }
 return {history:{...history,updatedAt:observedAt,leads},summary};
}
function readCatalogs(dir='data'){
 const context={window:{RADAR_PARTS:{}}};vm.createContext(context);
 for(const file of ['opportunities.js','datasets.js','tools.js'])vm.runInContext(fs.readFileSync(require('node:path').join(dir,file),'utf8'),context);
 return context.window.RADAR_PARTS;
}
if(require.main===module){
 const input=process.argv[2]||'intake/lead-history-next.json';
 const report=process.argv[3]||'intake/publication-history-reconciliation.json';
 const result=reconcileHistory(JSON.parse(fs.readFileSync(input,'utf8')),readCatalogs());
 fs.writeFileSync(input,JSON.stringify(result.history,null,2)+'\n');
 fs.writeFileSync(report,JSON.stringify(result.summary,null,2)+'\n');
 fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY||'/dev/null',['### Reconciliação com catálogos públicos',...['markedPublished','proofRefreshed','conflicts'].map(k=>'- '+k+': '+(Array.isArray(result.summary[k])?result.summary[k].length:result.summary[k]))].join('\n')+'\n');
 console.log(JSON.stringify(result.summary));
}
module.exports={reconcileHistory,readCatalogs};
