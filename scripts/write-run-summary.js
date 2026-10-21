// Human-readable, public-only GitHub Actions run summary.
const fs=require('node:fs');
const read=name=>JSON.parse(fs.readFileSync('intake/'+name,'utf8'));
const intake=read('source-review.json'),triage=read('candidate-triage.json'),review=read('editorial-review.json'),history=read('lead-history-delta.json');
const coverage=intake.coverage||{},s=history.summary||{};
const persistent=['schedule','workflow_dispatch'].includes(process.env.GITHUB_EVENT_NAME);
const rows=[
 '# Radar PLOT — relatório de descoberta',
 '',
 '| Indicador | Resultado |','|---|---:|',
 '| Fontes consultadas nesta rodada | '+(coverage.checked??(intake.results||[]).length)+' |',
 '| Fontes cadastradas | '+(coverage.totalSources??'não informado')+' |',
 '| Links temáticos encontrados | '+(triage.summary?.linkLeads??0)+' |',
 '| Referências históricas sinalizadas | '+(triage.summary?.historicalReferences??0)+' |',
 '| Candidatos aguardando revisão | '+(review.candidates||[]).length+' |',
 '| Oportunidades candidatas | '+(review.counts?.opportunities??0)+' |',
 '| Bases e dados candidatos | '+(review.counts?.datasets??0)+' |',
 '| Ferramentas candidatas | '+(review.counts?.tools??0)+' |',
 '| Candidatos com metadados alterados | '+(review.historyPrioritization?.counts?.changed??0)+' |',
 '| Candidatos inéditos com histórico carregado | '+(review.historyPrioritization?.counts?.new??0)+' |',
 '| Candidatos recorrentes | '+(review.historyPrioritization?.counts?.returning??0)+' |',
 '| Links inéditos no histórico disponível | '+(s.new??0)+' |',
 '| Links recorrentes | '+(s.returning??0)+' |',
 '| Links com mudanças detectadas | '+(s.changed??0)+' |',
 '',
 persistent?'**Persistência:** gravação programada em job separado; confirmar sucesso do job persist.':'**Persistência:** não gravada (execução de teste/PR).',
 !s.stateLoaded?'**Atenção:** não foi carregado histórico anterior; “inédito” significa apenas novo para esta execução.':'Histórico anterior carregado para comparação.',
 '',
 '**Verificação editorial:** nenhuma oportunidade foi automaticamente aprovada ou publicada.',
 'Menções a datas não equivalem a prazos confirmados. As candidaturas exigem checagem de fonte primária, prazo, elegibilidade e duplicatas.',
 ''
];
const md=rows.join('\n');
fs.writeFileSync('intake/run-summary.md',md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+'\n');
console.log(JSON.stringify({report:'intake/run-summary.md',candidates:(review.candidates||[]).length,historyLoaded:!!s.stateLoaded}));
