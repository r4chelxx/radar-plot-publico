const test=require('node:test'),assert=require('node:assert/strict');
const {selectBacklog}=require('../scripts/select-historical-backlog');
const {identity}=require('../scripts/lead-identity');
const now=new Date('2026-10-23T13:00:00Z');
const lead=(n,extras={})=>({url:'https://example.org/story/'+n,title:'Story '+n,source:'Public site',category:'opportunities',classification:'needs-editorial-review',firstSeen:'2026-10-10T00:00:00Z',editorialStatus:'unverified',...extras});
const state=arr=>({schemaVersion:1,leads:Object.fromEntries(arr.map(x=>[identity(x.url).id,x]))});
test('historical leads take precedence over newly discovered leads',()=>{
 const historic=Array.from({length:230},(_,i)=>lead(i));
 const result=selectBacklog(state(historic),[lead('new')],15,now);
 assert.equal(result.total,231);assert.equal(result.selected.length,15);
 assert(result.selected.every(x=>x.origin==='historical'));
});
test('inspection rotates without starving old backlog',()=>{
 const all=Array.from({length:230},(_,i)=>lead(i));
 const st=state(all),inspected=new Set();
 for(let day=0;day<16;day++){
  const current=new Date(now.getTime()+day*86400000);
  const result=selectBacklog(st.leads?st:null,[],15,current);
  for(const item of result.selected){
   if(!inspected.has(item.id))inspected.add(item.id);
   st.leads[item.id].lastInspectedAt=current.toISOString();
  }
 }
 assert.equal(inspected.size,230);
});
test('recently inspected leads wait, terminal decisions stay out',()=>{
 const result=selectBacklog(state([
  lead(1,{lastInspectedAt:'2026-10-22T13:00:00Z'}),
  lead(2,{editorialStatus:'rejected'}),
  lead(3,{pageStatus:'fetch-failed',lastInspectedAt:'2026-10-14T13:00:00Z'}),
  lead(4,{classification:'catalog-match'}),
  lead(5)
 ]),[],15,now);
 assert.deepEqual(result.selected.map(x=>x.url).sort(),[lead(3).url,lead(5).url].sort());
});

test('opportunities are rechecked after seven days while datasets wait 21 days',()=>{
 const older='2026-10-15T13:00:00Z';
 const result=selectBacklog(state([lead('grant',{lastInspectedAt:older}),lead('dataset',{category:'datasets',lastInspectedAt:older})]),[],40,now);
 assert.deepEqual(result.selected.map(x=>x.url),[lead('grant').url]);
});
test('failed pages retry after three days but not after one day',()=>{
 const result=selectBacklog(state([lead('retry',{pageStatus:'http-error',lastInspectedAt:'2026-10-19T13:00:00Z'}),lead('wait',{pageStatus:'fetch-failed',lastInspectedAt:'2026-10-22T13:00:00Z'})]),[],40,now);
 assert.deepEqual(result.selected.map(x=>x.url),[lead('retry').url]);
});
