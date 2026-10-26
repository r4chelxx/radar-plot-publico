#!/usr/bin/env node
// Import manually verified PUBLIC post links without authenticating or scraping LinkedIn.
// Input is a reviewed JSON array; outputs candidates only, never approved publications.
const fs=require('node:fs');
const {canonical}=require('./lead-identity');
function convert(entries){
 if(!Array.isArray(entries))throw Error('Expected an array of public post records');
 const seen=new Set(),leads=[],errors=[];
 for(let i=0;i<entries.length;i++){
  const item=entries[i];
  try{
   if(!item||typeof item!=='object')throw Error('Invalid record');
   const post=new URL(String(item.postUrl||''));
   if(!/(^|\\.)linkedin\\.com$/i.test(post.hostname))throw Error('Not a LinkedIn post');
   if(!['/posts/','/feed/update/','/pulse/'].some(prefix=>post.pathname.startsWith(prefix)))throw Error('Not a public post permalink');
   const url=canonical(String(item.officialUrl||''));
   if(!url.startsWith('https://')&&!url.startsWith('http://'))throw Error('Invalid official URL');
   const title=String(item.title||'').trim();
   if(title.length<12)throw Error('Title too short');
   if(seen.has(url))continue;
   seen.add(url);
   leads.push({url,title:title.slice(0,220),category:'uncategorized',sourceName:'Grants for Journalists (LinkedIn public post)',sourcePost:post.origin+post.pathname,editorialStatus:'unverified'});
  }catch(e){errors.push({index:i,reason:String(e.message||e)})}
 }
 return {leads,errors,coverageStatus:'partial',note:'Manual public post candidates only. Deadlines and eligibility must be checked at primary sources; no LinkedIn feed coverage is implied.'};
}
if(require.main===module){
 const input=process.argv[2],output=process.argv[3]||'intake/linkedin-public-candidates.json';
 if(!input)throw Error('Usage: node scripts/import-linkedin-public-posts.js input.json [output.json]');
 const result=convert(JSON.parse(fs.readFileSync(input,'utf8')));
 fs.mkdirSync(require('node:path').dirname(output),{recursive:true});
 fs.writeFileSync(output,JSON.stringify({source:'web',...result},null,2)+'\\n');
 console.log(JSON.stringify({accepted:result.leads.length,rejected:result.errors.length,coverageStatus:result.coverageStatus}));
 if(result.errors.length)process.exitCode=1;
}
module.exports={convert};
