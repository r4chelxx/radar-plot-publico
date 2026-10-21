// Editorial review queue derived from evidence. Never marks a candidate verified.
const fs=require('node:fs');
const {identity}=require('./lead-identity');
const triage=JSON.parse(fs.readFileSync('intake/candidate-triage.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('intake/lead-evidence.json','utf8'));
const byUrl=new Map((evidence.results||[]).flatMap(x=>{try{return [[identity(x.url).id,x]]}catch{return []}}));
const seen=new Set();
const candidates=(triage.leads||[]).filter(x=>x.classification==='needs-editorial-review').filter(x=>{
 if(typeof x.url!=='string'||!/^https?:\/\//i.test(x.url))return false;
 let key;
 try{key=identity(x.url).id}catch{return false}
 if(seen.has(key))return false;
 seen.add(key);
 return true;
}).map(x=>{
 const ev=byUrl.get(identity(x.url).id);
 const checks={
  primarySourceVerified:false,
  duplicateReviewed:false,
  editorialApproval:false
 };
 if(x.category==='opportunities')Object.assign(checks,{deadlineVerified:false,eligibilityVerified:false});
 if(x.category==='datasets')Object.assign(checks,{producerVerified:false,accessAndScopeVerified:false});
 if(x.category==='tools')Object.assign(checks,{functionalityVerified:false,officialLinkVerified:false});
 if(x.category==='uncategorized')checks.categoryReviewed=false;
 const missing=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
 return {id:identity(x.url).id,category:x.category,source:x.source,title:x.title,url:x.url,pageStatus:ev?.pageStatus||'not-inspected',pageTitle:ev?.pageTitle||null,dateMentionsUnclassified:ev?.dateMentionsUnclassified||[],checks,missing,publicationReady:false};
});
const counts={opportunities:0,datasets:0,tools:0,uncategorized:0};
for(const x of candidates)counts[x.category]=(counts[x.category]||0)+1;
const out={generatedAt:new Date().toISOString(),policy:'Manual verification required. No candidate automatically qualifies for publication.',counts,candidates};
fs.writeFileSync('intake/editorial-review.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({candidates:candidates.length,counts}));
