-- Protect GOD accounts at the database level (2026-11-28).
--
-- GOD profiles are now listed in every member list like anyone else
-- (the client-side `.neq('level','god')` filters were removed), so an
-- admin with system_setting can now see them. The UI already hides the
-- delete button and locks the row, but profiles' RLS lets any
-- system_setting user UPDATE/DELETE any profile, so the real guarantee
-- has to live here:
--   * a GOD profile can never be deleted (deleting the profile also
--     deletes the login via trg_delete_auth_user, and deleting the login
--     from the Auth dashboard cascades here and is blocked the same way)
--   * a GOD can never be demoted
--   * only a GOD (or the server / SQL editor, auth.uid() null) may grant
--     GOD level or edit a GOD profile's fields
-- Escape hatch, on purpose: from the SQL editor,
--   alter table public.profiles disable trigger trg_profiles_protect_god;
--
-- Separate from fn_profiles_guard_self_update, which covers a different
-- concern (what a non-admin may change on their OWN row) and lets admins
-- through untouched.

create or replace function public.fn_profiles_protect_god()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  caller_is_god boolean;
begin
  if tg_op = 'DELETE' then
    if old.level = 'god' then
      raise exception 'A GOD account cannot be deleted';
    end if;
    return old;
  end if;

  if old.level = 'god' and new.level is distinct from old.level then
    raise exception 'A GOD account cannot be demoted';
  end if;

  if auth.uid() is null then
    return new;  -- server-side / SQL editor
  end if;

  select coalesce(bool_or(p.level = 'god'), false)
    into caller_is_god
    from public.profiles p
   where p.id = auth.uid();

  if new.level = 'god' and old.level is distinct from 'god' and not caller_is_god then
    raise exception 'Only a GOD can grant GOD level';
  end if;

  if old.level = 'god' and not caller_is_god then
    raise exception 'Only a GOD can edit a GOD account';
  end if;

  return new;
end;
$$;

alter function public.fn_profiles_protect_god() owner to postgres;

drop trigger if exists trg_profiles_protect_god on public.profiles;
create trigger trg_profiles_protect_god
  before update or delete on public.profiles
  for each row execute function public.fn_profiles_protect_god();
