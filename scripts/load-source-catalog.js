const fs=require('node:fs');
const vm=require('node:vm');
function loadSources(file='data/sources.js'){
 const context={window:{RADAR_PARTS:{}}};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file,timeout:2000});
 const raw=context.window.RADAR_PARTS.sources;
 if(!Array.isArray(raw))throw new Error('Invalid source registry');
 const seen=new Set(),sources=[];
 for(const item of raw){
  if(!item||typeof item.name!=='string'||typeof item.url!=='string')continue;
  let url;
  try{url=new URL(item.url)}catch{continue}
  if(!['http:','https:'].includes(url.protocol))continue;
  const key=url.href.replace(/\/$/,'');
  if(seen.has(key))continue;
  seen.add(key);
  sources.push({name:item.name,url:url.href,category:item.category||null,priority:item.priority||null,cadence:item.cadence||null});
 }
 return {sources,registryCount:raw.length,invalidOrDuplicate:raw.length-sources.length};
}
module.exports={loadSources};
