// Deterministic, bounded inspection capacity based on persisted public backlog.
const {summarizeBacklog}=require('./backlog-health');
function auditCapacity(leads,now=new Date()){
 const m=summarizeBacklog(leads,now);
 const pressure=m.neverInspected+m.overdueRechecks;
 const limit=pressure>=250?50:pressure>=100?45:40;
 return {limit,pressure,metrics:m,policy:'bounded-backlog-capacity'};
}
module.exports={auditCapacity};
