import { PGlite } from '@electric-sql/pglite';
import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const db = new PGlite();
let checks = 0;
const sql = async (s, params=[]) => db.query(s, params);
const val = async (s, params=[]) => (await sql(s,params)).rows[0]?.v;
const check = (condition, label) => { assert.ok(condition,label); checks++; console.log(`PASS ${label}`); };
const deny = async (s,label,params=[]) => {
 let rejected=false; try { await sql(s,params); } catch { rejected=true; }
 check(rejected,label);
};
const identity = async (id,role='authenticated') => {
 await db.exec('reset role');
 await sql("select set_config('request.jwt.claim.sub',$1,false)",[id||'']);
 await db.exec(`set role ${role}`);
};
const root = async()=>db.exec('reset role');
const uid=n=>`10000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const oid=n=>`20000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const lid=n=>`30000000-0000-4000-8000-${String(n).padStart(12,'0')}`;
const authSnapshot = async()=>val(`select jsonb_build_object(
 'schema',(select jsonb_build_object('owner',nspowner,'acl',nspacl) from pg_namespace where nspname='auth'),
 'objects',(select jsonb_agg(jsonb_build_object('name',c.relname,'owner',c.relowner,'acl',c.relacl,'rls',c.relrowsecurity) order by c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='auth'),
 'functions',(select jsonb_agg(jsonb_build_object('name',p.proname,'owner',p.proowner,'acl',p.proacl,'definition',pg_get_functiondef(p.oid)) order by p.oid) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='auth')) as v`);
const storageStructure = async()=>val(`select jsonb_agg(jsonb_build_object('table',c.relname,'owner',c.relowner,'column',a.attname,'type',a.atttypid,'required',a.attnotnull) order by c.relname,a.attnum) as v
 from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_attribute a on a.attrelid=c.oid
 where n.nspname='storage' and c.relkind='r' and a.attnum>0 and not a.attisdropped`);
try {
 await db.exec(await readFile(new URL('./bootstrap-local.sql',import.meta.url),'utf8'));
 check(!await val("select has_schema_privilege(current_user,'auth','USAGE WITH GRANT OPTION') as v"),'migration principal cannot grant Auth schema access');
 check(!await val("select has_function_privilege(current_user,'auth.uid()','EXECUTE WITH GRANT OPTION') as v"),'migration principal cannot grant Auth function permissions');
 check(!await val("select pg_has_role(current_user,'supabase_storage_admin','MEMBER') as v"),'migration principal is not Storage owner/member');
 const originalAuth=await authSnapshot();
 const originalStorage=await storageStructure();
 await db.exec(await readFile(new URL('../checks/preflight.sql',import.meta.url),'utf8'));
 const dir=new URL('../migrations/',import.meta.url);
 let storagePolicyExceptions=0;
 for(const f of (await readdir(dir)).filter(f=>f.endsWith('.sql')).sort()) {
  const source=await readFile(new URL(f,dir),'utf8');
  const executable=source.replace(/--[^\n]*/g,'');
  assert.ok(!/\b(?:grant|revoke)\b[^;]*\b(?:schema\s+auth\b|(?:function|table|sequence|procedure)\s+auth\s*\.)/i.test(executable),`Auth permission mutation in ${f}`);
  assert.ok(!/\b(?:create(?:\s+or\s+replace)?|alter|drop|truncate|comment\s+on)\s+(?:schema\s+auth\b|(?:table|function|sequence|procedure|view)\s+auth\s*\.)/i.test(executable),`Auth DDL in ${f}`);
  assert.ok(!/\b(?:insert\s+into|update|delete\s+from|merge\s+into)\s+auth\s*\./i.test(executable),`Auth data mutation in ${f}`);
  // PGlite cannot implement Supabase's supautils extension. Only these exact four
  // platform-supported policy creations use the test bootstrap principal.
  // No ownership/membership or broader privileges are granted to local_migrator.
  const localSource=source.replace(/create policy (hub_draft_read|hub_draft_insert|hub_published_read|hub_prepared_media_lookup) on storage\.objects\b[^;]*;/g,statement=>{
   storagePolicyExceptions++;
   return `reset role;\n${statement}\nset role local_migrator;`;
  });
  await db.exec(`begin;\n${localSource}\ncommit;`);
  console.log(`MIGRATED ${f}`);
 }
 check(storagePolicyExceptions===4,'only four supported Storage policy exceptions emulated');
 check(JSON.stringify(await authSnapshot())===JSON.stringify(originalAuth),'Auth objects ownership grants and functions unchanged');
 check(JSON.stringify(await storageStructure())===JSON.stringify(originalStorage),'Storage managed structure and ownership unchanged');
 check(!await val("select has_schema_privilege('hub_owner','auth','USAGE') as v"),'hub_owner has no direct Auth schema access');
 check(!await val("select has_schema_privilege('hub_executor','auth','USAGE') as v"),'hub_executor has no direct Auth schema access');
 check(await val("select pg_get_userbyid(proowner)='local_migrator' as v from pg_proc where oid='hub_private.request_user_id()'::regprocedure"),'identity bridge remains owned by migration principal');
 await root();
 await db.exec(await readFile(new URL('../checks/postflight.sql',import.meta.url),'utf8'));
 check(await val('select count(*)::int as v from hub_private.organizations')===0,'no customer organizations seeded');
 check(await val('select count(*)::int as v from auth.users')===0,'no Auth accounts seeded');
 check(await val('select count(*)::int as v from hub_private.subscriptions')===0,'no commercial data seeded');
 // Synthetic local fixtures only. Every test run uses a new in-memory database.
 for(let i=1;i<=6;i++) {
  await sql('insert into auth.users values($1)',[uid(i)]);
  await sql('insert into hub_private.profiles(id,display_name,enabled) values($1,$2,true)',[uid(i),`Test user ${i}`]);
 }
 for(let i=1;i<=2;i++) await sql('insert into hub_private.organizations(id,name) values($1,$2)',[oid(i),`Test organization ${i}`]);
 await sql("insert into hub_private.organization_members values($1,$2,'operator',true,now(),now()),($1,$3,'organization_admin',true,now(),now()),($4,$5,'operator',true,now(),now()),($1,$6,'operator',true,now(),now())",[oid(1),uid(1),uid(2),oid(2),uid(3),uid(6)]);
 await sql("insert into hub_private.staff_roles(user_id,role) values($1,'cilentomania_editor'),($2,'cilentomania_admin')",[uid(4),uid(5)]);
 for(let i=1;i<=3;i++) await sql("insert into hub_private.listings(id,organization_id,content_owner,type,slug) values($1,$2,$2,$3,$4)",[lid(i),oid(i===3?2:1),i===2?'restaurant':'accommodation',`test-listing-${i}`]);
 await identity(uid(1));
 await sql("select set_config('request.jwt.claim.sub','',false)");
 await sql("select set_config('request.jwt.claims',$1,false)",[JSON.stringify({sub:uid(1),role:'authenticated'})]);
 check((await val('select hub_api.current_context() as v')).user.id===uid(1),'identity bridge preserves JWT claims identity');
 await sql("select set_config('request.jwt.claims','',false)");
 await identity(uid(1));
 check(await val('select count(*)::int as v from hub_private.listings')===2,'operator sees multiple own listings only');
 check((await val('select hub_api.current_context() as v')).organizations.length===1,'context API contains own organization only');
 check((await val('select hub_api.list_listings() as v')).length===2,'list API respects organization isolation');
 await deny('select hub_api.list_listings(101,0)','list pagination bounded');
 await deny('select hub_api.review_queue()','operator cannot read admin queue');
 await deny('select hub_api.get_listing($1)','get API rejects other organization',[lid(3)]);
 check(await val('select count(*)::int as v from hub_private.organization_members')===3,'multiple members in same organization');
 await deny("update hub_private.listings set publication_status='published'",'direct administrative update denied');
 await deny("insert into hub_private.staff_roles values(auth.uid(),'cilentomania_admin',null,now())",'self elevation denied');
 await deny('delete from hub_private.listings','direct delete denied');
 await deny('select * from hub_private.subscriptions','commercial data denied');
 check(!await val("select pg_has_role('authenticated','hub_executor','MEMBER') as v"),'browser role is not member of executor');
 const r1=await val('select hub_api.create_working_revision($1,1) as v',[lid(1)]);
 const r2=await val('select hub_api.create_working_revision($1,1) as v',[lid(2)]);
 await deny('select hub_api.create_working_revision($1,1)','cross organization draft denied',[lid(3)]);
 check(await val("select hub_api.save_draft($1,1,$2::jsonb) as v",[r1,JSON.stringify({content:{name:'Local test accommodation'},accommodation:{rooms:5,pets:null},amenities:[{code:'pool',available:true},{code:'parking',available:null}],translations:[{locale:'en',name:'Local test'}]})])===2,'save draft and structured values');
 check(await val('select pets is null as v from hub_private.accommodations where revision_id=$1',[r1]),'unknown is not false');
 check((await val('select hub_api.get_listing($1) as v',[lid(1)])).workingRevision.accommodation.rooms===5,'read API includes saved structured features');
 await deny("select hub_api.save_draft($1,1,'{}')",'stale version denied',[r1]);
 await deny("select hub_api.save_draft($1,2,'{\"content\":{\"is_demo\":false}}')",'operator cannot remove demo marker',[r1]);
 await deny("select hub_api.save_draft($1,2,'{\"content\":{\"organization_id\":null}}')",'ownership patch denied',[r1]);
 await deny("select hub_api.save_draft($1,2,'{\"amenities\":[{\"code\":\"Piscina\",\"available\":true}]}')",'translated service identifier denied',[r1]);
 const media=await val("select hub_api.register_media($1,2,'image/jpeg',1024) as v",[r1]);
 await sql("insert into storage.objects(bucket_id,name) values('listing-drafts',$1)",[media.path]);
 check(await val('select count(*)::int as v from storage.objects')===1,'authorized Storage insert and read');
 await deny("insert into storage.objects(bucket_id,name) values('listing-drafts','not-authorized')",'unregistered Storage path denied');
 check((await sql("update storage.objects set name='changed' returning id")).rows.length===0,'Storage overwrite denied');
 check((await sql('delete from storage.objects returning id')).rows.length===0,'Storage delete denied');
 await deny("select hub_api.register_media($1,2,'image/svg+xml',1024)",'SVG registration denied',[r1]);
 await deny("select hub_api.register_media($1,2,'image/png',5242881)",'oversize registration denied',[r1]);
 await sql('select hub_api.save_draft($1,2,$2::jsonb)',[r1,JSON.stringify({media:[{id:media.id,role:'cover',alt:'Test image'}]})]);
 await identity(uid(3));
 check(await val('select count(*)::int as v from hub_private.listings')===1,'second organization isolated');
 check(await val('select count(*)::int as v from hub_private.listing_revisions')===0,'other organization revisions invisible');
 check(await val('select count(*)::int as v from storage.objects')===0,'other organization originals invisible');
 await deny('select hub_api.save_draft($1,3,\'{}\')','other organization RPC denied',[r1]);
 const r3=await val('select hub_api.create_working_revision($1,1) as v',[lid(3)]);
 await deny('select hub_api.save_draft($1,1,$2::jsonb)','cross organization media association denied',[r3,JSON.stringify({media:[{id:media.id,role:'cover'}]})]);
 await identity(uid(6));
 check(await val('select count(*)::int as v from hub_private.listings')===2,'second operator shares organization access');
 await identity(uid(2));
 await sql('select hub_api.set_operator_membership($1,$2,false)',[oid(1),uid(6)]);
 await deny('select hub_api.set_operator_membership($1,$2,false)','organization admin cannot manage other organization',[oid(2),uid(3)]);
 await identity(uid(6));
 check(await val('select count(*)::int as v from hub_private.listings')===0,'membership revocation applies to existing identity');
 await identity(uid(1));
 await sql('select hub_api.submit_revision($1,3)',[r1]);
 await deny('select hub_api.save_draft($1,4,\'{}\')','submitted revision frozen',[r1]);
 await deny("select hub_api.review_revision($1,4,'in_review')",'operator cannot review',[r1]);
 await identity(uid(4));
 check(await val('select count(*)::int as v from hub_private.listing_revisions')===1,'editor sees submitted but not unrelated drafts');
 check(await val('select count(*)::int as v from hub_private.organizations')===1,'editor sees relevant organization');
 check((await val("select hub_api.review_queue('submitted','Local',10,0) as v")).length===1,'queue supports status search and pagination');
 check((await val('select hub_api.compare_revision($1,$2) as v',[lid(1),r1])).proposed.id===r1,'editor can compare exact submitted revision');
 await deny('select hub_api.compare_revision($1,$2)','compare rejects mismatched listing',[lid(2),r1]);
 await deny('select * from hub_private.payments','editor cannot read commerce');
 await deny("select hub_api.review_revision($1,4,'approved')",'review cannot skip in_review',[r1]);
 await sql("select hub_api.review_revision($1,4,'in_review')",[r1]);
 await deny("select hub_api.review_revision($1,5,'changes_requested')",'feedback required',[r1]);
 await sql("select hub_api.review_revision($1,5,'changes_requested','Please clarify')",[r1]);
 await identity(uid(1));
 const next=await val('select hub_api.create_working_revision($1,2) as v',[lid(1)]);
 check(next!==r1,'requested changes create new revision');
 check(await val('select count(*)::int as v from hub_private.listing_revision_media where revision_id=$1',[next])===1,'new draft copies gallery');
 check(await val('select status as v from hub_private.listing_revisions where id=$1',[r1])==='changes_requested','old revision retained');
 await sql('select hub_api.submit_revision($1,1)',[next]);
 await identity(uid(4));
 await sql("select hub_api.review_revision($1,2,'in_review')",[next]);
 await sql("select hub_api.review_revision($1,3,'approved')",[next]);
 await deny('select hub_api.publish_revision($1,$2,3)','editor cannot publish',[lid(1),next]);
 await identity(null,'anon');
 check(await val("select hub_api.public_listing('test-listing-1') as v")===null,'approval does not publish');
 await deny('select * from hub_private.listings','anonymous base tables denied');
 await deny('select hub_api.suspend_listing($1,3)','anonymous mutation denied',[lid(1)]);
 await identity(uid(5));
 await deny('select hub_api.publish_revision($1,$2,3)','unvalidated media blocks publication',[lid(1),next]);
 await deny("select hub_api.finalize_media($1,repeat('a',64),800,600)",'admin user cannot claim server validation',[media.id]);
 await identity(null,'service_role');
 await deny("select hub_api.finalize_media($1,repeat('a',64),800,600)",'validation requires prepared Storage object',[media.id]);
 // Simulate only the future worker Storage copy, not actual file inspection.
 await root();
 await sql("insert into storage.objects(bucket_id,name) values('listing-published',$1)",[media.path.replace('/original','/published')]);
 await identity(null,'service_role');
 await sql("select hub_api.finalize_media($1,repeat('a',64),800,600)",[media.id]);
 await sql("select hub_api.finalize_media($1,repeat('a',64),800,600)",[media.id]);
 await deny("select hub_api.finalize_media($1,repeat('b',64),800,600)",'validated media immutable',[media.id]);
 await identity(uid(5));
 check(await val('select hub_api.publish_revision($1,$2,3) as v',[lid(1),next])===4,'admin publishes approved ready revision');
 check(await val('select hub_api.publish_revision($1,$2,3) as v',[lid(1),next])===4,'publication retry is idempotent');
 await identity(null,'anon');
 const published=await val("select hub_api.public_listing('test-listing-1') as v");
 check(published.name==='Local test accommodation','public projection displays published content');
 check(!JSON.stringify(published).match(/organization_id|created_by|subscription|checksum|original|workflow/),'public projection excludes private fields');
 check(await val('select count(*)::int as v from storage.objects')===1,'anonymous sees published image only');
 await identity(uid(1));
 const third=await val('select hub_api.create_working_revision($1,4) as v',[lid(1)]);
 await sql('select hub_api.save_draft($1,1,$2::jsonb)',[third,JSON.stringify({content:{name:'Unpublished change'}})]);
 check((await val("select hub_api.public_listing('test-listing-1') as v")).name==='Local test accommodation','working revision cannot change public content');
 await root();
 await deny('update hub_private.listings set working_revision_id=$1 where id=$2','composite pointer rejects cross listing',[r3,lid(1)]);
 await deny("update hub_private.listing_revisions set name='tamper' where id=$1",'database trigger freezes submitted text',[next]);
 await deny('update hub_private.accommodations set rooms=99 where revision_id=$1','database trigger freezes submitted features',[next]);
 await deny("update hub_private.listing_revisions set status='draft' where id=$1",'approved revision cannot return to draft',[next]);
 await deny('delete from hub_private.workflow_events','audit is append only');
 await sql('update hub_private.profiles set enabled=false where id=$1',[uid(1)]);
 await identity(uid(1));
 check(await val('select count(*)::int as v from hub_private.listings')===0,'disabled account loses access immediately');
 await deny('select hub_api.save_draft($1,2,\'{}\')','disabled account cannot save',[third]);
 await identity(uid(5));
 await sql('select hub_api.suspend_listing($1,5)',[lid(1)]);
 await identity(null,'anon');
 check(await val("select hub_api.public_listing('test-listing-1') as v")===null,'suspension removes public projection');
 check(await val('select count(*)::int as v from storage.objects')===0,'suspension removes anonymous media access');
 await root();
 check(await val("select count(*)::int as v from pg_tables where schemaname='hub_private' and not rowsecurity")===0,'all private tables have RLS');
 check(await val("select count(*)::int as v from information_schema.role_table_grants where table_schema='hub_private' and grantee in ('anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE')")===0,'no browser table mutation grants');
 check(await val("select count(*)::int as v from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='hub_api' and p.proname<>'public_listing' and has_function_privilege('anon',p.oid,'EXECUTE')")===0,'anonymous can execute only public projection');
 check(await val("select count(*)::int as v from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in ('hub_api','hub_private') and p.prosecdef and not coalesce(p.proconfig @> array['search_path=\"\"'],false)")===0,'definer functions fix search_path');
 console.log(`\n${checks} database checks passed. Local PGlite only; no remote connection.`);
} catch (error) {
 console.error('FAIL',error.message,error.code||'');
 process.exitCode=1;
} finally { await db.close(); }
