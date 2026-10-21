const test=require('node:test'),assert=require('node:assert/strict');
const {canonical,identity}=require('../scripts/lead-identity');
test('public history excludes tokens and email tracking identifiers',()=>{
 const raw='https://example.org/grant?id=123&token=SECRET&email=someone%40example.org&utm_campaign=x&lang=PT';
 assert.equal(canonical(raw),'https://example.org/grant?id=123&lang=pt');
 assert.equal(identity(raw).id,identity('https://example.org/grant?lang=pt&id=123').id);
});
test('public history rejects credentials and internal URLs',()=>{
 for(const url of ['https://user:pass@example.org/a','http://127.0.0.1/x','http://localhost/x','https://private.internal/x','ftp://example.org/x'])assert.throws(()=>canonical(url));
});
test('distinct numeric public page IDs remain distinct',()=>{
 assert.notEqual(identity('https://example.org/?p=10').id,identity('https://example.org/?p=11').id);
});
