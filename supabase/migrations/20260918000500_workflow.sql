-- Each write is one transaction. No role or identity is accepted from the browser.
create function hub_api.save_draft(rid uuid, expected_version integer, patch jsonb) returns integer
language plpgsql security definer set search_path='' as $$
declare r hub_private.listing_revisions; a hub_private.accommodations; item jsonb; ord integer:=0;
begin
 r:=hub_private.lock_draft(rid,expected_version);
 perform hub_private.assert_keys(patch,array['content','accommodation','amenities','translations','media']);
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
 if patch ? 'amenities' then
  if jsonb_typeof(patch->'amenities')<>'array' then raise exception 'invalid_amenities'; end if;
  delete from hub_private.listing_amenities where revision_id=rid;
  for item in select value from jsonb_array_elements(patch->'amenities') loop
   perform hub_private.assert_keys(item,array['code','available']);
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

create function hub_api.submit_revision(rid uuid, expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare r hub_private.listing_revisions;
begin
 r:=hub_private.lock_draft(rid,expected_version);
 if btrim(r.name)='' then raise exception 'name_required'; end if;
 update hub_private.listing_revisions set status='submitted',version=version+1,submitted_at=now(),updated_at=now(),updated_by=hub_private.request_user_id() where id=rid;
 insert into hub_private.workflow_events(listing_id,revision_id,actor_id,action,from_status,to_status) values(r.listing_id,rid,hub_private.request_user_id(),'submit','draft','submitted');
 return r.version+1;
end $$;

create function hub_api.review_revision(rid uuid, expected_version integer, target text, feedback text default null) returns integer
language plpgsql security definer set search_path='' as $$
declare r hub_private.listing_revisions; lid uuid;
begin
 if hub_private.staff_level() is null then raise exception 'not_authorized'; end if;
 select listing_id into lid from hub_private.listing_revisions where id=rid;
 perform 1 from hub_private.listings where id=lid for update;
 select * into r from hub_private.listing_revisions where id=rid for update;
 if r.id is null or expected_version is null or r.version<>expected_version then raise exception 'version_conflict'; end if;
 if not ((r.status='submitted' and target='in_review') or (r.status='in_review' and target in ('approved','changes_requested'))) then raise exception 'invalid_transition'; end if;
 if target='changes_requested' and coalesce(btrim(feedback),'')='' then raise exception 'feedback_required'; end if;
 update hub_private.listing_revisions set status=target,version=version+1,updated_at=now(),updated_by=hub_private.request_user_id() where id=rid;
 insert into hub_private.workflow_events(listing_id,revision_id,actor_id,action,from_status,to_status,feedback)
 values(r.listing_id,rid,hub_private.request_user_id(),'review',r.status,target,feedback);
 return r.version+1;
end $$;

create function hub_api.create_working_revision(lid uuid, expected_version integer) returns uuid
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
  insert into hub_private.listing_amenities select new_id,amenity_code,available from hub_private.listing_amenities where revision_id=r.id;
  insert into hub_private.listing_revision_translations select new_id,locale,name,short_description,description from hub_private.listing_revision_translations where revision_id=r.id;
  insert into hub_private.listing_revision_media select new_id,listing_id,organization_id,media_id,role,position,caption,alt from hub_private.listing_revision_media where revision_id=r.id;
 end if;
 update hub_private.listings set working_revision_id=new_id,version=version+1,updated_at=now() where id=lid;
 insert into hub_private.workflow_events(listing_id,revision_id,actor_id,action,to_status) values(lid,new_id,hub_private.request_user_id(),'create_draft','draft');
 return new_id;
end $$;

create function hub_api.publish_revision(lid uuid,rid uuid,expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare l hub_private.listings; r hub_private.listing_revisions;
begin
 if not hub_private.is_admin() then raise exception 'not_authorized'; end if;
 select * into l from hub_private.listings where id=lid for update;
 select * into r from hub_private.listing_revisions where id=rid for update;
 if l.id is null or r.id is null or r.listing_id<>lid or r.status<>'approved' then raise exception 'not_approved'; end if;
 if not exists(select 1 from hub_private.organizations where id=l.organization_id and enabled) then raise exception 'organization_disabled'; end if;
 if l.published_revision_id=rid and l.publication_status='published' then return l.version; end if;
 if expected_version is null or l.version<>expected_version then raise exception 'version_conflict'; end if;
 if exists(select 1 from hub_private.listing_revision_media rm join hub_private.media m on m.id=rm.media_id
 where rm.revision_id=rid and (m.validation_status<>'validated' or m.published_path is null)) then raise exception 'media_not_ready'; end if;
 update hub_private.listings set published_revision_id=rid,publication_status='published',version=version+1,updated_at=now() where id=lid;
 insert into hub_private.workflow_events(listing_id,revision_id,actor_id,action,from_status,to_status) values(lid,rid,hub_private.request_user_id(),'publish',l.publication_status,'published');
 return l.version+1;
end $$;
create function hub_api.suspend_listing(lid uuid,expected_version integer) returns integer
language plpgsql security definer set search_path='' as $$
declare l hub_private.listings;
begin
 if not hub_private.is_admin() then raise exception 'not_authorized'; end if;
 select * into l from hub_private.listings where id=lid for update;
 if l.id is null or expected_version is null or l.version<>expected_version then raise exception 'version_conflict'; end if;
 update hub_private.listings set publication_status='suspended',version=version+1,updated_at=now() where id=lid;
 insert into hub_private.workflow_events(listing_id,revision_id,actor_id,action,from_status,to_status) values(lid,l.published_revision_id,hub_private.request_user_id(),'suspend',l.publication_status,'suspended');
 return l.version+1;
end $$;

-- Admin setup is for existing Auth users only; no Auth account creation here.
create function hub_api.set_operator_membership(org uuid, uid uuid, active boolean) returns void
language plpgsql security definer set search_path='' as $$
begin
 if not (hub_private.is_admin() or hub_private.member_of(org,true)) or uid=hub_private.request_user_id() then raise exception 'not_authorized'; end if;
 if exists(select 1 from hub_private.organization_members where organization_id=org and user_id=uid and role<>'operator') then raise exception 'protected_role'; end if;
 if not hub_private.is_admin() and not exists(select 1 from hub_private.organization_members where organization_id=org and user_id=uid) then
  raise exception 'invitation_requires_server';
 end if;
 insert into hub_private.organization_members(organization_id,user_id,role,active) values(org,uid,'operator',active)
 on conflict(organization_id,user_id) do update set active=excluded.active,updated_at=now();
end $$;

-- RPCs alone get the executor role; browser roles can never SET ROLE hub_executor.
do $$ declare f record; begin
 for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='hub_api' loop
  execute format('alter function %s owner to hub_executor',f.signature);
  execute format('revoke all on function %s from public,anon,authenticated',f.signature);
  execute format('grant execute on function %s to authenticated',f.signature);
 end loop;
end $$;
