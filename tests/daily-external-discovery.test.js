const test=require('node:test'),assert=require('node:assert/strict');
const gmail=require('../scripts/discover-gmail-newsletters');
const linkedin=require('../scripts/discover-linkedin-indexed');
test('Gmail without OAuth secrets explicitly reports unavailable',async()=>{const r=await gmail.collect(undefined,{});assert.equal(r.leads.length,0);assert.equal(r.health[0].status,'unconfigured')});
test('Gmail metadata links are unverified candidates',()=>{const r=gmail.extract({subject:'Journalism grant applications',snippet:'Apply https://example.org/grant'});assert.equal(r.length,1);assert.equal(r[0].editorialStatus,'unverified')});
test('Indexed LinkedIn extraction rejects unrelated URLs',()=>{const xml='<item><title>Journalism grant fellowship</title><link>https://www.linkedin.com/posts/example-grant</link></item><item><title>Journalism grant</title><link>https://example.org/grant</link></item>';const r=linkedin.extract(xml);assert.equal(r.length,1);assert.equal(r[0].category,'opportunities')});

test('Gmail historical pagination advances and saves a bounded checkpoint',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-gmail-'));
 const cursor=path.join(dir,'cursor.json');
 const calls=[];
 const fetcher=async(url)=>{
  calls.push(String(url));
  const payload=String(url).includes('oauth2.googleapis.com')?{access_token:'test'}:String(url).endsWith('/labels')?{labels:[{id:'L',name:'Radar PLOT.'}]}:String(url).includes('/messages?')?String(url).includes('pageToken=next')?{messages:[{id:'b'}]}:{messages:[{id:'a'}],nextPageToken:'next'}:{payload:{headers:[{name:'Subject',value:'Journalism grant'}]},snippet:'https://example.org/grant'};
  return {ok:true,json:async()=>payload};
 };
 try{
  const r=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z',RADAR_GMAIL_CURSOR_FILE:cursor,RADAR_GMAIL_MAX_PAGES:'1'});
  assert.equal(r.health[0].scanned,1);assert.equal(r.health[0].coverageStatus,'partial');
  assert.equal(JSON.parse(fs.readFileSync(cursor)).pageToken,'next');
  const r2=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z',RADAR_GMAIL_CURSOR_FILE:cursor,RADAR_GMAIL_MAX_PAGES:'1'});
  assert.equal(r2.health[0].coverageStatus,'complete');assert.equal(JSON.parse(fs.readFileSync(cursor)).processed,2);
  assert(calls.some(x=>x.includes('pageToken=next')));
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('Gmail scans body even when subject and snippet omit funding keywords',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-gmail-body-'));
 const fetcher=async url=>({ok:true,json:async()=>String(url).includes('oauth2.googleapis.com')?{access_token:'test'}:String(url).endsWith('/labels')?{labels:[{id:'L',name:'Radar PLOT.'}]}:String(url).includes('/messages?')?{messages:[{id:'a'}]}:{payload:{headers:[{name:'Subject',value:'Weekly digest'}],body:{data:Buffer.from('Journalism grant https://example.org/fellowship').toString('base64url')}},snippet:'New issue'}});
 try{const r=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z',RADAR_GMAIL_CURSOR_FILE:path.join(dir,'cursor.json')});assert.equal(r.leads.length,1)}finally{fs.rmSync(dir,{recursive:true,force:true})}
});
