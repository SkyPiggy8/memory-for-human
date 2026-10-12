import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import '../app/core.js';
const C=globalThis.MFHCore;
test('backup round trip keeps long source text, unfinished answers, chapter selection, and stable citations without credentials',()=>{
  const p=C.newProject('es');p.title='La vida';p.workingAnswer='An unfinished thought';p.apiKey='DUMMY-SECRET';p.nextAnswer=9;
  p.answers=[{id:C.uuid(),sourceId:'A7',include:true,question:'When?',answer:'Approximate date only.',date:''}];
  p.materials=[{id:C.uuid(),sourceId:'M3',name:'Long transcript',content:'x'.repeat(700000),include:false}];
  p.chapters=[{id:C.uuid(),title:'One',content:'Approximate date. [A7]',approved:false,origin:'ai',updatedAt:''},{id:C.uuid(),title:'Two',content:'My words',approved:true,origin:'manual',updatedAt:''}];p.activeChapter=p.chapters[1].id;
  const backup=C.publicProject(p);assert.equal(backup.materials[0].content.length,700000);assert.equal(backup.activeChapter,p.activeChapter);assert.equal(backup.apiKey,undefined);
  const restored=C.validateProject(JSON.parse(JSON.stringify(backup)));assert.notEqual(restored.id,p.id);assert.equal(restored.answers[0].sourceId,'A7');assert.equal(restored.nextAnswer,9);assert.equal(restored.chapters.find(c=>c.id===restored.activeChapter).title,'Two');assert.equal(restored.workingAnswer,p.workingAnswer);assert.equal(restored.chapters[1].approved,true);
});
test('selected sources alone enter model context and source IDs do not change after deletions',()=>{
  const p=C.newProject();p.answers=[{sourceId:'A4',question:'Q',answer:'Allowed',include:true},{sourceId:'A8',question:'Q',answer:'PRIVATE-NOT-SENT',include:false}];
  p.materials=[{sourceId:'M11',name:'Selected',content:'Useful',include:true},{sourceId:'M12',name:'Private',content:'PRIVATE-FILE',include:false}];
  p.apiKey='DUMMY-SECRET';p.chapters=[{id:'c1',title:'Other chapter',content:'DO-NOT-SEND-ALL-CHAPTERS'},{id:'c2',title:'Current',content:'Check this'}];p.activeChapter='c2';
  const context=C.context(p);assert.deepEqual(context.answers.map(a=>a.source),['A4']);assert.deepEqual(context.materials.map(m=>m.source),['M11']);assert(!JSON.stringify(context).includes('PRIVATE'));assert(!JSON.stringify(context).includes('DUMMY-SECRET'));
  const review=C.context(p,'review');assert.equal(review.chapter.text,'Check this');assert(!JSON.stringify(review).includes('DO-NOT-SEND'));
  p.answers.splice(1,1);assert.equal(C.context(p).answers[0].source,'A4');
});
test('malformed backups are rejected and oversized context is not silently truncated',()=>{
  assert.throws(()=>C.validateProject({version:2}),/INVALID_PROJECT/);
  const p=C.newProject();p.answers=[{question:'Q',answer:'x'.repeat(110000),include:true}];assert.throws(()=>C.taskPrompt('draft',p),/CONTEXT_TOO_LARGE/);
});
test('all three UI languages have the same keys and scene-specific question coverage',async()=>{
  const sandbox={window:{}};vm.runInNewContext(await fs.readFile(new URL('../app/i18n.js',import.meta.url),'utf8'),sandbox);
  const flatten=(obj,p='')=>Object.entries(obj).flatMap(([k,v])=>typeof v==='object'&&!Array.isArray(v)?flatten(v,p+k+'.'):[p+k]).sort();
  const {MFH_LOCALES:L,MFH_QUESTIONS:Q}=sandbox.window;
  assert.deepEqual(flatten(L.zh),flatten(L.en));assert.deepEqual(flatten(L.zh),flatten(L.es));
  for(const lang of ['zh','en','es']){
    assert.equal(L[lang].faqLabels.length,6);assert.equal(L[lang].faqAnswers.length,6);
    for(const scene of C.scenes){
      assert(Q[lang][scene].length>=(scene==='life'?40:20),`${lang}/${scene} needs enough starting topics`);
      assert.equal(Q[lang][scene].length,Q.zh[scene].length,`${lang}/${scene} has untranslated questions`);
      assert(Q[lang][scene].every(q=>typeof q==='string'&&q.trim().length>5),`${lang}/${scene} has an empty question`);
      assert.equal(new Set(Q[lang][scene]).size,Q[lang][scene].length,`${lang}/${scene} repeats a starting question`);
    }
    assert(Q[lang].life.length>Q[lang].lovers.length);
  }
});
