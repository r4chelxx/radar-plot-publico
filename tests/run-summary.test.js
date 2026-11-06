'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('run summary counts HTML-fetched pages as accessible inspections',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-run-summary-'));
 try{
  fs.mkdirSync(path.join(root,'intake'));
  const write=(name,value)=>fs.writeFileSync(path.join(root,'intake',name),JSON.stringify(value));
  write('source-review.json',{coverage:{},results:[]});
  write('candidate-triage.json',{summary:{}});
  write('editorial-review.json',{counts:{},historyPrioritization:{},candidates:[
   {pageStatus:'html-fetched'},{pageStatus:'html-fetched'},{pageStatus:'fetch-failed'},{pageStatus:'http-error'}
  ]});
  write('lead-history-delta.json',{summary:{stateLoaded:true}});
  write('lead-evidence.json',{archivedRechecks:0});
  write('lead-history-next.json',{leads:{}});
  cp.execFileSync(process.execPath,[path.resolve('scripts/write-run-summary.js')],{cwd:root,encoding:'utf8'});
  const summary=fs.readFileSync(path.join(root,'intake/run-summary.md'),'utf8');
  assert.match(summary,/\| Pistas com página acessível \| 2 \|/);
  assert.match(summary,/\| Pistas sem página acessível confirmada \| 2 \|/);
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
