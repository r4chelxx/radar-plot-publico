#!/usr/bin/env node
const { test, expect } = require('@playwright/test');
const pages=[
 ['visao','Visão geral'],['oportunidades','Oportunidades'],['pautas','Pautas'],
 ['matriz','Matriz'],['dados','Dados & Bases'],['ferramentas','Ferramentas'],
 ['pipeline','Pipeline'],['calendario','Calendário'],['arquivo','Arquivo'],
 ['metodologia','Metodologia']
];
const privateSdkMock=`window.supabase={createClient(){
 const user={id:'owner-test'};
 const records=Array.from({length:6},(_,i)=>({id:'private-'+i,story:{id:'private-'+i,title:'Private test '+i,status:'Apuração',summary:'Private',themes:[],opportunityIds:i===0?[window.RADAR.opportunities[0].id]:[],datasetIds:i===0?[window.RADAR.datasets[0].id]:[]},investigation:{stages:[],sources:[]}}));
 return {
  auth:{getSession:async()=>({data:{session:{user}},error:null}),onAuthStateChange:cb=>(window.__authCallback=cb),signOut:async()=>({error:null})},
  from:table=>({select:()=>({eq:async()=>({data:table==='private_stories'?records:[],error:null})})})
 };
}};`;
for (const [hash,label] of pages) {
 test(label+' renders without runtime errors',async ({page})=>{
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('/#'+hash);
  await expect(page.locator('#app')).not.toBeEmpty();
  expect(errors).toEqual([]);
 });
}
test('mobile menu opens and closes after navigation',async ({page,isMobile})=>{
 test.skip(!isMobile,'Mobile-only interaction');
 await page.goto('/#visao');
 const menu=page.locator('#menu');
 await expect(menu).toBeVisible();
 await menu.click();
 await expect(menu).toHaveAttribute('aria-expanded','true');
 await page.locator('#nav a[href="#dados"]').click();
 await expect(menu).toHaveAttribute('aria-expanded','false');
 await expect(page.locator('#app')).not.toBeEmpty();
});
test('no horizontal overflow on core pages',async ({page})=>{
 for (const hash of ['visao','oportunidades','dados','ferramentas','pautas']) {
  await page.goto('/#'+hash);
  const dims=await page.evaluate(()=>({viewport:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
  expect(dims.scroll,hash+' horizontal overflow').toBeLessThanOrEqual(dims.viewport+2);
 }
});

test('keyboard focus is visible on navigation',async ({page})=>{
 await page.goto('/#visao');
 await page.keyboard.press('Tab');
 const focus=await page.evaluate(()=>({tag:document.activeElement?.tagName,outline:getComputedStyle(document.activeElement).outlineStyle}));
 expect(focus.tag).toBe('A');
 expect(focus.outline).not.toBe('none');
});

test('logged-out editorial access has an accessible button',async ({page})=>{
 await page.goto('/#visao');
 const button=page.getByRole('button',{name:'Minhas decisões'});
 await expect(button).toBeVisible();
});

test('catalog remains usable when Supabase SDK is unavailable',async ({page})=>{
  await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0',route=>route.abort());
 await page.goto('/#visao');
 await expect(page.locator('#app')).not.toBeEmpty();
  await expect(page.getByRole('alert')).toContainText('Conexão indisponível');
});

test('logged-out visitors cannot load private editorial fixtures',async ({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0',route=>route.abort());
 await page.goto('/#pautas');
 await expect(page.getByText('Conteúdo privado protegido.')).toBeVisible();
 expect(await page.evaluate(()=>window.RADAR.stories.length)).toBe(0);
});

test('authenticated private records load and are scrubbed on sign-out',async ({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0',route=>route.fulfill({contentType:'application/javascript',body:privateSdkMock}));
 await page.goto('/#pautas');
 await expect(page.getByText('Private test 0')).toBeVisible();
 expect(await page.evaluate(()=>window.RADAR.stories.length)).toBe(6);
 expect(await page.evaluate(()=>window.RADAR.opportunities[0].story)).toEqual(['private-0']);
 await page.evaluate(()=>window.__authCallback('SIGNED_OUT',{user:null}));
 await expect(page.getByText('Conteúdo privado protegido.')).toBeVisible();
 expect(await page.evaluate(()=>window.RADAR.stories.length)).toBe(0);
 expect(await page.evaluate(()=>Object.prototype.hasOwnProperty.call(window.RADAR.opportunities[0],'story'))).toBe(false);
});


test('public home and calendar provide useful information without authentication',async ({page})=>{
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0',route=>route.abort());
 await page.goto('/#visao');
 await expect(page.getByText('Consulta aberta, sem cadastro.',{exact:false})).toBeVisible();
 await expect(page.locator('#app .metrics .metric')).toHaveCount(4);
 await expect(page.locator('#nav a[href="#pautas"]')).toBeHidden();
 await page.goto('/#calendario');
 await expect(page.locator('#app .event').first()).toBeVisible();
 await page.goto('/#oportunidades');
 await expect(page.locator('#olist .row').first()).toBeVisible();
 await expect(page.locator('#sort option[value="fit"]')).toHaveCount(0);
 await page.goto('/#dados');
 await expect(page.locator('#dlist .row').first()).toBeVisible();
 await expect(page.locator('#app .metrics')).not.toContainText('null');
});

test('private catalog is restored only for the signed-in account',async ({page})=>{
 const mock=privateSdkMock.replace("data:table==='private_stories'?records:[]", "data:table==='private_stories'?records:table==='private_catalog_items'?[{record_type:'opportunity',record_id:window.RADAR.opportunities[0].id,mode:'overlay',payload:{title:'Private catalog marker'}},{record_type:'dataset',record_id:'private-only',mode:'record',payload:{id:'private-only',name:'Private data marker',org:'Test',kind:'dataset',themes:[],coverage:'Test',format:'CSV',frequency:'Test'}}]:[]");
 await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0',route=>route.fulfill({contentType:'application/javascript',body:mock}));
 await page.goto('/#pautas');
 await expect(page.getByText('Private test 0')).toBeVisible();
 expect(await page.evaluate(()=>window.RADAR.opportunities[0].title)).toBe('Private catalog marker');
 expect(await page.evaluate(()=>window.RADAR.datasets.some(x=>x.id==='private-only'))).toBe(true);
 await page.evaluate(()=>window.__authCallback('SIGNED_OUT',{user:null}));
 expect(await page.evaluate(()=>window.RADAR.opportunities[0].title)).not.toBe('Private catalog marker');
 expect(await page.evaluate(()=>window.RADAR.datasets.some(x=>x.id==='private-only'))).toBe(false);
});
