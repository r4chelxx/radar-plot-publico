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

test('merges only evidence-gated approvals without replacing manual approvals', () => {
  const manual = { category: 'opportunities', record: record('manual', 'https://example.org/manual'), review: { reviewedBy: 'Rachel' } };
  const approved = { category: 'tools', record: record('earthkit', 'https://earthkit.ecmwf.int/'), review };
  const source = {
    approved: [
      approved,
      { category: 'tools', record: record('unreviewed', 'https://example.org/unreviewed'), review: { decision: 'approved' } },
      { category: 'tools', record: record('rejected', 'https://example.org/rejected'), review: { ...review, decision: 'rejected' } }
    ]
  };
  const result = mergeSourceApprovals({ schemaVersion: 1, approved: [manual] }, source);
  assert.deepEqual(result.manifest.approved, [manual, approved]);
  assert.equal(result.added.length, 1);
  assert.deepEqual(result.byCategory, { opportunities: 0, tools: 1, datasets: 0 });
});

test('deduplicates source approvals by id and canonicalized URL', () => {
  const existing = { category: 'tools', record: record('known', 'https://example.org/tool/'), review };
  const source = { approved: [
    { category: 'tools', record: record('known', 'https://example.org/other'), review },
    { category: 'tools', record: record('new-id', 'https://example.org/tool'), review }
  ] };
  const result = mergeSourceApprovals({ approved: [existing] }, source);
  assert.equal(result.added.length, 0);
  assert.deepEqual(result.manifest.approved, [existing]);
});

test('does not mutate the target with unverified or incomplete source rows', () => {
  const target = { approved: [] };
  const result = mergeSourceApprovals(target, { approved: [
    { category: 'tools', record: record('missing-review', 'https://example.org/a') },
    { category: 'tools', record: { id: 'missing-url' }, review }
  ] });
  assert.equal(result.added.length, 0);
  assert.deepEqual(target.approved, []);
});
