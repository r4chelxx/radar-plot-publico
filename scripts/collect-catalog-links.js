'use strict';

const fields={
  opportunities:['rules','apply','source','discoveryUrl'],
  datasets:['url','docs','api','discoveryUrl'],
  sources:['url','discoveryUrl'],
  tools:['url','docs','api','discoveryUrl']
};
const trailing=/[),.;:!?…—–]+$/u;
function extractUrls(value){
  if(typeof value!=='string')return[];
  return (value.match(/https?:\/\/[^\s"'<>]+/g)||[])
    .map(url=>url.replace(trailing,''))
    .filter(url=>url&&!/[{}]/.test(url));
}
function collectCatalogLinks(data={}){
  const rows=[];
  for(const [type,names] of Object.entries(fields)){
    for(const record of data[type]||[]){
      for(const field of names){
        for(const url of extractUrls(record?.[field])){
          rows.push({type:type==='opportunities'?'opportunity':type==='datasets'?'dataset':type==='sources'?'source':'tool',id:record.id||record.name||record.title,field,url});
        }
      }
    }
  }
  const byUrl=new Map();
  for(const row of rows){
    const current=byUrl.get(row.url);
    if(current)current.references.push({type:row.type,id:row.id,field:row.field});
    else byUrl.set(row.url,{...row,references:[{type:row.type,id:row.id,field:row.field}]});
  }
  return [...byUrl.values()];
}
module.exports={collectCatalogLinks,extractUrls};
