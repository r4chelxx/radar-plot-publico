const {test,expect}=require('@playwright/test');
test('public page has Portuguese language, main landmark and usable navigation',async({page})=>{
 await page.goto('/');
 await expect(page.locator('html')).toHaveAttribute('lang','pt-BR');
 await expect(page.locator('main#app')).toBeVisible();
 await expect(page.locator('header nav#nav')).toHaveCount(1);
 await expect(page.locator('header a.brand')).toHaveAttribute('href','#visao');
 await expect(page.locator('button#menu')).toHaveAttribute('aria-controls','nav');
 const invalid=await page.locator('header nav a').evaluateAll(links=>links.filter(a=>!a.textContent.trim()||!a.getAttribute('href')).map(a=>a.outerHTML));
 expect(invalid).toEqual([]);
});
test('mobile navigation announces expanded state and supports keyboard',async({page,isMobile})=>{
 test.skip(!isMobile,'mobile-only interaction');
 await page.goto('/');
 const button=page.locator('button#menu');
 await expect(button).toBeVisible();
 await expect(button).toHaveAttribute('aria-expanded','false');
 await button.focus();
 await expect(button).toBeFocused();
 await page.keyboard.press('Enter');
 await expect(button).toHaveAttribute('aria-expanded','true');
 await expect(page.locator('#nav')).toHaveClass(/open/);
 await page.keyboard.press('Enter');
 await expect(button).toHaveAttribute('aria-expanded','false');
});
test('public homepage contains no duplicate element IDs',async({page})=>{
 await page.goto('/');
 const duplicates=await page.evaluate(()=>{
  const seen=new Set(),duplicates=[];
  for(const el of document.querySelectorAll('[id]')){if(seen.has(el.id))duplicates.push(el.id);seen.add(el.id)}
  return duplicates;
 });
 expect(duplicates).toEqual([]);
});
