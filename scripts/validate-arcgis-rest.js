'use strict';
// ArcGIS REST may respond HTTP 200 while the JSON payload reports an application error.
function isArcgisRest(url){
 try{const u=new URL(url);return /^https?:$/.test(u.protocol)&&/\/arcgis\/rest\/services\//i.test(u.pathname)&&/\/(?:MapServer|FeatureServer)(?:\/\d+)?\/?$/i.test(u.pathname)}catch{return false}
}
function validateArcgisPayload(body){
 let data;try{data=JSON.parse(body)}catch{return {valid:false,reason:'non-json-arcgis-response'}}
 if(!data||typeof data!=='object'||Array.isArray(data))return {valid:false,reason:'invalid-arcgis-response'};
 if(data.error)return {valid:false,reason:'arcgis-error-'+String(data.error.code||'unknown'),message:String(data.error.message||'Service error').slice(0,160)};
 if(typeof data.currentVersion!=='number')return {valid:false,reason:'missing-arcgis-version'};
 if(!Array.isArray(data.layers)&&!(Number.isInteger(data.id)&&typeof data.name==='string'))return {valid:false,reason:'missing-arcgis-layers'};
 return {valid:true};
}
module.exports={isArcgisRest,validateArcgisPayload};
