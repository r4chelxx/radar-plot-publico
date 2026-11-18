'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { mergeSourceApprovals } = require('../scripts/merge-source-approvals');

const review = {
  decision: 'approved',
  reviewedBy: 'Radar evidence gate v1',
  reviewPolicyVersion: 'radar-evidence-v1'
};
const record = (id, url) => ({ id, url, name: id, kind: 'data tool', desc: 'Verified product with documented function and access.' });
const decision = (category, id, url, overrides = {}) => ({
  category,
  status: 'approved',
  record: record(id, url),
  publicationReviewV1: { ...review, ...overrides }
});

test('merges only approvals made by this run and preserves manual approvals', () => {
  const manual = { category: 'opportunities', record: record('manual', 'https://example.org/manual'), review: { reviewedBy: 'Rachel' } };
  const approved = decision('tools', 'earthkit', 'https://earthkit.ecmwf.int/');
  const source = {
    decisions: [
      approved,
      decision('tools', 'unreviewed', 'https://example.org/unreviewed', { reviewPolicyVersion: null }),
      decision('tools', 'rejected', 'https://example.org/rejected', { decision: 'rejected' })
    ],
    approved: [{ category: 'tools', record: record('stale-legacy', 'https://example.org/stale'), review }]
  };
  const result = mergeSourceApprovals({ schemaVersion: 1, approved: [manual] }, source);
  assert.deepEqual(result.manifest.approved, [manual, { category: 'tools', record: approved.record, review: approved.publicationReviewV1 }]);
  assert.equal(result.added.length, 1);
  assert.deepEqual(result.byCategory, { opportunities: 0, tools: 1, datasets: 0 });
});

test('deduplicates current decisions by id and canonicalized URL', () => {
  const existing = { category: 'tools', record: record('known', 'https://example.org/tool/'), review };
  const source = { decisions: [
    decision('tools', 'known', 'https://example.org/other'),
    decision('tools', 'new-id', 'https://example.org/tool')
  ] };
  const result = mergeSourceApprovals({ approved: [existing] }, source);
  assert.equal(result.added.length, 0);
  assert.deepEqual(result.manifest.approved, [existing]);
});

test('does not mutate the target with unverified or incomplete decisions', () => {
  const target = { approved: [] };
  const source = { decisions: [
    { category: 'tools', record: record('missing-review', 'https://example.org/a') },
    { category: 'tools', record: { id: 'missing-url' }, publicationReviewV1: review },
    { category: 'tools', status: 'rejected', record: record('rejected', 'https://example.org/r'), publicationReviewV1: review }
  ] };
  const result = mergeSourceApprovals(target, source);
  assert.equal(result.added.length, 0);
  assert.deepEqual(target.approved, []);
});
