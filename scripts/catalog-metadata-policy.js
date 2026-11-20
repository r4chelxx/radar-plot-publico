'use strict';

const CATEGORY_POLICIES={
  opportunities:{
    identity:'title',
    source:'rules',
    tags:'themes',
    required:['title','org','summary','type','themes','scope','eligibility','status','rules'],
    optional:['deadline','deadlineStatus','apply','value','duration','modality','documents','restrictions','verified']
  },
  datasets:{
    identity:'name',
    source:'url',
    tags:'themes',
    required:['name','org','territoryTier','kind','themes','coverage','format','docs','limitations','lastChecked','url'],
    optional:['frequency','period','granularity','geoUnit','api','description']
  },
  tools:{
    identity:'name',
    source:'url',
    tags:'kind',
    required:['name','kind','url','desc'],
    optional:['discoveryUrl','lastChecked','discoveredVia']
  }
};

const GENERIC_TOOL_TITLES=new Set([
  'tools','ferramentas','resources and tools','data portals and tools',
  'world bank open data','database tools','stable tools','apply','read more',
  'learn more'
]);

function clean(value){
  return String(value??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/\s+/g,' ').trim();
}
function normalizedTag(value){
  return clean(value).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}
function tagsFor(category,item){
  const raw=category==='tools'?[item.kind,...(item.themes||[])]:item.themes||[];
  return [...new Set(raw.map(normalizedTag).filter(Boolean))];
}
function missingRequired(category,item){
  const policy=CATEGORY_POLICIES[category];
  if(!policy)return [];
  return policy.required.filter(field=>{
    const value=item?.[field];
    return value===undefined||value===null||value===''||(Array.isArray(value)&&value.length===0);
  });
}
function toolTitleIssue(item){
  if(!item||!item.name)return null;
  const title=clean(item.name);
  if(GENERIC_TOOL_TITLES.has(title.toLowerCase()))return 'generic';
  if(/^(?:welcome to|about|home|official website|the .* project|.*\s[|—–-]\s(?:data|who|world health organization))$/i.test(title))return 'promotional';
  if(title.length>100)return 'promotional';
  return null;
}
function qualityRecord(category,item){
  const missing=missingRequired(category,item);
  const tags=tagsFor(category,item);
  const issues=[];
  if(!tags.length)issues.push('missing-tags');
  if(category==='tools'){
    const titleIssue=toolTitleIssue(item);
    if(titleIssue)issues.push('tool-title-'+titleIssue);
  }
  return {category,id:item?.id||null,missing,tags,issues,quality:missing.length===0&&issues.length===0?'complete':'needs-review'};
}
function explainRecommendation(resource,queryTags=[]){
  const wanted=new Set(queryTags.map(normalizedTag).filter(Boolean));
  const tags=tagsFor(resource?.category||resource?.type||'',resource||{});
  const matched=tags.filter(tag=>wanted.has(tag));
  return {score:matched.length,matchedTags:matched,reason:matched.length?'tags em comum: '+matched.join(', '):'nenhuma tag compatível'};
}
function summarizeQuality(category,items=[]){
  const records=items.map(item=>qualityRecord(category,item));
  const counts={complete:0,'needs-review':0};
  const issues={};
  for(const record of records){
    counts[record.quality]=(counts[record.quality]||0)+1;
    for(const issue of record.issues)issues[issue]=(issues[issue]||0)+1;
  }
  return {category,total:records.length,counts,issues,records};
}
module.exports={CATEGORY_POLICIES,GENERIC_TOOL_TITLES,clean,normalizedTag,tagsFor,missingRequired,toolTitleIssue,qualityRecord,explainRecommendation,summarizeQuality};
