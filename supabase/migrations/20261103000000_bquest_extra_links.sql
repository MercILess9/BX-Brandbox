-- B-Quest: up to 3 links per task (Settings → Links decides how many are
-- shown, their labels and order — stored in b_quest_setting rule
-- 'quest_links'). The existing `link` column stays as slot 1, so existing
-- data needs no backfill. No RLS change needed (b_quest_list's policy is
-- row-level USING (true)), and these aren't codename columns, so
-- fn_cascade_codename_rename() doesn't need them.
ALTER TABLE "public"."b_quest_list"
    ADD COLUMN IF NOT EXISTS "link_2" "text",
    ADD COLUMN IF NOT EXISTS "link_3" "text";
