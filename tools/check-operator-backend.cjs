const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const root = path.resolve(__dirname, '..');
const load = name => import(pathToFileURL(path.join(root, 'operatori/js', name)));

(async () => {
  const {createBackend} = await load('backend.js');
  const {validateConfiguration, loadConfiguration, BackendUnavailableError} = await load('configuration.js');
  const config = backend => ({backend, supabase:{url:'', publishableKey:''}});
  const calls = {demo:0, supabase:0, storage:0, network:0};
  const fixture = {kind:'demo'};
  const loaders = {
    demo:async () => { calls.demo++; return {connectBackend:async () => fixture}; },
    supabase:async () => { calls.supabase++; throw new Error('Private diagnostic must not reach the UI'); }
  };
  assert.equal(await createBackend(config('demo'), loaders), fixture);
  await assert.rejects(createBackend(config('supabase'), loaders), BackendUnavailableError);
  assert.equal(calls.demo, 1, 'Failed Supabase must not invoke demo loader');
  assert.equal(calls.supabase, 1);
  await assert.rejects(createBackend(config('demo'), {demo:async () => {throw Error('Unavailable');}}), BackendUnavailableError);
  for (const bad of [{}, config(''), config('unknown'), {...config('demo'), serverSecret:''}, {backend:'demo',supabase:null}]) {
    assert.throws(() => validateConfiguration(bad), BackendUnavailableError);
  }
  for (const fetcher of [async () => {throw Error('Network');}, async () => ({ok:false}), async () => ({ok:true,json:async () => {throw Error('Invalid JSON');}})]) {
    await assert.rejects(loadConfiguration(fetcher), BackendUnavailableError);
  }
  assert.equal((await loadConfiguration(async () => ({ok:true,json:async () => config('demo')}))).backend, 'demo');
  globalThis.location={hostname:'127.0.0.1'};
  let configReads=0;
  assert.equal((await loadConfiguration(async()=>{configReads++;return {ok:true,json:async()=>config('supabase')};})).auth,'supabase');
  assert.equal(configReads,1);
  for(const response of [{ok:false,status:500},{ok:true,json:async()=>{throw Error('Invalid local JSON');}}]) {
    configReads=0;
    await assert.rejects(loadConfiguration(async()=>{configReads++;return response;}),BackendUnavailableError);
    assert.equal(configReads,1,'Local override error must not fall back to demo');
  }
  configReads=0;
  assert.equal((await loadConfiguration(async()=>++configReads===1?{ok:false,status:404}:{ok:true,json:async()=>config('demo')})).auth,'demo');
  globalThis.location={hostname:'www.cilentomania.it'};
  await loadConfiguration(async url=>{assert.ok(!url.href.includes('config.local.json'));return {ok:true,json:async()=>config('demo')};});
  delete globalThis.location;

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {calls.network++; throw Error('Unexpected request');};
  globalThis.indexedDB = {open(){calls.storage++;throw Error('Unexpected local storage');}};
  try {
    await assert.rejects(createBackend(config('supabase')), BackendUnavailableError);
    assert.equal(calls.network, 0);
    assert.equal(calls.storage, 0);
  } finally {globalThis.fetch=originalFetch;delete globalThis.indexedDB;}

  const memory = new Map();
  globalThis.sessionStorage = {getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};
  const {DemoSession} = await load('demo-backend.js');
  const seed = JSON.parse(fs.readFileSync(path.join(root,'operatori/data/demo.json'),'utf8'));
  const auth = new DemoSession(seed);
  assert.equal(await auth.current(),null);
  assert.equal((await auth.login('anna@example.test','demo')).userId,'anna');
  assert.equal((await auth.current()).userId,'anna');
  assert.equal((await auth.current({area:'admin'})).userId,'redazione');
  assert.match(await auth.recoverPassword(),/non è attivo/);
  await assert.rejects(auth.changePassword(''),/non è attivo/);
  await auth.logout();assert.equal(await auth.current(),null);
  delete globalThis.sessionStorage;

  const {operation} = await load('demo-repository.js');
  const state = {...seed,profiles:[]};
  assert.deepEqual(operation(state,{userId:'anna'},'context').organizations.map(o=>o.id),['org-mare']);
  assert.deepEqual(operation(state,{userId:'luca'},'context').organizations.map(o=>o.id),['org-mare']);
  assert.deepEqual(operation(state,{userId:'marta'},'context').organizations.map(o=>o.id),['org-borgo']);
  assert.throws(()=>operation(state,null,'context'));
  for(const name of ['app.js','admin.js','preview.js']) {
    const code=fs.readFileSync(path.join(root,'operatori/js',name),'utf8');
    assert.ok(!/from ['"]\.\/demo-(session|repository)\.js/.test(code),name+' must use backend contract');
    assert.ok(!code.includes('adminSession()'),name+' must not synthesize admin identity');
  }
  const env=fs.readFileSync(path.join(root,'.env.example'),'utf8').trim().split(/\r?\n/);
  assert.ok(env.every(line=>/^[A-Z][A-Z0-9_]*=$/.test(line)),'.env.example must contain empty values only');
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'operatori/config.json'),'utf8')).backend,'demo');
  console.log('PASS: explicit provider, no fallback, unavailable Supabase without network/IndexedDB, invalid configuration fails closed, async demo session, scoped context, entry-point separation, empty environment template.');
})().catch(error=>{console.error(error);process.exitCode=1;});
