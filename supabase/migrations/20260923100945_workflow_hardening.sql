-- Add tag and OS terms to indexed search without a stable array conversion in a generated expression.
create function public.search_tags(v text[]) returns text language sql immutable parallel safe set search_path='' as $$select array_to_string(v,' ')$$;
alter table public.posts drop column search_document;
alter table public.posts add column search_document tsvector generated always as (setweight(to_tsvector('english',title),'A')||setweight(to_tsvector('english',symptoms||' '||error_message||' '||device||' '||os||' '||public.search_tags(tags)),'B')||to_tsvector('english',steps||' '||cause||' '||excerpt)) stored;
create index posts_search on public.posts using gin(search_document);
create function public.engagement_total() returns bigint language sql stable security invoker set search_path='' as $$select coalesce(sum(views+likes),0)::bigint from public.posts where status='published' and published_at<=now()$$;
grant execute on function public.engagement_total() to anon,authenticated;
-- Admin-only, atomic conversion; locks one request to prevent two drafts from concurrent clicks.
create function public.convert_request(p_id uuid,p_slug text) returns uuid language plpgsql security invoker set search_path='' as $$declare r public.solution_requests; pid uuid;begin
 if not public.is_admin() then raise exception 'Forbidden';end if;
 select * into r from public.solution_requests where id=p_id for update;if not found then raise exception 'Missing request';end if;
 if r.post_id is not null then return r.post_id;end if;
 insert into public.posts(title,slug,device,os,symptoms,error_message,status) values(r.title,p_slug,r.device,r.os,r.description,r.error_message,'draft') returning id into pid;
 update public.solution_requests set post_id=pid,status='converted' where id=p_id;return pid;end $$;
revoke execute on function public.convert_request(uuid,text) from public,anon;
grant execute on function public.convert_request(uuid,text) to authenticated;
-- Block unreviewed or unrelated media even if an admin writes through the Data API.
create function public.check_published_media() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if new.status='published' and exists(select 1 from jsonb_array_elements(new.screenshots) s where (s->>'reviewed')::boolean is distinct from true or length(coalesce(s->>'alt',''))<3 or not exists(select 1 from public.media m where m.id::text=s->>'id' and m.path=s->>'path')) then raise exception 'Images need privacy review and valid media records';end if;
 return new;end $$;
create trigger validate_post_media before insert or update on public.posts for each row execute function public.check_published_media();
-- The private maintenance job removes expired identifiers and requests. It preserves all-time counters.
create function public.cleanup_events() returns void language plpgsql security invoker set search_path='' as $$begin
 delete from public.rate_limits where expires_at<now();delete from public.page_views where day<current_date-90;delete from public.events where created_at<now()-interval '90 days';end $$;
revoke execute on function public.cleanup_events() from public,anon,authenticated;
grant execute on function public.cleanup_events() to service_role;
