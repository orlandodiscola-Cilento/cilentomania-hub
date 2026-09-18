-- LOCAL ONLY: not approved/applied on Supabase. No client records or commerce activation.
-- Each subscription already has listing_id: future purchase/renewal is per listing.
create table hub_private.restaurants (
 revision_id uuid primary key references hub_private.listing_revisions(id),
 cuisine text[] not null default '{}', specialties text[] not null default '{}',
 indoor_seats integer check(indoor_seats>=0), outdoor_seats integer check(outdoor_seats>=0),
 opening_period text, opening_hours text, closed_days text,
 menu_url text check(menu_url is null or menu_url='' or menu_url ~ '^https?://'),
 reservation_recommended boolean, pets boolean, accessible boolean, family_friendly boolean, open_all_year boolean
);
alter table hub_private.restaurants owner to hub_owner;
alter table hub_private.restaurants enable row level security;
revoke all on hub_private.restaurants from public,anon,authenticated,service_role;
grant select on hub_private.restaurants to authenticated;
grant select,insert,update,delete on hub_private.restaurants to hub_executor;
create policy trusted_rpc on hub_private.restaurants to hub_executor using(true) with check(true);
create policy restaurants_read on hub_private.restaurants for select to authenticated using(hub_private.can_read_revision(revision_id));
create trigger content_freeze before insert or update or delete on hub_private.restaurants for each row execute function hub_private.freeze_content();
create function hub_private.restaurant_type_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if not exists(select 1 from hub_private.listing_revisions r join hub_private.listings l on l.id=r.listing_id where r.id=new.revision_id and l.type='restaurant') then raise exception 'wrong_content_type'; end if;
 return new;
end $$;
revoke all on function hub_private.restaurant_type_guard() from public,anon,authenticated,service_role;
create trigger restaurant_type before insert or update on hub_private.restaurants for each row execute function hub_private.restaurant_type_guard();
insert into hub_private.amenities(code,labels) values
 ('outdoor_seating','{"it":"Tavoli all’aperto"}'),('vegetarian_options','{"it":"Opzioni vegetariane"}'),
 ('vegan_options','{"it":"Opzioni vegane"}'),('gluten_free_options','{"it":"Opzioni senza glutine"}'),
 ('takeaway','{"it":"Asporto"}'),('high_chairs','{"it":"Seggioloni"}');

create or replace function hub_api.save_draft(rid uuid, expected_version integer, patch jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare r hub_private.listing_revisions; a hub_private.accommodations; food hub_private.restaurants; item jsonb; ord integer:=0;
begin
 r:=hub_private.lock_draft(rid,expected_version);
 perform hub_private.assert_keys(patch,array['content','accommodation','restaurant','amenities','translations','media']);
 if patch ? 'content' then
  perform hub_private.assert_keys(patch->'content',array['name','category','short_description','description','municipality_id','locality','address','latitude','longitude','phone','whatsapp','email','website','facebook','instagram','booking_url']);
  r:=jsonb_populate_record(r,patch->'content');
 end if;
 update hub_private.listing_revisions set name=r.name,category=r.category,short_description=r.short_description,description=r.description,
 municipality_id=r.municipality_id,locality=r.locality,address=r.address,latitude=r.latitude,longitude=r.longitude,
 phone=r.phone,whatsapp=r.whatsapp,email=r.email,website=r.website,facebook=r.facebook,instagram=r.instagram,booking_url=r.booking_url,
 version=version+1,updated_at=now(),updated_by=hub_private.request_user_id() where id=rid;
 if patch ? 'accommodation' then
  if not exists(select 1 from hub_private.listings where id=r.listing_id and type='accommodation') then raise exception 'wrong_content_type'; end if;
  perform hub_private.assert_keys(patch->'accommodation',array['rooms','beds','opening_period','check_in','check_out','pets','accessible','family_friendly','open_all_year','room_types','board_options','ideal_for']);
  select * into a from hub_private.accommodations where revision_id=rid;
  a:=jsonb_populate_record(a,patch->'accommodation'); a.revision_id:=rid;
  delete from hub_private.accommodations where revision_id=rid;
  insert into hub_private.accommodations select a.*;
 end if;
 if patch ? 'restaurant' then
  if not exists(select 1 from hub_private.listings where id=r.listing_id and type='restaurant') then raise exception 'wrong_content_type'; end if;
  perform hub_private.assert_keys(patch->'restaurant',array['cuisine','specialties','indoor_seats','outdoor_seats','opening_period','opening_hours','closed_days','menu_url','reservation_recommended','pets','accessible','family_friendly','open_all_year']);
  select * into food from hub_private.restaurants where revision_id=rid;
  food:=jsonb_populate_record(food,patch->'restaurant');food.revision_id:=rid;
  food.cuisine:=coalesce(food.cuisine,'{}');food.specialties:=coalesce(food.specialties,'{}');
  delete from hub_private.restaurants where revision_id=rid;
  insert into hub_private.restaurants select food.*;
 end if;
 if patch ? 'amenities' then
  if jsonb_typeof(patch->'amenities')<>'array' then raise exception 'invalid_amenities'; end if;
  delete from hub_private.listing_amenities where revision_id=rid;
  for item in select value from jsonb_array_elements(patch->'amenities') loop
   perform hub_private.assert_keys(item,array['code','available']);
   if not exists(select 1 from hub_private.listings l where l.id=r.listing_id and
    ((l.type='restaurant' and item->>'code'=any(array['wifi','parking','air_conditioning','sea_view','pets','accessible','outdoor_seating','vegetarian_options','vegan_options','gluten_free_options','takeaway','high_chairs'])) or
     (l.type='accommodation' and item->>'code'=any(array['wifi','pool','parking','breakfast','air_conditioning','sea_view','pets','accessible','spa','restaurant'])))) then raise exception 'invalid_amenity_for_type'; end if;
   insert into hub_private.listing_amenities values(rid,item->>'code',(item->>'available')::boolean);
  end loop;
 end if;
 if patch ? 'translations' then
  if jsonb_typeof(patch->'translations')<>'array' then raise exception 'invalid_translations'; end if;
  delete from hub_private.listing_revision_translations where revision_id=rid;
  for item in select value from jsonb_array_elements(patch->'translations') loop
   perform hub_private.assert_keys(item,array['locale','name','short_description','description']);
   insert into hub_private.listing_revision_translations values(rid,item->>'locale',item->>'name',item->>'short_description',item->>'description');
  end loop;
 end if;
 if patch ? 'media' then
  if jsonb_typeof(patch->'media')<>'array' or jsonb_array_length(patch->'media')>40 then raise exception 'invalid_media_count'; end if;
  delete from hub_private.listing_revision_media where revision_id=rid;
  for item in select value from jsonb_array_elements(patch->'media') loop
   perform hub_private.assert_keys(item,array['id','role','caption','alt']);
   insert into hub_private.listing_revision_media values(rid,r.listing_id,r.organization_id,(item->>'id')::uuid,item->>'role',ord,item->>'caption',coalesce(item->>'alt',''));
   ord:=ord+1;
  end loop;
 end if;
 return r.version+1;
end $$;
create or replace function hub_api.create_working_revision(lid uuid, expected_version integer) returns uuid
language plpgsql security definer set search_path='' as $$
declare l hub_private.listings; r hub_private.listing_revisions; new_id uuid:=gen_random_uuid();
begin
 select * into l from hub_private.listings where id=lid for update;
 if l.id is null or not hub_private.member_of(l.organization_id) then raise exception 'not_authorized'; end if;
 if expected_version is null or l.version<>expected_version then raise exception 'version_conflict'; end if;
 select * into r from hub_private.listing_revisions where id=coalesce(l.working_revision_id,l.published_revision_id) for update;
 if r.id is not null and r.status not in ('approved','changes_requested') then raise exception 'revision_pending'; end if;
 if r.id is null then
  insert into hub_private.listing_revisions(id,listing_id,organization_id,sequence,created_by,updated_by) values(new_id,lid,l.organization_id,1,hub_private.request_user_id(),hub_private.request_user_id());
 else
  insert into hub_private.listing_revisions select (jsonb_populate_record(null::hub_private.listing_revisions,
   to_jsonb(r)||jsonb_build_object('id',new_id,'base_revision_id',r.id,'sequence',r.sequence+1,'status','draft','version',1,
   'created_by',hub_private.request_user_id(),'updated_by',hub_private.request_user_id(),'created_at',now(),'updated_at',now(),'submitted_at',null))).*;
  insert into hub_private.accommodations select (jsonb_populate_record(a,jsonb_build_object('revision_id',new_id))).* from hub_private.accommodations a where revision_id=r.id;
  insert into hub_private.restaurants select (jsonb_populate_record(a,jsonb_build_object('revision_id',new_id))).* from hub_private.restaurants a where revision_id=r.id;
  insert into hub_private.listing_amenities select new_id,amenity_code,available from hub_private.listing_amenities where revision_id=r.id;
  insert into hub_private.listing_revision_translations select new_id,locale,name,short_description,description from hub_private.listing_revision_translations where revision_id=r.id;
  insert into hub_private.listing_revision_media select new_id,listing_id,organization_id,media_id,role,position,caption,alt from hub_private.listing_revision_media where revision_id=r.id;
 end if;
 update hub_private.listings set working_revision_id=new_id,version=version+1,updated_at=now() where id=lid;
 insert into hub_private.workflow_events(listing_id,revision_id,actor_id,action,to_status) values(lid,new_id,hub_private.request_user_id(),'create_draft','draft');
 return new_id;
end $$;
create or replace function hub_private.revision_document(rid uuid) returns jsonb language sql stable set search_path='' as $$
 select to_jsonb(r)||jsonb_build_object(
 'restaurant',(select to_jsonb(a)-'revision_id' from hub_private.restaurants a where a.revision_id=r.id),
 'accommodation',(select to_jsonb(a)-'revision_id' from hub_private.accommodations a where a.revision_id=r.id),
 'amenities',coalesce((select jsonb_agg(jsonb_build_object('code',a.amenity_code,'available',a.available) order by a.amenity_code) from hub_private.listing_amenities a where a.revision_id=r.id),'[]'::jsonb),
 'translations',coalesce((select jsonb_agg(to_jsonb(t)-'revision_id' order by t.locale) from hub_private.listing_revision_translations t where t.revision_id=r.id),'[]'::jsonb),
 'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'storagePath',m.storage_path,'role',rm.role,'position',rm.position,'caption',rm.caption,'alt',rm.alt) order by rm.position)
 from hub_private.listing_revision_media rm join hub_private.media m on m.id=rm.media_id where rm.revision_id=r.id),'[]'::jsonb))
 from hub_private.listing_revisions r where r.id=rid and hub_private.can_read_revision(r.id)
$$;
create or replace function hub_api.public_listing(listing_slug text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'id',l.id,'slug',l.slug,'type',l.type,'isDemo',r.is_demo,
  'name',r.name,'category',r.category,'shortDescription',r.short_description,'description',r.description,
  'location',jsonb_build_object('municipality',mu.name,'municipalitySlug',mu.slug,'locality',r.locality,'address',r.address,'latitude',r.latitude,'longitude',r.longitude),
  'contacts',jsonb_build_object('phone',r.phone,'whatsapp',r.whatsapp,'email',r.email,'website',r.website,'facebook',r.facebook,'instagram',r.instagram,'bookingUrl',r.booking_url),
  'features',case when l.type='restaurant' then (select jsonb_build_object('cuisine',a.cuisine,'specialties',a.specialties,'indoor_seats',a.indoor_seats,'outdoor_seats',a.outdoor_seats,'opening_period',a.opening_period,'opening_hours',a.opening_hours,'closed_days',a.closed_days,'menu_url',a.menu_url,'reservation_recommended',a.reservation_recommended,'pets',a.pets,'accessible',a.accessible,'family_friendly',a.family_friendly,'open_all_year',a.open_all_year) from hub_private.restaurants a where a.revision_id=r.id) else (select jsonb_build_object('rooms',a.rooms,'beds',a.beds,'openingPeriod',a.opening_period,'checkIn',a.check_in,'checkOut',a.check_out,'pets',a.pets,'accessible',a.accessible,'familyFriendly',a.family_friendly,'openAllYear',a.open_all_year,'roomTypes',a.room_types,'boardOptions',a.board_options,'idealFor',a.ideal_for) from hub_private.accommodations a where a.revision_id=r.id) end,
  'amenities',coalesce((select jsonb_agg(jsonb_build_object('code',a.amenity_code,'available',a.available) order by a.amenity_code) from hub_private.listing_amenities a where a.revision_id=r.id),'[]'::jsonb),
  'translations',coalesce((select jsonb_agg(jsonb_build_object('locale',t.locale,'name',t.name,'shortDescription',t.short_description,'description',t.description) order by t.locale) from hub_private.listing_revision_translations t where t.revision_id=r.id),'[]'::jsonb),
  'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'bucket','listing-published','path',m.published_path,'role',rm.role,'position',rm.position,'caption',rm.caption,'alt',rm.alt) order by rm.position)
   from hub_private.listing_revision_media rm join hub_private.media m on m.id=rm.media_id where rm.revision_id=r.id and m.validation_status='validated' and m.published_path is not null),'[]'::jsonb)
 ) from hub_private.listings l join hub_private.listing_revisions r on r.id=l.published_revision_id
 join hub_private.organizations o on o.id=l.organization_id left join hub_private.municipalities mu on mu.id=r.municipality_id
 where l.slug=listing_slug and l.publication_status='published' and r.status='approved' and o.enabled
$$;
-- CREATE OR REPLACE preserves owners/ACL of the established RPCs.
-- No new public RPC, storage policy, Auth change or commercial entitlement.
