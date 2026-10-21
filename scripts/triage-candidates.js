// Candidate-only triage: no automatic catalog writes or eligibility assertions.
const fs=require('node:fs'),vm=require('node:vm');
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const file of ['data/opportunities.js','data/datasets.js','data/tools.js']) vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const normalize=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const known=[...ctx.window.RADAR_PARTS.opportunities.map(x=>({category:'opportunities',name:x.title,url:x.rules})),...ctx.window.RADAR_PARTS.datasets.map(x=>({category:'datasets',name:x.name,url:x.url,discoveryUrl:x.discoveryUrl})),...ctx.window.RADAR_PARTS.tools.map(x=>({category:'tools',name:x.name,url:x.url,discoveryUrl:x.discoveryUrl}))];
const intake=JSON.parse(fs.readFileSync(process.argv[2]||'intake/source-review.json','utf8'));
const report={generatedAt:new Date().toISOString(),policy:'Candidate discovery only; all records require human verification before publication',coverage:intake.coverage||null,results:[]};
for(const source of intake.results||[]){
 const title=source.title||'';
 const normalized=normalize(title);
 const duplicates=known.filter(x=>normalize(x.name)===normalized || (x.url&&source.url&&x.url.replace(/\/$/,'')===source.url.replace(/\/$/,'')));
 let classification='source-homepage-only';
 if(source.accessStatus!=='accessible')classification='inaccessible';
 else if(duplicates.length)classification='catalog-match';
 else if(!title)classification='not-extracted';
 report.results.push({source:source.name,url:source.url,classification,possibleMatches:duplicates.slice(0,5),sourcePageTitle:title||null,candidateTitle:null,deadline:null,eligibility:null,editoriallyVerified:false});
}
const classes=report.results.reduce((acc,x)=>(acc[x.classification]=(acc[x.classification]||0)+1,acc),{});
report.summary={checked:report.results.length,classes,verifiedNewItems:{opportunities:0,datasets:0,tools:0},verificationNote:'No structured opportunities, datasets or tools are extracted from homepages; zeros mean none verified, not none available.'};
const leads=[];const seenLeads=new Set();
const sourceUrls=new Set((intake.results||[]).map(s=>String(s.url||'').replace(/\/$/,'')));
for(const source of intake.results||[])for(const link of source.leads||[]){
 const url=String(link.url||'').replace(/\/$/,'');
 if(!url||seenLeads.has(url))continue;
 seenLeads.add(url);
 const matches=known.filter(x=>((x.url&&x.url.replace(/\/$/,'')===url)||(x.discoveryUrl&&x.discoveryUrl.replace(/\/$/,'')===url))||normalize(x.name)===normalize(link.label));
 const label=String(link.label||'');
 const years=[...label.matchAll(/\b20(?:1\d|2\d|3\d)\b/g)].map(x=>Number(x[0]));
 const currentYear=new Date().getUTCFullYear();
 const historical=years.length>0&&Math.max(...years)<currentYear;
 const homepage=sourceUrls.has(url);
 const target=new URL(url);
 const navigation=/^\/(?:signup|login|feed\/hashtag)(?:\/|$)/i.test(target.pathname)&&/(^|\.)linkedin\.com$/i.test(target.hostname);
 const externalHomepage=(target.pathname==='/'||target.pathname==='')&&!target.search&&/^(?:https?:\/\/|www\.)/i.test(label.trim());
 const directory=/^(?:scholarships?\s*(?:&|and)\s*fellowships?|grants?\s*(?:&|and)\s*fellowships?|funding opportunities|open calls)(?:\s+[\w.-]+\.(?:org|com|net))?$/i.test(label.trim());
 const generic=/^(find a grant|grants for journalists|successful applications|stable tools|database tools|mediawiki tools|apply|application|tools|ferramentas)$/i.test(label.trim());
 const documentation=/\b(?:documentation|development|opting in|about|pricing options|plan(?:o)? de dados abertos|registry|articleinfo)\b/i.test(label);
 const category=/grant|fellowship|bolsa|funding|financiamento|edital|call for|apply/i.test(label)?'opportunities':/dataset|dados abertos|open data|base de dados/i.test(label)?'datasets':/tool|ferramenta/i.test(label)?'tools':'uncategorized';
 leads.push({source:source.name,title:label,url,category,classification:matches.length?'catalog-match':homepage?'source-homepage-only':externalHomepage?'external-homepage-only':navigation||generic?'generic-navigation':directory?'resource-directory':documentation?'documentation-reference':historical?'historical-reference':'needs-editorial-review',possibleMatches:matches.slice(0,5),deadline:null,eligibility:null,editoriallyVerified:false});
}
report.leads=leads;
report.summary.linkLeads=leads.length;
report.summary.homepageLinks=leads.filter(x=>x.classification==='source-homepage-only').length;
report.summary.externalHomepages=leads.filter(x=>x.classification==='external-homepage-only').length;
report.summary.resourceDirectories=leads.filter(x=>x.classification==='resource-directory').length;
report.summary.genericNavigation=leads.filter(x=>x.classification==='generic-navigation').length;
report.summary.historicalReferences=leads.filter(x=>x.classification==='historical-reference').length;
report.summary.unverifiedLinkLeads=leads.filter(x=>x.classification==='needs-editorial-review').length;
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/candidate-triage.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.summary));
