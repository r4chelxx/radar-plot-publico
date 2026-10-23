'use strict';
// Diagnostic only. Does not update the catalog or publish leads.
const targets=[
['Informed Earth','https://informedstories.org/en/informed-earth/opportunities/'],
['Informed opportunities','https://informedstories.org/en/opportunities/'],
['Pulitzer Center','https://pulitzercenter.org/opportunities/grants-fellowships'],
['GIJN Jobs','https://gijn.org/jobs/'],
['GIJN Follow','https://gijn.org/follow/'],
['SUS Open Data','https://dadosabertos.saude.gov.br/dataset']
];
async function inspect([name,url]){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);
 try{
  const response=await fetch(url,{signal:controller.signal,headers:{'user-agent':'RadarPLOT-monitor/1.0'}});
  const html=(await response.text()).slice(0,100000);
  return {name,url,status:response.status,ok:response.ok,finalUrl:response.url,hasTitle:/<title[^>]*>/i.test(html),anchorCount:(html.match(/<a\b/gi)||[]).length};
 }catch(error){return {name,url,ok:false,error:String(error)}}
 finally{clearTimeout(timer)}
}
(async()=>{
 const results=[];for(const target of targets)results.push(await inspect(target));
 require('node:fs').mkdirSync('intake',{recursive:true});
 require('node:fs').writeFileSync('intake/alternative-access.json',JSON.stringify({note:'Diagnostic only; HTTP success does not establish editorial suitability.',checkedAt:new Date().toISOString(),results},null,2)+'\n');
 console.log('Official alternative URL diagnostics:',JSON.stringify(results));
})().catch(error=>{console.error(error);process.exitCode=1});
