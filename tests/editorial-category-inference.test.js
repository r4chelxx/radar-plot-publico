const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync('scripts/merge-editorial-queue.js','utf8');
const fn=source.match(/function inferCategory\(title\)\{[\s\S]*?\n\}/);
assert.ok(fn,'inference function must exist');
const context=vm.createContext({});
vm.runInContext(fn[0]+';this.inferCategory=inferCategory;',context);
for(const [title,expected] of [
 ['United Nations DPoA MTR Journalism Fellowship 2027','opportunities'],
 ['Mozilla Foundation Fellowships 2027-2028','opportunities'],
 ['Call for Applications: Investigative Journalism Fellowship','opportunities'],
 ['Scholarship applications open','opportunities'],
 ['Journalist selected for fellowship','uncategorized'],
 ['Conference on journalism grants','uncategorized'],
 ['Report about grant funding','uncategorized'],
 ['Data visualization toolkit','uncategorized'],
])test(title,()=>assert.equal(context.inferCategory(title),expected));
