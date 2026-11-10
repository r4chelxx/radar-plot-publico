'use strict';
// Classify from the lead itself, never from its provider/source name.
function normalize(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function classifyLead({title='',url='',pageTitle='',evidenceText=''}={}){
 const text=normalize([title,pageTitle,evidenceText].join(' '));
 let path='';try{path=normalize(new URL(url).pathname)}catch{}
 const own=text+' '+path;
 if(/\bgrants? (?:broad|permission|permissions|access|rights|authority|powers?)\b/.test(text))return 'uncategorized';
 const opportunity=/\b(?:grants?|fellowships?|scholarships?|funding|stipends?|bolsas?|editais?|financiamento|awards?|prizes?|contests?|competitions?|opportunities|residencies)\b|\bcall for (?:applications?|proposals?)\b|\bapplications? (?:are )?open\b/.test(own);
 if(opportunity&&!/\b(?:conference|webinar|podcast|interview|guide|report|news|announces? winners?|selected for|awarded to|award winning|winners?|finalists?)\b/.test(text))return 'opportunities';
 if(/\b(?:datasets?|databases?|data catalogs?|data catalogues?|open data|microdata|microdados|dados abertos|base de dados)\b/.test(own))return 'datasets';
 if(/\b(?:tools?|software|platforms?|data visualization|data visualisation|mapping|charting|plugins?|extensions?|libraries|frameworks|ferramentas|plataformas|aplicativos|toolkit)\b/.test(own))return 'tools';
 return 'uncategorized';
}
module.exports={classifyLead};
