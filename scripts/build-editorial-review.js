// Editorial review queue derived from evidence. Never marks a candidate verified.
const fs=require('node:fs'),crypto=require('node:crypto');
const {identity}=require('./lead-identity');
const triage=JSON.parse(fs.readFileSync('intake/candidate-triage.json','utf8'));
const evidence=JSON.parse(fs.readFileSync('intake/lead-evidence.json','utf8'));
const byUrl=new Map((evidence.results||[]).flatMap(x=>{try{return [[identity(x.url).id,x]]}catch{return []}}));
const historyPath='intake/lead-history-previous.json';
const historical=fs.existsSync(historyPath)?Object.values(JSON.parse(fs.readFileSync(historyPath,'utf8')).leads||{}):[];
const seen=new Set();
const candidates=[...historical,...(triage.leads||[])].filter(x=>x.classification==='needs-editorial-review'&&!['published','duplicate','rejected','archived'].includes(x.editorialStatus)).filter(x=>{
 if(typeof x.url!=='string'||!/^https?:\/\//i.test(x.url))return false;
 let key;
 try{key=identity(x.url).id}catch{return false}
 if(seen.has(key))return false;
 seen.add(key);
 return true;
}).map(x=>{
 const ev=byUrl.get(identity(x.url).id);
 const pageText=String(ev?.evidenceText||ev?.pageDescription||'').replace(/\s+/g,' ').trim();
 const structured=ev?.structuredEvidence||x.structuredEvidence||{};
 const structuredText=JSON.stringify(structured);
 const finalUrl=ev?.finalUrl||x.url;
 const primarySourceVerified=ev?.pageStatus==='html-fetched'&&Number(ev?.httpStatus)===200&&/^text\/html\b/i.test(ev?.contentType||'');
 const duplicateReviewed=!(x.possibleMatches||[]).length;
 const checks={primarySourceVerified,duplicateReviewed,editorialApproval:false};
 if(x.category==='opportunities'){
  const callSignal=/(grant|fellowship|funding|scholarship|award|prize|contest|competition|edital|bolsa|financiamento)/i.test([ev?.pageTitle||x.title,pageText,structuredText].join(' '))&&/(apply|application|submission|call for|inscri[cç][aã]o|candidatura|prazo)/i.test([pageText,structuredText].join(' '));
  Object.assign(checks,{deadlineVerified:Boolean(ev?.deadline&&String(ev.deadline)>=today),eligibilityVerified:Boolean(ev?.eligibility),callSignal});
 } else if(x.category==='datasets'){
  const producerVerified=Boolean(structured.publisher||structured.provider||structured.organization||structured.creator);
  const accessAndScopeVerified=Boolean((structured.distribution||structured.contentUrl||ev?.resourceLinks?.length)&&pageText.length>=40);
  Object.assign(checks,{producerVerified,accessAndScopeVerified,datasetSignal:/(dataset|data catalog|open data|database|base de dados|dados abertos|data portal)/i.test([ev?.pageTitle||x.title,pageText,structuredText].join(' ')),directResource:Boolean(structured.distribution||structured.contentUrl||ev?.resourceLinks?.length),format:/\b(csv|json|xml|parquet|zip|api|geojson)\b/i.test([pageText,structuredText].join(' ')),coverage:/\b(20\d{2}|annual|monthly|municipal|national|global|covering|cobre|abrange)\b/i.test([pageText,structuredText].join(' '))});
 } else if(x.category==='tools'){
  const functionalityVerified=pageText.length>=80&&/(tool|software|application|library|platform|programming language|data analysis|data visualization|visualiza[cç][aã]o|analy[sz]e|create|build|processing|framework|plugin)/i.test([ev?.pageTitle||x.title,pageText,structuredText].join(' '));
  const officialLinkVerified=(()=>{try{return new URL(finalUrl).hostname===new URL(x.url).hostname}catch{return false}})();
  Object.assign(checks,{functionalityVerified,officialLinkVerified,productSignal:/(software|tool|application|library|platform|programming language|framework)/i.test([ev?.pageTitle||x.title,pageText,structuredText].join(' ')),functionSignal:functionalityVerified,access:/\b(download|install|web app|browser|online|cloud|desktop|api|documentation|docs|github|cran|npm|python|free|open source|license|licen[cç]a)\b/i.test([pageText,structuredText].join(' '))});
 } else checks.categoryReviewed=false;
 const categoryReady=x.category==='opportunities'?(checks.deadlineVerified&&checks.eligibilityVerified&&checks.callSignal):x.category==='datasets'?(checks.producerVerified&&checks.accessAndScopeVerified&&checks.datasetSignal&&checks.directResource&&checks.format&&checks.coverage):x.category==='tools'?(checks.functionalityVerified&&checks.officialLinkVerified&&checks.productSignal&&checks.functionSignal&&checks.access):false;
 checks.editorialApproval=Boolean(primarySourceVerified&&duplicateReviewed&&categoryReady);
 const missing=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);
 const checkedAt=ev?.checkedAt||evidence.generatedAt;
 const proofEvidence=[ev?.pageTitle||x.title,ev?.pageDescription||'',ev?.evidenceText||'',structuredText].join(' ').replace(/\s+/g,' ').trim().slice(0,2400);
 const requiredChecks=x.category==='opportunities'?{callSignal:checks.callSignal,eligibility:checks.eligibilityVerified}:x.category==='datasets'?{datasetSignal:checks.datasetSignal,directResource:checks.directResource,format:checks.format,coverage:checks.coverage}:x.category==='tools'?{productSignal:checks.productSignal,function:checks.functionSignal,access:checks.access}:{};
 const publicationReviewV1=checks.editorialApproval&&proofEvidence.length>=25?{reviewedBy:'Radar evidence gate v1',reviewPolicyVersion:'radar-evidence-v1',decision:'approved',officialUrl:finalUrl,sourceStatus:Number(ev.httpStatus),contentType:ev.contentType,checkedAt,reviewedAt:String(checkedAt).slice(0,10),evidence:proofEvidence,evidenceHash:crypto.createHash('sha256').update(proofEvidence).digest('hex'),evidenceChecks:requiredChecks}:null;
 return {id:identity(x.url).id,category:x.category,source:x.source,title:x.title,url:x.url,finalUrl,pageStatus:ev?.pageStatus||x.pageStatus||'not-inspected',lastInspectedAt:ev?evidence.generatedAt:x.lastInspectedAt||null,editorialStatus:x.editorialStatus||'unverified',pageTitle:ev?.pageTitle||null,pageDescription:ev?.pageDescription||null,evidenceText:ev?.evidenceText||null,structuredEvidence:structured,deadline:ev?.deadline||x.deadline||null,eligibility:ev?.eligibility||x.eligibility||null,dateMentionsUnclassified:ev?.dateMentionsUnclassified||[],checks,missing,publicationReady:false,publicationReviewV1};
});
const counts={opportunities:0,datasets:0,tools:0,uncategorized:0};
for(const x of candidates)counts[x.category]=(counts[x.category]||0)+1;
const out={generatedAt:new Date().toISOString(),policy:'Manual verification required. No candidate automatically qualifies for publication.',counts,candidates};
fs.writeFileSync('intake/editorial-review.json',JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({candidates:candidates.length,counts}));
