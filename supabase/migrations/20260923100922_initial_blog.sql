create table public.admins (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.admins enable row level security;
grant select on public.admins to authenticated;
create policy own_admin on public.admins for select to authenticated using(user_id=(select auth.uid()));
create function public.is_admin() returns boolean language sql stable security invoker set search_path='' as $$ select exists(select 1 from public.admins where user_id=(select auth.uid())) $$;
grant execute on function public.is_admin() to authenticated;
create table public.posts (
 id uuid primary key default gen_random_uuid(), title text not null check(length(title) between 5 and 200), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), excerpt text not null default '',
 device text not null default '', manufacturer text not null default '', os text not null default '',category text not null default 'Windows',tags text[] not null default '{}',
 symptoms text not null default '',error_message text not null default '',cause text not null default '',steps text not null default '',commands text not null default '',warnings text not null default '',verification text not null default '',alternatives text not null default '',
 faq jsonb not null default '[]',related_ids uuid[] not null default '{}',screenshots jsonb not null default '[]',seo_title text not null default '',seo_description text not null default '',
 status text not null default 'draft' check(status in ('draft','review','needs_verification','published','archived')),verified boolean not null default false,
 published_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),views bigint not null default 0 check(views>=0),likes bigint not null default 0 check(likes>=0),comment_count bigint not null default 0 check(comment_count>=0),
 search_document tsvector generated always as (setweight(to_tsvector('english',title),'A')||setweight(to_tsvector('english',symptoms||' '||error_message||' '||device),'B')||to_tsvector('english',steps||' '||cause||' '||excerpt)) stored,
 check(status<>'published' or (verified and length(steps)>=20 and length(verification)>=10 and length(excerpt)>0 and published_at is not null))
);
create index posts_search on public.posts using gin(search_document);
create index posts_tags on public.posts using gin(tags);
create index posts_published on public.posts(published_at desc) where status='published';
create index posts_views on public.posts(views desc) where status='published';
create index posts_likes on public.posts(likes desc) where status='published';
create index posts_category on public.posts(category,published_at desc);
create table public.post_revisions(id bigint generated always as identity primary key,post_id uuid not null references public.posts on delete cascade,body jsonb not null,created_at timestamptz not null default now());
create index revisions_post on public.post_revisions(post_id,created_at desc);
create table public.case_inventory(id uuid primary key default gen_random_uuid(),post_id uuid references public.posts on delete set null,source_date date,source_ref text not null default '',title text not null,device text not null default '',os text not null default '',symptoms text not null default '',error_message text not null default '',failed_attempts text not null default '',actual_fix text not null default '',root_cause text not null default '',verification text not null default '',commands text not null default '',settings_changes text not null default '',drivers text not null default '',screenshots text not null default '',confidence text not null default 'low',status text not null default 'needs_verification',duplicates text[] not null default '{}',canonical_url text not null default '',evidence text not null default '',created_at timestamptz not null default now());
create index case_post on public.case_inventory(post_id);
create table public.comments(id uuid primary key default gen_random_uuid(),post_id uuid not null references public.posts on delete cascade,parent_id uuid references public.comments on delete cascade,name text not null check(length(name) between 2 and 80),body text not null check(length(body) between 3 and 3000),status text not null default 'pending' check(status in ('pending','approved','hidden','spam')),is_admin boolean not null default false,created_at timestamptz not null default now());
create index comments_post on public.comments(post_id,status,created_at);
create index comments_parent on public.comments(parent_id);
create index comments_status on public.comments(status,created_at desc);
create table public.likes(post_id uuid not null references public.posts on delete cascade,visitor_id uuid not null,created_at timestamptz not null default now(),primary key(post_id,visitor_id));
create table public.page_views(post_id uuid not null references public.posts on delete cascade,visitor_id uuid not null,day date not null default current_date,source text not null default 'direct',created_at timestamptz not null default now(),primary key(post_id,visitor_id,day));
create index views_date on public.page_views(created_at);
create table public.events(id bigint generated always as identity primary key,kind text not null check(kind in ('support','affiliate','laptop','search','feedback_yes','feedback_no')),post_id uuid references public.posts on delete set null,visitor_id uuid not null,query text not null default '',result_count integer,target_id uuid,created_at timestamptz not null default now());
create index events_date on public.events(created_at,kind);
create index events_post on public.events(post_id);
create table public.solution_requests(id uuid primary key default gen_random_uuid(),title text not null,description text not null,device text not null default '',os text not null default '',error_message text not null default '',tried text not null default '',contact text not null default '',consent boolean not null check(consent),screenshot_paths text[] not null default '{}',status text not null default 'new' check(status in ('new','reviewing','need_more_information','solved','converted','closed')),post_id uuid references public.posts on delete set null,created_at timestamptz not null default now());
create index requests_status on public.solution_requests(status,created_at desc);
create index requests_post on public.solution_requests(post_id);
create table public.media(id uuid primary key default gen_random_uuid(),path text not null unique,original_path text not null,alt text not null default '',width integer not null,height integer not null,created_at timestamptz not null default now());
create table public.affiliate_links(id uuid primary key default gen_random_uuid(),name text not null,destination text not null,affiliate_destination text not null default '',disclosure text not null default 'We may earn a commission from qualifying purchases.',enabled boolean not null default false,category text not null default '',post_ids uuid[] not null default '{}',created_at timestamptz not null default now());
create table public.laptops(id uuid primary key default gen_random_uuid(),model text not null,cpu text not null default '',ram text not null default '',storage text not null default '',display text not null default '',condition text not null default '',price numeric(12,2),currency text not null default 'PKR',description text not null default '',images jsonb not null default '[]',available boolean not null default false,created_at timestamptz not null default now());
create table public.site_settings(id integer primary key check(id=1),value jsonb not null default '{}');
insert into public.site_settings(id,value) values(1,'{"brand":"Simple Technologies","admin_label":"Simple Technologies / Technician"}');
create table public.redirects(old_slug text primary key,post_id uuid not null references public.posts on delete cascade);
create index redirects_post on public.redirects(post_id);
create table public.rate_limits(key text primary key,hits integer not null default 1,expires_at timestamptz not null);
-- Public reads; no public write privileges. Anonymous writes must pass server validation.
alter table public.posts enable row level security;
grant select on public.posts to anon,authenticated;
grant insert,update,delete on public.posts to authenticated;
create policy published_posts on public.posts for select to anon,authenticated using(status='published' and published_at<=now());
create policy admin_posts on public.posts for all to authenticated using((select public.is_admin())) with check((select public.is_admin()));
do $$ declare t text; begin foreach t in array array['post_revisions','case_inventory','comments','likes','page_views','events','solution_requests','media','affiliate_links','laptops','site_settings','redirects','rate_limits'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('grant all on public.%I to service_role',t);
 if t<>'rate_limits' then
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy admin_access on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',t);
 end if;
end loop;end $$;
grant all on public.posts,public.admins to service_role;
grant usage,select on all sequences in schema public to authenticated,service_role;
grant select on public.comments,public.site_settings,public.affiliate_links,public.laptops,public.redirects to anon;
create policy visible_comments on public.comments for select to anon,authenticated using(status='approved' and exists(select 1 from public.posts where id=post_id and status='published' and published_at<=now()));
create policy visible_settings on public.site_settings for select to anon,authenticated using(true);
create policy visible_affiliates on public.affiliate_links for select to anon,authenticated using(enabled);
create policy visible_laptops on public.laptops for select to anon,authenticated using(available);
create policy visible_redirects on public.redirects for select to anon,authenticated using(exists(select 1 from public.posts where id=post_id and status='published' and published_at<=now()));
create function public.post_before_update() returns trigger language plpgsql security invoker set search_path='' as $$begin
 new.updated_at=now();
 if new.slug<>old.slug then insert into public.redirects(old_slug,post_id) values(old.slug,old.id) on conflict(old_slug) do update set post_id=excluded.post_id; end if;
 if (to_jsonb(new)-array['views','likes','comment_count','updated_at','search_document']) is distinct from (to_jsonb(old)-array['views','likes','comment_count','updated_at','search_document']) then insert into public.post_revisions(post_id,body) values(old.id,to_jsonb(old)-'search_document'); end if;
 return new;end $$;
create trigger post_update before update on public.posts for each row execute function public.post_before_update();
-- All engagement RPCs are invoker functions with service_role-only EXECUTE.
create function public.consume_rate_limit(p_key text,p_limit integer,p_window integer) returns boolean language plpgsql security invoker set search_path='' as $$declare n integer;begin
 insert into public.rate_limits(key,hits,expires_at) values(p_key,1,now()+make_interval(secs=>p_window)) on conflict(key) do update set hits=case when public.rate_limits.expires_at<=now() then 1 else public.rate_limits.hits+1 end, expires_at=case when public.rate_limits.expires_at<=now() then now()+make_interval(secs=>p_window) else public.rate_limits.expires_at end returning hits into n;return n<=p_limit;end $$;
create function public.record_view(p_post uuid,p_visitor uuid,p_source text) returns void language plpgsql security invoker set search_path='' as $$declare n integer;begin
 if not exists(select 1 from public.posts where id=p_post and status='published' and published_at<=now()) then raise exception 'Unavailable';end if;
 insert into public.page_views(post_id,visitor_id,source) values(p_post,p_visitor,left(p_source,200)) on conflict do nothing;get diagnostics n=row_count;
 if n>0 then update public.posts set views=views+1 where id=p_post;end if;end $$;
create function public.set_like(p_post uuid,p_visitor uuid,p_active boolean) returns jsonb language plpgsql security invoker set search_path='' as $$declare n integer;total bigint;begin
 perform 1 from public.posts where id=p_post and status='published' and published_at<=now() for update;if not found then raise exception 'Unavailable';end if;
 if p_active then insert into public.likes(post_id,visitor_id) values(p_post,p_visitor) on conflict do nothing;get diagnostics n=row_count;update public.posts set likes=likes+n where id=p_post returning likes into total;
 else delete from public.likes where post_id=p_post and visitor_id=p_visitor;get diagnostics n=row_count;update public.posts set likes=greatest(0,likes-n) where id=p_post returning likes into total;end if;return jsonb_build_object('liked',p_active,'likes',total);end $$;
create function public.refresh_comment_count() returns trigger language plpgsql security invoker set search_path='' as $$begin update public.posts set comment_count=(select count(*) from public.comments where post_id=coalesce(new.post_id,old.post_id) and status='approved') where id=coalesce(new.post_id,old.post_id);return coalesce(new,old);end $$;
create trigger comment_count after insert or update or delete on public.comments for each row execute function public.refresh_comment_count();
create function public.dashboard_stats() returns jsonb language sql security invoker set search_path='' as $$select jsonb_build_object(
 'today',(select count(*) from public.page_views where day=current_date),'week',(select count(*) from public.page_views where day>=current_date-6),'month',(select count(*) from public.page_views where day>=current_date-29),'total',(select coalesce(sum(views),0) from public.posts),'unique',(select count(distinct visitor_id) from public.page_views where day>=current_date-29),
 'pending',(select count(*) from public.comments where status='pending'),'requests',(select count(*) from public.solution_requests where status='new'),
 'daily',(select coalesce(jsonb_agg(x),'[]') from (select d::date as day,count(v.post_id) as views from generate_series(current_date-29,current_date,'1 day')d left join public.page_views v on v.day=d::date group by d order by d)x),
 'events',(select coalesce(jsonb_agg(x),'[]') from(select kind,count(*) as count from public.events where created_at>=now()-interval '30 days' group by kind)x),
 'zero_searches',(select coalesce(jsonb_agg(x),'[]') from(select query,count(*) as count from public.events where kind='search' and result_count=0 group by query order by count(*) desc limit 20)x),
 'sources',(select coalesce(jsonb_agg(x),'[]') from(select source,count(*) as count from public.page_views where day>=current_date-29 group by source order by count(*) desc limit 10)x)) $$;
revoke execute on function public.consume_rate_limit(text,integer,integer),public.record_view(uuid,uuid,text),public.set_like(uuid,uuid,boolean),public.dashboard_stats() from public,anon,authenticated;
grant execute on function public.consume_rate_limit(text,integer,integer),public.record_view(uuid,uuid,text),public.set_like(uuid,uuid,boolean) to service_role;
grant execute on function public.dashboard_stats() to authenticated,service_role;
-- Private screenshots are only served through admin-authorized routes. Public images require attachment to a published post.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('article-media','article-media',false,8388608,array['image/jpeg','image/png','image/webp']),('original-media','original-media',false,8388608,array['image/jpeg','image/png','image/webp']),('request-media','request-media',false,8388608,array['image/webp']);
create policy admin_storage on storage.objects for all to authenticated using(bucket_id in ('article-media','original-media','request-media') and (select public.is_admin())) with check(bucket_id in ('article-media','original-media','request-media') and (select public.is_admin()));
