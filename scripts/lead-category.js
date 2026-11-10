'use strict';
// Classify a lead only from its own title, URL, or inspected page evidence.
// Provider/source names are intentionally excluded to prevent navigation spillover.
function normalize(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase()}
function classifyLead({title='',url='',pageTitle='',evidenceText=''}={}){
 const text=normalize([title,pageTitle,evidenceText].join(' '));
 let path='';try{path=normalize(new URL(url).pathname.replace(/[-_]+/g,' '))}catch{}
 const own=text+' '+path;
 const opportunity=/(?:^|\b)(?:grants?|fellowships?|scholarships?|funding|stipends?|bolsas?|editais?|financiamento|awards?|prizes?|contests?|competitions?|opportunities)(?:$|\b)|\bcall\s+for\s+(?:applications?|proposals?)\b|\bapplications?\s+(?:are\s+)?open\b/.test(own);
 if(opportunity&&!/\b(?:conference|webinar|podcast|interview|guide|report|news|announces? winners?|selected for|awarded to|award winning|winners?|finalists?)\b/.test(text))return 'opportunities';
 if(/\b(?:datasets?|databases?|data catalog(?:ue)?s?|open data|microdata|microdados|dados abertos|base de dados)\b/.test(own))return 'datasets';
 if(/\b(?:tools?|software|platforms?|data visualization|data visualisation|mapping|charting|plugins?|extensions?|libraries|frameworks|ferramentas|plataformas|aplicativos)\b/.test(own))return 'tools';
 return 'uncategorized';
}
module.exports={classifyLead};
