'use strict';
// CI guard for the daily-cadence collector. Does not make network requests.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {loadSources}=require('../scripts/load-source-catalog');
const source=fs.readFileSync('scripts/source-intake.js','utf8');
new vm.Script(source,{filename:'scripts/source-intake.js'});
const {sources}=loadSources();
const daily=sources.filter(s=>s.cadence==='diária');
assert.ok(daily.length>=20,'Daily source coverage unexpectedly dropped below 20 unique URLs');
assert.match(source,/const daily = unique\.filter\(s=>s\.cadence==='diária'\)/);
assert.match(source,/\[\.\.\.daily,\.\.\.selected\]/);
assert.match(source,/dailyFailures/);
assert.match(source,/accessSummary/);
assert.match(source,/const blockedSources=results\.filter\(item=>item\.httpStatus===403\|\|item\.httpStatus===429\)/);
assert.match(source,/const httpFailures=results\.filter\(item=>item\.accessStatus==='http-error'\)/);
assert.match(source,/dailyFailures,blockedSources,httpFailures,networkFailures,coverageGaps,accessSummary/);
assert.match(source,/httpFailures:httpFailures\.length/);
assert.match(source,/const networkFailures=results\.filter\(item=>item\.accessStatus==='failed'\)/);
assert.match(source,/networkCode/);
assert.match(source,/coverageGaps=results\.filter/);
assert.match(source,/coverageStatus:'partial'/);
console.log(JSON.stringify({syntax:'ok',uniqueSources:sources.length,dailyUnique:daily.length,collectorDailySelection:'ok'}));

const summary=fs.readFileSync('scripts/write-run-summary.js','utf8');
for(const indicator of ['Fontes diárias esperadas','Fontes diárias consultadas','Fontes diárias acessíveis','Fontes diárias com falha','Fontes com links temáticos extraídos','Fontes acessíveis sem links temáticos','Fontes bloqueadas ou com falha de rede'])assert.ok(summary.includes(indicator),'Missing source health indicator: '+indicator);
assert.match(summary,/sourceDiagnostics/);
