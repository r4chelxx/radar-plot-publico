// Prioritize public-source editorial candidates without declaring them verified.
const fs=require('node:fs');
const {identity}=require('./lead-identity');
const review=JSON.parse(fs.readFileSync('intake/editorial-review.json','utf8'));
const history=JSON.parse(fs.readFileSync('intake/lead-history-delta.json','utf8'));
const delta=history.delta||{},loaded=history.summary?.stateLoaded===true;
const news=new Set((delta.new||[]).map(x=>x.id));
const changes=new Set((delta.changed||[]).map(x=>x.id));
const recurring=new Set((delta.returning||[]).map(x=>x.id));
const rank={changed:0,new:1,returning:2,unknown:3,uninitialized:4};
const counts={changed:0,new:0,returning:0,unknown:0,uninitialized:0};
for(const candidate of review.candidates||[]){
 let status='unknown',id=null;
 try{id=identity(candidate.url).id}catch{}
 if(!loaded)status='uninitialized';
 else if(id&&changes.has(id))status='changed';
 else if(id&&news.has(id))status='new';
 else if(id&&recurring.has(id))status='returning';
 candidate.historyStatus=status;
 candidate.priority=rank[status]+1;
 candidate.priorityReason={changed:'Metadados do link mudaram desde a última observação',new:'URL não encontrada no histórico persistido',returning:'URL já vista anteriormente',unknown:'Não foi possível correlacionar com o histórico',uninitialized:'Histórico anterior indisponível nesta execução'}[status];
 counts[status]++;
}
review.candidates.sort((a,b)=>a.priority-b.priority||String(a.category).localeCompare(String(b.category))||String(a.title).localeCompare(String(b.title)));
review.historyPrioritization={stateLoaded:loaded,counts,policy:'Prioridade de revisão, não validade, elegibilidade ou aprovação. Sem histórico carregado, não há classificação de novidade.'};
fs.writeFileSync('intake/editorial-review.json',JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify(review.historyPrioritization));
