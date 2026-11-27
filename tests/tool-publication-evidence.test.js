'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { hasDocumentedToolFunction, isEditorialPage } = require('../scripts/tool-publication-evidence');

test('official software documentation describing APIs and data workflows counts as product function evidence', () => {
  assert.equal(hasDocumentedToolFunction('High-level APIs offer a shallow learning curve. Interoperable data formats support processing and analysis.'), true);
});

test('generic page chrome and directory labels do not establish software function', () => {
  assert.equal(hasDocumentedToolFunction('Reporting Tools. Read more. Download a PDF.'), false);
});

test('a press release page cannot pass as a software product', () => {
  const record = {
    name: 'Warren, Balint, Colleagues Demand Answers from McDonald’s on Whether AI Pricing Tools Are Raising Prices and Facilitating Collusion',
    url: 'https://www.warren.senate.gov/newsroom/press-releases/warren-balint-colleagues-demand-answers-from-mcdonalds-on-whether-ai-pricing-tools-are-raising-prices-and-facilitating-collusion/'
  };
  assert.equal(isEditorialPage(record, {}), true);
});

test('article structured data is recognized on an otherwise generic URL', () => {
  assert.equal(isEditorialPage(
    { name: 'Research update', url: 'https://example.org/item/123' },
    { evidence: '{"@type":"NewsArticle"}' }
  ), true);
});

test('a direct software product and documentation page remains eligible for review', () => {
  assert.equal(isEditorialPage(
    { name: 'Data Explorer', url: 'https://example.org/products/data-explorer' },
    { evidence: 'The application provides filters, exports CSV, and documents its API.' }
  ), false);
});
