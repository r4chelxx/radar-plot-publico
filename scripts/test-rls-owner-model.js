#!/usr/bin/env node
// Local, dependency-free regression of the owner predicates used in the live RLS policies.
// This checks policy logic, not a live Postgres session or production credentials.
const assert=require('node:assert/strict');
const tables=['editorial_state','private_catalog_items','private_stories'];
const commands=['SELECT','INSERT','UPDATE','DELETE'];
const owner='11111111-1111-4111-8111-111111111111';
const other='22222222-2222-4222-8222-222222222222';
function authorized(command,sessionUser,existingOwner,newOwner){
 if(command==='INSERT')return sessionUser!==null&&sessionUser===newOwner;
 if(command==='UPDATE')return sessionUser!==null&&sessionUser===existingOwner&&sessionUser===newOwner;
 return sessionUser!==null&&sessionUser===existingOwner;
}
let assertions=0;
for(const table of tables)for(const cmd of commands){
 const test=(user,oldOwner,newOwner,expected)=>{
  assert.equal(authorized(cmd,user,oldOwner,newOwner),expected,`${table} ${cmd}: ${user||'anon'}`);assertions++;
 };
 test(owner,owner,owner,true);
 test(other,owner,owner,false);
 test(null,owner,owner,false);
 if(cmd==='INSERT')test(owner,owner,other,false);
 if(cmd==='UPDATE')test(owner,owner,other,false);
}
console.log(`Owner policy model: ${assertions} assertions passed across ${tables.length} tables and ${commands.length} commands.`);
