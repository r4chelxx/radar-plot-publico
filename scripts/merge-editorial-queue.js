#!/usr/bin/env node
// Persist public candidate metadata across daily discovery runs without approval by inference.
const fs=require('node:fs');
const {identity}=require('./lead-identity');
const {classifyLead}=require(require('node:path').join(process.cwd(),'scripts/lead-category'));
const current=JSON.parse(fs.readFileSync(process.argv[2]||'intake/discovery-quality.json','utf8'));
const dest=process.argv[3]||'intake/editorial-queue.json';
let previous={candidates:[]};
if(fs.existsSync(dest))previous=JSON.parse(fs.readFileSync(dest,'utf8'));
const queue=new Map((previous.candidates||[]).map(x=>[x.id,x]));
const now=new Date().toISOString();
const historyPath=process.argv[4]||'state/lead-history.json';
const decisionsPath=process.argv[5]||'intake/historical-decisions.json';
const history=fs.existsSync(historyPath)?JSON.parse(fs.readFileSync(historyPath,'utf8')).leads||{}:{};
const decisions=fs.existsSync(decisionsPath)?JSON.parse(fs.readFileSync(decisionsPath,'utf8')).decisions||[]:[];
// Public catalog membership is authoritative for publication status; reconcile the
// exact canonical URLs so published records are not audited and drafted again.
const vm=require('node:vm');
const catalogContext={window:{RADAR_PARTS:{}}};vm.createContext(catalogContext);
const catalogDir=process.env.RADAR_CATALOG_DIR||'data';
for(const name of ['opportunities.js','datasets.js','tools.js']){const file=require('node:path').join(catalogDir,name);vm.runInContext(fs.readFileSync(file,'utf8'),catalogContext,{filename:file});}
const publishedLinkIds=new Set();
for(const [category,records] of Object.entries(catalogContext.window.RADAR_PARTS)){
 const keys=category==='opportunities'?['rules','apply']:category==='datasets'?['url','api','docs']:['url'];
 for(const record of records||[])for(const key of keys){if(!record[key])continue;try{publishedLinkIds.add(identity(record[key]).id)}catch{}}
}
const byUrl=new Map();
for(const d of decisions){try{byUrl.set(identity(d.url).id,d.status)}catch{}}
const terminal=new Set(['published','rejected','duplicate','archived']);
// Classify strong opportunity signals only; this is triage, never approval.
function inferCategory(title){
 const t=String(title||'').toLowerCase();
 if(/\bgrants?\s+(?:broad|permission|permissions|access|rights|authority|powers?)\b/.test(t))return 'uncategorized';
 if(/\b(?:fellowships?|scholarships?|grants?|funding|funded|stipends?|bolsas?|editais?|awards?|prizes?|contests?|competitions?)\b|\bcall for applications\b|\bapplications? open\b/.test(t)
   && !/\b(?:conference|webinar|podcast|interview|guide|report|news|announces? winners?|selected for|awarded to|award-winning|winners?|finalists?)\b/.test(t))return 'opportunities';
 return 'uncategorized';
}
function inferTechnicalCategory(item){
 const raw=String(item.title||'').toLowerCase().trim();
 const t=raw.replace(/\s*↗\s*$/,'').trim();
 let host='';try{host=new URL(item.url).hostname.toLowerCase()}catch{}
 const toolNames=new Set([
  'bluesky','ai2html','datawrapper','datawrapper.de','data-to-viz.com','coolors.co','color.adobe.com','canva','playwright','svelte','observable framework','archieml','cloudinary','beautifulsoup','selenium','figma2html','camelot-py','spacy','recordlinkage','folium','duckdb','pandas','geopandas','scikit-learn','plotly','tabulapdf','quanteda','fedmatch','tmap','tidyverse','tidymodels','highcharter','rvest','chromote','reactable','layercake.graphics framework for svelte','tableau','power bi','dax','fabric','zebra bi','dbt (core & semantic layer)','cube','looker (lookml)','sigma computing','omni','powerui','mapbox','arcgis pro & online','spatial-sql.com','felt','deck.gl','postgis','h3 (hexagonal hierarchical geospatial index)','bigquery gis','snowflake geospatial','pmtiles','cloud-native geospatial, cog','stac','google earth engine','pyqgis','arcpy','whiteboxtools','segment anything model (sam) for geospatial','openlayers','duckdb (spatial extension)','overture maps','p5.js 2.0','three.js (with webgpu)','webgpu & wgsl','react three fiber (r3f)','processing (java/python)','momentum.js','segment anything model (sam) for design','canvas & svg api','gsap (greensock animation platform)','touchdesigner','rawgraphs','datylon'
 ]);
 const toolHosts=new Set(['ai2html.org','datawrapper.de','data-to-viz.com','coolors.co','color.adobe.com','playwright.dev','openlayers.org','spatial-sql.com','earthengine.google.com','mapbox.com','tableau.com','felt.com']);
 if(toolNames.has(t)||toolHosts.has(host))return 'tools';
 const datasetNames=new Set(['world bank open data','un data','data.un.org','our world in data','global biodiversity information facility','gbif','humanitarian data exchange','nyc open data','data.census.gov','opendata.cityofnewyork.us']);
 const datasetHosts=new Set(['opendata.cityofnewyork.us','data.un.org','data.census.gov']);
 if(datasetNames.has(t)||datasetHosts.has(host))return 'datasets';
 if(/\b(?:open data portal|open datasets|dataset catalog|data catalogue)\b/.test(t)&&!/(?:news|blog|conference|guide|tutorial)/.test(t))return 'datasets';
 return 'uncategorized';
}
function categoryFor(item){
 const detected=inferCategory(item.title);
 if(detected!=='uncategorized')return detected;
 return inferTechnicalCategory(item);
}
function historicalCategoryFor(item){
 let id=item.id;
 try{id=identity(item.url).id}catch{}
 const category=history[id]?.category;
 return ['opportunities','tools','datasets'].includes(category)?category:null;
}

function resolvedStatus(candidate){
 const hist=history[candidate.id]||history[identity(candidate.url).id];
 const decision=byUrl.get(candidate.id)||byUrl.get(identity(candidate.url).id);
 if(terminal.has(hist?.editorialStatus))return hist.editorialStatus;
 if(terminal.has(decision))return decision;
 if(decision==='approved'||hist?.editorialStatus==='approved')return 'in-review';
 return null;
}
for(const [id,item] of queue){
 const status=resolvedStatus(item);
 if(status)queue.set(id,{...item,status});
}
for(const candidate of current.review||[]){
 if(candidate.classification!=='needs-editorial-review')continue;
 if(!candidate.id||!/^https:\/\//.test(candidate.url||''))continue;
 const old=queue.get(candidate.id);
 if(old&&terminal.has(old.status)){
  if((!old.category||old.category==='uncategorized')&&categoryFor(candidate)!=='uncategorized')queue.set(candidate.id,{...old,category:categoryFor(candidate)});
  continue;
 }
 const providers=[...new Set([...(old?.providers||[]),...(candidate.providers||[])])].slice(0,30);
 const proposedCategory=categoryFor(candidate);
 const category=proposedCategory!=='uncategorized'?proposedCategory:(historicalCategoryFor(candidate)||old?.category||'uncategorized');
 queue.set(candidate.id,{id:candidate.id,title:candidate.title,url:candidate.url,category,providers,firstSeen:old?.firstSeen||now,lastSeen:now,status:resolvedStatus(candidate)||old?.status||'pending',reviewPriority:candidate.reviewPriority||'normal'});
}
for(const [id,item] of queue){
 if(item.status==='pending'&&item.category==='opportunities'&&categoryFor(item)==='uncategorized')queue.set(id,{...item,category:'uncategorized'});
}
// Reclassify old pending leads without changing reviewed or terminal decisions.
for(const [id,item] of queue){
 if(item.status==='pending'&&(!item.category||item.category==='uncategorized')){
  const inferred=categoryFor(item);
  const historical=historicalCategoryFor(item);
  const recovered=inferred!=='uncategorized'?inferred:(historical==='opportunities'?null:historical);
  if(recovered)queue.set(id,{...item,category:recovered});
 }
}
// Reconcile pending and in-review leads whose exact canonical URL is already
// present in a public catalog. Do not rewrite rejected, duplicate, archived, or
// otherwise terminal editorial decisions.
for(const [id,item] of queue){
 if(!['pending','in-review'].includes(item.status))continue;
 try{if(publishedLinkIds.has(identity(item.url).id))queue.set(id,{...item,status:'published'})}catch{}
}
const out={schemaVersion:1,updatedAt:now,policy:'Public web leads only; pending does not mean verified or approved.',candidates:[...queue.values()].sort((a,b)=>a.firstSeen.localeCompare(b.firstSeen))};
fs.mkdirSync(require('node:path').dirname(dest),{recursive:true});
fs.writeFileSync(dest,JSON.stringify(out,null,2)+'\n');
console.log(JSON.stringify({persisted:out.candidates.length,pending:out.candidates.filter(x=>x.status==='pending').length,resolved:out.candidates.filter(x=>terminal.has(x.status)).length}));
