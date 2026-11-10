#!/usr/bin/env node
// Read-only Gmail newsletter discovery. Never persist email bodies or credentials.
const fs=require('node:fs'),crypto=require('node:crypto');
const {canonical}=require('./lead-identity');
const label=process.env.RADAR_GMAIL_LABEL||'Radar PLOT.';
const allowed=/grant|fellowship|funding|scholarship|award|bolsa|edital|financiamento|journalism|jornalismo|dataset|database|ferramenta|tool/i;
function extract(message){
 const text=[message.snippet||'',message.subject||'',message.body||''].join(' ');
 const links=[...text.matchAll(/https?:\/\/[^\s<>"')]+/g)].map(x=>x[0]);
 return links.filter(x=>{try{return /^https:\/\//.test(canonical(x))}catch{return false}}).map(url=>({url:canonical(url),title:(message.subject||'Newsletter candidate').slice(0,220),category:'uncategorized',sourceName:'Gmail Radar PLOT newsletter',editorialStatus:'unverified'}));
}
async function collect(fetcher=fetch,env=process.env){
 const health={source:'Gmail Radar PLOT',status:'unconfigured',items:0,coverageStatus:'unavailable'};
 const {RADAR_GMAIL_CLIENT_ID:id,RADAR_GMAIL_CLIENT_SECRET:secret,RADAR_GMAIL_REFRESH_TOKEN:refresh}=env;
 const missing=[['RADAR_GMAIL_CLIENT_ID',id],['RADAR_GMAIL_CLIENT_SECRET',secret],['RADAR_GMAIL_REFRESH_TOKEN',refresh]].filter(([,value])=>!String(value||'').trim()).map(([name])=>name);
 if(missing.length)return {source:'gmail',leads:[],health:[{...health,reason:'Missing GitHub Actions secret(s): '+missing.join(', ')}]};
 try{
  const tokenResponse=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:id,client_secret:secret,refresh_token:refresh,grant_type:'refresh_token'})});
  if(!tokenResponse.ok){const oauthError=await tokenResponse.json().catch(()=>({}));const code=String(oauthError.error||'unknown').replace(/[^a-z0-9_-]/gi,'').slice(0,50);const failure=Error('OAuth HTTP '+tokenResponse.status+' '+code);failure.oauthStatus=tokenResponse.status;failure.oauthCode=code;throw failure;}
  const token=(await tokenResponse.json()).access_token;
  if(!token)throw Error('Missing access token');
  const retryBaseMs=Math.min(5000,Math.max(0,Number(env.RADAR_GMAIL_RETRY_BASE_MS||1000)));
  const api=async path=>{
   for(let attempt=0;attempt<5;attempt++){
    const r=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{headers:{authorization:'Bearer '+token}});
    if(r.ok)return r.json();
    const payload=await r.json().catch(()=>({}));
    const raw=payload.error?.errors?.[0]?.reason||payload.error?.status||payload.error?.message||'unknown';
    const reason=String(raw).replace(/[^a-z0-9_-]/gi,'').slice(0,60)||'unknown';
    const retryable=r.status===429||r.status>=500||(r.status===403&&/rateLimitExceeded|userRateLimitExceeded|backendError/i.test(reason));
    if(retryable&&attempt<4){
     const header=Number(r.headers?.get?.('retry-after'));
     const delay=Number.isFinite(header)&&header>0?Math.min(30000,header*1000):Math.min(30000,retryBaseMs*2**attempt);
     if(delay>0)await new Promise(resolve=>setTimeout(resolve,delay));
     continue;
    }
    const failure=Error('Gmail API HTTP '+r.status+' '+reason);failure.gmailApiStatus=r.status;failure.gmailApiReason=reason;throw failure;
   }
  };
  const labels=await api('labels');
  const found=(labels.labels||[]).find(x=>x.name===label);
  if(!found)throw Error('Gmail label not found');
  // Page through the label rather than silently truncating to the last seven days.
  // Keep each run bounded; the cursor is saved only when the batch succeeds.
  const cursorFile=env.RADAR_GMAIL_CURSOR_FILE||'intake/gmail-backfill-cursor.json';
  let cursor={pageToken:'',processed:0};
  try{cursor=JSON.parse(fs.readFileSync(cursorFile,'utf8'))}catch{}
  const maxPages=Math.min(20,Math.max(1,Number(env.RADAR_GMAIL_MAX_PAGES||3)));
  const pageSize=Math.min(50,Math.max(10,Number(env.RADAR_GMAIL_PAGE_SIZE||50)));
  const saveCursor=(pageToken,processedIdHashes,complete)=>{fs.mkdirSync(require('node:path').dirname(cursorFile),{recursive:true});fs.writeFileSync(cursorFile,JSON.stringify({...cursor,pageToken,processed:processedIdHashes.length,processedIdHashes,updatedAt:new Date().toISOString(),complete},null,2)+'\n')};
  // A completed historical pass must restart at the newest page on the next run.
  const leads=[],seen=new Set(),processedIds=new Set(cursor.processedIdHashes||[]);let scanned=0,skippedAlready=0,pages=0,nextToken=cursor.complete?'':(cursor.pageToken||'');
  for(let page=0;page<maxPages;page++){
   const params=new URLSearchParams({labelIds:found.id,maxResults:String(pageSize)});
   if(nextToken)params.set('pageToken',nextToken);
   const list=await api('messages?'+params);
   pages++;
   for(const m of list.messages||[]){
   const messageHash=crypto.createHash('sha256').update(m.id).digest('hex');
   if(processedIds.has(messageHash)){skippedAlready++;continue;}
   const item=await api('messages/'+encodeURIComponent(m.id)+'?format=full');
   processedIds.add(messageHash);scanned++;
   saveCursor(nextToken,[...processedIds],false);
   const subject=(item.payload?.headers||[]).find(x=>x.name.toLowerCase()==='subject')?.value||'';
   const parts=[];const walk=p=>{if(p?.body?.data){try{parts.push(Buffer.from(p.body.data,'base64url').toString('utf8').slice(0,100000))}catch{}}for(const child of p?.parts||[])walk(child)};walk(item.payload);
   const body=parts.join(' ').replace(/<[^>]+>/g,' ');
   if(!allowed.test(subject+' '+(item.snippet||'')+' '+body))continue;
   for(const lead of extract({subject,snippet:item.snippet,body})){if(!seen.has(lead.url)){seen.add(lead.url);leads.push(lead)}}
   }
   nextToken=list.nextPageToken||'';
   if(!nextToken)break;
  }
  saveCursor(nextToken,[...processedIds],!nextToken);
  return {source:'gmail',leads,health:[{source:'Gmail Radar PLOT',status:'ok',items:leads.length,scanned,skippedAlready,checkpointIds:processedIds.size,pages,coverageStatus:nextToken?'partial':'complete',checkpoint:cursorFile}]};
 }catch(e){const reason=String(e.message||e).replace(/[\r\n]/g,' ').slice(0,140);const diagnostics=e.oauthCode==='invalid_client'?{errorCode:'invalid_client',failureClass:'oauth-client-configuration',recommendedAction:'Reauthorize or replace the OAuth client ID/secret pair in the public repository.'}:e.oauthCode==='invalid_grant'?{errorCode:'invalid_grant',failureClass:'oauth-refresh-token',recommendedAction:'Generate a new refresh token for the same OAuth client and update the public repository secret.'}:e.gmailApiStatus===403&&e.gmailApiReason==='accessNotConfigured'?{errorCode:e.gmailApiReason,failureClass:'gmail-api-disabled',recommendedAction:'Enable Gmail API in the Google Cloud project that owns this OAuth client, then retry.'}:e.gmailApiStatus===403&&/insufficientPermissions|insufficient.*scope/i.test(e.gmailApiReason||'')?{errorCode:e.gmailApiReason,failureClass:'gmail-oauth-scope',recommendedAction:'Authorize the OAuth client with https://www.googleapis.com/auth/gmail.readonly and replace the refresh token.'}:e.gmailApiStatus===403?{errorCode:e.gmailApiReason,failureClass:'gmail-api-permission',recommendedAction:'Check Gmail API access, OAuth consent scopes, and whether the connected account permits read-only Gmail access.'}:{};return {source:'gmail',leads:[],health:[{...health,status:'error',reason,...diagnostics}]}}
}
if(require.main===module)collect().then(r=>{fs.mkdirSync('intake',{recursive:true});fs.writeFileSync('intake/gmail-discovery.json',JSON.stringify({source:r.source,leads:r.leads},null,2)+'\n');fs.writeFileSync('intake/gmail-health.json',JSON.stringify({health:r.health},null,2)+'\n');console.log(JSON.stringify({gmailCandidates:r.leads.length,health:r.health}));});
module.exports={collect,extract};
