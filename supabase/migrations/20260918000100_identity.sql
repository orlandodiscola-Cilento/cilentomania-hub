-- Local-reviewed migration; apply to Frankfurt DEV only after separate approval.
-- No user, customer, Auth credential or organization is seeded here.
create role hub_owner nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
create role hub_executor nologin noinherit nosuperuser nocreatedb nocreaterole noreplication nobypassrls;
-- Supabase's postgres is not a superuser: ownership transfers require membership.
-- Never grant these roles to authenticator, anon, authenticated or service_role.
grant hub_owner,hub_executor to current_user;
create schema hub_private authorization hub_owner;
create schema hub_api authorization hub_owner;
revoke all on schema hub_private, hub_api from public, anon, authenticated;
grant usage on schema hub_private, hub_api to authenticated, hub_executor;
grant create on schema hub_api to hub_executor;
grant usage on schema hub_api to anon;
-- The migration principal already has USAGE on auth, but cannot grant it.
-- Keep this narrow bridge owned by that principal (postgres on Supabase).
-- It still derives identity exclusively from auth.uid(), never from a client argument.
-- Do NOT transfer this function to hub_owner/hub_executor: they cannot access auth.
create function hub_private.request_user_id() returns uuid
language sql stable security definer set search_path='' as $$
 select auth.uid()
$$;
revoke all on function hub_private.request_user_id() from public;
grant execute on function hub_private.request_user_id() to hub_owner,hub_executor;

create table hub_private.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check(length(display_name) between 1 and 200),
 locale text not null default 'it' check(locale in ('it','en','de','fr','es')),
 enabled boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table hub_private.organizations (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200),
 enabled boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table hub_private.organization_members (
 organization_id uuid not null references hub_private.organizations(id),
 user_id uuid not null references hub_private.profiles(id),
 role text not null check(role in ('operator','organization_admin')), active boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(organization_id,user_id)
);
create index organization_members_user on hub_private.organization_members(user_id,organization_id) where active;
create table hub_private.staff_roles (
 user_id uuid primary key references hub_private.profiles(id),
 role text not null check(role in ('cilentomania_editor','cilentomania_admin')),
 granted_by uuid references hub_private.profiles(id), granted_at timestamptz not null default now()
);

create function hub_private.staff_level() returns text language sql stable security definer set search_path='' as $$
 select s.role from hub_private.staff_roles s join hub_private.profiles p on p.id=s.user_id
 where p.id=hub_private.request_user_id() and p.enabled
$$;
create function hub_private.member_of(org uuid, managers_only boolean default false) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from hub_private.organization_members m join hub_private.profiles p on p.id=m.user_id
 join hub_private.organizations o on o.id=m.organization_id
 where m.user_id=hub_private.request_user_id() and m.organization_id=org and m.active and p.enabled and o.enabled
 and (not managers_only or m.role='organization_admin'))
$$;
create function hub_private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select coalesce(hub_private.staff_level()='cilentomania_admin',false)
$$;
alter function hub_private.staff_level() owner to hub_owner;
alter function hub_private.member_of(uuid,boolean) owner to hub_owner;
alter function hub_private.is_admin() owner to hub_owner;
revoke all on all functions in schema hub_private from public;
grant execute on all functions in schema hub_private to authenticated,hub_executor;
