const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const scope={};vm.runInNewContext(fs.readFileSync('js/public-listings.js','utf8'),scope);const map=scope.HubPublicListings.map;
 const p=map({id:'one',type:'accommodation',isDemo:false,name:'Hotel',features:{rooms:0,pets:null,accessible:false},media:[{role:'cover',url:'https://example.org/image',focalX:20,focalY:80}],contacts:{},location:{},translations:[{locale:'de',name:'Hotel DE'}]});
 assert.equal(p.numero_camere,0);assert.equal(p.animali_ammessi,null);assert.equal(p.accessibile,false);assert.equal(p.focalX,20);assert.equal(p.focalY,80);assert.equal(p.translations.de.nome,'Hotel DE');assert.equal(p.demo,false);
 const {SupabaseRepository}=await import('../operatori/js/supabase-repository.js');
 const repo=new SupabaseRepository({client:{functions:{invoke:async()=>({data:{status:'ready'}})}}});
 repo.get=async()=>({version:7,workingRevision:{id:'revision',media:[{id:'media'}]}});let calls=[];repo.rpc=async(n,a)=>calls.push([n,a]);
 await repo.publish({}, {id:'listing',revisionId:'revision'});assert.equal(calls[0][0],'publish_revision');assert.equal(calls[0][1].expected_version,7);
 repo.client.functions.invoke=async()=>({error:{}});calls=[];await assert.rejects(repo.publish({}, {id:'listing',revisionId:'revision'}));assert.equal(calls.length,0,'photo failure blocks publication');
 console.log('PASS: public mapping, unknown/No/zero, translation, framing, revision/version, and failure blocks publication');
})().catch(e=>{console.error(e);process.exitCode=1;});
