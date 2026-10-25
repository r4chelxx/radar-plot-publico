const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function loadParts(){
 const context={window:{RADAR_PARTS:{}}};vm.createContext(context);
 for(const type of ['opportunities','datasets','tools','changelog'])vm.runInContext(fs.readFileSync('data/'+type+'.js','utf8'),context);
 return context.window.RADAR_PARTS;
}
test('daily update cards show each verified record description, not a repeated batch summary',()=>{
 const app=fs.readFileSync('app.js','utf8'),from=app.indexOf('function updateItemHref('),to=app.indexOf('function publicHome()',from);
 assert(from>=0&&to>from);
 const D=loadParts();
 const context={D,fmt:x=>x,escHTML:x=>String(x),encodeURIComponent};
 vm.createContext(context);
 vm.runInContext(app.slice(from,to),context);
 const html=vm.runInContext('dailyUpdatePanel()',context);
 const eligible=D.changelog.filter(x=>['nova-oportunidade','dados','ferramentas'].includes(x.type));
 const latest=eligible.map(x=>x.date).sort().at(-1);
 const day=eligible.filter(x=>x.date===latest);
 const unique=new Set(day.flatMap(x=>x.items||[]).map(x=>x.id));
 assert(html.includes(unique.size+' novos registros'));
 const catalogs={'nova-oportunidade':D.opportunities,dados:D.datasets,ferramentas:D.tools};
 const hrefs={'nova-oportunidade':'#oportunidade/',dados:'#base/',ferramentas:'#ferramentas/'};
 for(const entry of day){
  for(const item of entry.items||[]){
   const record=catalogs[entry.type].find(x=>x.id===item.id);
   assert(record,'missing '+entry.type+' record '+item.id);
   const detail=item.detail||record.desc||record.summary||record.description||entry.detail||'';
   assert(detail,'missing individual description '+item.id);
   assert(html.includes(detail),'individual description missing '+item.id);
   assert(html.includes(hrefs[entry.type]+item.id),'deep link missing '+item.id);
  }
  assert.equal(html.split(entry.detail).length-1,0,'batch summary should not repeat on cards');
 }
});
test('mobile sticky header is opaque and scripts have a fresh cache version',()=>{
 const css=fs.readFileSync('styles.css','utf8'),index=fs.readFileSync('index.html','utf8');
 assert(css.includes('header{background:var(--bg)}'));
 assert(css.includes('header{display:grid;grid-template-columns:'));
 assert(index.includes('app.js?v=20261023-daily-mobile-2'));
});
