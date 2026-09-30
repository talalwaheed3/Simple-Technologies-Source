-- Preserve Supabase's automatic RLS event trigger while removing client execution.
-- Older/local databases may not include this platform-provided helper.
do $$ begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
 end if;
end $$;
