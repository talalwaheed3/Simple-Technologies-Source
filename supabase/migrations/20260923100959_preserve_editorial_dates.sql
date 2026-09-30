-- Engagement counters must not rewrite an article's editorial modification date.
create or replace function public.post_before_update() returns trigger language plpgsql security invoker set search_path='' as $$begin
 if new.slug<>old.slug then insert into public.redirects(old_slug,post_id) values(old.slug,old.id) on conflict(old_slug) do update set post_id=excluded.post_id; end if;
 if (to_jsonb(new)-array['views','likes','comment_count','updated_at','search_document']) is distinct from (to_jsonb(old)-array['views','likes','comment_count','updated_at','search_document']) then
   new.updated_at=now();
   insert into public.post_revisions(post_id,body) values(old.id,to_jsonb(old)-'search_document');
 else new.updated_at=old.updated_at;
 end if;
 return new;end $$;
