import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import './app/core.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const { providers } = globalThis.MFHCore;
const types = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.md':'text/plain; charset=utf-8','.json':'application/json; charset=utf-8'};
class AppError extends Error { constructor(code, status = 400) { super(code); this.code=code; this.status=status; } }
function cleanConfig(input) {
  const preset = providers[input?.provider];
  if (!preset) throw new AppError('INVALID_CONFIG');
  const config = {provider:input.provider, protocol:preset.protocol, apiKey:typeof input.apiKey==='string'?input.apiKey.trim():'', model:typeof input.model==='string'?input.model.trim():preset.model, baseURL:typeof input.baseURL==='string'&&input.baseURL.trim()?input.baseURL.trim():preset.baseURL};
  if (!config.model || config.model.length>200 || /[\r\n]/.test(config.model)) throw new AppError('MODEL_REQUIRED');
  if (config.apiKey.length>2000 || /[\r\n]/.test(config.apiKey)) throw new AppError('INVALID_CONFIG');
  let url; try{url=new URL(config.baseURL);}catch(_){throw new AppError('INVALID_CONFIG');}
  if(url.username||url.password||url.search||url.hash)throw new AppError('INVALID_CONFIG');
  const local=['127.0.0.1','localhost','[::1]'].includes(url.hostname);
  if(url.protocol!=='https:' && !(local&&url.protocol==='http:'))throw new AppError('INVALID_CONFIG');
  if(config.provider!=='custom'&&url.origin!==new URL(preset.baseURL).origin)throw new AppError('INVALID_CONFIG');
  if(!config.apiKey && !(config.provider==='custom'&&local))throw new AppError('KEY_REQUIRED');
  config.baseURL=config.baseURL.replace(/\/+$/,'');return config;
}
function safeConnection(config) { return config ? {provider:config.provider, model:config.model, baseURL:config.baseURL} : null; }
async function readJson(req, max = 1500000) {
  if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))throw new AppError('INVALID_REQUEST',415);
  const chunks=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>max)throw new AppError('CONTEXT_TOO_LARGE',413);chunks.push(chunk);}
  try{return JSON.parse(Buffer.concat(chunks).toString('utf8'));}catch(_){throw new AppError('INVALID_REQUEST');}
}
function json(res, status, body) { res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body)); }
export function createApp({root=ROOT, fetchImpl=fetch, initialConfig=null, timeoutMs=120000}={}) {
  let config=initialConfig?cleanConfig(initialConfig):null;
  const token=randomBytes(32).toString('hex');let requestInFlight=false;
  async function modelCall(c, system, user, maxTokens) {
    const anthropic=c.protocol==='anthropic';
    const headers={'Content-Type':'application/json'};
    if(anthropic){headers['x-api-key']=c.apiKey;headers['anthropic-version']='2023-06-01';}
    else if(c.apiKey)headers.Authorization=`Bearer ${c.apiKey}`;
    const body=anthropic?{model:c.model,system,messages:[{role:'user',content:user}],max_tokens:maxTokens,stream:false}:{model:c.model,messages:[{role:'system',content:system},{role:'user',content:user}],stream:false,...(c.provider==='openai'||c.provider==='doubao'?{max_completion_tokens:maxTokens}:{max_tokens:maxTokens})};
    let response;
    try{response=await fetchImpl(c.baseURL+(anthropic?'/messages':'/chat/completions'),{method:'POST',headers,body:JSON.stringify(body),redirect:'error',signal:AbortSignal.timeout(timeoutMs)});}
    catch(error){throw new AppError(error.name==='TimeoutError'||error.name==='AbortError'?'TIMEOUT':'NETWORK',502);}
    if(!response.ok){
      const code=response.status===401||response.status===403?'AUTH':response.status===429?'RATE_LIMIT':response.status===404?'MODEL':'PROVIDER_ERROR';
      // Provider error bodies may echo secrets or private prompts. Never return or log them.
      if(response.body?.cancel)await response.body.cancel();throw new AppError(code,502);
    }
    let result;try{result=await response.json();}catch(_){throw new AppError('INVALID_RESPONSE',502);}
    const content=anthropic?result.content?.filter(c=>c.type==='text').map(c=>c.text).join('\n'):result.choices?.[0]?.message?.content;
    if(typeof content!=='string'||!content.trim())throw new AppError('INVALID_RESPONSE',502);
    return {text:content.slice(0,300000),truncated:content.length>300000||(anthropic?result.stop_reason==='max_tokens':result.choices?.[0]?.finish_reason==='length')};
  }
  const server=http.createServer(async(req,res)=>{
    try{
      const port=server.address()?.port;
      const allowedHosts=[`127.0.0.1:${port}`,`localhost:${port}`];
      if(!allowedHosts.includes(req.headers.host))throw new AppError('FORBIDDEN',403);
      if(req.headers.origin&&!allowedHosts.map(h=>'http://'+h).includes(req.headers.origin))throw new AppError('FORBIDDEN',403);
      if(req.headers['sec-fetch-site']==='cross-site')throw new AppError('FORBIDDEN',403);
      const pathname=new URL(req.url,'http://127.0.0.1').pathname;
      if(pathname==='/api/session'&&req.method==='GET'){json(res,200,{token,connection:safeConnection(config),version:'0.2.0'});return;}
      if(pathname.startsWith('/api/')){
        const presented=String(req.headers['x-mfh-session']||'');
        if(!/^[a-f0-9]{64}$/.test(presented)||!timingSafeEqual(Buffer.from(presented),Buffer.from(token)))throw new AppError('FORBIDDEN',403);
        if(req.method!=='POST')throw new AppError('METHOD',405);
        const body=await readJson(req);
        if(!body||typeof body!=='object'||Array.isArray(body))throw new AppError('INVALID_REQUEST');
        if(pathname==='/api/disconnect'){config=null;json(res,200,{ok:true});return;}
        if(requestInFlight)throw new AppError('BUSY',409);
        if(pathname==='/api/connect'){
          const candidate=cleanConfig(body);requestInFlight=true;
          try{await modelCall(candidate,'Reply briefly.','Reply with OK only.',256);config=candidate;json(res,200,safeConnection(config));}finally{requestInFlight=false;}return;
        }
        if(pathname==='/api/generate'){
          if(!config)throw new AppError('NO_CONNECTION',409);
          if(!['interview','draft','review','explain'].includes(body.kind)||typeof body.system!=='string'||typeof body.user!=='string')throw new AppError('INVALID_REQUEST');
          if(body.system.length+body.user.length>105000)throw new AppError('CONTEXT_TOO_LARGE',413);
          requestInFlight=true;try{const result=await modelCall(config,body.system,body.user,body.kind==='draft'?8000:body.kind==='review'?3000:1000);json(res,200,result);}finally{requestInFlight=false;}return;
        }
        throw new AppError('NOT_FOUND',404);
      }
      if(!['GET','HEAD'].includes(req.method))throw new AppError('METHOD',405);
      let relative;try{relative=decodeURIComponent(pathname).replace(/^\/+/, '')||'index.html';}catch(_){throw new AppError('NOT_FOUND',404);}
      const rootFiles=['index.html','README.md','README.en.md','README.es.md','AI-HANDOFF.md','AI-HANDOFF.en.md','AI-HANDOFF.es.md','AGENTS.md','THIRD_PARTY_NOTICES.md','LICENSE','CONTRIBUTING.md'];
      if(relative.includes('\\')||relative.split('/').some(p=>p==='..'||p.startsWith('.'))||relative.endsWith('.local.json')||!(rootFiles.includes(relative)||/^(app|assets|docs|preview|templates|prompts|examples)\//.test(relative)))throw new AppError('NOT_FOUND',404);
      const absolute=path.resolve(root,relative);if(!absolute.startsWith(path.resolve(root)+path.sep))throw new AppError('NOT_FOUND',404);
      const content=await fs.readFile(absolute);const mime=types[path.extname(absolute)]||'application/octet-stream';
      const headers={'Content-Type':mime,'X-Content-Type-Options':'nosniff','Cache-Control':'no-cache','Referrer-Policy':'no-referrer'};
      if(relative==='index.html')headers['Content-Security-Policy']="default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' blob: data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
      res.writeHead(200,headers);res.end(req.method==='HEAD'?undefined:content);
    }catch(error){if(!res.headersSent)json(res,error.status||(['ENOENT','EISDIR'].includes(error.code)?404:500),{code:error instanceof AppError?error.code:['ENOENT','EISDIR'].includes(error.code)?'NOT_FOUND':'INTERNAL'});else res.end();}
  });
  server.requestTimeout=150000;server.headersTimeout=20000;
  return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  let initialConfig;try{initialConfig=JSON.parse(await fs.readFile(path.join(ROOT,'user-config.local.json'),'utf8'));}catch(error){if(error.code!=='ENOENT')console.error('Local AI settings could not be read. You can configure AI in the page.');}
  const port=Number(process.env.MFH_PORT||4317);
  if(!Number.isInteger(port)||port<1024||port>65535){console.error('Invalid MFH_PORT.');process.exit(1);}
  let server;try{server=createApp({initialConfig});}catch(_){console.error('Local AI settings are invalid. Configure AI in the page.');server=createApp();}
  server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'This port is in use. Check if MFH is already open, or set MFH_PORT to another port.':'Could not start the local app.');process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>{
    const url=`http://127.0.0.1:${port}`;console.log(`Memory for Human\nLocal: ${url}\n请保持此窗口开启。关闭窗口即可停止。\nKeep this window running. Close it to stop.\nMantén esta ventana abierta. Ciérrala para detener el servicio.`);
    if(process.argv.includes('--open'))import('node:child_process').then(({spawn})=>{
      const child=process.platform==='win32'?spawn('cmd.exe',['/d','/c','start','',url],{windowsHide:true,stdio:'ignore'}):process.platform==='darwin'?spawn('open',[url],{stdio:'ignore'}):spawn('xdg-open',[url],{stdio:'ignore'});
      child.on('error',()=>{});child.unref();
    });
  });
}
