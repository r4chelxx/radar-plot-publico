#!/usr/bin/env node
// Static interface regression checks; does not replace browser-based testing.
const fs=require("node:fs"),vm=require("node:vm");
const assert=require("node:assert/strict");
const html=fs.readFileSync("index.html","utf8");
const app=fs.readFileSync("app.js","utf8");
const css=fs.readFileSync("styles.css","utf8");
const paths=[...html.matchAll(/<script\s+src="(data\/[^"?]+\.js|data\.js|app\.js)(?:\?[^"]*)?"/g)].map(m=>m[1]);
assert(paths.includes("app.js"),"Missing app.js script");
for(const p of paths) assert(fs.existsSync(p),"Missing script "+p);
assert(html.includes('name="viewport"'),"Missing mobile viewport");
assert(html.includes('lang="pt-BR"'),"Missing document language");
assert(html.includes('aria-expanded="false"'),"Missing navigation state");
assert(app.includes("escHTML"),"Missing HTML escaping helper");
assert(app.includes("closeNav()"),"Missing mobile navigation close behavior");
assert(css.includes("@media"),"Missing responsive styles");
for(const p of paths) {
 const s=fs.readFileSync(p,"utf8");
 new vm.Script(s,{filename:p});
}
console.log("Static UI checks passed: scripts, navigation, viewport, escaping helper and responsive CSS.");
