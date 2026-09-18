-- READ ONLY. Structural checks only; no real test identities are created.
select tablename,rowsecurity from pg_tables where schemaname='hub_private' order by tablename;
select table_name,grantee,privilege_type from information_schema.role_table_grants
 where table_schema='hub_private' and grantee in ('anon','authenticated') and privilege_type in ('INSERT','UPDATE','DELETE');
select p.proname,has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
 has_function_privilege('authenticated',p.oid,'EXECUTE') as user_execute,
 has_function_privilege('service_role',p.oid,'EXECUTE') as service_execute
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='hub_api' order by p.proname;
select id,public,file_size_limit,allowed_mime_types from storage.buckets where id in ('listing-drafts','listing-published');
select 'organizations' as entity,count(*) from hub_private.organizations union all
 select 'profiles',count(*) from hub_private.profiles union all
 select 'listings',count(*) from hub_private.listings union all
 select 'plans',count(*) from hub_private.plans union all
 select 'contracts',count(*) from hub_private.contracts union all
 select 'subscriptions',count(*) from hub_private.subscriptions union all
 select 'payments',count(*) from hub_private.payments;
