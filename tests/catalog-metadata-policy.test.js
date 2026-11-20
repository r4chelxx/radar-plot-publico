'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const policy=require('../scripts/catalog-metadata-policy');

test('requires category-specific identity, source and metadata',()=>{
  const result=policy.qualityRecord('datasets',{id:'d1',name:'Censo',org:'IBGE',territoryTier:'Brasil',kind:'dataset',themes:['Dados abertos'],coverage:'Brasil',format:'CSV',docs:'https://example.org/docs',limitations:'não informado',lastChecked:'2026-11-19',url:'https://example.org'});
  assert.equal(result.quality,'complete');
  assert.deepEqual(result.missing,[]);
});

test('reports missing metadata without inventing values',()=>{
  const result=policy.qualityRecord('opportunities',{id:'o1',title:'Grant',themes:['Jornalismo']});
  assert.equal(result.quality,'needs-review');
  assert.ok(result.missing.includes('org'));
  assert.ok(result.missing.includes('rules'));
});

test('flags generic or promotional tool titles',()=>{
  assert.equal(policy.toolTitleIssue({name:'Ferramentas'}),'generic');
  assert.equal(policy.toolTitleIssue({name:'World Bank Open Data | Data'}),'promotional');
  assert.equal(policy.toolTitleIssue({name:'Datawrapper'}),null);
});

test('builds deterministic recommendation explanations from tags',()=>{
  const result=policy.explainRecommendation({category:'datasets',themes:['Jornalismo de dados','Saúde']},['saude','futebol']);
  assert.deepEqual(result.matchedTags,['saude']);
  assert.equal(result.score,1);
  assert.match(result.reason,/saude/);
});

test('summarizes quality without changing records',()=>{
  const items=[{id:'t1',name:'Datawrapper',kind:'visualização',url:'https://example.org',desc:'charts',themes:['Visualização']}];
  const before=JSON.stringify(items);
  const result=policy.summarizeQuality('tools',items);
  assert.equal(result.total,1);
  assert.equal(JSON.stringify(items),before);
});
