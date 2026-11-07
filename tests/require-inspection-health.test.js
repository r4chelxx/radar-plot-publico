const test=require('node:test'),assert=require('node:assert/strict');
const {assertInspectionCoverage}=require('../scripts/require-inspection-health');
test('fails when candidates exist but no page was inspected',()=>assert.throws(()=>assertInspectionCoverage({eligibleCandidates:12,inspected:0,inspectionHealth:{status:'no-inspections'}}),/none were inspected/));
test('accepts inspected links even when all are unavailable',()=>assert.deepEqual(assertInspectionCoverage({eligibleCandidates:2,inspected:2,inspectionHealth:{status:'unavailable',htmlFetched:0}}),{status:'unavailable',inspected:2,candidates:2,htmlFetched:0}));
test('accepts partial technical inspection with evidence',()=>assert.deepEqual(assertInspectionCoverage({eligibleCandidates:40,inspected:40,inspectionHealth:{status:'degraded',htmlFetched:16}}),{status:'degraded',inspected:40,candidates:40,htmlFetched:16}));
test('allows an empty backlog without fabricating an outage',()=>assert.deepEqual(assertInspectionCoverage({eligibleCandidates:0,inspected:0,inspectionHealth:{status:'no-inspections'}}),{status:'no-inspections',inspected:0,candidates:0,htmlFetched:0}));
