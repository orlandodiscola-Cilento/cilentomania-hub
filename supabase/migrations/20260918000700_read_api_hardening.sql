-- Explicit API facade: expose hub_api ONLY, never hub_private.
create function hub_api.current_context() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('user',jsonb_build_object('id',p.id,'displayName',p.display_name,'locale',p.locale),
 'staffRole',hub_private.staff_level(),'organizations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'role',m.role) order by o.name)
 from hub_private.organizations o join hub_private.organization_members m on m.organization_id=o.id
 where m.user_id=p.id and hub_private.member_of(o.id)),'[]'::jsonb))
 from hub_private.profiles p where p.id=hub_private.request_user_id() and p.enabled
$$;
create function hub_private.revision_document(rid uuid) returns jsonb language sql stable set search_path='' as $$
 select to_jsonb(r)||jsonb_build_object(
 'accommodation',(select to_jsonb(a)-'revision_id' from hub_private.accommodations a where a.revision_id=r.id),
 'amenities',coalesce((select jsonb_agg(jsonb_build_object('code',a.amenity_code,'available',a.available) order by a.amenity_code) from hub_private.listing_amenities a where a.revision_id=r.id),'[]'::jsonb),
 'translations',coalesce((select jsonb_agg(to_jsonb(t)-'revision_id' order by t.locale) from hub_private.listing_revision_translations t where t.revision_id=r.id),'[]'::jsonb),
 'media',coalesce((select jsonb_agg(jsonb_build_object('id',m.id,'storagePath',m.storage_path,'role',rm.role,'position',rm.position,'caption',rm.caption,'alt',rm.alt) order by rm.position)
 from hub_private.listing_revision_media rm join hub_private.media m on m.id=rm.media_id where rm.revision_id=r.id),'[]'::jsonb))
 from hub_private.listing_revisions r where r.id=rid and hub_private.can_read_revision(r.id)
$$;
revoke all on function hub_private.revision_document(uuid) from public;
grant execute on function hub_private.revision_document(uuid) to hub_executor;
create function hub_api.get_listing(lid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
declare l hub_private.listings;
begin
 if not hub_private.can_read_listing(lid) then raise exception 'not_authorized'; end if;
 select * into l from hub_private.listings where id=lid;
 return to_jsonb(l)||jsonb_build_object('publishedVersion',hub_private.revision_document(l.published_revision_id),'workingRevision',hub_private.revision_document(l.working_revision_id));
end $$;
create function hub_api.list_listings(page_size integer default 30,page_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if page_size is null or page_size not between 1 and 100 or page_offset is null or page_offset<0 then raise exception 'invalid_page'; end if;
 return coalesce((select jsonb_agg(row_data order by updated_at desc,id) from
 (select l.id,l.updated_at,jsonb_build_object('id',l.id,'organizationId',l.organization_id,'type',l.type,'slug',l.slug,'publicationStatus',l.publication_status,'version',l.version,
 'publishedRevisionId',l.published_revision_id,'workingRevisionId',l.working_revision_id) row_data
 from hub_private.listings l where hub_private.can_read_listing(l.id) order by l.updated_at desc,l.id limit page_size offset page_offset) q),'[]'::jsonb);
end $$;
create function hub_api.review_queue(filter_status text default null,search_text text default '',page_size integer default 30,page_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if hub_private.staff_level() is null then raise exception 'not_authorized'; end if;
 if filter_status is not null and filter_status not in ('submitted','in_review','approved','changes_requested') then raise exception 'invalid_status'; end if;
 if page_size is null or page_size not between 1 and 100 or page_offset is null or page_offset<0 or length(search_text)>200 then raise exception 'invalid_page'; end if;
 return coalesce((select jsonb_agg(row_data order by submitted_at desc,id) from
 (select r.id,r.submitted_at,jsonb_build_object('id',r.id,'listingId',r.listing_id,'name',r.name,'organizationName',o.name,
 'status',r.status,'version',r.version,'updatedAt',r.updated_at,'submittedAt',r.submitted_at) row_data
 from hub_private.listing_revisions r join hub_private.organizations o on o.id=r.organization_id
 where r.status in ('submitted','in_review','approved','changes_requested') and (filter_status is null or r.status=filter_status)
 and (coalesce(search_text,'')='' or strpos(lower(r.name||' '||o.name),lower(search_text))>0)
 order by r.submitted_at desc,r.id limit page_size offset page_offset) q),'[]'::jsonb);
end $$;
create function hub_api.compare_revision(lid uuid,rid uuid) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if hub_private.staff_level() is null or not hub_private.can_read_revision(rid) or not exists(select 1 from hub_private.listing_revisions where id=rid and listing_id=lid) then raise exception 'not_authorized'; end if;
 return jsonb_build_object('proposed',hub_private.revision_document(rid),'published',hub_private.revision_document((select published_revision_id from hub_private.listings where id=lid)));
end $$;

-- Publication cannot point at a validated DB row whose prepared Storage object is absent.
grant usage on schema storage to hub_owner;
grant select on storage.objects to hub_owner;
create policy hub_prepared_media_lookup on storage.objects for select to hub_owner using(bucket_id='listing-published');
create function hub_private.prepared_media_exists(path text) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from storage.objects where bucket_id='listing-published' and name=path)
$$;
alter function hub_private.prepared_media_exists(text) owner to hub_owner;
revoke all on function hub_private.prepared_media_exists(text) from public;
grant execute on function hub_private.prepared_media_exists(text) to hub_executor;
create function hub_private.check_publish_media() returns trigger language plpgsql set search_path='' as $$
begin
 if new.publication_status='published' and exists(select 1 from hub_private.listing_revision_media rm join hub_private.media m on m.id=rm.media_id
 where rm.revision_id=new.published_revision_id and (m.validation_status<>'validated' or m.published_path is null or not hub_private.prepared_media_exists(m.published_path))) then raise exception 'media_not_ready'; end if;
 return new;
end $$;
revoke all on function hub_private.check_publish_media() from public;
create trigger published_media_ready before insert or update on hub_private.listings for each row execute function hub_private.check_publish_media();

-- Only a future trusted validation worker may call this: no user JWT can do it.
-- The worker must inspect actual file bytes, EXIF, dimensions and content before calling.
create function hub_api.finalize_media(mid uuid,file_checksum text,pixel_width integer,pixel_height integer) returns void
language plpgsql security definer set search_path='' as $$
declare m hub_private.media; ready_path text;
begin
 select * into m from hub_private.media where id=mid for update;
 if m.id is null or file_checksum is null or file_checksum !~ '^[a-f0-9]{64}$' or pixel_width is null or pixel_height is null or pixel_width<1 or pixel_height<1 then raise exception 'invalid_media'; end if;
 ready_path:=m.organization_id::text||'/'||m.listing_id::text||'/'||mid::text||'/published';
 if not hub_private.prepared_media_exists(ready_path) then raise exception 'media_not_ready'; end if;
 if m.validation_status='validated' then
  if m.checksum<>file_checksum or m.width<>pixel_width or m.height<>pixel_height then raise exception 'immutable_media'; end if;
  return;
 end if;
 update hub_private.media set published_path=ready_path,checksum=file_checksum,width=pixel_width,height=pixel_height,validation_status='validated' where id=mid;
end $$;

-- Every added RPC has explicit ownership and execute permissions, never PUBLIC.
do $$ declare f record; begin
 for f in select p.oid::regprocedure signature,p.proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='hub_api' and p.proname in ('current_context','get_listing','list_listings','review_queue','compare_revision','finalize_media') loop
  execute format('alter function %s owner to hub_executor',f.signature);
  execute format('revoke all on function %s from public,anon,authenticated,service_role',f.signature);
  if f.proname='finalize_media' then execute format('grant execute on function %s to service_role',f.signature);
  else execute format('grant execute on function %s to authenticated',f.signature); end if;
 end loop;
end $$;
grant usage on schema hub_api to service_role;
-- DDL privilege was needed for ownership transfers, not at runtime.
revoke create on schema hub_api from hub_executor;

create index revisions_municipality on hub_private.listing_revisions(municipality_id);
create index listing_amenities_code on hub_private.listing_amenities(amenity_code,revision_id);
create index contracts_organization on hub_private.contracts(organization_id,listing_id);
create index subscriptions_organization on hub_private.subscriptions(organization_id,listing_id);
create index payments_subscription on hub_private.payments(subscription_id,organization_id);
create index notifications_recipient on hub_private.notifications(recipient_id,created_at desc);
alter table hub_private.listing_revisions add unique(id,listing_id);
alter table hub_private.workflow_events add foreign key(revision_id,listing_id) references hub_private.listing_revisions(id,listing_id);
create function hub_private.append_only_event() returns trigger language plpgsql set search_path='' as $$
begin raise exception 'audit_is_append_only'; end $$;
revoke all on function hub_private.append_only_event() from public;
create trigger immutable_history before update or delete on hub_private.workflow_events for each row execute function hub_private.append_only_event();
create function hub_private.freeze_validated_media() returns trigger language plpgsql set search_path='' as $$
begin
 if old.validation_status='validated' and new is distinct from old then raise exception 'immutable_media'; end if;
 if (new.id,new.organization_id,new.listing_id,new.storage_path,new.uploaded_by) is distinct from
 (old.id,old.organization_id,old.listing_id,old.storage_path,old.uploaded_by) then raise exception 'immutable_media_identity'; end if;
 return new;
end $$;
revoke all on function hub_private.freeze_validated_media() from public;
create trigger validated_media_immutable before update on hub_private.media for each row execute function hub_private.freeze_validated_media();

-- Reduce runtime write surface to operations actually implemented in this step.
revoke insert,update,delete on hub_private.profiles,hub_private.organizations,hub_private.staff_roles,
 hub_private.municipalities,hub_private.amenities,hub_private.notifications from hub_executor;
revoke all on hub_private.plans,hub_private.contracts,hub_private.subscriptions,hub_private.payments from hub_executor;
revoke insert,delete on hub_private.listings from hub_executor;
revoke delete on hub_private.listing_revisions,hub_private.media from hub_executor;
revoke update,delete on hub_private.workflow_events from hub_executor;

-- Explicit final grants also override any platform-wide default function grants.
revoke all on all functions in schema hub_private from public,anon,authenticated,service_role;
grant execute on function hub_private.staff_level(),hub_private.member_of(uuid,boolean),hub_private.is_admin(),
 hub_private.can_read_listing(uuid),hub_private.can_read_revision(uuid),hub_private.storage_allowed(text,text),
 hub_private.public_media_allowed(text) to authenticated;
grant execute on function hub_private.public_media_allowed(text) to anon;
revoke all on all functions in schema hub_api from public,anon,authenticated,service_role;
grant execute on function hub_api.public_listing(text) to anon,authenticated;
grant execute on function hub_api.current_context(),hub_api.list_listings(integer,integer),hub_api.get_listing(uuid),
 hub_api.review_queue(text,text,integer,integer),hub_api.compare_revision(uuid,uuid),
 hub_api.create_working_revision(uuid,integer),hub_api.save_draft(uuid,integer,jsonb),
 hub_api.submit_revision(uuid,integer),hub_api.review_revision(uuid,integer,text,text),
 hub_api.publish_revision(uuid,uuid,integer),hub_api.suspend_listing(uuid,integer),
 hub_api.set_operator_membership(uuid,uuid,boolean),hub_api.register_media(uuid,integer,text,bigint) to authenticated;
grant execute on function hub_api.finalize_media(uuid,text,integer,integer) to service_role;
