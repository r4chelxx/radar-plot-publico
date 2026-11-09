#!/usr/bin/env node
// Produce GitHub Actions step summary without treating unavailable feeds as missing opportunities.
const fs=require('node:fs');
const r=JSON.parse(fs.readFileSync('intake/discovery-operations.json','utf8'));
const lines=['## Radar PLOT — Descoberta diária','',
 '| Indicador | Quantidade |','| --- | ---: |',
 '| Fontes operacionais | '+r.totals.healthy+' |',
 '| Fontes com erro | '+r.totals.failed+' |',
 '| Links candidatos | '+r.totals.candidates+' |',
 '| Links já no catálogo | '+r.totals.catalogMatches+' |',
 '| Revisão editorial pendente | '+r.totals.needsReview+' |','','### Fontes com falha'];
const funnel=r.editorialFunnel||{};
const queueAvailable=r.editorialQueueSource==='radar-state';
lines.push('','### Funil editorial persistido',
 '- Origem do snapshot: '+(r.editorialQueueSource||'indisponível'),
 '- Atualizado em: '+(r.editorialQueueUpdatedAt||'não informado'),
 '- Pendentes: '+(queueAvailable?(funnel.pending??'indisponível'):'indisponível (snapshot não carregado)'),
 '- Pendentes há 14+ dias: '+(queueAvailable?(funnel.pendingAging?.olderThan14Days??'indisponível'):'indisponível'),
 '- Pendentes há 30+ dias: '+(queueAvailable?(funnel.pendingAging?.olderThan30Days??'indisponível'):'indisponível'),
 '- Pendentes sem data inicial: '+(queueAvailable?(funnel.pendingAging?.missingFirstSeen??'indisponível'):'indisponível'),
 '- Candidatos novos nesta execução (comparação com snapshot): '+(funnel.currentRunNewCandidates??'indisponível'),
 '- Pendências por categoria: '+(queueAvailable?Object.entries(funnel.pendingByCategory||{}).map(([k,v])=>k+'='+v).join(', '):'indisponível'),
 '- Oportunidades classificadas pendentes: '+(queueAvailable?(funnel.classifiedOpportunityPending??'indisponível'):'indisponível'),
 '- Pendentes sem classificação: '+(queueAvailable?(funnel.unclassifiedPending??'indisponível')+' ('+(funnel.unclassifiedShare??'indisponível')+'%)':'indisponível'),
 '- Sinais heurísticos de oportunidades: '+(queueAvailable?(funnel.opportunitySignalPending??'indisponível'):'indisponível'),
 '- Pendência mais antiga: '+(queueAvailable?(funnel.oldestPendingFirstSeen||'não informado'):'indisponível'));
if(!queueAvailable)lines.push('A fila persistida não foi carregada; os números do funil não são apresentados como zero.');
lines.push('A categoria desconhecida indica registros legados sem classificação. Sinais por palavras-chave não equivalem a editais verificados.');
lines.push('','### Cobertura por família de fontes');
for(const [name,x] of Object.entries(r.coverage||{}))lines.push('- '+name+': '+x.healthy+'/'+x.total+' fontes acessíveis ('+(x.recovered||0)+' recuperadas); '+x.candidates+' links coletados');
lines.push('','### Gmail e LinkedIn — cobertura diária');
for(const name of ['gmail','linkedin']){
 const family=r.coverage?.[name];
 if(!family)continue;
 lines.push('- '+name+': '+family.healthy+'/'+family.total+' consultas disponíveis; '+family.candidates+' candidatos; '+family.failed+' falhas.');
}
lines.push('**Limitação:** Gmail depende de credenciais OAuth de leitura configuradas; LinkedIn usa busca pública indexada, sem garantia de cobertura completa.');
lines.push('- Gmail configurado nesta execução: '+(r.sourceLimitations?.gmailConfigured===true?'sim':'não confirmado')+'.');
lines.push('- Cobertura integral do LinkedIn confirmada: não.');
lines.push('- Publicação de novos registros confirmada por este relatório: não.');
lines.push('','**Estado da coleta:** '+(r.overallStatus||'unknown'));
for(const warning of r.warnings||[])lines.push('- Atenção: '+warning);
const failures=r.sources.filter(x=>x.status!=='ok'&&x.status!=='fallback');
const recovered=r.sources.filter(x=>x.status==='fallback');
lines.push('','### Fontes recuperadas por alternativa oficial');
if(!recovered.length)lines.push('Nenhuma recuperação necessária.');
else for(const item of recovered)lines.push('- '+item.name+': '+item.candidates+' candidatos; origem primária indisponível.');
if(!failures.length)lines.push('Nenhuma falha identificada.');
else for(const item of failures)lines.push('- '+item.name+': '+(item.error||'falha desconhecida').replace(/[\r\n]/g,' '));
lines.push('','**Observação:** links candidatos não são publicados sem verificação editorial. Este workflow tenta consultar o Gmail com OAuth quando configurado e pesquisa posts públicos indexados do LinkedIn; a cobertura é parcial e nenhum candidato é automaticamente aprovado.');
const text=lines.join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
else process.stdout.write(text);
