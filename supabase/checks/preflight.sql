-- READ ONLY. Run on the verified Frankfurt DEV only after authorization to connect.
-- No credentials, Auth records or application content are returned.
select current_user as migration_user, current_database() as database_name, version();
select rolname,rolsuper,rolcreaterole,rolcreatedb from pg_roles where rolname=current_user;
select nspname as conflicting_schema from pg_namespace where nspname in ('hub_private','hub_api');
select rolname as conflicting_role from pg_roles where rolname in ('hub_owner','hub_executor');
select id,public from storage.buckets where id in ('listing-drafts','listing-published');
select policyname,roles,cmd,qual,with_check from pg_policies where schemaname='storage' and tablename='objects';
select evtname,evtevent,evtenabled from pg_event_trigger;
-- Region and project reference must be verified in the dashboard, not inferred here.
