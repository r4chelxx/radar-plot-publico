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
 if(!id||!secret||!refresh)return {source:'gmail',leads:[],health:[{...health,reason:'OAuth read-only credentials not configured'}]};
 try{
  const tokenResponse=await fetcher('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:id,client_secret:secret,refresh_token:refresh,grant_type:'refresh_token'})});
  if(!tokenResponse.ok)throw Error('OAuth HTTP '+tokenResponse.status);
  const token=(await tokenResponse.json()).access_token;
  if(!token)throw Error('Missing access token');
  const api=async path=>{const r=await fetcher('https://gmail.googleapis.com/gmail/v1/users/me/'+path,{headers:{authorization:'Bearer '+token}});if(!r.ok)throw Error('Gmail API HTTP '+r.status);return r.json()};
  const labels=await api('labels');
  const found=(labels.labels||[]).find(x=>x.name===label);
  if(!found)throw Error('Gmail label not found');
  // Page through the label rather than silently truncating to the last seven days.
  // Keep each run bounded; the cursor is saved only when the batch succeeds.
  const cursorFile=env.RADAR_GMAIL_CURSOR_FILE||'intake/gmail-backfill-cursor.json';
  let cursor={pageToken:'',processed:0};
  try{cursor=JSON.parse(fs.readFileSync(cursorFile,'utf8'))}catch{}
  const maxPages=Math.min(20,Math.max(1,Number(env.RADAR_GMAIL_MAX_PAGES||3)));
  // A completed historical pass must restart at the newest page on the next run.
  const leads=[],seen=new Set(),processedIds=new Set(cursor.processedIdHashes||[]);let scanned=0,skippedAlready=0,pages=0,nextToken=cursor.complete?'':(cursor.pageToken||'');
  for(let page=0;page<maxPages;page++){
   const params=new URLSearchParams({labelIds:found.id,maxResults:'100'});
   if(nextToken)params.set('pageToken',nextToken);
   const list=await api('messages?'+params);
   pages++;
   for(const m of list.messages||[]){
   const messageHash=crypto.createHash('sha256').update(m.id).digest('hex');
   if(processedIds.has(messageHash)){skippedAlready++;continue;}
   const item=await api('messages/'+encodeURIComponent(m.id)+'?format=full');
   processedIds.add(messageHash);scanned++;
   const subject=(item.payload?.headers||[]).find(x=>x.name.toLowerCase()==='subject')?.value||'';
   const parts=[];const walk=p=>{if(p?.body?.data){try{parts.push(Buffer.from(p.body.data,'base64url').toString('utf8').slice(0,100000))}catch{}}for(const child of p?.parts||[])walk(child)};walk(item.payload);
   const body=parts.join(' ').replace(/<[^>]+>/g,' ');
   if(!allowed.test(subject+' '+(item.snippet||'')+' '+body))continue;
   for(const lead of extract({subject,snippet:item.snippet,body})){if(!seen.has(lead.url)){seen.add(lead.url);leads.push(lead)}}
   }
   nextToken=list.nextPageToken||'';
   if(!nextToken)break;
  }
  fs.mkdirSync(require('node:path').dirname(cursorFile),{recursive:true});
  fs.writeFileSync(cursorFile,JSON.stringify({...cursor,pageToken:nextToken,processed:processedIds.size,processedIdHashes:[...processedIds],updatedAt:new Date().toISOString(),complete:!nextToken},null,2)+'\n');
  return {source:'gmail',leads,health:[{source:'Gmail Radar PLOT',status:'ok',items:leads.length,scanned,skippedAlready,checkpointIds:processedIds.size,pages,coverageStatus:nextToken?'partial':'complete',checkpoint:cursorFile}]};
 }catch(e){return {source:'gmail',leads:[],health:[{...health,status:'error',reason:String(e.message||e).slice(0,140)}]}}
}
if(require.main===module)collect().then(r=>{fs.mkdirSync('intake',{recursive:true});fs.writeFileSync('intake/gmail-discovery.json',JSON.stringify({source:r.source,leads:r.leads},null,2)+'\n');fs.writeFileSync('intake/gmail-health.json',JSON.stringify({health:r.health},null,2)+'\n');console.log(JSON.stringify({gmailCandidates:r.leads.length,health:r.health}));});
module.exports={collect,extract};
