create table hub_private.municipalities (
 id uuid primary key default gen_random_uuid(), slug text not null unique, name text not null,
 istat_code text unique, latitude numeric check(latitude between -90 and 90), longitude numeric check(longitude between -180 and 180),
 check((latitude is null)=(longitude is null))
);
create table hub_private.listings (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references hub_private.organizations(id),
 content_owner uuid not null references hub_private.organizations(id),
 type text not null check(type in ('accommodation','restaurant','event','experience','service','itinerary')),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), legacy_id text unique,
 publication_status text not null default 'unpublished' check(publication_status in ('unpublished','published','suspended')),
 published_revision_id uuid, working_revision_id uuid, version integer not null default 1 check(version>0),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,organization_id), check(content_owner=organization_id),
 check(publication_status<>'published' or published_revision_id is not null)
);
create index listings_org on hub_private.listings(organization_id,id);
create table hub_private.listing_revisions (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null, organization_id uuid not null,
 sequence integer not null check(sequence>0), base_revision_id uuid,
 status text not null default 'draft' check(status in ('draft','submitted','in_review','approved','changes_requested')),
 version integer not null default 1 check(version>0),
 name text not null default '' check(length(name)<=200), category text, short_description text, description text,
 municipality_id uuid references hub_private.municipalities(id), locality text, address text,
 latitude numeric check(latitude between -90 and 90), longitude numeric check(longitude between -180 and 180),
 phone text, whatsapp text, email text, website text, facebook text, instagram text, booking_url text,
 is_demo boolean not null default false,
 created_by uuid not null references hub_private.profiles(id), updated_by uuid not null references hub_private.profiles(id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), submitted_at timestamptz,
 foreign key(listing_id,organization_id) references hub_private.listings(id,organization_id),
 unique(id,listing_id,organization_id), unique(listing_id,sequence),
 foreign key(base_revision_id,listing_id,organization_id) references hub_private.listing_revisions(id,listing_id,organization_id),
 check((latitude is null)=(longitude is null)),
 check(website is null or website ~ '^https://'), check(facebook is null or facebook ~ '^https://'),
 check(instagram is null or instagram ~ '^https://'), check(booking_url is null or booking_url ~ '^https://')
);
alter table hub_private.listings add foreign key(published_revision_id,id,organization_id)
 references hub_private.listing_revisions(id,listing_id,organization_id) deferrable initially immediate;
alter table hub_private.listings add foreign key(working_revision_id,id,organization_id)
 references hub_private.listing_revisions(id,listing_id,organization_id) deferrable initially immediate;
create index revisions_org on hub_private.listing_revisions(organization_id,listing_id);
create index revisions_queue on hub_private.listing_revisions(status,submitted_at desc,id);
create table hub_private.accommodations (
 revision_id uuid primary key references hub_private.listing_revisions(id),
 rooms integer check(rooms>=0), beds integer check(beds>=0), opening_period text,
 check_in time, check_out time, pets boolean, accessible boolean, family_friendly boolean, open_all_year boolean,
 room_types text[], board_options text[], ideal_for text[]
);
create table hub_private.amenities (
 code text primary key check(code ~ '^[a-z][a-z0-9_]*$'), labels jsonb not null check(jsonb_typeof(labels)='object')
);
insert into hub_private.amenities(code,labels) values
 ('wifi','{"it":"Wi-Fi"}'),('pool','{"it":"Piscina"}'),('parking','{"it":"Parcheggio"}'),
 ('breakfast','{"it":"Colazione"}'),('air_conditioning','{"it":"Aria condizionata"}'),('sea_view','{"it":"Vista mare"}'),
 ('pets','{"it":"Animali ammessi"}'),('accessible','{"it":"Accessibilità"}'),('spa','{"it":"Spa"}'),('restaurant','{"it":"Ristorante"}');
create table hub_private.listing_amenities (
 revision_id uuid not null references hub_private.listing_revisions(id), amenity_code text not null references hub_private.amenities(code),
 available boolean, primary key(revision_id,amenity_code)
);
create table hub_private.listing_revision_translations (
 revision_id uuid not null references hub_private.listing_revisions(id), locale text not null check(locale in ('it','en','de','fr','es')),
 name text, short_description text, description text, primary key(revision_id,locale)
);
create table hub_private.workflow_events (
 id uuid primary key default gen_random_uuid(), listing_id uuid not null references hub_private.listings(id),
 revision_id uuid references hub_private.listing_revisions(id), actor_id uuid not null references hub_private.profiles(id),
 action text not null, from_status text, to_status text, feedback text, created_at timestamptz not null default now()
);
create index workflow_events_listing on hub_private.workflow_events(listing_id,created_at desc);
