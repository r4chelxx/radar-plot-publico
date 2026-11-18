'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hasDocumentedToolFunction } = require('../scripts/tool-publication-evidence');

test('official software documentation describing APIs and data workflows counts as product function evidence', () => {
  assert.equal(hasDocumentedToolFunction('High-level APIs offer a shallow learning curve. Interoperable data formats support processing and analysis.'), true);
});

test('generic page chrome and directory labels do not establish software function', () => {
  assert.equal(hasDocumentedToolFunction('Reporting Tools. Read more. Download a PDF.'), false);
});
