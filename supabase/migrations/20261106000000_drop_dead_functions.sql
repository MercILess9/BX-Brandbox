-- Drop 4 leftover functions that nothing uses any more.
--
-- Found 2026-11-06 by diffing BX against CB: these exist on BX only.
-- No trigger, column default, policy or other object depends on them
-- (checked via pg_depend / pg_trigger on BX). Each was superseded:
--   handle_new_user()           -> fn_handle_new_user() (on_auth_user_created)
--   generate_account_id()       -> b_account_list.account_id column default
--   update_last_update_column() -> fn_set_update_date()
--   is_system_admin()           -> not referenced by any policy
--
-- Harmless to leave in place; this only tidies BX so both forks match.
-- IF EXISTS makes it a no-op on CB, which never had them.
-- NOT applied anywhere yet — run per fork when approved.

DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.generate_account_id();
DROP FUNCTION IF EXISTS public.update_last_update_column();
DROP FUNCTION IF EXISTS public.is_system_admin();
