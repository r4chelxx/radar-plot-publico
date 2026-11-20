const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

test('public HTML loads the sanitized catalog and never the editorial source bundle',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.match(html,/data\/public-opportunities\.js\?v=privacy-20261120/);
 assert.doesNotMatch(html,/data\/opportunities\.js/);
});

test('public opportunity catalog omits profile-dependent fields',()=>{
 const ctx={window:{}};
 vm.createContext(ctx);
 vm.runInContext(fs.readFileSync('data/public-opportunities.js','utf8'),ctx);
 const rows=ctx.window.RADAR_PARTS.opportunities;
 assert.ok(rows.length>0);
 assert.ok(rows.every(row=>!Object.prototype.hasOwnProperty.call(row,'fit')));
 assert.ok(rows.every(row=>!Object.prototype.hasOwnProperty.call(row,'eligibility')));
 assert.ok(rows.every(row=>!Object.prototype.hasOwnProperty.call(row,'story')));
});
