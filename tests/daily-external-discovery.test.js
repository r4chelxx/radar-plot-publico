const test=require('node:test'),assert=require('node:assert/strict');
const gmail=require('../scripts/discover-gmail-newsletters');
const linkedin=require('../scripts/discover-linkedin-indexed');
test('Gmail without OAuth secrets names missing Actions secrets without exposing values',async()=>{
 const r=await gmail.collect(undefined,{});
 assert.equal(r.leads.length,0);
 assert.equal(r.health[0].status,'unconfigured');
 for(const name of ['RADAR_GMAIL_CLIENT_ID','RADAR_GMAIL_CLIENT_SECRET','RADAR_GMAIL_REFRESH_TOKEN'])assert.match(r.health[0].reason,new RegExp(name));
});
test('Gmail with one missing OAuth secret reports only the missing secret name',async()=>{
 const r=await gmail.collect(undefined,{RADAR_GMAIL_CLIENT_ID:'present',RADAR_GMAIL_CLIENT_SECRET:'present'});
 assert.equal(r.health[0].status,'unconfigured');
 assert.equal(r.health[0].reason,'Missing GitHub Actions secret(s): RADAR_GMAIL_REFRESH_TOKEN');
 assert.doesNotMatch(r.health[0].reason,/present/);
});
test('Gmail invalid-client response identifies OAuth client configuration without exposing values',async()=>{
 const r=await gmail.collect(async()=>({ok:false,status:401,json:async()=>({error:'invalid_client',error_description:'must not be logged'})}),{
  RADAR_GMAIL_CLIENT_ID:'client-id-secret-value',
  RADAR_GMAIL_CLIENT_SECRET:'client-secret-value',
  RADAR_GMAIL_REFRESH_TOKEN:'refresh-token-secret-value'
 });
 assert.equal(r.health[0].status,'error');
 assert.equal(r.health[0].reason,'OAuth HTTP 401 invalid_client');
 assert.equal(r.health[0].errorCode,'invalid_client');
 assert.equal(r.health[0].failureClass,'oauth-client-configuration');
 assert.match(r.health[0].recommendedAction,/OAuth client ID\/secret pair/);
 assert.doesNotMatch(r.health[0].reason,/secret-value|must not be logged/);
});
test('Gmail invalid-grant response reports refresh-token failure distinctly',async()=>{
 const r=await gmail.collect(async()=>({ok:false,status:400,json:async()=>({error:'invalid_grant',error_description:'must not be logged'})}),{
  RADAR_GMAIL_CLIENT_ID:'client-id',
  RADAR_GMAIL_CLIENT_SECRET:'client-secret',
  RADAR_GMAIL_REFRESH_TOKEN:'refresh-token'
 });
 assert.equal(r.health[0].reason,'OAuth HTTP 400 invalid_grant');
 assert.equal(r.health[0].errorCode,'invalid_grant');
 assert.equal(r.health[0].failureClass,'oauth-refresh-token');
 assert.match(r.health[0].recommendedAction,/new refresh token/);
 assert.doesNotMatch(r.health[0].reason,/must not be logged/);
});
test('Gmail API disabled 403 identifies the Cloud API action without leaking response text',async()=>{
 const fetcher=async url=>String(url).includes('oauth2.googleapis.com')?{ok:true,json:async()=>({access_token:'test'})}:{ok:false,status:403,json:async()=>({error:{message:'PRIVATE RESPONSE DETAIL',errors:[{reason:'accessNotConfigured'}]}})};
 const r=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z'});
 assert.equal(r.health[0].errorCode,'accessNotConfigured');
 assert.equal(r.health[0].failureClass,'gmail-api-disabled');
 assert.match(r.health[0].recommendedAction,/Enable Gmail API/);
 assert.doesNotMatch(JSON.stringify(r.health),/PRIVATE RESPONSE DETAIL/);
});
test('Gmail insufficient-scope 403 asks for read-only authorization',async()=>{
 const fetcher=async url=>String(url).includes('oauth2.googleapis.com')?{ok:true,json:async()=>({access_token:'test'})}:{ok:false,status:403,json:async()=>({error:{errors:[{reason:'insufficientPermissions'}]}})};
 const r=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z'});
 assert.equal(r.health[0].failureClass,'gmail-oauth-scope');
 assert.match(r.health[0].recommendedAction,/gmail.readonly/);
});
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


test('Gmail checkpoint skips previously read message IDs without storing raw IDs',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-gmail-idempotent-'));
 const cursor=path.join(dir,'cursor.json');
 let reads=0;
 const fetcher=async url=>({ok:true,json:async()=>{
  const u=String(url);
  if(u.includes('oauth2.googleapis.com'))return {access_token:'test'};
  if(u.endsWith('/labels'))return {labels:[{id:'L',name:'Radar PLOT.'}]};
  if(u.includes('/messages?'))return {messages:[{id:'known-message'}]};
  reads++;return {payload:{headers:[{name:'Subject',value:'Journalism grant'}]},snippet:'https://example.org/grant'};
 }});
 const env={RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z',RADAR_GMAIL_CURSOR_FILE:cursor};
 try{
  const a=await gmail.collect(fetcher,env);
  assert.equal(a.health[0].scanned,1);assert.equal(reads,1);
  const stored=JSON.parse(fs.readFileSync(cursor));
  assert.equal(stored.processed,1);
  assert.deepEqual(stored.processedIdHashes,[crypto.createHash('sha256').update('known-message').digest('hex')]);
  assert(!fs.readFileSync(cursor,'utf8').includes('known-message'));
  const b=await gmail.collect(fetcher,env);
  assert.equal(b.health[0].scanned,0);
  assert.equal(b.health[0].skippedAlready,1);
  assert.equal(b.leads.length,0);
  assert.equal(reads,1);
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

const {assertGmailAvailable}=require('../scripts/require-gmail-health');
test('required Gmail source gate rejects missing OAuth coverage',()=>{
 assert.throws(()=>assertGmailAvailable({health:[{status:'unconfigured',reason:'OAuth read-only credentials not configured'}]}),/Required Gmail source unavailable: OAuth read-only credentials not configured/);
});
test('required Gmail source gate accepts a healthy partial backfill',()=>{
 const r=assertGmailAvailable({health:[{source:'Gmail Radar PLOT',status:'ok',scanned:30,items:4,coverageStatus:'partial'}]});
 assert.deepEqual(r,{source:'Gmail Radar PLOT',scanned:30,items:4,coverageStatus:'partial'});
});


test('Gmail retries transient per-user rate limits with exponential backoff',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-gmail-retry-'));let listCalls=0;
 const fetcher=async url=>{
  if(String(url).includes('oauth2.googleapis.com'))return {ok:true,json:async()=>({access_token:'test'})};
  if(String(url).endsWith('/labels'))return {ok:true,json:async()=>({labels:[{id:'L',name:'Radar PLOT.'}]})};
  if(String(url).includes('/messages?')&&++listCalls===1)return {ok:false,status:403,json:async()=>({error:{errors:[{reason:'rateLimitExceeded'}]}})};
  if(String(url).includes('/messages?'))return {ok:true,json:async()=>({messages:[]})};
  throw Error('Unexpected message read');
 };
 try{
  const r=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z',RADAR_GMAIL_CURSOR_FILE:path.join(dir,'cursor.json'),RADAR_GMAIL_RETRY_BASE_MS:'0'});
  assert.equal(r.health[0].status,'ok');assert.equal(listCalls,2);assert.equal(r.health[0].coverageStatus,'complete');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});

test('Gmail resets a legacy exhausted checkpoint instead of reusing its stale page token',async()=>{
 const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-gmail-legacy-')),cursor=path.join(dir,'cursor.json');
 fs.writeFileSync(cursor,JSON.stringify({schemaVersion:2,labelName:'Radar PLOT.',pageToken:'expired-token',processedIdHashes:[],paginationExhausted:true,incrementalFollowupRequired:true}));
 const calls=[];
 const fetcher=async url=>{
  calls.push(String(url));
  const u=String(url);
  if(u.includes('oauth2.googleapis.com'))return {ok:true,json:async()=>({access_token:'test'})};
  if(u.endsWith('/labels'))return {ok:true,json:async()=>({labels:[{id:'L',name:'Radar PLOT.'}]})};
  if(u.includes('/messages?')){assert(!u.includes('expired-token'));return {ok:true,json:async()=>({messages:[]})};}
  throw Error('Unexpected message read');
 };
 try{
  const r=await gmail.collect(fetcher,{RADAR_GMAIL_CLIENT_ID:'x',RADAR_GMAIL_CLIENT_SECRET:'y',RADAR_GMAIL_REFRESH_TOKEN:'z',RADAR_GMAIL_CURSOR_FILE:cursor});
  assert.equal(r.health[0].status,'ok');
  assert.equal(r.health[0].cursorReset,'stale-or-legacy-checkpoint');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
