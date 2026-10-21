const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 const ctx={window:{RADAR:{opportunities:[{id:'opp',title:'Public',themes:[],fit:8,eligibility:'parcial'}],datasets:[],tools:[],changelog:[],stories:[],investigations:{}}},document:{querySelector:()=>({})},console,URLSearchParams,Intl,Date,location:{hash:''}};
 vm.createContext(ctx);
 const src=fs.readFileSync('app.js','utf8').split('window.addEventListener("hashchange"')[0];
 vm.runInContext(src,ctx);
 return {ctx,run:code=>vm.runInContext(code,ctx)};
}
test('private stories accept zero, one or several records without a fixed migration count',async()=>{
 for(const n of [0,1,7]){
  const {ctx,run}=harness();ctx.records=Array.from({length:n},(_,i)=>({id:'s'+i,story:{id:'s'+i,themes:[]},investigation:null}));
  run('EDITORIAL.user={id:"owner"};EDITORIAL.loadSeq=1;SB={from:()=>({select:()=>({eq:async()=>({data:records,error:null})})})}');
  await run('loadPrivateStories("owner",1)');
  assert.equal(run('EDITORIAL.privateStoriesLoaded'),true);assert.equal(run('D.stories.length'),n);
 }
});
test('invalid records fail closed',async()=>{
 const {run}=harness();run('EDITORIAL.user={id:"owner"};EDITORIAL.loadSeq=1;SB={from:()=>({select:()=>({eq:async()=>({data:[{id:"wrong",story:{id:"different",themes:[]}}],error:null})})})}');
 await run('loadPrivateStories("owner",1)');assert.equal(run('EDITORIAL.privateStoriesLoaded'),false);assert.equal(run('D.stories.length'),0);
});
test('private overlays and private-only records disappear when the account is cleared',async()=>{
 const {run}=harness();run(`EDITORIAL.user={id:"owner"};EDITORIAL.loadSeq=1;SB={from:()=>({select:()=>({eq:async()=>({data:[{record_type:"opportunity",record_id:"opp",mode:"overlay",payload:{title:"Private title"}},{record_type:"dataset",record_id:"only-private",mode:"record",payload:{name:"Private dataset"}}],error:null})})})}`);
 await run('loadPrivateCatalog("owner",1)');assert.equal(run('D.opportunities[0].title'),'Private title');assert.equal(run('D.datasets.length'),1);
 run('clearPrivateStories()');assert.equal(run('D.opportunities[0].title'),'Public');assert.equal(run('D.datasets.length'),0);
});
test('late private responses cannot hydrate after the account changes',async()=>{
 const {ctx,run}=harness();ctx.pending=new Promise(resolve=>ctx.finish=resolve);
 run('EDITORIAL.user={id:"owner"};EDITORIAL.loadSeq=1;SB={from:()=>({select:()=>({eq:()=>pending})})}');
 const loading=run('loadPrivateCatalog("owner",1)');run('EDITORIAL.loadSeq++;EDITORIAL.user=null;clearPrivateStories()');
 ctx.finish({data:[{record_type:'opportunity',record_id:'opp',mode:'overlay',payload:{title:'Private'}}],error:null});await loading;
 assert.equal(run('D.opportunities[0].title'),'Public');
});
test('public exports omit profile-dependent ratings',()=>{
 const {run}=harness();assert.equal(run('"fit" in exportOpportunities()[0]'),false);assert.equal(run('"eligibility" in exportOpportunities()[0]'),false);
});
test('public catalog contains no private investigation records or personal application notes',()=>{
 const ctx={window:{}};vm.createContext(ctx);
 for(const name of ['opportunities','datasets','tools','changelog'])vm.runInContext(fs.readFileSync('data/'+name+'.js','utf8'),ctx);
 const d=ctx.window.RADAR_PARTS;
 assert.equal(d.datasets.some(x=>x.id.startsWith('plot-')),false);
 assert.doesNotMatch(JSON.stringify(d),/Rachel|futfem|CEP.escola/i);
});
