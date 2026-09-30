-- Read-only catalog assertions. Run after all migrations on the dedicated target.
do $$
declare t text; missing integer;
begin
 foreach t in array array['admins','posts','post_revisions','case_inventory','comments','likes','page_views','events','solution_requests','media','affiliate_links','laptops','site_settings','redirects','rate_limits'] loop
  if not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=t and c.relrowsecurity) then raise exception 'Missing table/RLS: %',t;end if;
  if has_table_privilege('anon','public.'||t,'INSERT,UPDATE,DELETE,TRUNCATE') then raise exception 'Anonymous writes allowed: %',t;end if;
  if t not in ('posts','comments','site_settings','affiliate_links','laptops','redirects') and has_table_privilege('anon','public.'||t,'SELECT') then raise exception 'Anonymous private read: %',t;end if;
  if not has_table_privilege('service_role','public.'||t,'SELECT') then raise exception 'Missing server grant: %',t;end if;
 end loop;
 foreach t in array array['posts','comments','site_settings','affiliate_links','laptops','redirects'] loop
  if not has_table_privilege('anon','public.'||t,'SELECT') then raise exception 'Missing public read: %',t;end if;
 end loop;
 foreach t in array array['likes','page_views','events','rate_limits','admins'] loop
  if has_table_privilege('authenticated','public.'||t,'INSERT,UPDATE,DELETE,TRUNCATE') then raise exception 'Excess authenticated grant: %',t;end if;
 end loop;
 if has_function_privilege('anon','public.consume_rate_limit(text,integer,integer)','EXECUTE') or has_function_privilege('authenticated','public.set_like(uuid,uuid,boolean)','EXECUTE') then raise exception 'Privileged engagement callable directly';end if;
 if exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname in ('is_admin','convert_request','record_view','set_like','dashboard_stats') and p.prosecdef) then raise exception 'Unexpected security definer';end if;
 select count(*) into missing from storage.buckets where id in ('article-media','original-media','request-media') and not public and file_size_limit=3145728;
 if missing<>3 then raise exception 'Private storage configuration mismatch';end if;
 if not exists(select 1 from pg_indexes where schemaname='public' and indexname='posts_search') then raise exception 'Missing search index';end if;
 if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='admin_storage') then raise exception 'Missing admin storage policy';end if;
end $$;
select schemaname,tablename,policyname,roles,cmd from pg_policies where schemaname='public' or (schemaname='storage' and policyname='admin_storage') order by schemaname,tablename,policyname;
select n.nspname,p.proname,p.prosecdef,p.proconfig from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by p.proname;
select c.relname as view_name,c.reloptions from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='v';
