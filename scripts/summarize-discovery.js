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
lines.push('','### Funil editorial persistido',
 '- Origem do snapshot: '+(r.editorialQueueSource||'indisponível'),
 '- Atualizado em: '+(r.editorialQueueUpdatedAt||'não informado'),
 '- Pendentes: '+(funnel.pending??'indisponível'),
 '- Candidatos novos nesta execução (comparação com snapshot): '+(funnel.currentRunNewCandidates??'indisponível'),
 '- Pendências por categoria: '+Object.entries(funnel.pendingByCategory||{}).map(([k,v])=>k+'='+v).join(', '),
 '- Sinais heurísticos de oportunidades: '+(funnel.opportunitySignalPending??'indisponível'),
 '- Pendência mais antiga: '+(funnel.oldestPendingFirstSeen||'não informado'));
lines.push('A categoria desconhecida indica registros legados sem classificação. Sinais por palavras-chave não equivalem a editais verificados.');
lines.push('','### Cobertura por família de fontes');
for(const [name,x] of Object.entries(r.coverage||{}))lines.push('- '+name+': '+x.healthy+'/'+x.total+' fontes acessíveis ('+(x.recovered||0)+' recuperadas); '+x.candidates+' links coletados');
lines.push('','**Estado da coleta:** '+(r.overallStatus||'unknown'));
for(const warning of r.warnings||[])lines.push('- Atenção: '+warning);
const failures=r.sources.filter(x=>x.status!=='ok'&&x.status!=='fallback');
const recovered=r.sources.filter(x=>x.status==='fallback');
lines.push('','### Fontes recuperadas por alternativa oficial');
if(!recovered.length)lines.push('Nenhuma recuperação necessária.');
else for(const item of recovered)lines.push('- '+item.name+': '+item.candidates+' candidatos; origem primária indisponível.');
if(!failures.length)lines.push('Nenhuma falha identificada.');
else for(const item of failures)lines.push('- '+item.name+': '+(item.error||'falha desconhecida').replace(/[\r\n]/g,' '));
lines.push('','**Observação:** links candidatos não são publicados sem verificação editorial. Gmail não é coletado por este workflow; LinkedIn depende de arquivo público de entrada previamente revisado.');
const text=lines.join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
else process.stdout.write(text);
