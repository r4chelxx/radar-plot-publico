#!/usr/bin/env node
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
const root=fs.mkdtempSync(path.join(os.tmpdir(),'radar-editorial-'));
const run=(file,...args)=>cp.execFileSync(process.execPath,[path.resolve('scripts',file),...args],{cwd:root,encoding:'utf8'});
try{
 fs.mkdirSync(path.join(root,'data'));fs.mkdirSync(path.join(root,'intake'));
 for(const category of ['opportunities','datasets','tools','changelog'])fs.writeFileSync(path.join(root,'data',category+'.js'),'window.RADAR_PARTS=window.RADAR_PARTS||{};\nwindow.RADAR_PARTS.'+category+'=[\n];\n');
 const candidate={id:'example-verified-tool',name:'Verified Example',kind:'research',url:'https://example.org/tool',desc:'Official documentation confirms the tool is available. Limitations: output is not proof and must be verified against original sources.'};
 const manifest={approved:[{category:'tools',record:candidate,review:{decision:'approved',reviewedBy:'editorial-reviewer',reviewedAt:'2026-10-23',officialUrl:'https://example.org/tool',evidence:'Official product documentation reviewed and scope, access and limitations recorded.'}}]};
 const input=path.join(root,'intake','approved-publications.json');
 fs.writeFileSync(input,JSON.stringify(manifest));
 const first=JSON.parse(run('publish-approved.js',input));assert.equal(first.published,1);
 assert(fs.readFileSync(path.join(root,'data','tools.js'),'utf8').includes('example-verified-tool'));
 assert(fs.readFileSync(path.join(root,'data','changelog.js'),'utf8').includes('example-verified-tool'));
 const second=JSON.parse(run('publish-approved.js',input));assert.equal(second.published,0);
 const workflow=fs.readFileSync(path.resolve('.github/workflows/editorial-publish.yml'),'utf8');
 assert.match(workflow,/push:\\s*\\n\\s*branches: \\[main\\]/);
 assert.match(workflow,/intake\\/approved-publications\\.json/);
 assert.match(workflow,/cron: \\\"0 14 \\* \\* \\*\\\"/);
 manifest.approved[0].review.decision='pending';fs.writeFileSync(input,JSON.stringify(manifest));
 assert.throws(()=>run('publish-approved.js',input));
 const queueInput=path.join(root,'intake','quality.json'),queueOutput=path.join(root,'intake','editorial-queue.json');
 fs.writeFileSync(queueInput,JSON.stringify({review:[{id:'abc',title:'Potential dataset',url:'https://example.org/data',classification:'needs-editorial-review',providers:['Feed A'],reviewPriority:'high'}]}));
 run('merge-editorial-queue.js',queueInput,queueOutput);
 let q=JSON.parse(fs.readFileSync(queueOutput));assert.equal(q.candidates.length,1);assert.equal(q.candidates[0].status,'pending');
 q.candidates[0].status='rejected';fs.writeFileSync(queueOutput,JSON.stringify(q));
 run('merge-editorial-queue.js',queueInput,queueOutput);
 q=JSON.parse(fs.readFileSync(queueOutput));assert.equal(q.candidates[0].status,'rejected');
 console.log('Editorial queue and verified publication regression passed');
}finally{fs.rmSync(root,{recursive:true,force:true})}
