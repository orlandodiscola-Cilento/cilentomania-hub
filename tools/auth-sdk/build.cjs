const path=require('node:path');
const fs=require('node:fs');
require('esbuild').buildSync({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:__dirname},bundle:true,platform:'browser',format:'esm',target:'es2022',supported:{'template-literal':false},minify:true,legalComments:'eof',outfile:path.resolve(__dirname,'../../operatori/js/vendor/supabase.js')});
const packages=['@supabase/supabase-js','@supabase/auth-js','@supabase/functions-js','@supabase/postgrest-js','@supabase/realtime-js','@supabase/storage-js','@supabase/phoenix','tslib','iceberg-js'];
const notices=packages.map(name=>{const dir=path.join(__dirname,'node_modules',name);const license=fs.readdirSync(dir).find(f=>/^LICENSE(\.(txt|md))?$/i.test(f));if(!license)throw Error('Missing license: '+name);return name+'\n'+fs.readFileSync(path.join(dir,license),'utf8');});
fs.writeFileSync(path.resolve(__dirname,'../../operatori/js/vendor/THIRD-PARTY-NOTICES.txt'),notices.join('\n\n---\n\n'));
