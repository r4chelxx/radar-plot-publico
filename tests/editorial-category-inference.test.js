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
 ['Legal experts warn new terms grant broad scraping permissions','uncategorized'],
 ['Data visualization toolkit','uncategorized'],
])test(title,()=>assert.equal(context.inferCategory(title),expected));

const technical=source.match(/function inferTechnicalCategory\(item\)\{[\s\S]*?\n\}/);
assert.ok(technical,'technical category inference must exist');
vm.runInContext(technical[0]+';this.inferTechnicalCategory=inferTechnicalCategory;',context);
for(const [title,expected] of [
 ['Scikit-learn','tools'],['TouchDesigner','tools'],['BigQuery GIS','tools'],
 ['Open Data Portal','datasets'],['Dataset catalog','datasets'],
 ['Conference on open data portals','uncategorized'],['Data visualization conference','uncategorized'],
 ['The Guardian','uncategorized']
])test('technical: '+title,()=>assert.equal(context.inferTechnicalCategory({title,url:'https://example.org/'}),expected));
