#!/usr/bin/env node
// Public RJI boundary: the browser bundle may contain catalog metadata only.
// Profile-dependent ratings and pauta relationships must arrive through the
// authenticated private overlay, never through a public static asset.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const html = fs.readFileSync('index.html', 'utf8');
assert.match(html, /data\/public-opportunities\.js\?v=/, 'index must load the sanitized opportunity catalog');
assert.doesNotMatch(html, /data\/opportunities\.js/, 'private editorial source must not be loaded by public HTML');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync('data/public-opportunities.js', 'utf8'), context, { filename: 'data/public-opportunities.js' });
const records = context.window.RADAR_PARTS?.opportunities;
assert.ok(Array.isArray(records) && records.length, 'sanitized public opportunity catalog is empty');

const forbidden = new Set(['fit', 'eligibility', 'story', 'investigation', 'user_id', 'owner_id', 'privateNote']);
const violations = records.flatMap(record => Object.keys(record)
  .filter(key => forbidden.has(key))
  .map(key => record.id + ': ' + key));
assert.equal(violations.length, 0, 'profile-dependent metadata leaked into public catalog: ' + violations.join(', '));
console.log(JSON.stringify({ ok: true, records: records.length, forbiddenFields: [...forbidden] }));