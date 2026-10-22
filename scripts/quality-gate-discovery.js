#!/usr/bin/env node
// Non-publishing quality report for live discovery, with catalog URL matching.
const fs=require('node:fs'),vm=require('node:vm');
const {identity}=require('./lead-identity');
const ctx={window:{RADAR_PARTS:{}}};vm.createContext(ctx);
for(const file of ['data/opportunities.js','data/datasets.js','data/tools.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
const catalog=new Set();
for(const [category,items,fields] of [
 ['opportunities',ctx.window.RADAR_PARTS.opportunities,['rules']],
 ['datasets',ctx.window.RADAR_PARTS.datasets,['url','discoveryUrl']],
 ['tools',ctx.window.RADAR_PARTS.tools,['url','discoveryUrl']]
])for(const item of items)for(const field of fields)if(item[field])try{catalog.add(identity(item[field]).id)}catch{}
const queue=JSON.parse(fs.readFileSync(process.argv[2]||'intake/unified-discovery.json','utf8'));
const report={generatedAt:new Date().toISOString(),policy:'Candidates are never automatically approved or published.',counts:{total:0,catalogMatches:0,needsReview:0,genericNavigation:0},review:[]};
const topical=/(?:grant|fellowship|funding|award|scholarship|prize|tool|software|platform|dataset|database|data source|open data|visualization|visualisation|map|chart|research|bolsa|edital|financiamento|ferramenta|dados abertos)/i;
const generic=/^(?:home|about|contact|privacy|terms|newsletter|blog|login|sign in|sign up|register|subscribe|read more|learn more|share|follow|donate|next|previous|more)$/i;
for(const item of queue.candidates||[]){
 const match=catalog.has(item.id);
 const nav=generic.test(String(item.title||'').trim());
 const classification=match?'catalog-match':nav?'generic-navigation':'needs-editorial-review';
 report.counts.total++;report.counts[match?'catalogMatches':nav?'genericNavigation':'needsReview']++;
 report.review.push({id:item.id,url:item.url,title:item.title,origins:item.origins,classification,reviewPriority:classification!=='needs-editorial-review'?'excluded':topical.test(String(item.title||''))?'high':'normal',publicationReady:false});
}
fs.mkdirSync('intake',{recursive:true});
fs.writeFileSync('intake/discovery-quality.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report.counts));
