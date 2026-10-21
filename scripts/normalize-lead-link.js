// Normalize public links and unwrap LinkedIn's outbound redirect safely.
function normalizeLink(raw,base){
 const decoded=String(raw||'').replace(/&amp;/gi,'&').replace(/&#38;/g,'&');
 let u=new URL(decoded,base);
 if((u.hostname==='www.linkedin.com'||u.hostname==='linkedin.com')&&u.pathname==='/redir/redirect'){
  const target=u.searchParams.get('url');
  if(target){const parsed=new URL(target);if(['https:','http:'].includes(parsed.protocol))u=parsed;}
 }
 if(!['http:','https:'].includes(u.protocol)||u.username||u.password)throw new Error('Unsafe URL');
 return u.href;
}
module.exports={normalizeLink};
