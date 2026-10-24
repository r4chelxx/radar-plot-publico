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
 for(const id of ['cvm-crowdfunding-plataformas-cadastro','fnde-dados-abertos-catalogo','bcb-estatisticas-pix','ararenda-dados-abertos-api']){
  const record=D.datasets.find(x=>x.id===id);
  assert(record,'missing dataset '+id);
  assert(html.includes(record.coverage),'individual description missing '+id);
  assert(html.includes('#base/'+id),'deep link missing '+id);
 }
 const shared=D.changelog.find(x=>x.items?.some(i=>i.id==='cvm-crowdfunding-plataformas-cadastro')).detail;
 assert.equal(html.split(shared).length-1,0,'batch summary should not repeat on every card');
});
test('mobile sticky header is opaque and scripts have a fresh cache version',()=>{
 const css=fs.readFileSync('styles.css','utf8'),index=fs.readFileSync('index.html','utf8');
 assert(css.includes('header{background:var(--bg)}'));
 assert(css.includes('header{display:grid;grid-template-columns:'));
 assert(index.includes('app.js?v=20261023-daily-mobile-2'));
});
