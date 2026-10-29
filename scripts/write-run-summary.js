// Human-readable, public-only GitHub Actions run summary.
const fs=require('node:fs');
const {summarizeBacklog}=require('./backlog-health');
const read=name=>JSON.parse(fs.readFileSync('intake/'+name,'utf8'));
const intake=read('source-review.json'),triage=read('candidate-triage.json'),review=read('editorial-review.json'),history=read('lead-history-delta.json');
const coverage=intake.coverage||{},s=history.summary||{};
const sourceResults=intake.results||[];
const productive=sourceResults.filter(x=>x.accessStatus==='accessible'&&(x.leads||[]).length>0);
const empty=sourceResults.filter(x=>x.accessStatus==='accessible'&&!(x.leads||[]).length);
const failed=sourceResults.filter(x=>x.accessStatus!=='accessible');
const dailyFailures=coverage.dailyFailures||[];
const sourceDiagnostics=[...empty.map(x=>({name:x.name,status:'acessível sem links temáticos'})),...failed.map(x=>({name:x.name,status:x.accessStatus+(x.httpStatus?' HTTP '+x.httpStatus:'')}))];
const state=read('lead-history-next.json'),leads=Object.values(state.leads||{});
const historical=leads.filter(x=>x.classification==='needs-editorial-review');
const backlog=summarizeBacklog(state.leads);
const visited=historical.filter(x=>x.lastInspectedAt).length;
const reviewed=historical.filter(x=>x.reviewedAt).length;
const approved=historical.filter(x=>x.editorialStatus==='approved').length;
const published=historical.filter(x=>x.editorialStatus==='published').length;
const persistent=['schedule','workflow_dispatch','push'].includes(process.env.GITHUB_EVENT_NAME) && process.env.GITHUB_REF==='refs/heads/main';
const rows=[
 '# Radar PLOT — relatório de descoberta',
 '',
 '| Indicador | Resultado |','|---|---:|',
 '| Total histórico persistido | '+leads.length+' |',
 '| Fila ativa pendente | '+backlog.pending+' |',
 '| Oportunidades pendentes | '+backlog.pendingOpportunities+' |',
 '| Oportunidades com rechecagem vencida | '+backlog.overdueOpportunities+' |',
 '| Rechecagens vencidas (todas as categorias) | '+backlog.overdueRechecks+' |',
 '| Idade máxima de links sem inspeção (dias) | '+backlog.oldestUninspectedDays+' |',
 '| Dias estimados para primeira passagem, sem novas entradas | '+backlog.estimatedFirstPassDays+' |',
 '| Pendências históricas classificadas para revisão | '+historical.length+' |',
 '| Links históricos com inspeção técnica registrada | '+visited+' |',
 '| Links históricos ainda sem inspeção técnica | '+(historical.length-visited)+' |',
 '| Inspeções técnicas realizadas nesta rodada | '+(s.inspectedHistorical??0)+' |',
 '| Links com decisão editorial registrada | '+reviewed+' |',
 '| Links aprovados no histórico | '+approved+' |',
 '| Links publicados com confirmação no histórico | '+published+' |',
 '| Fontes consultadas nesta rodada | '+(coverage.checked??(intake.results||[]).length)+' |',
 '| Fontes cadastradas | '+(coverage.totalSources??'não informado')+' |',
 '| Fontes diárias esperadas | '+(coverage.dailyExpected??'não informado')+' |',
 '| Fontes diárias consultadas | '+(coverage.dailySelected??'não informado')+' |',
 '| Fontes diárias acessíveis | '+(coverage.dailyAccessible??'não informado')+' |',
 '| Fontes diárias com falha | '+dailyFailures.length+' |',
 '| Fontes com links temáticos extraídos | '+productive.length+' |',
 '| Fontes acessíveis sem links temáticos | '+empty.length+' |',
 '| Fontes bloqueadas ou com falha de rede | '+failed.length+' |',
 '| Links temáticos encontrados | '+(triage.summary?.linkLeads??0)+' |',
 '| Referências históricas sinalizadas | '+(triage.summary?.historicalReferences??0)+' |',
 '| Candidatos aguardando revisão | '+(review.candidates||[]).length+' |',
 '| Pistas com página acessível | '+(review.candidates||[]).filter(x=>x.pageStatus==='accessible').length+' |',
 '| Pistas sem página acessível confirmada | '+(review.candidates||[]).filter(x=>x.pageStatus!=='accessible').length+' |',
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
 '**Pressão da fila:** '+backlog.status+'; a estimativa de dias é um limite teórico com 40 inspeções/dia e não garante prazo.',
 '**Diagnóstico de fontes:** HTTP 200 não confirma extração produtiva; links temáticos ainda não são oportunidades verificadas.',
 ...sourceDiagnostics.slice(0,30).map(x=>'- '+String(x.name||'Fonte sem nome').replace(/[|\\n\\r]/g,' ')+' — '+x.status),
 sourceDiagnostics.length>30?'- Mais '+(sourceDiagnostics.length-30)+' fontes com lacunas no artefato source-review.json.':'',
 '',
 persistent?'**Persistência:** gravação programada em job separado; confirmar sucesso do job persist.':'**Persistência:** não gravada (execução de teste/PR).',
 !s.stateLoaded?'**Atenção:** não foi carregado histórico anterior; “inédito” significa apenas novo para esta execução.':'Histórico anterior carregado para comparação.',
 '',
 '**Verificação editorial:** inspeção técnica não equivale a aprovação. As decisões registradas exigem evidências explícitas.',
 '**Próxima ação:** revisar os candidatos priorizados no artefato editorial-review.json; confirmar fonte primária, escopo, prazo, elegibilidade e duplicatas antes de qualquer inclusão no catálogo.',
 'Menções a datas não equivalem a prazos confirmados. As candidaturas exigem checagem de fonte primária, prazo, elegibilidade e duplicatas.',
 ''
];
const md=rows.join('\n');
fs.writeFileSync('intake/run-summary.md',md);
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md+'\n');
console.log(JSON.stringify({report:'intake/run-summary.md',candidates:(review.candidates||[]).length,historyLoaded:!!s.stateLoaded}));
