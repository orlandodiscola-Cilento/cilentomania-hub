-- Private originals and private publication bucket. Public read is an RLS decision,
-- not a permanent publicly readable bucket (signed URLs still expire separately).
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('listing-drafts','listing-drafts',false,5242880,array['image/jpeg','image/png','image/webp']),
 ('listing-published','listing-published',false,5242880,array['image/jpeg','image/png','image/webp']);

create function hub_api.register_media(rid uuid,expected_version integer,mime_type text,file_bytes bigint) returns jsonb
language plpgsql security definer set search_path='' as $$
declare r hub_private.listing_revisions; mid uuid:=gen_random_uuid(); path text;
begin
 r:=hub_private.lock_draft(rid,expected_version);
 if (select count(*) from hub_private.media where listing_id=r.listing_id and validation_status='pending')>=40 then raise exception 'pending_media_limit'; end if;
 path:=r.organization_id::text||'/'||r.listing_id::text||'/'||mid::text||'/original';
 insert into hub_private.media(id,organization_id,listing_id,storage_path,mime,bytes,uploaded_by)
 values(mid,r.organization_id,r.listing_id,path,mime_type,file_bytes,hub_private.request_user_id());
 return jsonb_build_object('id',mid,'bucket','listing-drafts','path',path);
end $$;

create function hub_private.storage_allowed(path text, action text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from hub_private.media m join hub_private.listings l on l.id=m.listing_id
 where m.storage_path=path and
 case when action='read' then
  hub_private.member_of(m.organization_id) or hub_private.is_admin() or exists
   (select 1 from hub_private.listing_revision_media rm where rm.media_id=m.id and hub_private.can_read_revision(rm.revision_id))
 when action='insert' then hub_private.member_of(m.organization_id) and m.uploaded_by=hub_private.request_user_id()
  and m.validation_status='pending' and exists(select 1 from hub_private.listing_revisions r where r.id=l.working_revision_id and r.status='draft')
  and not exists(select 1 from hub_private.listing_revision_media rm join hub_private.listing_revisions r on r.id=rm.revision_id where rm.media_id=m.id and r.status<>'draft')
 else false end)
$$;
create function hub_private.public_media_allowed(path text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from hub_private.media m join hub_private.listing_revision_media rm on rm.media_id=m.id
 join hub_private.listings l on l.published_revision_id=rm.revision_id
 join hub_private.organizations o on o.id=l.organization_id
 where m.published_path=path and m.validation_status='validated' and l.publication_status='published' and o.enabled)
$$;
alter function hub_private.storage_allowed(text,text) owner to hub_owner;
alter function hub_private.public_media_allowed(text) owner to hub_owner;
revoke all on function hub_private.storage_allowed(text,text),hub_private.public_media_allowed(text) from public;
grant execute on function hub_private.storage_allowed(text,text) to authenticated;
grant execute on function hub_private.public_media_allowed(text) to anon,authenticated;
create policy hub_draft_read on storage.objects for select to authenticated
 using(bucket_id='listing-drafts' and hub_private.storage_allowed(name,'read'));
create policy hub_draft_insert on storage.objects for insert to authenticated
 with check(bucket_id='listing-drafts' and hub_private.storage_allowed(name,'insert'));
create policy hub_published_read on storage.objects for select to anon,authenticated
 using(bucket_id='listing-published' and hub_private.public_media_allowed(name));
-- Deliberately NO client UPDATE/DELETE or publication INSERT policy. An authorized
-- future server worker must validate bytes, strip EXIF, copy through Storage API,
-- then mark validated/ready. Never DELETE storage.objects with SQL to remove files.

create function hub_api.public_listing(listing_slug text) returns jsonb
language sql stable security definer set search_path='' as $$
 select jsonb_build_object(
  'id',l.id,'slug',l.slug,'type',l.type,'isDemo',r.is_demo,
  'name',r.name,'category',r.category,'shortDescription',r.short_description,'description',r.description,
  'location',jsonb_build_object('municipality',mu.name,'municipalitySlug',mu.slug,'locality',r.locality,'address',r.address,'latitude',r.latitude,'longitude',r.longitude),
  'contacts',jsonb_build_object('phone',r.phone,'whatsapp',r.whatsapp,'email',r.email,'website',r.website,'facebook',r.facebook,'instagram',r.instagram,'bookingUrl',r.booking_url),
  'features',(select jsonb_build_object('rooms',a.rooms,'beds',a.beds,'openingPeriod',a.opening_period,'checkIn',a.check_in,'checkOut',a.check_out,'pets',a.pets,'accessible',a.accessible,'familyFriendly',a.family_friendly,'openAllYear',a.open_all_year,'roomTypes',a.room_types,'boardOptions',a.board_options,'idealFor',a.ideal_for) from hub_private.accommodations a where a.revision_id=r.id),
  'amenities',coalesce((select jsonb_agg(jsonb_build_object('code',a.amenity_code,'available',a.available) order by a.amenity_code) from hub_private.listing_amenities a where a.revision_id=r.id),'[]'::jsonb),
  'translations',coalesce((select jsonb_agg(jsonb_build_object('locale',t.locale,'name',t.name,'shortDescription',t.short_description,'description',t.description) order by t.locale) from hub_private.listing_revision_translations t where t.revision_id=r.id),'[]'::jsonb),
  'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'bucket','listing-published','path',m.published_path,'role',rm.role,'position',rm.position,'caption',rm.caption,'alt',rm.alt) order by rm.position)
   from hub_private.listing_revision_media rm join hub_private.media m on m.id=rm.media_id where rm.revision_id=r.id and m.validation_status='validated' and m.published_path is not null),'[]'::jsonb)
 ) from hub_private.listings l join hub_private.listing_revisions r on r.id=l.published_revision_id
 join hub_private.organizations o on o.id=l.organization_id left join hub_private.municipalities mu on mu.id=r.municipality_id
 where l.slug=listing_slug and l.publication_status='published' and r.status='approved' and o.enabled
$$;
alter function hub_api.public_listing(text) owner to hub_owner;
revoke all on function hub_api.public_listing(text) from public;
grant execute on function hub_api.public_listing(text) to anon,authenticated;
alter function hub_api.register_media(uuid,integer,text,bigint) owner to hub_executor;
revoke all on function hub_api.register_media(uuid,integer,text,bigint) from public;
grant execute on function hub_api.register_media(uuid,integer,text,bigint) to authenticated;

-- Defense against future defective pointer assignments and unbounded media linking.
create function hub_private.validate_listing_pointers() returns trigger language plpgsql set search_path='' as $$
begin
 if new.published_revision_id is not null and not exists(select 1 from hub_private.listing_revisions r where r.id=new.published_revision_id and r.status='approved') then raise exception 'published_must_be_approved'; end if;
 return new;
end $$;
create trigger valid_pointers before insert or update on hub_private.listings for each row execute function hub_private.validate_listing_pointers();
create function hub_private.limit_revision_media() returns trigger language plpgsql set search_path='' as $$
begin
 perform 1 from hub_private.listing_revisions where id=new.revision_id for update;
 if (select count(*) from hub_private.listing_revision_media where revision_id=new.revision_id)>=40 then raise exception 'media_limit'; end if;
 return new;
end $$;
create trigger media_limit before insert on hub_private.listing_revision_media for each row execute function hub_private.limit_revision_media();
revoke all on function hub_private.validate_listing_pointers(),hub_private.limit_revision_media() from public;

-- Future functions/tables must opt in to grants, even if platform defaults change.
alter default privileges in schema hub_api revoke execute on functions from public;
alter default privileges in schema hub_private revoke execute on functions from public;
alter default privileges for role hub_owner in schema hub_api revoke execute on functions from public;
alter default privileges for role hub_executor in schema hub_api revoke execute on functions from public;
