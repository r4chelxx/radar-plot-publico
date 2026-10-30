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

test('archived closed opportunities wait 30 days and reenter the existing inspection rotation',()=>{
 const archived=lead('closed',{editorialStatus:'archived',archiveKind:'closed-opportunity',reviewedAt:'2026-10-01',lastInspectedAt:null});
 const st=state([archived]);
 assert.equal(selectBacklog(st,[archived],40,new Date('2026-10-30T12:00:00Z')).selected.length,0);
 const r=selectBacklog(st,[archived],40,new Date('2026-11-01T12:00:00Z'));
 assert.equal(r.selected.length,1);assert.equal(r.selected[0].editorialStatus,'archived');
});
test('archived rechecks never displace eligible active leads',()=>{
 const st=state([lead('active'),lead('closed',{editorialStatus:'archived',archiveKind:'closed-opportunity',reviewedAt:'2026-08-01'})]);
 const r=selectBacklog(st,[],1,new Date('2026-10-30T12:00:00Z'));
 assert.equal(r.selected[0].url,lead('active').url);
});
test('terminal leads are not resurrected by fresh daily discovery',()=>{
 const st=state([lead('rejected',{editorialStatus:'rejected'}),lead('archived',{editorialStatus:'archived',archiveKind:'closed-opportunity',reviewedAt:'2026-10-30'})]);
 const r=selectBacklog(st,[lead('rejected'),lead('archived')],40,new Date('2026-10-30T12:00:00Z'));
 assert.equal(r.selected.length,0);
});

test('direct primary source precedes indirect Google News RSS link within the same cohort',()=>{
 const indirect=lead('rss',{url:'https://news.google.com/rss/articles/example',firstSeen:'2026-10-01T00:00:00Z'});
 const direct=lead('official',{url:'https://example.org/grants/official',firstSeen:'2026-10-22T00:00:00Z'});
 const result=selectBacklog(state([indirect,direct]),[],2,now);
 assert.equal(result.selected[0].url,direct.url);
 assert.equal(result.selected[1].url,indirect.url);
});
