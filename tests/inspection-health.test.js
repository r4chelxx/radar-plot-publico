const test=require('node:test'),assert=require('node:assert/strict');
const {inspectionHealth}=require('../scripts/inspection-health');
test('healthy run with 39 of 40 HTML pages',()=>{const r=inspectionHealth({'html-fetched':39,'http-error':1},40);assert.equal(r.status,'healthy');assert.equal(r.degraded,false)});
test('partial outage 16 of 40 is degraded',()=>{const r=inspectionHealth({'html-fetched':16,'http-error':23,'non-html':1},40);assert.equal(r.status,'degraded');assert.equal(r.failures,24);assert.equal(r.successRate,0.4)});
test('zero HTML fails closed',()=>{const r=inspectionHealth({'http-error':40},40);assert.equal(r.status,'unavailable');assert.equal(r.degraded,true)});
test('empty selection is not an outage',()=>{const r=inspectionHealth({},0);assert.equal(r.status,'no-inspections');assert.equal(r.degraded,false)});
