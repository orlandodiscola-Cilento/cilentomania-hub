-- Tables have a non-login owner. RPC executor is NOT owner and cannot bypass RLS.
-- Only its explicitly granted SECURITY DEFINER functions can use write policies.
do $$ declare t record; begin
 for t in select tablename from pg_tables where schemaname='hub_private' loop
  execute format('alter table hub_private.%I owner to hub_owner',t.tablename);
  execute format('alter table hub_private.%I enable row level security',t.tablename);
  execute format('revoke all on hub_private.%I from public, anon, authenticated',t.tablename);
  execute format('grant select,insert,update,delete on hub_private.%I to hub_executor',t.tablename);
  execute format('create policy trusted_rpc on hub_private.%I to hub_executor using (true) with check (true)',t.tablename);
 end loop;
end $$;
grant select on all tables in schema hub_private to authenticated;
revoke all on hub_private.plans,hub_private.contracts,hub_private.subscriptions,hub_private.payments from authenticated;

create function hub_private.can_read_revision(rid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from hub_private.listing_revisions r join hub_private.listings l on l.id=r.listing_id
 where r.id=rid and (hub_private.member_of(r.organization_id) or hub_private.is_admin()
 or (hub_private.staff_level()='cilentomania_editor' and (r.status in ('submitted','in_review','approved','changes_requested') or l.published_revision_id=r.id))))
$$;
create function hub_private.can_read_listing(lid uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from hub_private.listings l where l.id=lid and
 (hub_private.member_of(l.organization_id) or hub_private.is_admin() or
 (hub_private.staff_level()='cilentomania_editor' and exists(select 1 from hub_private.listing_revisions r
 where r.listing_id=l.id and r.status in ('submitted','in_review','approved','changes_requested')))))
$$;
alter function hub_private.can_read_revision(uuid) owner to hub_owner;
alter function hub_private.can_read_listing(uuid) owner to hub_owner;
revoke all on function hub_private.can_read_revision(uuid),hub_private.can_read_listing(uuid) from public;
grant execute on function hub_private.can_read_revision(uuid),hub_private.can_read_listing(uuid) to authenticated,hub_executor;

create policy profile_read on hub_private.profiles for select to authenticated using
 ((id=auth.uid() and enabled) or hub_private.is_admin());
create policy organization_read on hub_private.organizations for select to authenticated using
 (hub_private.member_of(id) or hub_private.is_admin() or
 (hub_private.staff_level()='cilentomania_editor' and exists(select 1 from hub_private.listings l where l.organization_id=organizations.id and hub_private.can_read_listing(l.id))));
create policy members_read on hub_private.organization_members for select to authenticated using
 (hub_private.member_of(organization_id) or hub_private.is_admin());
create policy staff_read on hub_private.staff_roles for select to authenticated using
 (hub_private.is_admin() or (user_id=auth.uid() and hub_private.staff_level() is not null));
create policy listings_read on hub_private.listings for select to authenticated using (hub_private.can_read_listing(id));
create policy revisions_read on hub_private.listing_revisions for select to authenticated using (hub_private.can_read_revision(id));
create policy accommodations_read on hub_private.accommodations for select to authenticated using (hub_private.can_read_revision(revision_id));
create policy amenities_read on hub_private.listing_amenities for select to authenticated using (hub_private.can_read_revision(revision_id));
create policy translations_read on hub_private.listing_revision_translations for select to authenticated using (hub_private.can_read_revision(revision_id));
create policy revision_media_read on hub_private.listing_revision_media for select to authenticated using (hub_private.can_read_revision(revision_id));
create policy media_read on hub_private.media for select to authenticated using
 (hub_private.member_of(organization_id) or hub_private.is_admin() or exists(select 1 from hub_private.listing_revision_media rm where rm.media_id=id and hub_private.can_read_revision(rm.revision_id)));
create policy events_read on hub_private.workflow_events for select to authenticated using
 (hub_private.can_read_listing(listing_id) and (revision_id is null or hub_private.can_read_revision(revision_id)));
create policy municipalities_read on hub_private.municipalities for select to authenticated using (true);
create policy catalog_read on hub_private.amenities for select to authenticated using (true);
create policy notifications_read on hub_private.notifications for select to authenticated using
 (recipient_id=auth.uid() and hub_private.member_of(organization_id));

-- Guard content and children even against a defective future write RPC.
create function hub_private.freeze_content() returns trigger language plpgsql set search_path='' as $$
declare rid uuid; state text;
begin
 if tg_table_name='listing_revisions' then
  if tg_op='DELETE' then raise exception 'revision_delete_forbidden'; end if;
  if tg_op='UPDATE' and new.status<>old.status and not
   ((old.status='draft' and new.status='submitted') or (old.status='submitted' and new.status='in_review') or
   (old.status='in_review' and new.status in ('approved','changes_requested'))) then raise exception 'invalid_transition'; end if;
  if tg_op='UPDATE' and old.status<>'draft' and
    (to_jsonb(new)-array['status','version','updated_at','updated_by']) is distinct from
    (to_jsonb(old)-array['status','version','updated_at','updated_by']) then
   raise exception 'revision_frozen';
  end if;
 else
  rid:=case when tg_op='DELETE' then old.revision_id else new.revision_id end;
  select status into state from hub_private.listing_revisions where id=rid for update;
  if state is distinct from 'draft' then raise exception 'revision_frozen'; end if;
  if tg_op='UPDATE' and old.revision_id<>new.revision_id then raise exception 'revision_move_forbidden'; end if;
 end if;
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
create trigger revision_freeze before update or delete on hub_private.listing_revisions for each row execute function hub_private.freeze_content();
do $$ declare t text; begin
 foreach t in array array['accommodations','listing_amenities','listing_revision_translations','listing_revision_media'] loop
 execute format('create trigger content_freeze before insert or update or delete on hub_private.%I for each row execute function hub_private.freeze_content()',t);
 end loop;
end $$;
create function hub_private.assert_keys(value jsonb, allowed text[]) returns void language plpgsql set search_path='' as $$
begin
 if jsonb_typeof(value) is distinct from 'object' or exists(select 1 from jsonb_object_keys(value) k where not(k=any(allowed))) then
 raise exception 'invalid_fields'; end if;
end $$;
create function hub_private.lock_draft(rid uuid, expected_version integer) returns hub_private.listing_revisions
language plpgsql set search_path='' as $$
declare r hub_private.listing_revisions; l hub_private.listings;
begin
 select * into r from hub_private.listing_revisions where id=rid;
 select * into l from hub_private.listings where id=r.listing_id for update;
 select * into r from hub_private.listing_revisions where id=rid for update;
 if r.id is null or not hub_private.member_of(r.organization_id) then raise exception 'not_authorized'; end if;
 if r.status<>'draft' or l.working_revision_id is distinct from r.id then raise exception 'not_current_draft'; end if;
 if expected_version is null or r.version<>expected_version then raise exception 'version_conflict'; end if;
 return r;
end $$;
revoke all on function hub_private.freeze_content(),hub_private.assert_keys(jsonb,text[]),hub_private.lock_draft(uuid,integer) from public;
grant execute on function hub_private.assert_keys(jsonb,text[]),hub_private.lock_draft(uuid,integer) to hub_executor;
