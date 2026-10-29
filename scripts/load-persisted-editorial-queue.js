#!/usr/bin/env node
// Persisted public-only queue snapshot for reporting; no editorial mutations.
const fs=require('node:fs'),path=require('node:path');
const source=process.argv[2]||'/tmp/radar-persisted-editorial-queue.json';
const target=process.argv[3]||'intake/editorial-queue-report.json';
let output={source:'unavailable',updatedAt:null,candidates:[]};
if(fs.existsSync(source)){
 try{
  const data=JSON.parse(fs.readFileSync(source,'utf8'));
  if(data.schemaVersion===1&&Array.isArray(data.candidates)){
   output={source:'radar-state',updatedAt:data.updatedAt||null,candidates:data.candidates};
  }
 }catch(e){console.error('Persisted editorial queue could not be parsed:',e.message)}
}
fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify({source:output.source,queueSize:output.candidates.length,updatedAt:output.updatedAt}));
