const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const {identity}=require('../scripts/lead-identity');
test('approved audited decision creates a publication manifest entry when absent',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'radar-approval-bridge-'));
 try{
  fs.mkdirSync(path.join(dir,'scripts'));fs.mkdirSync(path.join(dir,'data'));fs.mkdirSync(path.join(dir,'intake'));
  for(const file of ['scripts/apply-editorial-decisions.js','scripts/lead-identity.js'])fs.copyFileSync(file,path.join(dir,file));
  for(const file of ['data/opportunities.js','data/datasets.js','data/tools.js'])fs.copyFileSync(file,path.join(dir,file));
  const url='https://official.example.org/grant',id=identity(url).id;
  fs.writeFileSync(path.join(dir,'intake/lead-history-next.json'),JSON.stringify({schemaVersion:1,leads:{[id]:{id,url,title:'New grant',classification:'needs-editorial-review',editorialStatus:'unverified'}}}));
  fs.writeFileSync(path.join(dir,'intake/approved-publications.json'),JSON.stringify({policy:'test',approved:[]}));
  fs.writeFileSync(path.join(dir,'intake/historical-decisions.json'),JSON.stringify({decisions:[{url,status:'approved',category:'opportunities',officialUrl:url,reviewedBy:'Test reviewer',reviewedAt:'2026-11-06',reason:'Fonte oficial, prazo, elegibilidade e duplicidade verificadas com evidência suficiente para publicação.',record:{id:'new-grant',title:'New grant',rules:url,apply:'https://official.example.org/apply',deadline:'2026-12-01',deadlineStatus:'confirmado',eligibility:'elegível',status:'aberta',summary:'Oportunidade de teste com ficha editorial completa.',type:'Grant',scope:'Internacional',value:'US$ 1.000',duration:'2027',modality:'Bolsa',documents:[],restrictions:['Jornalistas'],desc:'Descrição editorial completa da oportunidade de teste.'}}]}));
  cp.execFileSync(process.execPath,['scripts/apply-editorial-decisions.js'],{cwd:dir,stdio:'pipe'});
  const out=JSON.parse(fs.readFileSync(path.join(dir,'intake/approved-publications-next.json')));
  assert.equal(out.approved.length,1);assert.equal(out.approved[0].record.id,'new-grant');assert.equal(out.approved[0].review.decision,'approved');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
});
