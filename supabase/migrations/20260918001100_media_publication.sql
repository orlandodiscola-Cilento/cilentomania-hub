-- Processing copies are private and immutable. No Auth DDL or seed data.
create table hub_private.media_processing_jobs(
 media_id uuid primary key references hub_private.media(id), token uuid not null,
 state text not null check(state in ('processing','ready','failed')), lease_until timestamptz not null,
 attempts integer not null default 1, last_error text, updated_at timestamptz not null default now()
);
alter table hub_private.media_processing_jobs owner to hub_owner;
alter table hub_private.media_processing_jobs enable row level security;
revoke all on hub_private.media_processing_jobs from public,anon,authenticated,service_role;

create function hub_api.media_processing_context(mid uuid) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare m hub_private.media;
begin
 select * into m from hub_private.media where id=mid;
 if m.id is null or not hub_private.can_read_listing(m.listing_id) then raise exception 'not_authorized'; end if;
 return jsonb_build_object('id',m.id,'status',m.validation_status,'original',m.storage_path,'candidate',replace(m.storage_path,'/original','/candidate'),'published',replace(m.storage_path,'/original','/published'));
end $$;
alter function hub_api.media_processing_context(uuid) owner to hub_owner;
revoke all on function hub_api.media_processing_context(uuid) from public,anon,authenticated,service_role;
grant execute on function hub_api.media_processing_context(uuid) to authenticated;

create function hub_api.claim_media_processing(mid uuid) returns uuid
language plpgsql security definer set search_path='' as $$
declare j hub_private.media_processing_jobs; new_token uuid:=gen_random_uuid();
begin
 perform 1 from hub_private.media where id=mid for update;
 if not found then raise exception 'not_found'; end if;
 select * into j from hub_private.media_processing_jobs where media_id=mid;
 if j.state='processing' and j.lease_until>now() then raise exception 'processing_busy'; end if;
 if j.updated_at>now()-interval '30 seconds' and j.state='failed' then raise exception 'retry_later'; end if;
 insert into hub_private.media_processing_jobs(media_id,token,state,lease_until) values(mid,new_token,'processing',now()+interval '3 minutes')
 on conflict(media_id) do update set token=new_token,state='processing',lease_until=now()+interval '3 minutes',attempts=hub_private.media_processing_jobs.attempts+1,last_error=null,updated_at=now();
 return new_token;
end $$;
alter function hub_api.claim_media_processing(uuid) owner to hub_owner;
revoke all on function hub_api.claim_media_processing(uuid) from public,anon,authenticated,service_role;
grant execute on function hub_api.claim_media_processing(uuid) to service_role;

create function hub_api.finish_media_processing(mid uuid,lease_token uuid,file_checksum text,pixel_width integer,pixel_height integer,failure_code text default null) returns void
language plpgsql security definer set search_path='' as $$
begin
 perform 1 from hub_private.media_processing_jobs where media_id=mid and token=lease_token and state='processing' and lease_until>now() for update;
 if not found then raise exception 'stale_processing_lease'; end if;
 if failure_code is null then
  if pixel_width>1600 or pixel_height>1600 then raise exception 'invalid_size'; end if;
  perform hub_api.finalize_media(mid,file_checksum,pixel_width,pixel_height);
  update hub_private.media_processing_jobs set state='ready',updated_at=now() where media_id=mid;
 else
  update hub_private.media_processing_jobs set state='failed',last_error=case when failure_code in ('pixel_limit','candidate_required','processing_failed') then failure_code else 'processing_failed' end,updated_at=now() where media_id=mid;
 end if;
end $$;
alter function hub_api.finish_media_processing(uuid,uuid,text,integer,integer,text) owner to hub_owner;
grant execute on function hub_api.finalize_media(uuid,text,integer,integer) to hub_owner;
revoke all on function hub_api.finish_media_processing(uuid,uuid,text,integer,integer,text) from public,anon,authenticated,service_role;
grant execute on function hub_api.finish_media_processing(uuid,uuid,text,integer,integer,text) to service_role;

create function hub_api.public_listings(content_type text,page_size integer default 50,page_offset integer default 0) returns jsonb
language plpgsql stable security definer set search_path='' as $$
begin
 if content_type is null or content_type not in ('accommodation','restaurant') or page_size is null or page_size not between 1 and 100 or page_offset is null or page_offset<0 then raise exception 'invalid_page'; end if;
 return coalesce((select jsonb_agg(hub_api.public_listing(q.slug) order by q.id) from
 (select l.id,l.slug from hub_private.listings l join hub_private.listing_revisions r on r.id=l.published_revision_id join hub_private.organizations o on o.id=l.organization_id
 where l.type=content_type and l.publication_status='published' and r.status='approved' and not r.is_demo and o.enabled order by l.id limit page_size offset page_offset) q),'[]'::jsonb);
end $$;
alter function hub_api.public_listings(text,integer,integer) owner to hub_owner;
revoke all on function hub_api.public_listings(text,integer,integer) from public,anon,authenticated,service_role;
grant execute on function hub_api.public_listings(text,integer,integer) to anon,authenticated;

create or replace function hub_private.storage_allowed(path text, action text) returns boolean
language sql stable security definer set search_path='' as $$
 select exists(select 1 from hub_private.media m join hub_private.listings l on l.id=m.listing_id
 where (m.storage_path=path or replace(m.storage_path,'/original','/candidate')=path) and
 case when action='read' then
  hub_private.member_of(m.organization_id) or hub_private.is_admin() or exists
   (select 1 from hub_private.listing_revision_media rm where rm.media_id=m.id and hub_private.can_read_revision(rm.revision_id))
 when action='insert' then hub_private.member_of(m.organization_id) and m.uploaded_by=hub_private.request_user_id()
  and m.validation_status='pending' and exists(select 1 from hub_private.listing_revisions r where r.id=l.working_revision_id and r.status='draft')
  and not exists(select 1 from hub_private.listing_revision_media rm join hub_private.listing_revisions r on r.id=rm.revision_id where rm.media_id=m.id and r.status<>'draft')
 else false end)
$$;
