create table hub_private.media (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, listing_id uuid not null,
 storage_path text not null unique, published_path text unique,
 mime text not null check(mime in ('image/jpeg','image/png','image/webp')),
 bytes bigint not null check(bytes between 1 and 5242880), width integer check(width>0), height integer check(height>0),
 checksum text, validation_status text not null default 'pending' check(validation_status in ('pending','validated','rejected')),
 uploaded_by uuid not null references hub_private.profiles(id), created_at timestamptz not null default now(),
 foreign key(listing_id,organization_id) references hub_private.listings(id,organization_id), unique(id,listing_id,organization_id),
 check(storage_path=organization_id::text||'/'||listing_id::text||'/'||id::text||'/original'),
 check(published_path is null or published_path=organization_id::text||'/'||listing_id::text||'/'||id::text||'/published'),
 check(validation_status<>'validated' or (width is not null and height is not null and checksum is not null))
);
create index media_listing on hub_private.media(organization_id,listing_id);
create table hub_private.listing_revision_media (
 revision_id uuid not null, listing_id uuid not null, organization_id uuid not null, media_id uuid not null,
 role text not null check(role in ('logo','cover','gallery')), position integer not null check(position>=0),
 caption text, alt text not null default '', primary key(revision_id,media_id), unique(revision_id,position),
 foreign key(revision_id,listing_id,organization_id) references hub_private.listing_revisions(id,listing_id,organization_id),
 foreign key(media_id,listing_id,organization_id) references hub_private.media(id,listing_id,organization_id)
);
create unique index revision_single_cover_logo on hub_private.listing_revision_media(revision_id,role) where role in ('logo','cover');
create index revision_media_asset on hub_private.listing_revision_media(media_id);

-- Empty private commercial foundations: deliberately no billing automation or example amounts.
create table hub_private.plans (
 id uuid primary key default gen_random_uuid(), code text not null unique, name text not null,
 version integer not null check(version>0), status text not null check(status in ('draft','active','retired'))
);
create table hub_private.contracts (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references hub_private.organizations(id), listing_id uuid,
 document_ref text, status text not null default 'draft', starts_at timestamptz, ends_at timestamptz,
 unique(id,organization_id), foreign key(listing_id,organization_id) references hub_private.listings(id,organization_id),
 check(ends_at is null or starts_at is null or ends_at>=starts_at)
);
create table hub_private.subscriptions (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references hub_private.organizations(id), listing_id uuid,
 plan_id uuid references hub_private.plans(id), contract_id uuid, status text not null default 'draft',
 starts_at timestamptz, ends_at timestamptz, renewal_at timestamptz,
 unique(id,organization_id), foreign key(listing_id,organization_id) references hub_private.listings(id,organization_id),
 foreign key(contract_id,organization_id) references hub_private.contracts(id,organization_id),
 check(ends_at is null or starts_at is null or ends_at>=starts_at)
);
create table hub_private.payments (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references hub_private.organizations(id), subscription_id uuid not null,
 provider_ref text unique, amount numeric(12,2) check(amount>=0), currency text check(currency ~ '^[A-Z]{3}$'), status text not null,
 foreign key(subscription_id,organization_id) references hub_private.subscriptions(id,organization_id),
 check((amount is null)=(currency is null))
);
create table hub_private.notifications (
 id uuid primary key default gen_random_uuid(), recipient_id uuid not null, organization_id uuid not null,
 type text not null, created_at timestamptz not null default now(), read_at timestamptz,
 foreign key(organization_id,recipient_id) references hub_private.organization_members(organization_id,user_id)
);
