import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import '../app/core.js';
const C=globalThis.MFHCore;
const png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6z2kAAAAASUVORK5CYII=';
function photoProject(){
  const p=C.newProject();p.chapters=[{id:C.uuid(),title:'First job',content:'The workshop. [A1]\n\nWhy it mattered.',approved:true,origin:'manual',updatedAt:''}];p.activeChapter=p.chapters[0].id;p.photoChapterIds=[p.activeChapter];
  p.photos=[{id:C.uuid(),sourceId:'P7',name:'workshop.png',data:png,description:'A workshop with my father.',meaning:'He taught me to repair things.',include:true,placement:null,placementApproved:false}];p.nextPhoto=8;return p;
}
test('legacy v2 and photo backups restore additively, preserving original bytes, source IDs and remapped positions',()=>{
  const legacy=C.newProject();delete legacy.photos;delete legacy.photoChapterIds;delete legacy.nextPhoto;
  assert.deepEqual(C.validateProject(legacy).photos,[]);
  const p=photoProject();p.photos[0].placement={chapterId:p.activeChapter,afterParagraph:1,caption:'My first workshop',reason:'The first job scene',order:0};p.photos[0].placementApproved=true;p.photos[0].apiKey='DUMMY-PHOTO-SECRET';
  C.replaceChapter(p,p.activeChapter,'The workshop, in my words. [A1]\n\nWhat father taught me.');p.photos[0].placementApproved=true;
  const backup=C.publicProject(p);assert(!JSON.stringify(backup).includes('DUMMY-PHOTO-SECRET'));
  const restored=C.validateProject(backup);assert.notEqual(restored.id,p.id);assert.notEqual(restored.activeChapter,p.activeChapter);assert.equal(restored.photos[0].data,png);assert.equal(restored.photos[0].sourceId,'P7');assert.equal(restored.nextPhoto,8);assert.equal(restored.photos[0].placement.chapterId,restored.activeChapter);assert.deepEqual(restored.photoChapterIds,[restored.activeChapter]);assert.equal(restored.chapters[0].revisions[0].content,'The workshop. [A1]\n\nWhy it mattered.');
});
test('AI photo context omits pixels and unselected chapters, sources and photos',()=>{
  const p=photoProject();p.chapters.push({id:'private-chapter',title:'Private',content:'PRIVATE-CHAPTER'});p.photos.push({...p.photos[0],id:'private-photo',sourceId:'P8',description:'PRIVATE-PHOTO',include:false});p.answers=[{sourceId:'A1',question:'Q',answer:'UNNEEDED-ANSWER',include:true}];
  const prompt=C.taskPrompt('photos',p);assert(prompt.system.includes('cannot see the image pixels'));assert(!prompt.user.includes('base64'));assert(!prompt.user.includes(png));assert(!prompt.user.includes('PRIVATE'));assert(!prompt.user.includes('UNNEEDED'));assert(prompt.user.includes('He taught me'));assert(C.taskPrompt('rewrite',p).user.includes('The workshop'));
  assert(!JSON.stringify(C.context(p)).includes('base64'));
});
test('photo proposals reject duplicate, unknown, unselected and out-of-range positions before mutation',()=>{
  const p=photoProject(),item={photo:'P7',chapterId:p.activeChapter,afterParagraph:1,caption:'The workshop',reason:'Same scene'};
  assert.equal(C.validatePhotoPlan(p,{placements:[item]})[0].photoId,p.photos[0].id);
  for(const placements of [[item,item],[{...item,photo:'P999'}],[{...item,chapterId:'unknown'}],[{...item,afterParagraph:3}],[{...item,afterParagraph:-1}],[{...item,afterParagraph:1.5}],[{...item,caption:[]}]] )assert.throws(()=>C.validatePhotoPlan(p,{placements}),/INVALID_PLACEMENT/);
  p.photoChapterIds=[];assert.throws(()=>C.validatePhotoPlan(p,{placements:[item]}),/INVALID_PLACEMENT/);assert.equal(p.photos[0].placement,null);
  for(const data of ['https://example.com/p.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,AAAA','data:image/jpeg;base64,PGh0bWw+'])assert.throws(()=>C.photoInfo(data),/INVALID_PHOTO/);
  assert.throws(()=>C.photoInfo('x'.repeat(8*1024*1024)),/PHOTO_SIZE/);
});
test('only confirmed photos enter book output; rewriting retains prior text and invalidates positions',()=>{
  const p=photoProject(),c=p.chapters[0];p.photos[0].placement={chapterId:c.id,afterParagraph:1,caption:'My workshop',reason:'',order:0};
  assert.deepEqual(C.chapterBlocks(p,c).map(b=>b.type),['text','text']);p.photos[0].placementApproved=true;
  assert.deepEqual(C.chapterBlocks(p,c).map(b=>b.type),['text','photo','text']);assert.equal(C.bookFiles(p,{bookPackageReadme:'Instructions'}).length,3);
  C.replaceChapter(p,c.id,'A shorter draft.');assert.equal(c.approved,false);assert.equal(p.photos[0].placementApproved,false);assert.equal(c.revisions.length,1);assert.equal(C.bookFiles(p,{bookPackageReadme:'Instructions'}).length,2);
  // Positions awaiting review can survive a chapter becoming shorter.
  p.photos[0].placement.afterParagraph=2;assert.equal(C.validateProject(C.publicProject(p)).photos[0].placement.afterParagraph,2);
  C.restoreRevision(p,c.id);assert.equal(c.content,'The workshop. [A1]\n\nWhy it mattered.');assert.equal(c.revisions.at(-1).content,'A shorter draft.');assert.equal(p.photos[0].placementApproved,false);
});
test('book ZIP uses valid signatures, known CRC32 and unchanged photo bytes',()=>{
  const bytes=new TextEncoder().encode('123456789'),zip=C.zipFiles([{name:'memoir.md',bytes}]),v=new DataView(zip.buffer);
  assert.equal(v.getUint32(0,true),0x04034b50);assert.equal(v.getUint32(14,true),0xcbf43926);assert.equal(v.getUint32(zip.length-22,true),0x06054b50);assert.equal(v.getUint16(zip.length-14,true),1);
  const p=photoProject();p.photos[0].placement={chapterId:p.activeChapter,afterParagraph:0,caption:'My workshop',reason:'',order:0};p.photos[0].placementApproved=true;
  const files=C.bookFiles(p,{bookPackageReadme:'Instructions'});assert.equal(files[2].name,'photos/P7.png');assert.equal(Buffer.from(files[2].bytes).toString('base64'),png.split(',')[1]);assert(new TextDecoder().decode(files[0].bytes).includes('](photos/P7.png)'));
  p.photos[0].placement.caption='<script>alert(1)</script> [a](javascript:bad)';const md=C.markdown(p,{});assert(!md.includes('<script>'));assert(md.includes('&lt;script&gt;'));assert(md.includes('\\[a\\]'));
});
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
