const test=require('node:test');const assert=require('node:assert/strict');const {classifyLead}=require('../scripts/lead-category');
for(const [title,url,expected] of [
 ['2.3 Applying patches','https://www.mediawiki.org/wiki/Manual:Applying_patches','uncategorized'],
 ['Call for Applications: Global Investigative Journalism Fellowship','https://example.org/fellowship','opportunities'],
 ['Open grant round 2027','https://example.org/funding-opportunities/2027','opportunities'],
 ['Skip to content','https://grantsforjournalists.org/','uncategorized'],
 ['Research Group (5)','https://example.org/research','uncategorized'],
 ['Open Data Catalog','https://example.org/data','datasets'],
 ['Pandas','https://pandas.pydata.org/','uncategorized'],
 ['Data visualization tool','https://example.org/tool','tools']
])test(title,()=>assert.equal(classifyLead({title,url}),expected));
