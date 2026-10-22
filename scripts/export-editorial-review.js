#!/usr/bin/env node
// Human-readable editorial handoff; no approval or publication.
const fs=require('node:fs');
const sample=JSON.parse(fs.readFileSync('intake/editorial-review-sample.json','utf8'));
const safe=s=>String(s||'').replace(/[\r\n|]/g,' ').trim();
const lines=['# Radar PLOT — Conferência editorial','','Amostra de candidatos não verificados. Confirmar fonte oficial, prazo, elegibilidade, categoria e duplicatas antes de publicar.','','| Prioridade | Título | URL | Procedência |','| --- | --- | --- | --- |'];
for(const item of sample.selected||[])lines.push('| '+safe(item.priority)+' | '+safe(item.title)+' | '+safe(item.url)+' | '+safe((item.providers?.length?item.providers:item.origins||[]).map(x=>typeof x==='string'?x:(x.source||'unknown')).join(', '))+' |');
lines.push('','Nenhum item desta lista foi aprovado ou publicado automaticamente.','');
fs.writeFileSync('intake/editorial-review.md',lines.join('\n'));
console.log(JSON.stringify({exported:(sample.selected||[]).length}));
