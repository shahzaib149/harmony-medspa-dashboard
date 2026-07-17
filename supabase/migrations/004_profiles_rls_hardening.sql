-- 004_profiles_rls_hardening.sql
--
-- SECURITY (report PHASE 15/16). The `profiles` table drives every
-- authorization decision (role, is_active) but was created outside these
-- migrations, so its RLS was never version-controlled or audited.
--
-- Threat: the browser uses the anon key + the signed-in user's session to read
-- `profiles`. If any UPDATE policy exists for authenticated users, a viewer
-- could self-promote to admin (set role='admin') or reactivate themselves
-- (is_active=true) directly against Supabase REST — bypassing the API entirely.
--
-- This migration makes profiles least-privilege for the browser client:
--   * a user may READ ONLY their own row
--   * NO insert / update / delete is granted to normal users at all
--   * all privileged mutations go through the admin API, which uses the
--     service-role key (service role BYPASSES RLS, so requireRole + user
--     management keep working unchanged)
--
-- REVIEW BEFORE APPLYING: confirm the table is `public.profiles` with columns
-- id (uuid, = auth.users.id), role, is_active. Then run in a Supabase SQL
-- editor / via `supabase db push`, and re-verify with the checks at the bottom.

alter table public.profiles enable row level security;

-- Remove any pre-existing broad policies we are replacing. (Named policies only;
-- this will NOT touch a service-role policy created under a different name — see
-- the verification query at the bottom to list everything that remains.)
drop policy if exists "profiles_select_own"          on public.profiles;
drop policy if exists "profiles_select_admin"        on public.profiles;
drop policy if exists "profiles_no_write"            on public.profiles;
drop policy if exists "Users can view own profile"   on public.profiles;
drop policy if exists "Enable read access for all"   on public.profiles;

-- A signed-in user may read only their own profile row.
create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

-- Service role (server-side admin API only) retains full access.
drop policy if exists "profiles_service_role_all" on public.profiles;
create policy "profiles_service_role_all"
  on public.profiles
  for all
  to service_role
  using (true)
  with check (true);

-- NOTE: we intentionally create NO insert/update/delete policy for the
-- `authenticated` role. Under RLS, absence of a permissive policy = denied.
-- Users therefore cannot change their own role, reactivate themselves, or edit
-- any profile from the browser.

-- ---------------------------------------------------------------------------
-- VERIFY after applying (run manually, expect the described results):
--
--   -- 1. List every remaining policy on profiles; confirm no broad UPDATE/ALL
--   --    policy is granted to `authenticated` or `anon`:
--   select policyname, cmd, roles, qual, with_check
--   from pg_policies where schemaname='public' and tablename='profiles';
--
--   -- 2. As a NON-admin signed-in user (anon key + their JWT), this must FAIL /
--   --    affect 0 rows:
--   --    update profiles set role='admin' where id = auth.uid();
--
--   -- 3. As that same user, selecting another user's row must return 0 rows.
-- ---------------------------------------------------------------------------
