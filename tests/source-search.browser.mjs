// Optional real-browser regression check: node tests/source-search.browser.mjs
// Requires Playwright in the test environment, not as an app/runtime dependency.
// MFH_SCREENSHOT_DIR optionally retains screenshots; MFH_CHROMIUM_PATH selects an installed browser.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {existsSync} from 'node:fs';
import {mkdir, readFile} from 'node:fs/promises';
import path from 'node:path';
import {createApp} from '../server.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const C=globalThis.MFHCore, fixture=C.newProject('zh');
fixture.title='虚构示例 · 那条老街';
fixture.answers=[
  {id:C.uuid(),sourceId:'A2',question:'第一次走进修理铺，还记得什么？',answer:'这是用于界面验证的虚构回忆。那天清早，我沿着石板路走到修理铺，师傅让我先把工具摆好。窗外有一棵刚发芽的树。',include:true,date:''},
  {id:C.uuid(),sourceId:'A7',question:'午饭时，你通常坐在哪里？',answer:'我总坐在门口，带着自己做的饭。有时候邻居路过，会停下来聊两句。我们谈不上什么大事，但那条街让我慢慢觉得熟悉。',include:false,date:''},
  {id:C.uuid(),sourceId:'A12',question:'后来，再回到那条街是什么时候？',answer:'记不清是哪一年了。店面已经换过招牌，门口的树比记忆里高了很多。我在对面站了一会儿，没有进去。',include:true,date:''}
];
fixture.materials=[
  {id:C.uuid(),sourceId:'M3',name:'虚构材料 · 午后的旧信',content:'这是一封为界面测试编写的虚构信件。\n\n'+('那条街的石板路很长，下雨的时候会泛着光。我们把伞放在门口，坐下来慢慢说话。\n').repeat(15)+'\n信的结尾写着：蓝色车票。Café del barrio. <img src=x onerror="window.injected=true">',include:false},
  {id:C.uuid(),sourceId:'M9',name:'Fictional notes · First morning',content:'A fictional notebook entry. I remember the small patch of sunlight beside the workshop door.',include:true}
];
fixture.nextAnswer=13;fixture.nextMaterial=10;
let providerCalls=0;
const app=createApp({fetchImpl:async()=>{providerCalls++;throw new Error('No provider calls are allowed in this test');}});
await new Promise(r=>app.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:process.env.MFH_CHROMIUM_PATH||(existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined)});
const base=`http://127.0.0.1:${app.address().port}`, errors=[], output=process.env.MFH_SCREENSHOT_DIR;
if(output)await mkdir(output,{recursive:true});
const record=(page,id)=>page.locator('.source-record').filter({has:page.locator('.source-id').filter({hasText:`[${id}]`})});
async function data(page){return page.evaluate(async()=>{
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('memory-for-human',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});
  const result=await new Promise((resolve,reject)=>{const r=db.transaction('projects').objectStore('projects').get(localStorage.getItem('mfh-active'));r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)});db.close();return result;
});}
async function saved(page){await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent===window.MFH_LOCALES[document.querySelector('#language').value].saved);}
async function openPage(lang,width,height){
  const context=await browser.newContext({locale:lang==='zh'?'zh-CN':lang,viewport:{width,height}}),page=await context.newPage();
  page.on('pageerror',e=>errors.push(e.message));await page.goto(base);await page.locator('#bookTitle').waitFor();
  await page.locator('#backupFile').setInputFiles({name:'fictional.mfh.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
  await page.waitForFunction(()=>document.querySelector('#bookTitle').value==='虚构示例 · 那条老街');await page.click('[data-step="1"]');return {context,page};
}
async function search(page,query){await page.fill('#sourceSearch',query);}
async function expectStatus(page,shown,total){
  assert.equal(await page.locator('#sourceSearchStatus').innerText(),await page.evaluate(([shown,total])=>window.MFH_LOCALES[document.querySelector('#language').value].sourceResults.replace('{shown}',shown).replace('{total}',total),[shown,total]));
}
async function expectNotice(page,key){await page.waitForFunction(key=>document.querySelector('#toast').textContent===window.MFH_LOCALES[document.querySelector('#language').value][key],key);}
try{
  for(const lang of (process.argv.includes('--mutations-only')?[]:['zh','en','es']))for(const [device,width,height] of [['desktop',1440,1000],['mobile',390,844],['narrow',320,740]])for(const reduced of [false,true]){
    const {context,page}=await openPage(lang,width,height);await page.emulateMedia({reducedMotion:reduced?'reduce':'no-preference'});
    const original=await data(page);assert.equal(await page.locator('.source-record').count(),5);assert.equal(await page.locator('.source-record[open]').count(),0);
    await expectStatus(page,5,5);assert(await page.locator('#clearSourceSearch').isDisabled());
    assert.equal(await page.locator('#sourceSearch').getAttribute('aria-controls'),'answers materials');
    const label=await page.locator('label[for="sourceSearch"]').innerText();assert(label.length>3);assert.equal(await page.getByLabel(label,{exact:true}).count(),1);
    for(const [query,id] of [['午饭','A7'],['熟悉','A7'],['旧信','M3'],['蓝色车票','M3'],['CAFE DEL BARRIO','M3'],['first MORNING','M9'],['[A7]','A7'],['ｍ３','M3'],['<img','M3']]){
      await search(page,query);assert.equal(await page.locator('.source-record').count(),1);assert.equal(await record(page,id).count(),1);await expectStatus(page,1,5);
    }
    const summary=record(page,'M3').locator('summary');await summary.focus();await page.keyboard.press('Space');
    await page.waitForFunction(()=>!!document.querySelector('#materials details[open] .source-content')?.textContent);
    assert.equal(await record(page,'M3').locator('.source-content').textContent(),fixture.materials[0].content);
    assert.equal(await record(page,'M3').locator('img,script').count(),0);assert.equal(await page.evaluate(()=>window.injected),undefined);
    assert.equal(await record(page,'M3').locator('input').isChecked(),false);
    const motion=await record(page,'M3').evaluate(e=>[getComputedStyle(e.querySelector('.source-body')).animationName,getComputedStyle(e.querySelector('.source-arrow')).transitionDuration]);
    assert.equal(motion[0],reduced?'none':'source-reveal');if(reduced)assert.equal(motion[1],'0s');
    await page.keyboard.press('Tab');assert(await record(page,'M3').locator('input').evaluate(e=>document.activeElement===e));
    await summary.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>!document.querySelector('#materials details').open);
    await search(page,'no-such-source');await expectStatus(page,0,5);assert.equal(await page.locator('.source-record').count(),0);
    await page.click('#clearSourceSearch');assert(await page.locator('#sourceSearch').evaluate(e=>document.activeElement===e));await expectStatus(page,5,5);
    const unchanged=await data(page);assert.deepEqual(unchanged.answers,original.answers);assert.deepEqual(unchanged.materials,original.materials);assert.deepEqual(C.context(unchanged),C.context(original));
    assert(!Object.hasOwn(unchanged,'sourceQuery'));assert(!Object.hasOwn(unchanged,'expandedSources'));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    if(output&&!reduced){await page.locator('#toast').waitFor({state:'hidden'});await page.locator('#sourceLibrary').evaluate(e=>e.scrollIntoView({block:'start'}));await page.screenshot({path:path.join(output,`after-${lang}-${device}.png`)});}
    await context.close();console.log(`PASS ${lang} ${width}px reduced=${reduced}: search fields/full text/IDs, safe disclosure, keyboard, counts, clear, unchanged AI selection`);
  }
  for(const lang of ['zh','en','es']){
    const {context,page}=await openPage(lang,390,844);
    // Editing a filtered item may remove the match; focus and feedback remain useful.
    await search(page,'蓝色车票');await record(page,'M3').locator('summary').click();await record(page,'M3').locator('[data-action="editMaterial"]').click();
    await page.fill('#materialContent','汉'.repeat(1600)+' <script>window.injected=true</script>');await page.locator('#materialForm button[type="submit"],#materialForm button.primary').click();
    await page.waitForFunction(()=>!document.querySelector('#materialDialog').open);await expectStatus(page,0,5);await expectNotice(page,'sourceOutsideSearch');
    assert(await page.locator('#sourceSearch').evaluate(e=>e===document.activeElement));
    await search(page,'[M3]');assert(await record(page,'M3').evaluate(e=>e.open));
    assert.equal(await record(page,'M3').locator('.source-content').textContent(),'汉'.repeat(1600)+' <script>window.injected=true</script>');assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    // Inclusion control is the only action here that changes the AI selection.
    await record(page,'M3').locator('input').check();await saved(page);
    assert.equal((await data(page)).materials.find(m=>m.sourceId==='M3').include,true);
    assert.equal(await record(page,'M3').locator('.source-inclusion').innerText(),await page.evaluate(()=>window.MFH_LOCALES[document.querySelector('#language').value].sourceIncluded));
    await record(page,'M3').locator('input').uncheck();await saved(page);
    await record(page,'M3').locator('[data-action="editMaterial"]').click();await page.fill('#materialName','CANCELLED');await page.keyboard.press('Escape');
    assert(await record(page,'M3').locator('[data-action="editMaterial"]').evaluate(e=>e===document.activeElement));assert.equal((await data(page)).materials.find(m=>m.sourceId==='M3').name,fixture.materials[0].name);
    await search(page,'熟悉');await record(page,'A7').locator('summary').click();await record(page,'A7').locator('[data-action="editAnswer"]').click();await page.fill('#editAnswer','Edited fictional answer.');await page.locator('#editAnswerForm button.primary').click();
    await page.waitForFunction(()=>!document.querySelector('#editAnswerDialog').open);await expectStatus(page,0,5);await expectNotice(page,'sourceOutsideSearch');
    assert.equal((await data(page)).answers.find(a=>a.sourceId==='A7').include,false);
    // Cancel then confirm deletion under a filter; remaining IDs must not shift.
    await search(page,'M9');await record(page,'M9').locator('summary').click();page.once('dialog',d=>d.dismiss());await record(page,'M9').locator('[data-action="deleteMaterial"]').click();assert.equal(await record(page,'M9').count(),1);
    page.once('dialog',d=>d.accept());await record(page,'M9').locator('[data-action="deleteMaterial"]').click();await expectNotice(page,'sourceRemoved');await expectStatus(page,0,4);assert(await page.locator('#sourceSearch').evaluate(e=>e===document.activeElement));
    await search(page,'A2');await record(page,'A2').locator('summary').click();page.once('dialog',d=>d.accept());await record(page,'A2').locator('[data-action="deleteAnswer"]').click();await expectNotice(page,'sourceRemoved');await expectStatus(page,0,3);
    await search(page,'no-such-source');await page.click('[data-action="addText"]');await page.fill('#materialName','New fictional note');await page.fill('#materialContent','A quiet morning.');await page.locator('#materialForm button.primary').click();await page.waitForFunction(()=>!document.querySelector('#materialDialog').open);await expectNotice(page,'sourceOutsideSearch');
    assert.equal((await data(page)).materials.find(m=>m.sourceId==='M10').include,false);
    await page.fill('#answer','New fictional answer.');await page.click('[data-action="saveAnswer"]');await expectNotice(page,'sourceOutsideSearch');assert.equal((await data(page)).answers.find(a=>a.sourceId==='A13').include,true);
    await page.locator('#textFile').setInputFiles({name:'imported-fiction.txt',mimeType:'text/plain',buffer:Buffer.from('Imported fictional note.')});
    await page.waitForFunction(()=>document.querySelector('#sourceSearchStatus').textContent.includes('6'));await saved(page);
    assert.equal((await data(page)).materials.find(m=>m.sourceId==='M11').include,false);
    const beforeBackup=await data(page);assert.deepEqual(beforeBackup.answers.map(a=>a.sourceId),['A7','A12','A13']);assert.deepEqual(beforeBackup.materials.map(m=>m.sourceId),['M3','M10','M11']);
    await page.click('[data-step="3"]');const downloadEvent=page.waitForEvent('download');await page.click('[data-action="backup"]');const download=await downloadEvent,backup=JSON.parse(await readFile(await download.path(),'utf8'));
    assert(!Object.hasOwn(backup,'sourceQuery'));assert(!Object.hasOwn(backup,'expandedSources'));
    await page.locator('#backupFile').setInputFiles({name:'round-trip.mfh.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
    await page.waitForFunction(id=>localStorage.getItem('mfh-active')!==id,beforeBackup.id);await page.click('[data-step="1"]');
    assert.equal(await page.locator('#sourceSearch').inputValue(),'');assert.equal(await page.locator('.source-record[open]').count(),0);
    const restored=await data(page);for(const kind of ['answers','materials'])assert.deepEqual(restored[kind].map(({id,...s})=>s),beforeBackup[kind].map(({id,...s})=>s));
    assert.equal(restored.nextAnswer,beforeBackup.nextAnswer);assert.equal(restored.nextMaterial,beforeBackup.nextMaterial);
    await search(page,'M3');await record(page,'M3').locator('summary').click();await page.selectOption('#projects',beforeBackup.id);await page.click('[data-step="1"]');
    assert.equal(await page.locator('#sourceSearch').inputValue(),'');assert.equal(await page.locator('.source-record[open]').count(),0);
    await page.locator('.sidebar [data-action="new"]').click();await page.waitForFunction(id=>localStorage.getItem('mfh-active')!==id,beforeBackup.id);await page.click('[data-step="1"]');await expectStatus(page,0,0);assert.equal(await page.locator('.source-record').count(),0);
    await context.close();console.log(`PASS ${lang}: filtered edits/deletes/add/import, cancellation, include controls, stable IDs, backup/restore, memoir switching`);
  }
  assert.deepEqual(errors,[]);assert.equal(providerCalls,0);console.log(`PASS ${process.argv.includes('--mutations-only')?'3 mutation scenarios':'18 display scenarios + 3 mutation scenarios'}; no page errors or provider requests. file:// not attempted (environment policy).`);
}finally{await browser.close();await new Promise(r=>{app.close(r);app.closeAllConnections();});}
