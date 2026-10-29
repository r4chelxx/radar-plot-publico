const test=require('node:test'),assert=require('node:assert/strict');
const {auditCapacity}=require('../scripts/audit-capacity');
const now=new Date('2026-10-29T12:00:00Z');
function history(n){return Object.fromEntries(Array.from({length:n},(_,i)=>[String(i),{category:i%2?'opportunities':'datasets',classification:'needs-editorial-review',firstSeen:'2026-10-01T12:00:00Z'}]));}
test('normal backlog retains baseline 40 inspections',()=>{assert.equal(auditCapacity(history(50),now).limit,40)});
test('medium backlog increases to 45 inspections',()=>{assert.equal(auditCapacity(history(150),now).limit,45)});
test('high backlog increases to maximum 50 inspections',()=>{assert.equal(auditCapacity(history(300),now).limit,50)});
test('published leads do not inflate backlog capacity',()=>{const h=history(300);for(const x of Object.values(h))x.editorialStatus='published';assert.equal(auditCapacity(h,now).limit,40)});
