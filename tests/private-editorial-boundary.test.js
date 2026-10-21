const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');

test('private editorial fixtures are absent from the public bundle',()=>{
 const html=fs.readFileSync('index.html','utf8');
 assert.equal(fs.existsSync('data/stories.js'),false);
 assert.equal(fs.existsSync('data/investigations.js'),false);
 assert.doesNotMatch(html,/data\/(stories|investigations)\.js/);
});

test('public catalogs contain no private story links',()=>{
 const ctx={window:{RADAR_PARTS:{}}};
 vm.createContext(ctx);
 for(const file of ['data/opportunities.js','data/datasets.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
 for(const item of [...ctx.window.RADAR_PARTS.opportunities,...ctx.window.RADAR_PARTS.datasets]){
  assert.equal(Object.prototype.hasOwnProperty.call(item,'story'),false,`${item.id} exposes a story link`);
 }
});

test('private loader fails closed and clears records on account changes',()=>{
 const app=fs.readFileSync('app.js','utf8');
 assert.doesNotMatch(app,/data\?\.length!==6/);
 assert.match(app,/!Array.isArray\(data\)/);
 assert.match(app,/function clearPrivateStories\(\)/);
 assert.match(app,/if\(changed\)\{EDITORIAL\.loadSeq\+\+;clearPrivateStories\(\)/);
 assert.match(app,/Nenhuma cópia pública será usada como alternativa/);
});

test('private links hydrate only after loading and are scrubbed on clear',()=>{
 const app=fs.readFileSync('app.js','utf8');
 const helpers=app.match(/const PUBLIC_CATALOG[\s\S]*?function clearPrivateStories\(\)[\s\S]*?(?=async function logoutRadar)/)[0];
 const ctx={
  D:{opportunities:[{id:'public-opportunity'}],datasets:[{id:'public-dataset'}],stories:[],investigations:{}},
  EDITORIAL:{privateStoriesLoaded:false}
 };
 vm.runInNewContext(helpers,ctx);
 ctx.applyPrivateStoryLinks([{id:'private-story',story:{opportunityIds:['public-opportunity'],datasetIds:['public-dataset']}}]);
 assert.deepEqual([...ctx.D.opportunities[0].story],['private-story']);
 assert.deepEqual([...ctx.D.datasets[0].story],['private-story']);
 ctx.D.stories=[{id:'private-story'}];
 ctx.D.investigations={'private-story':{}};
 ctx.EDITORIAL.privateStoriesLoaded=true;
 ctx.clearPrivateStories();
 assert.equal(ctx.D.stories.length,0);
 assert.equal(Object.keys(ctx.D.investigations).length,0);
 assert.equal(Object.prototype.hasOwnProperty.call(ctx.D.opportunities[0],'story'),false);
 assert.equal(Object.prototype.hasOwnProperty.call(ctx.D.datasets[0],'story'),false);
 assert.equal(ctx.EDITORIAL.privateStoriesLoaded,false);
});
