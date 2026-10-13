// Optional: node tests/chapter-finder.browser.mjs (preinstalled Playwright/Chromium).
// MFH_APP_ROOT can exercise the same checks against a local combined worktree.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createApp} from '../server.mjs';
const {chromium}=createRequire(import.meta.url)('playwright'),C=globalThis.MFHCore;
const fixture=C.newProject();fixture.title='虚构示例 · 那些值得记下的日子';
const names=['河边的旧街','窗边的木桌','第一次远行','修理铺的早晨','写给未来的一封信'];
fixture.chapters=Array.from({length:300},(_,i)=>({id:C.uuid(),title:`${names[i%5]} · ${i+1}`,content:'这是用于界面验证的虚构片段。记不清是哪一年，只记得窗边那片安静的阳光。\n\n'+(i===299?'The final chapter remembers a blue compass. Café de la estación.':'每一次重新读起，都可以慢慢补上当时记得的细节。'),approved:i%3===0,origin:'manual',updatedAt:''}));
fixture.chapters[10].title=fixture.chapters[11].title='同名章节';fixture.chapters[8].title='长标题'.repeat(90);fixture.chapters[7].title='<img src=x onerror=alert(1)>';fixture.chapters[6].title='';fixture.activeChapter=fixture.chapters[0].id;
const output=process.env.MFH_SCREENSHOT_DIR;if(output){await mkdir(output,{recursive:true});await writeFile(output+'/fictional-long-memoir.mfh.json',JSON.stringify(fixture,null,2));}
let calls=0;const errors=[];
const app=createApp({...(process.env.MFH_APP_ROOT?{root:process.env.MFH_APP_ROOT}:{}),fetchImpl:async()=>{calls++;throw Error('No provider calls allowed')}});await new Promise(r=>app.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.MFH_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)}),base=`http://127.0.0.1:${app.address().port}`;
async function start(lang,width,reduced){const context=await browser.newContext({locale:lang==='zh'?'zh-CN':lang,viewport:{width,height:width>700?1000:844},reducedMotion:reduced?'reduce':'no-preference'}),p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(base);await p.waitForFunction(()=>document.querySelector('#saveStatus').textContent===window.MFH_LOCALES[document.querySelector('#language').value].saved);return {context,p};}
async function restore(p,project=fixture){await p.locator('#backupFile').setInputFiles({name:'fictional.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(project))});await p.waitForFunction(title=>document.querySelector('#bookTitle').value===title,project.title);await p.click('[data-step="2"]');}
async function backup(p){await p.click('[data-step="3"]');const event=p.waitForEvent('download');await p.click('[data-action="backup"]');const result=JSON.parse(await readFile(await (await event).path(),'utf8'));await p.click('[data-step="2"]');return result;}
async function open(p){await p.locator('#chapterFinderButton').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('#chapterFinder').open);}
try{
 for(const lang of ['zh','en','es'])for(const width of [1440,390,320])for(const reduced of [false,true]){
  const {context,p}=await start(lang,width,reduced);await p.click('[data-step="2"]');assert(await p.locator('#chapterFinderButton').isDisabled());await restore(p);const original=await backup(p);
  await open(p);assert(await p.locator('#chapterQuery').evaluate(e=>e===document.activeElement));assert.equal(await p.locator('.finder-chapter').count(),300);assert.equal(await p.locator('.finder-chapter[aria-current]').count(),1);assert.equal(await p.locator('#chapterMatchesList img').count(),0);
  assert.equal(await p.locator('.finder-title').nth(6).innerText(),await p.evaluate(()=>window.MFH_LOCALES[document.querySelector('#language').value].chapter));
  if(output&&!reduced&&lang==='zh'){await p.locator('#toast').waitFor({state:'hidden'});await p.screenshot({path:output+`/after-${width}.png`});}
  await p.fill('#chapterQuery','BLUE COMPASS');assert.equal(await p.locator('.finder-chapter').count(),1);assert((await p.locator('.finder-excerpt').innerText()).includes('blue compass'));
  await p.fill('#chapterQuery','cafe');assert.equal(await p.locator('.finder-chapter').count(),1);await p.fill('#chapterQuery','not-a-real-match');assert(await p.locator('#noChapterMatches').isVisible());
  await p.click('#clearChapterQuery');assert.equal(await p.locator('.finder-chapter').count(),300);await p.fill('#chapterQuery','同名章节');assert.equal(await p.locator('.finder-chapter').count(),2);
  assert.equal(await p.getByRole('button',{name:/^12 同名章节/}).count(),1);await p.locator('.finder-chapter').nth(1).focus();await p.keyboard.press('Enter');assert(await p.locator('#chapterFinder').evaluate(e=>!e.open));assert.equal(await p.locator('#chapters').inputValue(),original.chapters[11].id);assert(await p.locator('#editChapterTitle').evaluate(e=>e===document.activeElement));
  await open(p);assert.equal(await p.locator('#chapterQuery').inputValue(),'');await p.keyboard.press('Escape');assert(await p.locator('#chapterFinderButton').evaluate(e=>e===document.activeElement));
  const after=await backup(p);assert.deepEqual(after.chapters,original.chapters);assert.equal(after.activeChapter,original.chapters[11].id);assert(!Object.hasOwn(after,'chapterQuery'));
  await open(p);await p.fill('#chapterQuery','长标题');assert.equal(await p.locator('.finder-chapter').count(),1);assert(await p.locator('#chapterFinder').evaluate(e=>e.scrollWidth<=e.clientWidth+1));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await p.locator('#chapterFinder [data-close]').click();
  // Choosing a chapter and then focused writing must still use the same editor.
  if(await p.locator('#focusChapterButton').count()){await p.click('#focusChapterButton');await p.fill('#chapterText','A new fictional paragraph.');await p.keyboard.press('Escape');await p.waitForFunction(()=>document.activeElement===document.querySelector('#focusChapterButton'));assert.equal(await p.locator('#chapterText').inputValue(),'A new fictional paragraph.');await open(p);await p.keyboard.press('Escape');}
  await p.reload();await p.click('[data-step="2"]');assert.equal(await p.locator('#chapters').inputValue(),original.chapters[11].id);
  await context.close();console.log(`PASS ${lang} ${width}px reduced=${reduced}: 300 chapters, title/full-text/accent search, duplicate/long/empty titles, safe text, keyboard/focus, unchanged approval/order, save/reload`);
 }
 const {context,p}=await start('en',390,true);await restore(p);
 // Delay real IDB completion delivery and then navigate elsewhere.
 await p.evaluate(()=>{window.pending=[];const d=Object.getOwnPropertyDescriptor(IDBTransaction.prototype,'oncomplete');Object.defineProperty(IDBTransaction.prototype,'oncomplete',{configurable:true,get:d.get,set(fn){d.set.call(this,e=>window.pending.push(()=>fn.call(this,e)))}})});
 await open(p);await p.fill('#chapterQuery','blue compass');await p.locator('.finder-chapter').click();await p.waitForFunction(()=>window.pending.length===1);await p.click('[data-step="1"]');await p.locator('#answer').focus();await p.evaluate(()=>window.pending.splice(0).forEach(fn=>fn()));await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));assert(await p.locator('#answer').evaluate(e=>e===document.activeElement));assert.equal(await p.locator('.step.active').getAttribute('data-step'),'1');await context.close();
 const edge=await start('en',320,true);await restore(edge.p,{...fixture,title:'Fictional single chapter',chapters:fixture.chapters.slice(0,1)});await open(edge.p);assert.equal(await edge.p.locator('.finder-chapter').count(),1);
 await edge.p.evaluate(()=>{const original=IDBDatabase.prototype.transaction;IDBDatabase.prototype.transaction=function(stores,mode,...args){if(mode==='readwrite')throw Error('Synthetic storage failure');return original.call(this,stores,mode,...args)}});await edge.p.locator('.finder-chapter').click();assert(await edge.p.locator('#chapterFinder').evaluate(e=>!e.open));assert(await edge.p.locator('#editChapterTitle').evaluate(e=>e===document.activeElement));await edge.p.waitForFunction(()=>document.querySelector('#saveStatus').textContent===window.MFH_LOCALES.en.saveFailed);await edge.context.close();
 const busy=await start('en',390,true);await restore(busy.p);await busy.p.route('**/api/session',r=>r.fulfill({json:{token:'a'.repeat(64),connection:{provider:'openai'}}}));await busy.p.reload();await busy.p.click('[data-step="2"]');const started=Promise.withResolvers(),release=Promise.withResolvers();await busy.p.route('**/api/generate',async r=>{started.resolve();await release.promise;await r.fulfill({json:{text:'Fictional review',truncated:false}})});await busy.p.click('[data-action="reviewAI"]');await started.promise;assert(await busy.p.locator('#chapterFinderButton').isDisabled());release.resolve();await busy.p.waitForFunction(()=>!document.querySelector('#chapterFinderButton').disabled);await busy.context.close();
 assert.deepEqual(errors,[]);assert.equal(calls,0);console.log('PASS 18 matrix scenarios + delayed-save, one-chapter/save-failure, mocked busy checks; zero real provider calls/page errors.');
}finally{await browser.close();await new Promise(r=>{app.close(r);app.closeAllConnections()})}
