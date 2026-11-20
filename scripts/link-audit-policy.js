'use strict';

const INCONCLUSIVE=new Set(['blocked','network','server']);

function hostname(value){
 try{return new URL(value).hostname.toLowerCase()}catch{return 'invalid-url'}
}

// Keep URLs from the same host out of the same request burst. Catalog entries
// are grouped by source, and sending twelve requests to one portal at once was
// producing avoidable timeouts and 5xx responses.
function interleaveByHost(items){
 const groups=new Map();
 for(const item of items){
  const key=hostname(item.url);
  if(!groups.has(key))groups.set(key,[]);
  groups.get(key).push(item);
 }
 const queues=[...groups.values()],out=[];
 while(queues.some(x=>x.length)){
  for(const queue of queues)if(queue.length)out.push(queue.shift());
 }
 return out;
}

function classify(response,old){
 if(response.serviceError)return old&&['suspect','broken'].includes(old.class)?'broken':'suspect';
 if(response.status>=200&&response.status<400)return'ok';
 if([401,403,405,406,429].includes(response.status))return'blocked';
 if(response.status===404||response.status===410)return old&&['suspect','broken'].includes(old.class)?'broken':'suspect';
 if(response.status>=500)return'server';
 if(response.status===null)return'network';
 return'warning';
}

function withHistory(result,old){
 const same=old&&old.class===result.class;
 const streak=same?Math.max(1,Number(old.streak)||1)+1:1;
 const persistent=INCONCLUSIVE.has(result.class)&&streak>=3;
 return {...result,streak,persistent,previousClass:old?.class||null};
}

function shouldRetry(response){
 return Boolean(response.status===null||response.status>=500||response.status===429||response.status===404||response.status===410||response.serviceError);
}

module.exports={INCONCLUSIVE,hostname,interleaveByHost,classify,withHistory,shouldRetry};
