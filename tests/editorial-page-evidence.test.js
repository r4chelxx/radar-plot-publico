#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const {extractEvidence}=require('../scripts/editorial-page-evidence');
const sample=`<html><header>Top menu</header><nav>Navigation links</nav><main>
<title>Ignored by visible text extractor</title>
<h1>Open Data Catalog</h1><p>Download annual CSV files about municipal services.</p><a href="/datasets/municipal.csv">Download municipal dataset</a>
<script type="application/ld+json">{"@type":"Dataset","name":"Municipal Services","description":"Annual public-service records","license":"https://creativecommons.org/publicdomain/zero/1.0/","distribution":{"@type":"DataDownload","contentUrl":"https://example.org/data.csv","encodingFormat":"text/csv"},"temporalCoverage":"2020/2025","spatialCoverage":"Example country"}</script>
<script type="application/ld+json">not valid json</script>
<footer>Footer menu</footer></main></html>`;
const result=extractEvidence(sample,'https://example.org/catalog');
assert.match(result.evidenceText,/Open Data Catalog/);
assert.match(result.evidenceText,/Download annual CSV/);
assert.doesNotMatch(result.evidenceText,/Top menu|Navigation links|Footer menu|not valid json/);
assert.equal(result.structuredData.length,1);
assert.equal(result.structuredData[0]['@type'],'Dataset');
assert.equal(result.structuredData[0].distribution.contentUrl,'https://example.org/data.csv');
assert.equal(result.structuredData[0].distribution.encodingFormat,'text/csv');
assert.equal(result.structuredData[0].license,'https://creativecommons.org/publicdomain/zero/1.0/');
assert.deepEqual(result.resourceLinks,[{url:'https://example.org/datasets/municipal.csv',label:'Download municipal dataset'}]);
const malformed=extractEvidence('<script type="application/ld+json">{bad}</script><p>Still readable &amp; safe</p>');
assert.equal(malformed.structuredData.length,0);
assert.match(malformed.evidenceText,/Still readable & safe/);
const oversized=extractEvidence('<p>'+('x'.repeat(6000))+'</p>');
assert.equal(oversized.evidenceText.length,5000);
console.log('Primary-source evidence extraction regression passed');
