#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function mergeSourceApprovals(manifest, source) {
  if (!manifest || !Array.isArray(manifest.approved) || !source || !Array.isArray(source.decisions)) {
    throw new Error('Target manifest and source decisions are required');
  }

  const seenIds = new Set(manifest.approved.map(entry => String(entry?.record?.id || '')));
  const seenUrls = new Set(manifest.approved.map(entry => {
    const category = String(entry?.category || '');
    const url = String(entry?.record?.url || '');
    return category && url ? category + '|' + url.replace(/#.*$/, '').replace(/\/$/, '').toLowerCase() : '';
  }).filter(Boolean));

  const added = [];
  for (const decision of source.decisions) {
    const review = decision?.publicationReviewV1 || {};
    const record = decision?.record || {};
    if (decision?.status !== 'approved'
      || review.decision !== 'approved'
      || review.reviewPolicyVersion !== 'radar-evidence-v1'
      || review.reviewedBy !== 'Radar evidence gate v1'
      || !record.id || !record.url) continue;

    const entry = { category: decision.category, record, review };
    const urlKey = String(entry.category || '') + '|' + String(record.url).replace(/#.*$/, '').replace(/\/$/, '').toLowerCase();
    if (seenIds.has(String(record.id)) || seenUrls.has(urlKey)) continue;

    manifest.approved.push(entry);
    seenIds.add(String(record.id));
    seenUrls.add(urlKey);
    added.push(entry);
  }

  return {
    manifest,
    added,
    byCategory: Object.fromEntries(['opportunities', 'tools', 'datasets'].map(category => [
      category,
      added.filter(entry => entry.category === category).length
    ]))
  };
}

if (require.main === module) {
  const [targetPath, sourcePath, outputPath] = process.argv.slice(2);
  if (!targetPath || !sourcePath || !outputPath) {
    console.error('Usage: merge-source-approvals.js <target> <source-decisions> <output>');
    process.exit(2);
  }
  const target = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
  const result = mergeSourceApprovals(target, source);
  fs.writeFileSync(outputPath, JSON.stringify(result.manifest, null, 2) + '\n');
  console.log(JSON.stringify({ added: result.added.length, byCategory: result.byCategory }));
}

module.exports = { mergeSourceApprovals };
