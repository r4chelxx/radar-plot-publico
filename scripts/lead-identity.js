const crypto=require('node:crypto');
// The history branch is public. Keep only known navigation parameters;
// discard tracking, email identifiers, signatures and arbitrary query values.
const safeNumeric=new Set(['id','p','page','post','year']);
const safeText=new Set(['lang','locale']);
function canonical(raw){
 const u=new URL(raw);
 if(!['http:','https:'].includes(u.protocol))throw new Error('Unsupported URL');
 const host=u.hostname.toLowerCase();
 if(u.username||u.password||host==='localhost'||host.endsWith('.local')||host.endsWith('.internal')||/^\d+\.\d+\.\d+\.\d+$/.test(host)||host.includes(':'))throw new Error('Non-public URL');
 u.hash='';u.hostname=host;
 const kept=[];
 for(const [key,value] of u.searchParams){
  const k=key.toLowerCase();
  if(safeNumeric.has(k)&&/^\d{1,12}$/.test(value))kept.push([k,value]);
  else if(safeText.has(k)&&/^[a-zA-Z_-]{2,12}$/.test(value))kept.push([k,value.toLowerCase()]);
 }
 u.search='';
 for(const [key,value] of kept)u.searchParams.append(key,value);
 u.searchParams.sort();
 if(u.pathname.length>1)u.pathname=u.pathname.replace(/\/+$/,'');
 return u.toString();
}
function identity(raw){const url=canonical(raw);return {url,id:crypto.createHash('sha256').update(url).digest('hex')};}
module.exports={canonical,identity};
