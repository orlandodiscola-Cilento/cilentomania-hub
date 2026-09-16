const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const records = new Map();
const storage = {getItem: key => records.get(key) || null, setItem: (key, value) => records.set(key, value)};
const window = {};
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../js/cileo.js'), 'utf8'), {
  window, localStorage: storage, sessionStorage: storage, console,
  document: {readyState: 'loading', addEventListener() {}, getElementById() {return null;}}
});
async function check(mode, response) {
  records.clear();
  const c = Object.create(window.Cileo.prototype);
  let resolve;
  Object.assign(c, {
    activeConversationScope: 'it:sleep:Agropoli', messages: [{sender:'user',text:'Hotel con piscina'}],
    cancelActiveTurn() {return this.turnId = 1;}, selectTopicAvatar() {return null;},
    scheduleTurnCallback() {}, requestBackendResponse() {return new Promise(r => {resolve = r;});},
    ui: {showTyping() {return () => {};}}
  });
  const key = c.storageKey('localState');
  const original = JSON.stringify({messages:c.messages, actions:[], inputValue:'bozza conservata'});
  storage.setItem(key, original);
  const pending = c.respond('Hotel con piscina');
  c.turnId++;
  c.activeConversationScope = 'it:eat:Agropoli';
  if (mode === 'newer') storage.setItem(key, JSON.stringify({messages:[{sender:'user',text:'Messaggio recente'}]}));
  if (mode === 'cleared') records.delete(key);
  const before = storage.getItem(key);
  resolve(response);
  await pending;
  if (mode !== 'unchanged') assert.equal(storage.getItem(key), before);
  else {
    const result = JSON.parse(storage.getItem(key));
    assert.equal(result.messages.length, 2);
    assert.equal(result.messages[1].text, response?.answer || 'Al momento non sono in grado di rispondere alla tua richiesta.');
    assert.equal(result.inputValue, 'bozza conservata');
  }
}
(async () => {
  const answer = {answer:'Risposta verificata',results:[{name:'Hotel'}]};
  await check('unchanged', answer);
  await check('newer', answer);
  await check('cleared', answer);
  await check('unchanged', null);
  console.log('OK: late replies preserve newer/cleared histories, complete unchanged history, preserve drafts, and handle missing answers.');
})().catch(error => {console.error(error);process.exitCode = 1;});
