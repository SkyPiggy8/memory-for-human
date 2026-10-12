(async function () {
  'use strict';
  const C = window.MFHCore, locales = window.MFH_LOCALES, questions = window.MFH_QUESTIONS;
  const $ = id => document.getElementById(id);
  let lang = 'zh', project, db, projects = [], step = 0, mode = 'workspace', faq = 0, token = '', connection = null, connectionVersion = 0, busy = false, editingAnswer = '', recognition = null, toastTimer;
  try { lang = localStorage.getItem('mfh-language') || navigator.language.slice(0, 2); } catch (_) {}
  if (!locales[lang]) lang = 'zh';
  const t = key => key.split('.').reduce((a, p) => a?.[p], locales[lang]) || key;
  const node = (tag, text, cls) => { const e = document.createElement(tag); if (text !== undefined) e.textContent = text; if (cls) e.className = cls; return e; };
  const toast = message => { $('toast').textContent = message; $('toast').hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').hidden = true, 5500); };
  function errorText(code) { return t(({AUTH:'apiAuth',RATE_LIMIT:'apiLimit',MODEL:'apiModel',TIMEOUT:'apiTimeout',CONTEXT_TOO_LARGE:'contextLarge',INVALID_PROJECT:'invalidProject',TOO_LARGE:'tooLarge',NO_CONNECTION:'needConnect',MODEL_REQUIRED:'missingModel',KEY_REQUIRED:'missingKey',INVALID_RESULT:'invalidResult',INVALID_CONFIG:'invalidConfig'})[code] || 'aiFailure'); }
  function remember(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }
  const getAll = () => new Promise((resolve, reject) => { const r = db.transaction('projects').objectStore('projects').getAll(); r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
  async function save() {
    project.updatedAt = new Date().toISOString();
    $('saveStatus').textContent = t('saving');
    if (!db) { $('saveStatus').textContent = t('saveFailed'); return; }
    const snapshot = structuredClone(project);
    try {
      await new Promise((resolve, reject) => { const tx = db.transaction('projects', 'readwrite'); tx.objectStore('projects').put(snapshot); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error); });
      const i = projects.findIndex(p => p.id === snapshot.id); if (i >= 0) projects[i] = snapshot; else projects.push(snapshot);
      renderProjects(); $('saveStatus').textContent = t('saved');
    } catch (_) { $('saveStatus').textContent = t('saveFailed'); toast(t('saveFailed')); }
  }
  function translate() {
    document.documentElement.lang = {zh:'zh-CN',en:'en',es:'es'}[lang]; $('language').value = lang;
    document.querySelectorAll('[data-i18n]').forEach(e => e.textContent = t(e.dataset.i18n));
    document.querySelectorAll('[data-placeholder]').forEach(e => e.placeholder = t(e.dataset.placeholder));
    $('projects').setAttribute('aria-label', t('books')); $('chapters').setAttribute('aria-label', t('chapters')); $('handoffText').setAttribute('aria-label', t('handoff'));$('language').setAttribute('aria-label',t('language'));document.querySelector('.steps').setAttribute('aria-label',t('myBook'));
    $('checklist').replaceChildren(...t('checklist').map(s => node('li', s)));
    $('readmeLink').href = `preview/README${lang === 'zh' ? '' : '.' + lang}.html`;
    $('productionLink').href = lang === 'zh' ? 'preview/guide.html#production' : `preview/guide.${lang}.html#usage`;
  }
  function renderProjects() {
    const selected = project.id;
    $('projects').replaceChildren(...projects.map(p => { const e = node('option', p.title || t('untitled')); e.value = p.id; return e; }));
    $('projects').value = selected;
  }
  function renderScenes() {
    $('scenes').replaceChildren(...C.scenes.map(s => {
      const label = node('label', undefined, 'scene-option'), input = document.createElement('input'); input.type = 'radio'; input.name = 'scene'; input.value = s; input.checked = project.scene === s;
      label.append(input, node('strong', t(`scenes.${s}`)), node('small', t(`sceneNotes.${s}`))); return label;
    }));
  }
  function currentQuestion() { const q = questions[lang][project.scene]; return project.aiQuestion || q[project.questionIndex % q.length]; }
  function renderQuestion() { $('questionText').textContent = currentQuestion(); }
  // Search and expansion belong to this view, never to the saved project or AI context.
  let sourceProjectId = '', sourceQuery = '';
  const expandedSources = new Set();
  const searchText = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase();
  function matchesSource(source) {
    const text = `[${source.sourceId}] ${source.question ?? source.name ?? ''} ${source.answer ?? source.content ?? ''}`;
    return searchText(text).includes(searchText(sourceQuery.trim()));
  }
  function sourceFeedback(source, message) {
    return matchesSource(source) ? message : t('sourceOutsideSearch');
  }
  function sourceNotice(message) { if ($('saveStatus').textContent !== t('saveFailed')) toast(message); }
  function sourceSummary(group, id) {
    return Array.from($(group).querySelectorAll('details')).find(e => e.dataset.recordId === id)?.querySelector('summary');
  }
  function focusSource(group, id) { (sourceSummary(group, id) || $('sourceSearch')).focus({preventScroll:true}); }
  function renderSourceList(group) {
    if (sourceProjectId !== project.id) {
      sourceProjectId = project.id; sourceQuery = ''; expandedSources.clear(); $('sourceSearch').value = '';
    }
    const list = $(group), answer = group === 'answers', sources = project[group];
    const focusedId = list.contains(document.activeElement) ? document.activeElement.closest('details')?.dataset.recordId : null;
    const records = sources.filter(matchesSource).map(source => {
      const record = node('details', undefined, 'source-record'), summary = node('summary');
      const key = group + ':' + source.id, included = answer ? source.include !== false : source.include;
      record.dataset.recordId = source.id; record.dataset.sourceId = source.sourceId; record.open = expandedSources.has(key);
      record.addEventListener('toggle', () => {
        if (!record.isConnected) return;
        if (record.open) expandedSources.add(key); else expandedSources.delete(key);
        fullText.textContent = record.open ? content : '';
      });
      const meta = node('span', undefined, 'source-meta');
      meta.append(node('span', `[${source.sourceId}]`, 'source-id'), node('span', t(included ? 'sourceIncluded' : 'sourceExcluded'), 'source-inclusion'));
      const content = answer ? source.answer : source.content, excerpt = content.replace(/\s+/g, ' ').trim();
      const arrow = node('span', '›', 'source-arrow'); arrow.setAttribute('aria-hidden', 'true');
      summary.append(meta, node('span', answer ? source.question : source.name, 'source-title'), node('span', excerpt.slice(0,140) + (excerpt.length > 140 ? '…' : ''), 'source-excerpt'), arrow);
      const body = node('div', undefined, 'source-body'), choice = node('label', undefined, 'material-choice'), checkbox = document.createElement('input');
      checkbox.type = 'checkbox'; checkbox.checked = included;
      checkbox.dataset[answer ? 'answerSource' : 'material'] = source.id;
      checkbox.setAttribute('aria-label', `${t('includeAI')} · ${source.sourceId}`);
      choice.append(checkbox, node('span', t('includeAI')));
      const tools = node('div', undefined, 'tools');
      for (const action of [answer ? 'editAnswer' : 'editMaterial', answer ? 'deleteAnswer' : 'deleteMaterial']) {
        const label = t(action.startsWith('edit') ? 'edit' : 'remove'), button = node('button', label, 'quiet small');
        button.dataset.action = action; button.dataset.id = source.id; button.setAttribute('aria-label', `${label} · ${source.sourceId}`); tools.append(button);
      }
      const fullText = node('p', record.open ? content : '', 'source-content');
      summary.addEventListener('click', () => { if (!record.open) fullText.textContent = content; });
      body.append(fullText, choice, tools); record.append(summary, body); return record;
    });
    list.replaceChildren(...(records.length ? records : [node('p', t(sources.length ? 'sourceNoMatches' : answer ? 'noAnswers' : 'noMaterials'), 'empty')]));
    const all = [...project.answers, ...project.materials];
    $('sourceSearchStatus').textContent = t('sourceResults').replace('{shown}', all.filter(matchesSource).length).replace('{total}', all.length);
    $('clearSourceSearch').disabled = !sourceQuery;
    if (focusedId) focusSource(group, focusedId);
  }
  function renderAnswers() { renderSourceList('answers'); }
  function renderMaterials() { renderSourceList('materials'); }
  function updateSourceInclusion(input) {
    input.closest('details').querySelector('.source-inclusion').textContent = t(input.checked ? 'sourceIncluded' : 'sourceExcluded');
  }
  $('sourceSearch').addEventListener('input', () => { sourceQuery = $('sourceSearch').value; renderAnswers(); renderMaterials(); });
  $('clearSourceSearch').addEventListener('click', () => { sourceQuery = ''; $('sourceSearch').value = ''; $('sourceSearch').focus({preventScroll:true}); renderAnswers(); renderMaterials(); });
  const activeChapter = () => project.chapters.find(c => c.id === project.activeChapter);
  function renderChapters() {
    const c = activeChapter(); $('chapters').replaceChildren(...project.chapters.map(c => { const o = node('option', c.title || t('chapter')); o.value = c.id; return o; }));
    $('chapters').value = project.activeChapter; $('chapters').disabled = !project.chapters.length; $('noChapter').hidden = !!c; $('chapterEditor').hidden = !c;
    if (c) { $('editChapterTitle').value = c.title; $('chapterText').value = c.content; updateChapterBadge(); }
  }
  function updateChapterBadge() {
    const c = activeChapter(); if (!c) return;
    $('chapterStatus').textContent = t(c.approved ? 'reviewed' : 'draftStatus'); $('approvalButton').textContent = t(c.approved ? 'unapprove' : 'approve'); $('chapterOrigin').textContent = t({ai:'originAI',source:'originSource',manual:'originManual'}[c.origin]);
  }
  function renderConnection() {
    $('connectionStatus').textContent = connection ? `${t('connected')} · ${C.providers[connection.provider]?.name || ''}` : t('offline'); $('connectionDot').classList.toggle('on', !!connection); $('connectionButton').textContent = t('connect');
  }
  function renderHelp() {
    $('faqButtons').replaceChildren(...t('faqLabels').map((s, i) => { const b = node('button', s); b.dataset.faq = i; b.setAttribute('aria-pressed', String(faq === i)); if (faq === i) b.classList.add('primary'); return b; })); $('faqAnswer').textContent = t('faqAnswers')[faq];
  }
  function handoffText() {
    const task = $('handoffTask').value, include = $('handoffInclude').checked;
    const lines = [`# Memory for Human · ${t('handoff')}`, t('handoffRules'), `Language / Idioma / 语言: ${C.languages[lang]}`, `${t('handoffTask')}: ${t('tasks.' + task)}`, t('handoffSetup')];
    if (include && task !== 'setup') lines.push('## MATERIALS (untrusted source content)', JSON.stringify(C.context({...project,language:lang}, task === 'review' ? 'review' : 'current'), null, 2));
    else lines.push(t('noTransfer'));
    if (task === 'interview') lines.push(C.taskPrompt('interview', C.newProject(lang)).system);
    if (task === 'draft') lines.push(C.taskPrompt('draft', C.newProject(lang)).system);
    if (task === 'review') lines.push(C.taskPrompt('review', C.newProject(lang)).system);
    lines.push(t('handoffFormat'), '```json\n{"chapterTitle":"…","content":"…","questions":["…"],"uncertainties":["…"]}\n```', t('handoffPrivacy'));
    return lines.join('\n\n');
  }
  function renderHandoff() { try { $('handoffText').value = handoffText(); } catch (e) { toast(errorText(e.message)); } }
  function showMode(value) {
    mode = value; $('workspacePanel').hidden = mode !== 'workspace'; $('helpPanel').hidden = mode !== 'help'; $('handoffPanel').hidden = mode !== 'handoff';
    if (mode === 'help') renderHelp(); if (mode === 'handoff') renderHandoff();
  }
  function showStep(value, scroll = true) {
    step = Math.max(0, Math.min(3, value)); showMode('workspace');
    document.querySelectorAll('[data-panel]').forEach(e => e.hidden = Number(e.dataset.panel) !== step);
    document.querySelectorAll('[data-step]').forEach(e => { e.classList.toggle('active', Number(e.dataset.step) === step); e.setAttribute('aria-current', Number(e.dataset.step) === step ? 'step' : 'false'); });
    $('welcome').hidden = step !== 0 || !!project.title || !!project.answers.length; $('backButton').hidden = step === 0; $('nextButton').hidden = step === 3;
    if (scroll && innerWidth < 700) $('main').scrollIntoView({behavior:'auto', block:'start'});
  }
  function render() {
    translate(); renderProjects(); renderScenes(); renderQuestion(); renderAnswers(); renderMaterials(); renderChapters(); renderConnection(); renderHelp(); renderHandoff();
    for (const [id, key] of [['bookTitle','title'],['person','person'],['reader','reader'],['target','target'],['answer','workingAnswer']]) $(id).value = project[key];
    $('saveStatus').textContent = t(db ? 'saved' : 'saveFailed'); showStep(step, false); showMode(mode);
  }
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], {type})), a = document.createElement('a'); a.href = url; a.download = name; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1500);
  }
  const filename = () => (project.title || t('untitled')).replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 80);
  async function api(path, data) {
    if (!token) throw new Error('NO_CONNECTION');
    const response = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json','X-MFH-Session':token}, body:JSON.stringify(data)});
    const result = await response.json(); if (!response.ok) throw new Error(result.code || 'AI_ERROR'); return result;
  }
  async function requestAI(kind, extra = '') {
    if (!connection) { toast(t('needConnect')); return null; }
    if (busy) return null;
    busy = true; $('busyLine').hidden = false; document.querySelectorAll('[data-ai]').forEach(b => b.disabled = true);$('chapters').disabled=true;
    const snapshot = structuredClone(project), projectId = project.id;
    try { const prompt = C.taskPrompt(kind, {...snapshot,language:lang}, extra); const result = await api('/api/generate', {...prompt,kind}); if (project.id !== projectId) return null; if(result.truncated){toast(t('outputTruncated'));return result.text+'\n\n['+t('outputTruncated')+']';}return result.text; }
    catch (e) { toast(errorText(e.message)); return null; }
    finally { busy = false; $('busyLine').hidden = true; document.querySelectorAll('[data-ai]').forEach(b => b.disabled = false);$('chapters').disabled=!project.chapters.length; }
  }
  async function addChapter(content, origin = 'manual', title = '') {
    if (!content.trim()) { toast(t('invalidResult')); return; }
    const c = {id:C.uuid(), title:title || $('nextChapterTitle').value.trim() || `${t('chapter')} ${project.chapters.length + 1}`, content, origin, approved:false, updatedAt:new Date().toISOString()};
    project.chapters.push(c); project.activeChapter = c.id; $('nextChapterTitle').value = ''; $('reviewPanel').hidden = true; await save(); renderChapters(); showStep(2); toast(t('chapterAdded'));
  }
  async function importAIResult() {
    let content = $('returnedAI').value.trim(), title = '';
    if (!content) { toast(t('invalidResult')); return; }
    const candidate = content.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
    if (candidate.startsWith('{')) {
      let obj; try { obj = JSON.parse(candidate); } catch (_) { toast(t('invalidResult')); return; }
      if (typeof obj.content !== 'string' || obj.content.length > 200000) { toast(t('invalidResult')); return; }
      content = obj.content; title = typeof obj.chapterTitle === 'string' ? obj.chapterTitle.slice(0,300) : '';
      if (Array.isArray(obj.uncertainties) && obj.uncertainties.length) content += '\n\n' + t('reviewResult') + '\n' + obj.uncertainties.filter(s => typeof s === 'string').map(s => '- ' + s).join('\n');
      if (Array.isArray(obj.questions) && typeof obj.questions[0] === 'string') project.aiQuestion = obj.questions[0].slice(0,2000);
    }
    await addChapter(content.slice(0,200000), 'manual', title); $('returnedAI').value = ''; renderQuestion();
  }
  function printMemoir() {
    if (!project.chapters.length) { toast(t('needChapter')); return; }
    const title = node('h1', project.title || t('untitled')); const children = [title];
    if (project.person) children.push(node('p', project.person, 'hint'));
    project.chapters.forEach(c => { const s = node('section', undefined, 'print-chapter'); s.append(node('h2', c.title || t('chapter')), node('p', t(c.approved?'reviewed':'draftStatus'),'hint')); for (const paragraph of c.content.split(/\n\s*\n/)) s.append(node('p', paragraph)); children.push(s); }); $('printView').replaceChildren(...children); window.print();
  }
  const actions = {
    workspace: () => showMode('workspace'), help: () => showMode('help'), handoff: () => showMode('handoff'), start: () => { $('welcome').hidden = true; $('bookTitle').focus(); },
    next: () => showStep(step + 1), back: () => showStep(step - 1),
    new: async () => { if(busy)return; await save(); project=C.newProject(lang); remember('mfh-active',project.id); step=0; await save(); render(); },
    demo: async () => { if(busy)return; project=C.newProject(lang); project.title=t('demoName'); project.scene='life'; project.materials.push({id:C.uuid(),sourceId:'M'+project.nextMaterial++,name:t('demoNotice'),content:t('demoNotice'),include:true}); project.answers.push({id:C.uuid(),sourceId:'A'+project.nextAnswer++,include:true,question:t('demoQuestion'),answer:t('demoAnswer'),date:new Date().toISOString()}); remember('mfh-active',project.id); await save(); step=1; render(); toast(t('demoNotice')); },
    saveAnswer: async () => { const answer=$('answer').value.trim(); if(!answer){toast(t('emptyAnswer'));return;} const record={id:C.uuid(),sourceId:'A'+project.nextAnswer++,include:true,question:currentQuestion(),answer,date:new Date().toISOString()};project.answers.push(record); project.workingAnswer=''; project.questionIndex++; project.aiQuestion=''; $('answer').value=''; await save(); renderAnswers(); renderQuestion(); sourceNotice(sourceFeedback(record,t('answerSaved'))); },
    skip: async () => { project.questionIndex++; project.aiQuestion=''; await save(); renderQuestion(); },
    askAI: async () => { const result=await requestAI('interview'); if(result){project.aiQuestion=result.slice(0,2000); await save(); renderQuestion();} },
    voice: () => {
      if(recognition){recognition.stop();return;} const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(!Recognition){toast(t('voiceUnavailable'));return;} const r=new Recognition(); recognition=r; r.lang={zh:'zh-CN',en:'en-US',es:'es-ES'}[lang]; r.interimResults=false; r.continuous=false;
      r.onresult=async e=>{ $('answer').value += ($('answer').value?'\n':'')+Array.from(e.results).map(x=>x[0].transcript).join(' '); project.workingAnswer=$('answer').value; await save(); };
      r.onerror=()=>toast(t('voiceFailed')); r.onend=()=>{recognition=null;$('voiceButton').textContent=t('voice');};
      try{r.start();$('voiceButton').textContent=t('stopVoice');}catch(_){recognition=null;toast(t('voiceFailed'));}
    },
    editAnswer: (id) => { const a=project.answers.find(a=>a.id===id); if(!a)return; editingAnswer=id;$('editQuestion').value=a.question;$('editAnswer').value=a.answer;$('editAnswerDialog').showModal(); },
    deleteAnswer: async id => { if(!confirm(t('deleteConfirm')))return;project.answers=project.answers.filter(a=>a.id!==id);await save();renderAnswers();sourceNotice(t('sourceRemoved')); },
    addText: () => { $('materialForm').reset();$('materialForm').dataset.edit='';$('materialDialog').showModal(); },
    editMaterial: id => { const m=project.materials.find(m=>m.id===id);if(!m)return;$('materialName').value=m.name;$('materialContent').value=m.content;$('materialForm').dataset.edit=id;$('materialDialog').showModal(); },
    deleteMaterial: async id => { if(!confirm(t('deleteConfirm')))return;project.materials=project.materials.filter(m=>m.id!==id);await save();renderMaterials();sourceNotice(t('sourceRemoved')); },
    importText: () => $('textFile').click(),
    writeAI: async () => { if(!project.answers.some(a=>a.include!==false)&&!project.materials.some(m=>m.include)){toast(t('needSources'));return;}const result=await requestAI('draft',$('nextChapterTitle').value);if(result)await addChapter(result,'ai'); },
    collect: async () => { if(!project.answers.some(a=>a.include!==false)&&!project.materials.some(m=>m.include)){toast(t('needSources'));return;}await addChapter(C.sourceDraft(project,locales[lang]),'source'); },
    pasteDraft: () => { showMode('handoff');$('returnedAI').focus(); },
    newChapter: () => { $('nextChapterTitle').value='';$('nextChapterTitle').focus(); },
    reviewAI: async () => { if(!activeChapter()?.content.trim()){toast(t('needChapter'));return;} const result=await requestAI('review');if(result){$('reviewOutput').textContent=result;$('reviewPanel').hidden=false;} },
    approve: async () => { const c=activeChapter();if(!c)return;c.approved=!c.approved;await save();updateChapterBadge(); },
    deleteChapter: async () => { if(!activeChapter()||!confirm(t('deleteConfirm')))return;project.chapters=project.chapters.filter(c=>c.id!==project.activeChapter);project.activeChapter=project.chapters[0]?.id||'';await save();$('reviewPanel').hidden=true;renderChapters(); },
    backup: () => { download(filename()+'.mfh.json',JSON.stringify(C.publicProject(project),null,2),'application/json');toast(t('backupDone')); }, restore: () => $('backupFile').click(),
    exportMD: () => download(filename()+'.md',C.markdown(project,locales[lang]),'text/markdown;charset=utf-8'), print: printMemoir,
    explainAI: async () => { const result=await requestAI('explain',$('explainQuestion').value||t('faqLabels')[faq]);if(result){$('explainOutput').textContent=result;$('explainOutput').hidden=false;} },
    copyHandoff: async () => { try{await navigator.clipboard.writeText($('handoffText').value);toast(t('copied'));}catch(_){$('handoffText').select();toast(t('copyFailed'));} },
    downloadHandoff: () => download('MFH-AI-'+lang+'.md',$('handoffText').value,'text/markdown;charset=utf-8'), importResult: importAIResult,
    connect: () => { $('fileMode').hidden=!!token;$('connectionError').hidden=true;$('connectionDialog').showModal(); },
    disconnect: async () => { connectionVersion++;if(token)await api('/api/disconnect',{});connection=null;$('apiKey').value='';renderConnection();toast(t('disconnected')); }
  };
  document.addEventListener('click', async e => {
    const close=e.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}
    const nextStep=e.target.closest('[data-step]');if(nextStep){showStep(Number(nextStep.dataset.step));return;}
    const faqButton=e.target.closest('[data-faq]');if(faqButton){faq=Number(faqButton.dataset.faq);renderHelp();return;}
    const button=e.target.closest('[data-action]');if(!button||!project)return;
    try{await actions[button.dataset.action]?.(button.dataset.id);}catch(err){toast(errorText(err.message));}
  });
  $('language').addEventListener('change',async()=>{lang=$('language').value;project.language=lang;remember('mfh-language',lang);await save();const oldMode=mode;render();showMode(oldMode);});
  $('projects').addEventListener('change',async()=>{const selectedId=$('projects').value;if(busy){$('projects').value=project.id;return;}await save();const selected=projects.find(p=>p.id===selectedId);if(!selected)return;project=structuredClone(selected);remember('mfh-active',project.id);step=0;$('reviewPanel').hidden=true;render();});
  $('scenes').addEventListener('change',async e=>{project.scene=e.target.value;project.questionIndex=0;project.aiQuestion='';await save();renderQuestion();});
  for(const [id,key] of [['bookTitle','title'],['person','person'],['reader','reader'],['target','target'],['answer','workingAnswer']]) $(id).addEventListener(id==='target'?'change':'input',()=>{project[key]=$(id).value;void save();});
  $('materials').addEventListener('change',async e=>{const m=project.materials.find(m=>m.id===e.target.dataset.material);if(m){m.include=e.target.checked;updateSourceInclusion(e.target);await save();}});
  $('answers').addEventListener('change',async e=>{const a=project.answers.find(a=>a.id===e.target.dataset.answerSource);if(a){a.include=e.target.checked;updateSourceInclusion(e.target);await save();}});
  for(const [id,key] of [['editChapterTitle','title'],['chapterText','content']])$(id).addEventListener('input',()=>{const c=activeChapter();if(!c)return;c[key]=$(id).value;c.approved=false;c.updatedAt=new Date().toISOString();updateChapterBadge();void save();});
  $('chapters').addEventListener('change',async()=>{project.activeChapter=$('chapters').value;await save();$('reviewPanel').hidden=true;renderChapters();});
  for(const id of ['handoffTask','handoffInclude'])$(id).addEventListener('change',renderHandoff);
  $('provider').addEventListener('change',()=>{const p=C.providers[$('provider').value];$('model').value=p.model;$('baseURL').value=p.baseURL;if($('provider').value==='custom')$('advanced').open=true;});
  $('connectionForm').addEventListener('submit',async e=>{
    e.preventDefault();if(!token){toast(t('fileMode'));return;}const provider=$('provider').value,apiKey=$('apiKey').value.trim(),model=$('model').value.trim();
    if(provider!=='custom'&&!apiKey){toast(t('missingKey'));return;}if(!model){$('advanced').open=true;toast(t('missingModel'));return;}
    const version=++connectionVersion;
    $('connectSubmit').disabled=true;$('connectSubmit').textContent=t('connecting');$('connectionError').hidden=true;
    try{
      const result=await api('/api/connect',{provider,apiKey,model,baseURL:$('baseURL').value.trim()});
      // Ignore even a successful response if the user disconnected before it arrived.
      if(version!==connectionVersion)return;
      connection=result;$('apiKey').value='';$('connectionDialog').close();renderConnection();toast(t('connected'));
    }
    catch(err){if(version===connectionVersion){$('connectionError').textContent=errorText(err.message);$('connectionError').hidden=false;}}
    finally{$('connectSubmit').disabled=false;$('connectSubmit').textContent=t('connectButton');}
  });
  $('materialForm').addEventListener('submit',async e=>{
    e.preventDefault();const name=$('materialName').value.trim(),content=$('materialContent').value.trim();if(!name||!content)return;
    let record=project.materials.find(m=>m.id===$('materialForm').dataset.edit);
    if(record){record.name=name;record.content=content;}else{record={id:C.uuid(),sourceId:'M'+project.nextMaterial++,name,content,include:false};project.materials.push(record);}
    await save();renderMaterials();$('materialDialog').close();focusSource('materials',record.id);sourceNotice(sourceFeedback(record,t('sourceUpdated')));
  });
  $('editAnswerForm').addEventListener('submit',async e=>{
    e.preventDefault();const a=project.answers.find(a=>a.id===editingAnswer);
    if(a){a.question=$('editQuestion').value;a.answer=$('editAnswer').value;await save();renderAnswers();}
    $('editAnswerDialog').close();focusSource('answers',editingAnswer);if(a)sourceNotice(sourceFeedback(a,t('sourceUpdated')));
  });
  $('textFile').addEventListener('change',async()=>{
    let added=false, outsideSearch=false, rejected=false;
    for(const file of $('textFile').files){if(!/\.(txt|md|csv|json)$/i.test(file.name)){rejected=true;toast(t('unsupportedFile'));continue;}if(file.size>1024*1024){rejected=true;toast(t('tooLarge'));continue;}const record={id:C.uuid(),sourceId:'M'+project.nextMaterial++,name:file.name,content:await file.text(),include:false};project.materials.push(record);added=true;outsideSearch ||= !matchesSource(record);}
    await save();renderMaterials();$('textFile').value='';if(added&&!rejected)sourceNotice(t(outsideSearch?'sourceOutsideSearch':'sourceUpdated'));
  });
  $('backupFile').addEventListener('change',async()=>{const file=$('backupFile').files[0];if(!file)return;try{if(file.size>20*1024*1024)throw new Error('TOO_LARGE');const restored=C.validateProject(JSON.parse(await file.text()));project=restored;remember('mfh-active',project.id);await save();step=0;render();toast(t('restoreDone'));}catch(err){toast(errorText(err.message==='TOO_LARGE'?'TOO_LARGE':'INVALID_PROJECT'));}$('backupFile').value='';});
  try {
    db=await new Promise((resolve,reject)=>{const r=indexedDB.open('memory-for-human',1);r.onupgradeneeded=()=>r.result.createObjectStore('projects',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
    projects=(await getAll()).map(p=>C.validateProject(p,true));let id;try{id=localStorage.getItem('mfh-active');}catch(_){}project=projects.find(p=>p.id===id)||projects[0]||C.newProject(lang);project.language=lang;await save();
  }catch(_){project=C.newProject(lang);projects=[project];toast(t('storageUnavailable'));}
  $('model').value=C.providers.openai.model;$('baseURL').value=C.providers.openai.baseURL;render();
  if(location.protocol!=='file:'){
    try{const r=await fetch('/api/session');if(r.ok){const session=await r.json();token=session.token;connection=session.connection||null;renderConnection();}}catch(_){}
  }
})();
