const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
module.exports=dir=>{
 const files=[];function walk(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?walk(p):files.push(p);}}walk(dir);
 for(const file of files){const relative=path.relative(dir,file).replaceAll('\\','/');
  assert.ok(!/(^|\/)(node_modules|tests|tools|docs|supabase|server|review-cilentino)(\/|$)|config\.local|^\.env|temp-/.test(relative),'Excluded path: '+relative);
  if(/\.(js|json|html|css|txt|xml)$/.test(file)){
   const text=fs.readFileSync(file,'utf8');
   assert.ok(!/localhost|127(?:\\)?\.0(?:\\)?\.0(?:\\)?\.1/.test(text),'Loopback reference: '+relative);
   assert.ok(!/sb_secret_[A-Za-z0-9_-]{12,}|sbp_[A-Za-z0-9]{20,}|-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(text),'Potential secret: '+relative);
   for(const m of text.matchAll(/eyJ[A-Za-z0-9_-]+\.([A-Za-z0-9_-]+)\.[A-Za-z0-9_-]+/g)){let value;try{value=JSON.parse(Buffer.from(m[1],'base64url'));}catch{}assert.notEqual(value?.role,'service_role');}
  }
 }
 const ops=files.map(f=>path.relative(dir,f).replaceAll('\\','/')).filter(f=>f.startsWith('operatori/')).sort();
 assert.deepEqual(ops,['operatori/.htaccess','operatori/anteprima.html','operatori/css/restaurant-preview.css','operatori/js/preview.js','operatori/THIRD-PARTY-NOTICES.txt','operatori/config.json','operatori/css/area-operatori.css','operatori/index.html','operatori/js/app.js','operatori/js/password.js','operatori/password.html'].sort());
 for(const page of ['index','password']){const html=fs.readFileSync(path.join(dir,'operatori',page+'.html'),'utf8');assert.match(html,/Content-Security-Policy/);assert.ok(!/DEMO LOCALE|operator-profile-model/.test(html));}
 for(const page of ['app','password','preview']){const js=fs.readFileSync(path.join(dir,'operatori/js',page+'.js'),'utf8');assert.ok(!/anna@example|demo-repository|indexedDB|cilentomania_operator_demo_user/.test(js));assert.match(js,/https:\/\/www\.cilentomania\.it\/hub\/operatori\/password\.html/);}
 const app=fs.readFileSync(path.join(dir,'operatori/js/app.js'),'utf8');assert.match(app,/save_listing_draft/);assert.match(app,/media_capabilities/);assert.match(app,/Riepilogo e invio/);
 const preview=fs.readFileSync(path.join(dir,'operatori/anteprima.html'),'utf8');assert.match(preview,/Content-Security-Policy/);
 assert.match(fs.readFileSync(path.join(dir,'js/operator-entry.js'),'utf8'),/PUBLIC_OPERATOR_ENTRY_ENABLED = true/);
};
