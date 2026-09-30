-- Dedicated blog project only. Explicit access works with automatic exposure disabled.
-- Disable implicit future API grants, including PostgreSQL's PUBLIC EXECUTE default.
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated, service_role;
alter default privileges for role postgres in schema public revoke execute on functions from public, anon, authenticated, service_role;

-- PostgreSQL global PUBLIC EXECUTE cannot be revoked by a schema-scoped default.
alter default privileges for role postgres revoke execute on functions from public, anon, authenticated, service_role;

-- Reset only this application's objects; never grant access to every schema object.
revoke all on public.admins, public.posts, public.post_revisions, public.case_inventory,
 public.comments, public.likes, public.page_views, public.events, public.solution_requests,
 public.media, public.affiliate_links, public.laptops, public.site_settings,
 public.redirects, public.rate_limits from public, anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
grant select on public.posts, public.comments, public.site_settings,
 public.affiliate_links, public.laptops, public.redirects to anon;
grant select on public.admins, public.posts, public.post_revisions, public.case_inventory,
 public.comments, public.likes, public.page_views, public.events, public.solution_requests,
 public.media, public.affiliate_links, public.laptops, public.site_settings, public.redirects to authenticated;
grant insert, update, delete on public.posts, public.comments, public.affiliate_links, public.laptops to authenticated;
grant insert on public.post_revisions, public.media to authenticated;
grant insert, update on public.redirects to authenticated;
grant update on public.solution_requests, public.site_settings to authenticated;
grant select, insert, update, delete on public.admins, public.posts, public.post_revisions,
 public.case_inventory, public.comments, public.likes, public.page_views, public.events,
 public.solution_requests, public.media, public.affiliate_links, public.laptops,
 public.site_settings, public.redirects, public.rate_limits to service_role;
revoke all on public.post_revisions_id_seq, public.events_id_seq from public, anon, authenticated, service_role;
grant usage on public.post_revisions_id_seq to authenticated, service_role;
grant usage on public.events_id_seq to service_role;

revoke execute on function public.is_admin(), public.search_tags(text[]),
 public.post_before_update(), public.refresh_comment_count(), public.check_published_media(),
 public.consume_rate_limit(text,integer,integer), public.record_view(uuid,uuid,text),
 public.set_like(uuid,uuid,boolean), public.dashboard_stats(), public.engagement_total(),
 public.convert_request(uuid,text), public.cleanup_events() from public, anon, authenticated, service_role;
grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.search_tags(text[]) to authenticated, service_role;
grant execute on function public.engagement_total() to anon, authenticated, service_role;
grant execute on function public.dashboard_stats(), public.convert_request(uuid,text) to authenticated, service_role;
grant execute on function public.consume_rate_limit(text,integer,integer),
 public.record_view(uuid,uuid,text), public.set_like(uuid,uuid,boolean), public.cleanup_events() to service_role;

-- Include all reader-facing diagnostic text, category, OS, manufacturer and tags.
alter table public.posts drop column search_document;
alter table public.posts add column search_document tsvector generated always as (
 setweight(to_tsvector('english',title),'A') ||
 setweight(to_tsvector('english',symptoms||' '||error_message||' '||device||' '||os||' '||manufacturer||' '||category||' '||public.search_tags(tags)),'B') ||
 to_tsvector('english',steps||' '||cause||' '||excerpt||' '||commands||' '||warnings||' '||verification||' '||alternatives||' '||faq::text)
) stored;
create index posts_search on public.posts using gin(search_document);

-- Listing images have the same publication boundary as article screenshots.
create function public.check_listing_media() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if jsonb_typeof(new.images)<>'array' then raise exception 'Images must be an array';end if;
 if new.available and exists(select 1 from jsonb_array_elements(new.images) s
 where (s->>'reviewed')::boolean is distinct from true or length(coalesce(s->>'alt',''))<3
 or not exists(select 1 from public.media m where m.id::text=s->>'id' and m.path=s->>'path'))
 then raise exception 'Images need privacy review and valid media records';end if;
 return new;end $$;
revoke execute on function public.check_listing_media() from public, anon, authenticated, service_role;
create trigger validate_listing_media before insert or update on public.laptops for each row execute function public.check_listing_media();

-- Align stored-object caps with the application's 3 MiB input cap. Private originals remain private.
update storage.buckets set file_size_limit=3145728 where id in ('article-media','original-media','request-media');
