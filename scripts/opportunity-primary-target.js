'use strict';
function officialOpportunityTarget(html,baseUrl){
 const source=String(html||'');
 let base;try{base=new URL(baseUrl)}catch{return null}
 const social=/^(?:instagram|facebook|linkedin|tiktok|x|twitter|youtube|youtu|threads|reddit|pinterest|t\.me)(?:\.|$)/i;
 const evidenceLabel=/(?:application\s+faq|frequently\s+asked\s+questions|\bfaq\b|eligibility(?:\s+criteria)?|who\s+(?:may|can)\s+apply|who\s+is\s+eligible|application\s+period|deadline|requirements|guidelines)/i;
 const officialLabel=/(?:official(?:\s+(?:website|page|site))?|call\s+(?:details|page)|program(?:me)?\s+(?:details|page)|opportunity\s+(?:details|page)|view\s+(?:the\s+)?opportunity|full\s+details|view\s+call|detalhes\s+(?:da\s+)?(?:chamada|oportunidade))/i;
 const generalLabel=/(?:application(?:\s+(?:form|details|page))?|apply(?:\s+(?:now|here))?|learn\s+more|read\s+more|inscri[cç][aã]o|candidatar|candidatura|submeter|enviar\s+inscri[cç][aã]o|aplicar|saiba\s+mais|ver\s+detalhes)/i;
 const samePage=base.href.replace(/#.*$/,'').replace(/\/$/,'');
 const candidates=[];
 for(const m of source.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a\s*>/gi)){
  const label=m[2].replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim();
  const raw=m[1].trim();
  if(!evidenceLabel.test(label)&&!officialLabel.test(label)&&!generalLabel.test(label))continue;
  try{
   if(/^(?:mailto:|javascript:|#)/i.test(raw))continue;
   const u=new URL(raw,base),normalized=u.href.replace(/#.*$/,'').replace(/\/$/,'');
   if(u.protocol!=='https:'||normalized===samePage||social.test(u.hostname)||/\.(?:pdf|docx?|xlsx?|zip)(?:$|[?#])/i.test(u.pathname))continue;
   const sameHost=u.hostname.toLowerCase()===base.hostname.toLowerCase();
   const evidence=evidenceLabel.test(label+' '+u.pathname);
   const official=officialLabel.test(label);
   const general=generalLabel.test(label);
   // Prefer pages that state deadlines and eligibility. If a listing links to
   // an official destination, that label outranks its own generic application button.
   const score=(evidence?100:0)+(official?70:0)+(general?25:0)+(sameHost?15:0);
   candidates.push({url:u.href,score});
  }catch{}
 }
 candidates.sort((a,b)=>b.score-a.score);
 return candidates[0]?.url||null;
}
module.exports={officialOpportunityTarget};
