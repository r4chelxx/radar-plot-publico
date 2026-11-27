'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { buildDrafts } = require('../scripts/build-editorial-record-drafts');

test('attributes CVM CKAN dataset pages to the agency and removes the portal suffix', () => {
  const id = 'cvm-dataset-fixture';
  const url = 'https://dados.cvm.gov.br/dataset/adm_fii-cad';
  const page = {
    id, title: 'Administradores de FII: Informação Cadastral',
    url, source: 'CVM — Dados Abertos',
    audit: {
      finalUrl: url,
      pageTitle: 'Administradores de FII: Informação Cadastral - Portal Dados Abertos CVM',
      pageDescription: 'Dados cadastrais de Administradores de Fundos de Investimento Imobiliário.',
      evidenceText: 'CVM — Portal Dados Abertos. Dados cadastrais de Administradores de Fundos de Investimento Imobiliário. Dados e recursos CSV. Periodicidade de atualização diária.',
      checkedAt: '2026-11-27T19:25:38.018Z',
      httpStatus: 200,
      contentType: 'text/html; charset=utf-8',
      tabularData: [{ rows: 9, columns: 2 }],
      resourceLinks: [],
      structuredData: []
    }
  };
  const checks = {
    datasetSignal: true, directResource: true, webAccess: true,
    format: true, coverage: true
  };
  const result = buildDrafts(
    { candidates: [page] },
    { records: [{ id, category: 'datasets', decision: 'evidence_complete_for_record_draft', publicationReady: false, checks }] }
  );
  assert.equal(result.drafts.length, 1);
  assert.equal(result.drafts[0].recordDraft.org, 'Comissão de Valores Mobiliários (CVM)');
  assert.equal(result.drafts[0].recordDraft.name, 'Administradores de FII: Informação Cadastral');
  assert.deepEqual(result.drafts[0].missingFields, []);
});
