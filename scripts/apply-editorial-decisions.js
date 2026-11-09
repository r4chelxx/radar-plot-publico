// Apply explicit editorial decisions to historical lead state; page inspection never approves a record.
const fs=require('node:fs'),vm=require('node:vm');
const {identity}=require('./lead-identity');
const input=JSON.parse(fs.readFileSync('intake/lead-history-next.json','utf8'));
const decisionsPath=process.env.RADAR_DECISIONS||'intake/historical-decisions.json';
const decisions=JSON.parse(fs.readFileSync(decisionsPath,'utf8'));
const approvedManifest=JSON.parse(fs.readFileSync('intake/approved-publications.json','utf8'));
const approved=approvedManifest.approved||[];
const nextManifest={...approvedManifest,approved:[...approved]};
if(!Array.isArray(decisions.decisions))throw Error('Expected decisions[]');
const allowed=new Set(['in-review','approved','published','duplicate','rejected','archived','blocked']);
const urls=new Set();
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const file of ['data/opportunities.js','data/datasets.js','data/tools.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
for(const kind of ['opportunities','datasets','tools'])for(const rec of ctx.window.RADAR_PARTS[kind]||[]){
 const url=rec[kind==='opportunities'?'rules':'url'];if(url)urls.add(url);
}
const seen=new Set(),counts={};
for(const d of decisions.decisions){
 if(!allowed.has(d.status)||!d.url||!d.reviewedBy||!/^\d{4}-\d{2}-\d{2}$/.test(d.reviewedAt||'')||!d.reason||d.reason.length<25)throw Error('Incomplete editorial decision: '+(d.url||'?'));
 const id=identity(d.url).id;
 if(seen.has(id))throw Error('Duplicate editorial decision: '+d.url);
 seen.add(id);
 const lead=input.leads[id];
 if(!lead)throw Error('Editorial decision references unknown lead: '+d.url);
 if(['approved','published','duplicate','rejected','archived'].includes(d.status)&&(!d.officialUrl||!/^https:\/\//.test(d.officialUrl)))throw Error('Missing official evidence: '+d.url);
 if(d.status==='approved'&&!approved.some(x=>x.review?.decision==='approved'&&x.review?.officialUrl===d.officialUrl)){
  const category=d.category||d.record?.category;
  const record=d.record||d.publicationRecord;
  if(!['opportunities','datasets','tools'].includes(category)||!record||typeof record!=='object'||!record.id)throw Error('New approval requires category and complete publication record: '+d.url);
  const target=category==='opportunities'?record.rules:record.url;
  if(typeof target!=='string'||!/^https:\/\//.test(target))throw Error('New approval requires an official HTTPS record URL: '+d.url);
  if(nextManifest.approved.some(x=>x.record?.id===record.id||x.review?.officialUrl===d.officialUrl))throw Error('Duplicate approved publication record: '+record.id);
  nextManifest.approved.push({category,record,review:d.publicationReviewV1||{decision:'approved',reviewedBy:d.reviewedBy,reviewedAt:d.reviewedAt,officialUrl:d.officialUrl,evidence:d.reason}});
}
 if(d.status==='archived'&&d.archiveKind!=='closed-opportunity')throw Error('Archived opportunity must identify archiveKind: '+d.url);
 if(d.status==='published'&&!urls.has(d.officialUrl))throw Error('Publication not present in public catalog: '+d.url);
 const effectiveStatus=d.status==='approved'&&urls.has(d.officialUrl)?'published':d.status;
 input.leads[id]={...lead,editorialStatus:effectiveStatus,reviewedAt:d.reviewedAt,reviewedBy:d.reviewedBy,decisionReason:d.reason,editorialEvidence:d.officialUrl||null,
  ...(d.status==='archived'?{archiveKind:d.archiveKind||'closed-opportunity',deadline:d.deadline||null,archiveVerifiedAt:d.reviewedAt,archiveSource:d.officialUrl}:{} )};
 counts[effectiveStatus]=(counts[effectiveStatus]||0)+1;
}
fs.writeFileSync('intake/lead-history-next.json',JSON.stringify(input,null,2)+'\n');
fs.writeFileSync('intake/approved-publications-next.json',JSON.stringify(nextManifest,null,2)+'\n');
console.log(JSON.stringify({applied:seen.size,counts,approvedManifestEntries:nextManifest.approved.length}));
