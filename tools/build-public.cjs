const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),output=path.resolve(root,'_site');
// Only this verified generated directory may be replaced, never a computed parent.
assert.equal(path.dirname(output),root);assert.equal(path.basename(output),'_site');
const config=JSON.parse(fs.readFileSync(path.join(root,'operatori/public/config.json'),'utf8'));
assert.deepEqual(Object.keys(config).sort(),['auth','supabase']);assert.equal(config.auth,'supabase');
assert.deepEqual(Object.keys(config.supabase).sort(),['publishableKey','url']);
assert.equal(config.supabase.url,'https://qgkwqzjapvjvzmvdfges.supabase.co');
assert.match(config.supabase.publishableKey,/^sb_publishable_[A-Za-z0-9_-]+$/);
fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output);
const copy=(from,to=from)=>{const dest=path.join(output,to);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.cpSync(path.join(root,from),dest,{recursive:true});};
// Explicit public allowlist. No root-wide upload, server source, tests or admin.
for(const dir of ['assets','css','data','i18n','images','js'])copy(dir);
for(const file of ['index.html','bottega-del-cilento.html','robots.txt','sitemap.xml'])copy(file);
copy('operatori/css/area-operatori.css');copy('operatori/css/restaurant-preview.css');copy('operatori/anteprima.html');copy('operatori/.htaccess');
copy('operatori/js/vendor/THIRD-PARTY-NOTICES.txt','operatori/THIRD-PARTY-NOTICES.txt');
fs.writeFileSync(path.join(output,'operatori/config.json'),JSON.stringify(config));
for(const page of ['index.html','password.html']){
 let html=fs.readFileSync(path.join(root,'operatori',page),'utf8');
 html=html.replace('<script src="../js/operator-profile-model.js"></script>','')
   .replace(/<div class="demo-banner">[^<]*<\/div>/,'<div class="demo-banner">Accesso riservato agli operatori invitati</div>');
 fs.writeFileSync(path.join(output,'operatori',page),html);
}
// Synchronous build uses aliases for public-only config and redirect selection.
// Build a temporary source entry through esbuild's normal resolveDir/alias mapping.
const esbuild=require('./auth-sdk/node_modules/esbuild');
async function main(){
 for(const name of ['app','password','preview'])await esbuild.build({entryPoints:[path.join(root,'operatori/public',name+'.js')],outfile:path.join(output,'operatori/js',name+'.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'none',plugins:[{name:'public-only',setup(build){
   build.onResolve({filter:/(^|[\\/])backend\.js$/},()=>({path:path.join(root,'operatori/public/backend.js')}));
   build.onResolve({filter:/configuration\.js$/},()=>({path:path.join(root,'operatori/public/configuration.js')}));
   build.onResolve({filter:/auth-urls\.js$/},()=>({path:path.join(root,'operatori/public/auth-urls.js')}));
   build.onLoad({filter:/vendor[\\/]supabase\.js$/},args=>{
     let text=fs.readFileSync(args.path,'utf8');
     // Remove SDK development defaults/loopback hostname exceptions in release.
     // Explicit validated project URL is always passed to createClient.
     text=text.replaceAll('http://localhost:9999',config.supabase.url+'/auth/v1').replace('r==="localhost"||','').replace('e.push("localhost","127.0.0.1","[::1]"),','');
     return {contents:text,loader:'js',resolveDir:path.dirname(args.path)};
   });
   build.onLoad({filter:/auth-ui\.js$/},args=>({contents:fs.readFileSync(args.path,'utf8').replace('Ambiente di sviluppo · Accesso riservato agli operatori invitati. Gestione delle schede non ancora collegata.','Accesso riservato agli operatori invitati.'),loader:'js',resolveDir:path.dirname(args.path)}));
 }}]});
 // Homepage entry is enabled only in this public artifact. Local source retains
 // its useful same-origin preview link, which is never copied to production.
 let entry=fs.readFileSync(path.join(root,'js/operator-entry.js'),'utf8');
 entry=entry.replace('PUBLIC_OPERATOR_ENTRY_ENABLED = false','PUBLIC_OPERATOR_ENTRY_ENABLED = true')
   .replace(/export function entryUrl\(location\) \{[\s\S]*?\n\}/,'export function entryUrl() { return PUBLIC_OPERATOR_URL; }');
 fs.writeFileSync(path.join(output,'js/operator-entry.js'),entry);
 const catalogPath=path.join(output,'js/public-listings.js');fs.writeFileSync(catalogPath,fs.readFileSync(catalogPath,'utf8').replace('operatori/public/config.json','operatori/config.json'));
 const cileoPath=path.join(output,'js/cileo.js');
 let cileo=fs.readFileSync(cileoPath,'utf8');
 const devLine=cileo.split(/\r?\n/).find(line=>line.includes('const isDevelopment ='));
 assert.ok(devLine,'Expected existing development-only logging guard');
 cileo=cileo.replace(devLine,'    const isDevelopment = false;');fs.writeFileSync(cileoPath,cileo);
 // Version public assets by their actual bytes so returning browsers cannot
 // combine the new HTML with an older cached tourism/chat implementation.
 const crypto=require('node:crypto');
 const indexPath=path.join(output,'index.html');
 const html=fs.readFileSync(indexPath,'utf8').replace(/(src|href)="((?:js|css)\/[^"?]+)(?:\?[^"\s]*)?"/g,(match,attribute,file)=>{
   const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(output,file))).digest('hex').slice(0,12);
   return `${attribute}="${file}?v=${version}"`;
 });
 fs.writeFileSync(indexPath,html);
 // Version operator assets too: do not mix old login bundles with the online editor.
 for(const page of ['index.html','password.html','anteprima.html']){
  const file=path.join(output,'operatori',page);
  let html=fs.readFileSync(file,'utf8');
  html=html.replace(/(src|href)="((?:operatori\/)?(?:js|css)\/[^"?]+)"/g,(match,attribute,url)=>{
   const asset=path.join(output,page==='anteprima.html'?'':'operatori',url);
   const hash=crypto.createHash('sha256').update(fs.readFileSync(asset)).digest('hex').slice(0,12);
   return attribute+'="'+url+'?v='+hash+'"';
  });fs.writeFileSync(file,html);
 }
 require('./check-public-package.cjs')(output);
 console.log('PASS: public package generated from explicit allowlist; Private online editor, no local configuration or demo operator routes.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
