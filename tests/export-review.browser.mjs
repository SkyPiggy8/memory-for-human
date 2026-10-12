// Optional browser regression check: node tests/export-review.browser.mjs
// Uses an existing Playwright installation; no application dependency is added.
// MFH_SCREENSHOT_DIR saves captures. MFH_CHROMIUM_PATH selects an installed Chromium.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir,readFile} from 'node:fs/promises';
import path from 'node:path';
import {createApp} from '../server.mjs';
const {chromium}=createRequire(import.meta.url)('playwright'),C=globalThis.MFHCore;
const fixture=C.newProject('zh');fixture.title='虚构示例 · 留给家人的三页';fixture.workingAnswer='尚未整理的虚构记录。';
fixture.answers=[{id:C.uuid(),sourceId:'A2',question:'虚构问题：还记得窗边的木桌吗？',answer:'虚构回答：木桌上有一道旧划痕。',include:true,date:''}];
fixture.materials=[{id:C.uuid(),sourceId:'M5',name:'虚构材料',content:'一段未交给 AI 的虚构文字。',include:false}];
fixture.chapters=[
  {id:C.uuid(),title:'窗边的那张木桌',content:'这是用于测试的虚构章节。窗边有一张旧木桌，我们坐在一起慢慢说话。[A2]',approved:true,origin:'manual',updatedAt:''},
  {id:C.uuid(),title:'第一次独自出门',content:'这是用于测试的第二章。记不清是哪一年，只记得那天的风很轻。',approved:false,origin:'manual',updatedAt:''},
  {id:C.uuid(),title:'一封没有寄出的信',content:'这是用于测试的第三章。我把那封信放回抽屉，想等下一次见面再说。',approved:false,origin:'manual',updatedAt:''}
];fixture.activeChapter=fixture.chapters[0].id;
let providerCalls=0;
const app=createApp({fetchImpl:async()=>{providerCalls++;throw new Error('No provider calls allowed');}});await new Promise(r=>app.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${app.address().port}`,output=process.env.MFH_SCREENSHOT_DIR,errors=[];
const browser=await chromium.launch({headless:true,executablePath:process.env.MFH_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
if(output)await mkdir(output,{recursive:true});
async function data(page){return page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('memory-for-human',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const p=await new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get(localStorage.getItem('mfh-active'));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();return p;
});}
async function importProject(page,p){const old=await page.evaluate(()=>localStorage.getItem('mfh-active'));await page.locator('#backupFile').setInputFiles({name:'fictional.mfh.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))});await page.waitForFunction(id=>localStorage.getItem('mfh-active')!==id,old);await page.waitForFunction(title=>document.querySelector('#bookTitle').value===title,p.title);}
async function newPage(lang,width,height){const context=await browser.newContext({locale:lang==='zh'?'zh-CN':lang,viewport:{width,height}}),page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('#bookTitle').waitFor();return {context,page};}
async function counts(page,total,reviewed){await page.waitForFunction(([total,reviewed])=>document.querySelector('#exportCounts').textContent===window.MFH_LOCALES[document.querySelector('#language').value].exportCounts.replace('{total}',total).replace('{reviewed}',reviewed).replace('{drafts}',total-reviewed),[total,reviewed]);}
async function exportFile(page,action){const event=page.waitForEvent('download');await page.click(`[data-action="${action}"]`);const file=await event;return readFile(await file.path(),'utf8');}
async function verifyExports(page){
  const p=await data(page),backup=JSON.parse(await exportFile(page,'backup'));
  for(const key of ['answers','materials','chapters','workingAnswer','activeChapter'])assert.deepEqual(backup[key],p[key]);
  assert(!Object.hasOwn(backup,'exportReviewProject'));
  const expected=await page.evaluate(p=>window.MFHCore.markdown(p,window.MFH_LOCALES[document.querySelector('#language').value]),p);
  assert.equal(await exportFile(page,'exportMD'),expected);
  await page.evaluate(()=>{window.testPrintCalls=0;window.print=()=>{window.testPrintCalls=(window.testPrintCalls||0)+1}});
  await page.click('[data-action="print"]');
  if(p.chapters.length){assert.equal(await page.locator('#printView h2').count(),p.chapters.length);assert.equal(await page.evaluate(()=>window.testPrintCalls),1);for(const chapter of p.chapters)assert((await page.locator('#printView').textContent()).includes(chapter.content));}
  else assert.equal(await page.evaluate(()=>window.testPrintCalls),0);
}
try{
  for(const lang of (process.argv.includes('--workflow-only')?[]:['zh','en','es']))for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,740]])for(const reduced of [false,true]){
    const {context,page}=await newPage(lang,width,height);await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
    await page.click('[data-step="3"]');await counts(page,0,0);assert(await page.locator('#exportDirectory').isHidden());
    await importProject(page,fixture);await page.click('[data-step="3"]');await counts(page,3,1);
    assert.equal(await page.locator('#exportBookTitle').innerText(),fixture.title);
    for(const action of ['backup','exportMD','print'])assert.equal(await page.locator(`[data-action="${action}"]`).isDisabled(),false);
    const before=(await data(page)).chapters;await page.locator('#exportDirectory summary').focus();await page.keyboard.press('Enter');
    assert(await page.locator('#exportDirectory').evaluate(e=>e.open));assert.equal(await page.locator('#exportChapterList li').count(),3);assert.equal(await page.locator('#exportChapterList button').count(),2);
    if(output&&!reduced){await page.locator('#toast').waitFor({state:'hidden'});await page.locator('#exportOverview').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(output,`after-${lang}-${device}.png`)});}
    await page.locator('#exportChapterList button').nth(1).focus();await page.keyboard.press('Enter');await page.locator('#returnToExport').waitFor();
    assert.equal(await page.locator('#chapterText').inputValue(),fixture.chapters[2].content);assert(await page.locator('#chapterEditor').evaluate(e=>e===document.activeElement));
    await page.keyboard.press('Tab');assert(await page.locator('#returnToExport').evaluate(e=>e===document.activeElement));await page.keyboard.press('Enter');
    await counts(page,3,1);assert(await page.locator('#exportOverview').evaluate(e=>e===document.activeElement));assert.deepEqual((await data(page)).chapters,before);
    const motion=await page.evaluate(()=>['#exportReviewNote','.manuscript-chevron'].map(s=>getComputedStyle(document.querySelector(s)).transitionDuration));if(reduced)assert.deepEqual(motion,['0s','0s']);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await context.close();console.log(`PASS ${lang} ${width}px reduced=${reduced}: empty/mixed counts, directory, keyboard check/return, unchanged text, export access, layout`);
  }
  for(const lang of ['zh','en','es']){
    const {context,page}=await newPage(lang,390,844);await importProject(page,fixture);await page.click('[data-step="2"]');
    const original=await data(page);await page.selectOption('#chapters',original.chapters[0].id);await page.fill('#chapterText',fixture.chapters[0].content+'\nEdited fictional text.');
    await counts(page,3,0);await page.click('[data-step="3"]');await counts(page,3,0);await page.click('#checkNextDraft');await page.locator('#returnToExport').waitFor();
    assert((await page.locator('#chapterText').inputValue()).endsWith('Edited fictional text.'));
    await page.click('#approvalButton');await counts(page,3,1);
    const longTitle='虚构长标题'.repeat(40);await page.fill('#editChapterTitle',longTitle);await counts(page,3,0);
    await page.click('#returnToExport');await counts(page,3,0);await page.locator('#exportDirectory summary').click();assert((await page.locator('#exportChapterList').innerText()).includes(longTitle));assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    // Draft export stays available and does not mark anything as reviewed.
    await verifyExports(page);assert((await data(page)).chapters.every(c=>!c.approved));
    await page.click('[data-step="2"]');
    for(const chapter of (await data(page)).chapters){await page.selectOption('#chapters',chapter.id);await page.waitForFunction(title=>document.querySelector('#editChapterTitle').value===title,chapter.title);await page.click('#approvalButton');await page.waitForFunction(()=>document.querySelector('#chapterStatus').textContent===window.MFH_LOCALES[document.querySelector('#language').value].reviewed);}
    await page.click('[data-step="3"]');await counts(page,3,3);assert(await page.locator('#checkNextDraft').isHidden());assert.equal(await page.locator('#exportChapterList button').count(),0);assert.equal(await page.locator('#exportOverview').getAttribute('data-state'),'reviewed');
    // Deleting chapters uses the existing confirmation and keeps the overview current.
    await page.click('[data-step="2"]');for(let remaining=3;remaining>0;remaining--){page.once('dialog',d=>d.accept());await page.click('[data-action="deleteChapter"]');await counts(page,remaining-1,remaining-1);}
    await page.click('[data-step="3"]');await counts(page,0,0);assert(await page.locator('#exportDirectory').isHidden());assert.equal(await page.locator('#exportChapterList li').count(),0);await verifyExports(page);
    const p=await data(page);assert.deepEqual(p.answers,original.answers);assert.deepEqual(p.materials,original.materials);assert.equal(p.workingAnswer,fixture.workingAnswer);
    // A genuinely empty new memoir also remains exportable and has no stale review-return link.
    await page.locator('.sidebar [data-action="new"]').click();await page.waitForFunction(id=>localStorage.getItem('mfh-active')!==id,p.id);await page.waitForFunction(()=>document.querySelector('#bookTitle').value==='');await page.click('[data-step="3"]');await counts(page,0,0);await verifyExports(page);assert(await page.locator('#returnToExport').isHidden());
    await context.close();console.log(`PASS ${lang}: edits revoke review, live counts, long titles, all-draft/all-reviewed/empty, delete, backup/Markdown/print content`);
  }
  assert.deepEqual(errors,[]);assert.equal(providerCalls,0);console.log(`PASS ${process.argv.includes('--workflow-only')?'3 workflows':'18 display scenarios + 3 workflows'}; no page errors or provider requests. file:// not attempted.`);
}finally{await browser.close();await new Promise(r=>{app.close(r);app.closeAllConnections();});}
