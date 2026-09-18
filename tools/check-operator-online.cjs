const assert=require('node:assert/strict'),path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{
 const {SupabaseRepository,draftPatch,mapRevision}=await import(pathToFileURL(path.resolve('operatori/js/supabase-repository.js')));
 const towns=[{id:'town-id',slug:'castellabate',name:'Castellabate'}];
 const source={id:'revision',version:4,status:'draft',name:'Hotel test',claim:'Benvenuti',municipality_id:'town-id',accommodation:{rooms:0,accessible:null,check_in:'15:00:00'},amenities:[{code:'wifi',available:true},{code:'pets',available:false}],media:[]};
 const mapped=mapRevision(source,'accommodation',towns);assert.equal(mapped.content.numero_camere,0);assert.equal(mapped.content.accessibile,null);assert.equal(mapped.content.check_in,'15:00');
 const patch=draftPatch(mapped.content,'accommodation',towns,source);assert.equal(patch.content.municipality_id,'town-id');assert.equal(patch.content.claim,'Benvenuti');assert.equal(patch.content.website,null);assert.deepEqual(patch.amenities,[{code:'wifi',available:true},{code:'pets',available:false}]);
 assert.throws(()=>draftPatch({planId:'forged'},'accommodation',towns));assert.throws(()=>draftPatch({comune_id:'unknown'},'accommodation',towns));assert.throws(()=>mapRevision(source,'accommodation',[]));
 const calls=[];let fail=false,disabled=false;let row={id:'listing',type:'accommodation',organization_id:'org',version:2,publication_status:'unpublished',workingRevision:source,publishedVersion:null};
 const auth={client:{schema:schema=>{assert.equal(schema,'hub_api');return {rpc:async(name,args)=>{calls.push({name,args});if(fail)return {error:{message:'private network details'}};let data;if(name==='current_context')data=disabled?null:{user:{id:'user',displayName:'Test'},organizations:[{id:'org',name:'Test'}]};else if(name==='list_municipalities')data=towns;else if(name==='get_listing')data=row;else if(name==='list_listings')data=[];else if(name==='save_listing_draft'){row=structuredClone(row);row.workingRevision.version++;row.workingRevision.name=args.patch.content.name;data=row;}else if(name==='submit_revision')data=5;else throw Error(name);return {data};}}}}};
 const repo=new SupabaseRepository(auth);assert.deepEqual(await repo.list({}),[]);
 const p=await repo.get({},'listing');assert.equal(p.workingRevision.content.nome,'Hotel test');
 await assert.rejects(repo.save({},{id:'listing',version:2,revisionId:'revision',revisionVersion:3,patch:{nome:'wrong'},media:[]}),/cambiata/);
 const saved=await repo.save({},{id:'listing',version:2,revisionId:'revision',revisionVersion:4,patch:{nome:'Nuovo nome'},media:[]});assert.equal(saved.workingRevision.content.nome,'Nuovo nome');assert.equal(calls.filter(c=>c.name==='save_listing_draft').length,1);
 await assert.rejects(repo.save({},{id:'listing',version:2,revisionId:'revision',revisionVersion:5,patch:{nome:'Foto'},media:[{blob:new Blob(['test'])}]}),/foto/);
 await repo.submit({},{id:'listing',revisionId:'revision',revisionVersion:5});assert.equal(calls.find(c=>c.name==='submit_revision').args.expected_version,5);
 disabled=true;await assert.rejects(repo.list({}),/non abilitato/);disabled=false;fail=true;await assert.rejects(repo.list({}),e=>!e.message.includes('private network details')&&e.message.includes('online'));
 console.log('PASS: RPC-only repository, empty real account, mapping, null/zero, municipality IDs, service No preserved, field protection, stale saves, atomic save arguments, submit, disabled account and sanitized errors.');
})().catch(e=>{console.error(e);process.exitCode=1;});
