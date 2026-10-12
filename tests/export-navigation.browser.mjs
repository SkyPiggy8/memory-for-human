// Optional real-browser regression: node tests/export-navigation.browser.mjs
// Uses preinstalled Playwright/Chromium, fictional chapters and no provider calls.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {createApp} from '../server.mjs';
const {chromium}=createRequire(import.meta.url)('playwright'),C=globalThis.MFHCore;
const fixture=C.newProject();fixture.title='Fictional navigation test';fixture.chapters=[1,2].map(n=>({id:C.uuid(),title:`Fictional chapter ${n}`,content:`Synthetic draft ${n}`,approved:false,origin:'manual',updatedAt:''}));fixture.activeChapter=fixture.chapters[0].id;
let calls=0;const errors=[];
const app=createApp({fetchImpl:async()=>{calls++;throw Error('No provider calls allowed')}});await new Promise(r=>app.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.MFH_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
async function state(p){return p.evaluate(()=>({step:document.querySelector('.step.active').dataset.step,mode:['workspace','help','handoff'].find(m=>!document.querySelector('#'+m+'Panel').hidden),focus:document.activeElement.id,chapter:document.querySelector('#chapterText').value,dialog:document.querySelector('#connectionDialog').open}));}
try{
 for(const lang of ['zh','en','es'])for(const action of ['sidebar','return','help','dialog','rapid','failure']){
  const context=await browser.newContext({locale:lang==='zh'?'zh-CN':lang,viewport:{width:1440,height:1000}}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(`http://127.0.0.1:${app.address().port}`);
  await p.waitForFunction(()=>document.querySelector('#saveStatus').textContent===window.MFH_LOCALES[document.querySelector('#language').value].saved);
  await p.locator('#backupFile').setInputFiles({name:'fictional.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});await p.waitForFunction(()=>document.querySelector('#bookTitle').value==='Fictional navigation test');await p.click('[data-step="3"]');
  // Defer delivery of real IndexedDB completion events to the app, not its save function.
  await p.evaluate(()=>{
   window.pendingSaves=[];const d=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');
   Object.defineProperty(IDBTransaction.prototype,'oncomplete',{configurable:true,get:d.get,set(fn){d.set.call(this,event=>window.pendingSaves.push(fail=>fail?this.onerror?.(event):fn.call(this,event)));}});
  });
  await p.click('#checkNextDraft');await p.waitForFunction(()=>window.pendingSaves.length===1);
  if(action==='sidebar'){await p.click('[data-step="1"]');await p.locator('#answer').focus();}
  if(action==='return'||action==='failure'){await p.click('#returnToExport');}
  if(action==='help'){await p.click('.sidebar [data-action="help"]');await p.locator('#faqButtons button').first().focus();}
  if(action==='dialog'){await p.click('#connectionButton');await p.locator('#connectionDialog [data-close]').click();await p.locator('#connectionButton').focus();}
  if(action==='rapid'){
   // Two inspections are still saving; the newer chapter and later navigation win.
   await p.click('#returnToExport');await p.locator('#exportDirectory summary').click();await p.locator('#exportChapterList button').nth(1).click();await p.waitForFunction(()=>window.pendingSaves.length===2);
   assert.equal(await p.locator('#chapterText').inputValue(),'Synthetic draft 2');await p.click('[data-step="0"]');await p.locator('#bookTitle').focus();
  }
  const expected=await state(p);await p.evaluate(fail=>{const callbacks=window.pendingSaves.splice(0).reverse();callbacks.forEach(fn=>fn(fail));},action==='failure');
  // Let promise continuations and rendering frames finish before comparing focus/view.
  await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.deepEqual(await state(p),expected,`${lang} ${action}: completed save must not navigate or focus`);
  if(action==='failure')assert.equal(await p.locator('#saveStatus').innerText(),await p.evaluate(()=>window.MFH_LOCALES[document.querySelector('#language').value].saveFailed));
  await context.close();console.log(`PASS ${lang} ${action}: delayed completion preserves newer navigation, chapter and focus`);
 }
 assert.deepEqual(errors,[]);assert.equal(calls,0);console.log('PASS 18 delayed-save navigation cases; zero page errors/provider calls.');
}finally{await browser.close();await new Promise(r=>{app.close(r);app.closeAllConnections()})}
