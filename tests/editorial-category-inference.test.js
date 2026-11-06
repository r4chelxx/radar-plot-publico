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

const categoryForSource=source.match(/function categoryFor\(item\)\{[\s\S]*?\n\}/);
assert.ok(categoryForSource,'category resolver must exist');
vm.runInContext(categoryForSource[0]+';this.categoryFor=categoryFor;',context);
for(const [item,expected] of [
 [{title:'Legal experts warn terms grant broad scraping permissions',category:'opportunities'},'uncategorized'],
 [{title:'Grant access to a private dataset',category:'opportunities'},'uncategorized'],
 [{title:'Felt',category:'uncategorized'},'tools'],
 [{title:'World Bank Open Data',category:'uncategorized'},'datasets'],
 [{title:'Investigative Journalism Fellowship',category:'uncategorized'},'opportunities'],
 [{title:'Journalism conference',category:'uncategorized'},'uncategorized'],
])test('category resolution: '+item.title,()=>assert.equal(context.categoryFor(item),expected));

for(const name of ['chromote','React Three Fiber (R3F)','color.adobe.com','Bluesky']){
 test('known technical lead: '+name,()=>assert.equal(context.inferTechnicalCategory({title:name,url:'https://example.org/'}),'tools'));
}

for(const [title,expected] of [
 ['Award The Sigma Awards','opportunities'],
 ['Award The Philip Meyer Journalism Award','opportunities'],
 ['Award-winning visualization guide','uncategorized'],
 ['Conference on journalism prizes','uncategorized'],
])test('award discovery: '+title,()=>assert.equal(context.inferCategory(title),expected));
for(const [title,expected] of [
 ['ai2html','tools'],['Datawrapper.de ↗','tools'],['Power BI','tools'],
 ['PMTiles','tools'],['WebGPU & WGSL','tools'],['World Bank Open Data','datasets'],
])test('expanded resource classification: '+title,()=>assert.equal(context.inferTechnicalCategory({title,url:'https://example.org/'}),expected));
