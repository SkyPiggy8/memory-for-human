import test from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from '../server.mjs';
async function setup(t, fetchImpl){const app=createApp({fetchImpl});await new Promise(r=>app.listen(0,'127.0.0.1',r));t.after(()=>new Promise(r=>{app.close(r);app.closeAllConnections();}));const base='http://127.0.0.1:'+app.address().port;const session=await(await fetch(base+'/api/session')).json();return {base,session,post:(p,b,extra={})=>fetch(base+p,{method:'POST',headers:{'Content-Type':'application/json','X-MFH-Session':session.token,...extra},body:JSON.stringify(b)})};}
test('local server serves the actual app but blocks foreign origins and secret/config paths',async t=>{
  const s=await setup(t,()=>{throw new Error('Should not call a provider');});
  const home=await fetch(s.base);assert.equal(home.status,200);assert((await home.text()).includes('app/app.js'));assert(home.headers.get('content-security-policy').includes("frame-ancestors 'none'"));
  for(const p of ['/docs/guide.md','/docs/technical.md','/docs/templates.md','/docs/ai-handoff.md','/docs/translations/README.en.md','/docs/translations/README.es.md','/preview/guide.html','/preview/guide.en.html','/preview/guide.es.html'])assert.equal((await fetch(s.base+p)).status,200,p);
  for(const p of ['/user-config.local.json','/docs/user-config.local.json','/docs/translations/user-config.local.json','/.env','/.git/config','/server.mjs','/app/%2e%2e/user-config.local.json'])assert.equal((await fetch(s.base+p)).status,404);
  assert.equal((await fetch(s.base+'/api/session',{headers:{Origin:'https://foreign.example'}})).status,403);
  assert.equal((await s.post('/api/disconnect',{}, {'X-MFH-Session':'wrong'})).status,403);
  assert.equal((await s.post('/api/disconnect',{}, {Origin:'https://foreign.example'})).status,403);
});
test('OpenAI transport connects and writes a chapter without exposing the Key in app responses',async t=>{
  const calls=[];const s=await setup(t,async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({choices:[{message:{content:calls.length===1?'OK':'A sourced draft. [A4]'},finish_reason:'stop'}]}),{status:200});});
  const key='DUMMY-LOCAL-KEY';let response=await s.post('/api/connect',{provider:'openai',apiKey:key});assert.equal(response.status,200);assert(!(await response.text()).includes(key));
  response=await s.post('/api/generate',{kind:'draft',system:'Only use real sources',user:'Materials'});assert.equal(response.status,200);assert.equal((await response.json()).text,'A sourced draft. [A4]');
  assert.equal(calls[1].url,'https://api.openai.com/v1/chat/completions');assert.equal(calls[1].options.headers.Authorization,'Bearer '+key);assert.equal(JSON.parse(calls[1].options.body).max_completion_tokens,8000);
  assert(!JSON.stringify(await(await fetch(s.base+'/api/session')).json()).includes(key));await s.post('/api/disconnect',{});assert.equal((await s.post('/api/generate',{kind:'draft',system:'x',user:'x'})).status,409);
});
test('Claude uses the Messages protocol and preserves truncated-output status',async t=>{
  const calls=[];const s=await setup(t,async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({content:[{type:'thinking',thinking:'Not user output'},{type:'text',text:'A chapter'}],stop_reason:'max_tokens'}),{status:200});});
  assert.equal((await s.post('/api/connect',{provider:'anthropic',apiKey:'DUMMY-CLAUDE'})).status,200);
  const result=await(await s.post('/api/generate',{kind:'draft',system:'Rules',user:'Story'})).json();assert.equal(result.text,'A chapter');assert.equal(result.truncated,true);
  assert.equal(calls[1].url,'https://api.anthropic.com/v1/messages');assert.equal(calls[1].options.headers['anthropic-version'],'2023-06-01');const body=JSON.parse(calls[1].options.body);assert.equal(body.system,'Rules');assert.equal(body.messages[0].role,'user');assert.equal(body.max_tokens,8000);
});
test('provider errors that echo secrets are sanitized and a failed new connection preserves the prior one',async t=>{
  let calls=0;const s=await setup(t,async()=>++calls===1?new Response(JSON.stringify({choices:[{message:{content:'OK'}}]}),{status:200}):new Response('DUMMY-SECRET and PRIVATE-STORY',{status:401}));
  await s.post('/api/connect',{provider:'deepseek',apiKey:'DUMMY-OLD'});const response=await s.post('/api/connect',{provider:'anthropic',apiKey:'DUMMY-SECRET'});assert.equal(response.status,502);const text=await response.text();assert(!text.includes('DUMMY'));assert(!text.includes('PRIVATE'));assert.equal(JSON.parse(text).code,'AUTH');assert.equal((await(await fetch(s.base+'/api/session')).json()).connection.provider,'deepseek');
});
test('custom local models can omit a Key, remote HTTP and redirecting credential targets are rejected',async t=>{
  const s=await setup(t,async()=>new Response(JSON.stringify({choices:[{message:{content:'OK'}}]}),{status:200}));
  assert.equal((await s.post('/api/connect',{provider:'custom',baseURL:'http://127.0.0.1:11434/v1',model:'local-model'})).status,200);
  assert.equal((await s.post('/api/connect',{provider:'custom',baseURL:'http://remote.example/v1',model:'m',apiKey:'DUMMY'})).status,400);
  assert.equal((await s.post('/api/connect',{provider:'openai',baseURL:'https://other.example/v1',apiKey:'DUMMY'})).status,400);
});
