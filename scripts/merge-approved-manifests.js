#!/usr/bin/env node
const fs=require('node:fs');
function mergeApprovedManifests(current,incoming){
 const merged={...current,approved:[...(current.approved||[])]};
 const byKey=new Map(merged.approved.map(x=>[(x.category||'')+':'+(x.record?.id||x.review?.officialUrl||''),x]));
 const byOfficial=new Map(merged.approved.filter(x=>x.review?.officialUrl).map(x=>[x.review.officialUrl,x]));
 for(const entry of incoming.approved||[]){
  const key=(entry.category||'')+':'+(entry.record?.id||entry.review?.officialUrl||'');
  const existing=byKey.get(key)||byOfficial.get(entry.review?.officialUrl);
  if(existing){
   if(JSON.stringify(existing)!==JSON.stringify(entry)){
    const facts=item=>{const record={...item.record};delete record.name;delete record.title;return {...item,record};};
    // An older snapshot must not undo a verified display-name correction.
    // Identity, source, evidence/hash and every other field must still match.
    if(JSON.stringify(facts(existing))!==JSON.stringify(facts(entry)))throw Error('Conflicting approved publication entry: '+key);
   }
   continue;
  }
  merged.approved.push(entry);byKey.set(key,entry);if(entry.review?.officialUrl)byOfficial.set(entry.review.officialUrl,entry);
 }
 return merged;
}
if(require.main===module){
 const current=JSON.parse(fs.readFileSync(process.argv[2]||'intake/approved-publications-current.json','utf8'));
 const incoming=JSON.parse(fs.readFileSync(process.argv[3]||'intake/approved-publications-next.json','utf8'));
 const output=process.argv[4]||'intake/approved-publications-merged.json';
 fs.writeFileSync(output,JSON.stringify(mergeApprovedManifests(current,incoming),null,2)+'\n');
 console.log(JSON.stringify({current:(current.approved||[]).length,incoming:(incoming.approved||[]).length,merged:JSON.parse(fs.readFileSync(output,'utf8')).approved.length}));
}
module.exports={mergeApprovedManifests};
