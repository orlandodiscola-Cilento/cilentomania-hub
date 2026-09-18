const assert=require('node:assert/strict'),path=require('node:path');const {pathToFileURL}=require('node:url');
(async()=>{
 const {SupabaseRepository}=await import(pathToFileURL(path.resolve('operatori/js/supabase-repository.js')));
 const {validateMedia}=await import(pathToFileURL(path.resolve('operatori/js/model.js')));
 const {addFiles}=await import(pathToFileURL(path.resolve('operatori/js/media.js')));
 global.createImageBitmap=async()=>({width:1200,height:800,close(){}});
 const blob=new Blob(['synthetic-test-only'],{type:'image/jpeg'});Object.defineProperty(blob,'name',{value:'test.jpg'});
 const initial=await addFiles([blob],[]);assert.equal(initial[0].kind,'cover');assert.equal(initial[0].focalX,50);
 assert.throws(()=>validateMedia([{...initial[0],focalY:101}]),/Inquadratura/);
 let row={id:'listing',organization_id:'org',type:'accommodation',version:2,publication_status:'unpublished',workingRevision:{id:'revision',version:1,status:'draft',name:'Test',media:[]},publishedVersion:null};
 let uploads=0,registered=0,failUpload=true;const client={schema:()=>({rpc:async(name,args)=>{
  let data;
  if(name==='current_context')data={user:{id:'operator',displayName:'Test'},organizations:[]};
  else if(name==='media_capabilities')data={upload:true,focal:true};
  else if(name==='list_municipalities')data=[];
  else if(name==='get_listing')data=structuredClone(row);
  else if(name==='register_media'){registered++;data={id:'remote-photo',path:'org/listing/remote-photo/original',bucket:'listing-drafts'};}
  else if(name==='save_listing_draft'){
   assert.equal(args.expected_revision_version,row.workingRevision.version);
   row.workingRevision.version++;
   if(args.patch.content)Object.assign(row.workingRevision,args.patch.content);
   if(args.patch.media)row.workingRevision.media=args.patch.media.map(m=>({id:m.id,role:m.role,caption:m.caption,alt:m.alt,focalX:m.focal_x,focalY:m.focal_y,storagePath:'org/listing/remote-photo/original'}));
   data=structuredClone(row);
  }else throw Error(name);return {data};
 }}),storage:{from:bucket=>{assert.equal(bucket,'listing-drafts');return {upload:async(path,file,options)=>{uploads++;assert.equal(file,blob);assert.equal(options.upsert,false);return failUpload?{error:{statusCode:'503'}}:{data:{path}};},createSignedUrl:async()=>({data:{signedUrl:'https://qgkwqzjapvjvzmvdfges.supabase.co/storage/v1/object/sign/listing-drafts/test'}})}}}};
 const repo=new SupabaseRepository({client}),args={id:'listing',version:2,revisionId:'revision',revisionVersion:1,patch:{nome:'Test aggiornato'},media:[{...initial[0],focalX:25,focalY:75}]};
 let partial;try{await repo.save({},args);assert.fail('Upload must fail');}catch(e){partial=e;}
 assert.match(partial.message,/testi sono salvati/);assert.equal(row.workingRevision.name,'Test aggiornato');assert.equal(row.workingRevision.media.length,0);assert.equal(partial.updatedProfile.workingRevision.version,2);
 failUpload=false;args.revisionVersion=2;const saved=await repo.save({},args);assert.equal(registered,1,'retry reuses registered asset');assert.equal(uploads,2);assert.equal(saved.workingRevision.media[0].focalX,25);assert.equal(saved.workingRevision.media[0].focalY,75);assert.equal(saved.publishedVersion,null);
 console.log('PASS: original preserved, first cover, framing bounds, private upload without overwrite, explicit partial-save error, retry without duplicate registration, framing persisted, publication unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1;});
