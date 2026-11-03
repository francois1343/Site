import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { JSDOM } from 'jsdom';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const tick=()=>new Promise(r=>setImmediate(r));
const manifest=JSON.parse(read('manifest.webmanifest'));
test('manifest has valid icons with exact PNG sizes and relative scope',()=>{
 assert.equal(manifest.id,'./');assert.equal(manifest.scope,'./');assert.equal(manifest.display,'standalone');
 for(const icon of manifest.icons){const bytes=fs.readFileSync(new URL('../'+icon.src,import.meta.url));const [w,h]=icon.sizes.split('x').map(Number);assert.equal(bytes.readUInt32BE(16),w);assert.equal(bytes.readUInt32BE(20),h);}
 const build=JSON.parse(read('dist/build.json'));for(const icon of manifest.icons)assert.ok(build.files[icon.src]);
 assert.ok(!Object.keys(build.files).some(f=>/tests|source|provenance|server|docs/.test(f)));
});
function worker(){
 const listeners={},buckets=new Map();let skips=0,network=true;
 const cache={addAll:async reqs=>{for(const r of reqs)buckets.set(typeof r==='string'?r:r.url,new Response(JSON.stringify({items:[],categories:[]})));},match:async req=>buckets.get(typeof req==='string'?req:req.url)?.clone(),put:async(req,res)=>buckets.set(req.url,res)};
 const context=vm.createContext({URL,Request,Response,Headers,AbortController,setTimeout,clearTimeout,Set,
 self:{registration:{scope:'https://pizza.test/sub/'},addEventListener:(name,fn)=>listeners[name]=fn,skipWaiting:async()=>{skips++;}},
 caches:{open:async()=>cache,keys:async()=>['other-app','lamouna-public-old','lamouna-public-previous'],delete:async key=>{assert.notEqual(key,'other-app');}},
 fetch:async()=>{if(!network)throw Error('offline');return new Response(JSON.stringify({items:[],categories:[]}));}});
 vm.runInContext(read('dist/sw.js'),context);
 return {listeners,buckets,get skips(){return skips;},offline(){network=false;},async event(name,arg={}){let work;listeners[name]({...arg,waitUntil:p=>work=p,respondWith:p=>work=p});return await work;}};
}
test('SW waits for consent, serves cached shell/menu offline, ignores APIs and POST',async()=>{
 const w=worker();await w.event('install');assert.equal(w.skips,0);w.offline();
 const menu=await w.event('fetch',{request:new Request('https://pizza.test/sub/menu.json')});assert.equal(menu.headers.get('X-LaMouna-Offline'),'1');assert.equal(menu.status,200);
 const shell=await w.event('fetch',{request:{url:'https://pizza.test/sub/',mode:'navigate',method:'GET'}});assert.equal(shell.status,200);
 assert.equal(await w.event('fetch',{request:new Request('https://pizza.test/sub/api/orders')}),undefined);
 assert.equal(await w.event('fetch',{request:new Request('https://pizza.test/sub/menu.json',{method:'POST'})}),undefined);
 assert.equal(await w.event('fetch',{request:new Request('https://pizza.test/sub/build.json')}),undefined);
 await w.event('message',{data:{type:'APPLY_UPDATE'}});assert.equal(w.skips,1);await w.event('activate');
});
async function page({waiting=false,standalone=false,refused=false}={}){
 const dom=new JSDOM(read('index.html'),{url:'https://pizza.test/',runScripts:'outside-only'}),w=dom.window;
 const listeners={},messages=[];let prompted=0;
 w.matchMedia=()=>({matches:standalone});w.fetch=async()=>({ok:true,json:async()=>({files:{}})});
 w.AbortController=AbortController;Object.defineProperty(w,'isSecureContext',{value:true});
 const worker={postMessage:data=>messages.push(data)};
 const reg={waiting:waiting?worker:null,addEventListener(){},update:async()=>{}};
 Object.defineProperty(w.navigator,'serviceWorker',{value:{controller:waiting?{}:null,register:async()=>reg,addEventListener:(name,fn)=>listeners[name]=fn}});
 if(refused)w.localStorage.setItem('lamouna-install-refused','yes');
 w.eval(read('pwa.js'));await tick();
 return {dom,w,reg,messages,listeners,get prompted(){return prompted;},installEvent(){const e=new w.Event('beforeinstallprompt',{cancelable:true});e.prompt=async()=>{prompted++;};e.userChoice=Promise.resolve({outcome:'dismissed'});w.dispatchEvent(e);return e;}};
}
test('install only prompts after explicit click; dismissal persists; standalone hides installation',async()=>{
 const a=await page();try{a.installEvent();assert.equal(a.prompted,0);assert.equal(a.w.document.getElementById('pwa-notice').hidden,true);a.w.document.getElementById('install-help').click();assert.equal(a.prompted,0);a.w.document.querySelector('#pwa-actions button').click();await tick();assert.equal(a.prompted,1);assert.ok(Number(a.w.localStorage.getItem('lamouna-install-later'))>Date.now());}finally{a.w.close();}
 const b=await page({standalone:true});try{assert.equal(b.w.document.getElementById('install-help').hidden,true);}finally{b.w.close();}
});
test('update is real, deferred on request, and preserves draft before applying',async()=>{
 const a=await page({waiting:true});try{assert.match(a.w.document.getElementById('pwa-title').textContent,/nouvelle version/);assert.equal(a.messages.length,0);a.w.document.querySelectorAll('#pwa-actions button')[1].click();assert.equal(a.w.document.getElementById('pwa-notice').hidden,true);a.w.document.getElementById('order-notes').value='19h si possible';a.w.document.getElementById('install-help').click();a.w.document.querySelector('#pwa-actions button').click();await tick();assert.equal(a.messages[0].type,'APPLY_UPDATE');assert.match(a.w.sessionStorage.getItem('lamouna-order-draft'),/19h si possible/);}finally{a.w.close();}
});
