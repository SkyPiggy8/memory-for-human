// Optional UI regression: run with Playwright and a local Chromium installation.
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFile} from 'node:fs/promises';
import {createApp} from '../server.mjs';
const {chromium}=createRequire(import.meta.url)('playwright');
const C=globalThis.MFHCore,errors=[],requests=[];
let providerCalls=0;
const app=createApp({fetchImpl:async()=>{providerCalls++;throw Error('Provider calls forbidden');}});
await new Promise(r=>app.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({headless:true,executablePath:'/usr/bin/chromium'});
async function saved(p){await p.waitForFunction(()=>document.querySelector('#saveStatus').textContent===window.MFH_LOCALES[document.querySelector('#language').value].saved);}
async function reveal(p,action){
  const button=p.locator(`[data-action="${action}"]`);
  if(!await button.isVisible()){
    if(!await p.locator('#chapterComposer').evaluate(e=>e.open))await p.locator('#chapterComposer>summary').click();
    if(!await button.isVisible())await p.locator('.other-methods>summary').click();
  }
  return button;
}
try{
  for(const lang of ['zh','en','es'])for(const width of [320,390,1440])for(const reduced of [false,true]){
    const ctx=await browser.newContext({locale:lang==='zh'?'zh-CN':lang,viewport:{width,height:width<700?844:1000},reducedMotion:reduced?'reduce':'no-preference'});
    const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
    p.on('request',r=>{if(r.method()==='POST'||!new URL(r.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))requests.push(r.url());});
    await p.goto(`http://127.0.0.1:${app.address().port}`);await saved(p);
    const fixture=C.newProject(lang);fixture.title='Fictional editorial test';
    fixture.answers=[{id:C.uuid(),sourceId:'A1',question:'Fictional question',answer:'Fictional memory. Café junto al río. 虚构的河边回忆。',include:true,date:''}];
    await p.locator('#backupFile').setInputFiles({name:'fictional.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(fixture))});
    await p.waitForFunction(()=>document.querySelector('#bookTitle').value==='Fictional editorial test');await p.click('[data-step="2"]');
    assert(await p.locator('#chapterComposer').evaluate(e=>e.open));assert(!await p.locator('#chapters').isVisible());
    if(await p.locator('#chapterFinderButton').count())assert(!await p.locator('#chapterFinderButton').isVisible());
    assert.equal(await p.locator('#organizerPrimary>button').count(),1);
    assert.equal(await p.locator('#writingBookTitle').innerText(),fixture.title);
    assert(await p.locator('.editorial-writing [data-i18n]').evaluateAll(es=>es.every(e=>e.textContent.trim()&&e.textContent!==e.dataset.i18n)));
    if(await p.locator('#writingLocalButton').count())assert.equal(await p.locator('#organizerPrimary>button').getAttribute('data-action'),'collect');
    assert.equal(await p.locator('#organizerAlternatives>button').count(),2);
    const collect=await reveal(p,'collect');await collect.focus();await p.keyboard.press('Enter');
    await p.waitForFunction(()=>!document.querySelector('#chapterEditor').hidden);await saved(p);
    assert(!await p.locator('#chapterComposer').evaluate(e=>e.open));
    const original=await p.locator('#chapterText').inputValue();assert(original.includes(fixture.answers[0].answer));
    const title='Fictional / 虚构 / Memorias junto al río — '.repeat(5);
    await p.fill('#editChapterTitle',title);await p.fill('#chapterText',original+'\n\nAn edited fictional paragraph.');await saved(p);
    assert.equal(await p.locator('#writingSaveStatus').innerText(),await p.locator('#saveStatus').innerText());
    assert.equal(await p.locator('label[for="chapterText"]').count(),1);
    assert.equal(await p.locator('#chapterEditor').count(),1);
    const metrics=await p.locator('#chapterText').evaluate(e=>({width:e.getBoundingClientRect().width,size:parseFloat(getComputedStyle(e).fontSize),line:parseFloat(getComputedStyle(e).lineHeight)}));
    assert(metrics.width<=680.5);assert(metrics.size>=18);assert(metrics.line>=30);
    const editorTop=await p.locator('#chapterEditor').evaluate(e=>e.getBoundingClientRect().top);
    const creationTop=await p.locator('#chapterComposer').evaluate(e=>e.getBoundingClientRect().top);assert(editorTop<creationTop);
    await p.locator('#chapterComposer>summary').focus();await p.keyboard.press('Enter');assert(await p.locator('#chapterComposer').evaluate(e=>e.open));
    await p.locator('.other-methods>summary').focus();await p.keyboard.press('Enter');
    assert(await p.locator('.composer-content .notice').isVisible());
    for(const button of await p.locator('.editorial-writing button').all())if(await button.isVisible())assert((await button.boundingBox()).height>=43.9);
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await p.locator('#chapterComposer>summary').focus();await p.keyboard.press('Enter');
    await p.locator('#approvalButton').click();await saved(p);
    await p.fill('#chapterText',original+'\n\nFinal fictional edit.');await saved(p);
    await p.click('[data-step="3"]');const download=p.waitForEvent('download');await p.locator('[data-panel="3"] [data-action="backup"]').click();
    const data=JSON.parse(await readFile(await(await download).path(),'utf8'));assert.equal(data.chapters.length,1);assert.equal(data.chapters[0].title,title);assert.equal(data.chapters[0].approved,false);assert.equal(data.answers[0].answer,fixture.answers[0].answer);
    assert(data.chapters[0].content.endsWith('Final fictional edit.'));
    await p.reload();await saved(p);await p.click('[data-step="2"]');assert.equal(await p.locator('#chapterText').inputValue(),data.chapters[0].content);
    await p.locator('#chapterText').focus();await p.keyboard.press('Tab');assert(await p.locator('[data-action="reviewAI"]').evaluate(e=>e===document.activeElement));
    await ctx.close();console.log(`PASS ${lang} ${width}px reduced=${reduced}: empty/create/edit, single editor, hierarchy, keyboard, sizing, backup and reload`);
  }
  assert.equal(providerCalls,0);assert.deepEqual(requests,[]);assert.deepEqual(errors,[]);
  console.log('PASS 18 editorial scenarios; zero API POSTs, external requests, provider calls or page errors.');
}finally{await browser.close();await new Promise(r=>{app.close(r);app.closeAllConnections();});}
