#!/usr/bin/env node
// Persist public candidate metadata across daily discovery runs without approval by inference.
const fs=require('node:fs');
const {identity}=require('./lead-identity');\nconst {classifyLead}=require('./lead-category');
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
function inferCategory(title,url='',pageTitle='',evidenceText=''){return classifyLead({title,url,pageTitle,evidenceText})}
