-- TEST ENGINE ONLY. Never apply to Supabase: Auth and Storage own these objects there.
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create role supabase_auth_admin nologin;
create role supabase_storage_admin nologin;
create schema auth authorization supabase_auth_admin;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
 select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
 nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid
$$;
alter table auth.users owner to supabase_auth_admin;
alter function auth.uid() owner to supabase_auth_admin;
grant usage on schema auth to anon,authenticated,service_role;
-- EXECUTE is PUBLIC, as observed remotely; schema USAGE is not PUBLIC.
create schema storage;
grant usage on schema storage to supabase_storage_admin;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,unique(bucket_id,name));
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated;
grant select,insert,update,delete on storage.objects to authenticated;
grant select on storage.objects to anon;
-- A non-superuser migration principal, with only the platform prerequisites.
create role local_migrator nologin createrole createdb;
do $$ begin execute format('grant create on database %I to local_migrator',current_database()); end $$;
grant usage on schema auth to local_migrator;
grant references on auth.users to local_migrator;
grant usage on schema storage to local_migrator with grant option;
alter table storage.objects owner to supabase_storage_admin;
alter table storage.buckets owner to supabase_storage_admin;
grant select on storage.objects to local_migrator with grant option;
grant select,insert on storage.buckets to local_migrator;
-- No membership in platform owner roles. PGlite lacks supautils.policy_grants:
-- run.mjs explicitly emulates ONLY the four authorized Storage CREATE POLICYs.
set role local_migrator;
