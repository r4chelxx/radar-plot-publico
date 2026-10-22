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
const failures=r.sources.filter(x=>x.status!=='ok');
if(!failures.length)lines.push('Nenhuma falha identificada.');
else for(const item of failures)lines.push('- '+item.name+': '+(item.error||'falha desconhecida').replace(/[\r\n]/g,' '));
lines.push('','**Observação:** links candidatos não são publicados sem verificação editorial. Gmail e LinkedIn ainda não fazem parte da coleta automática.');
const text=lines.join('\n')+'\n';
if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,text);
else process.stdout.write(text);
