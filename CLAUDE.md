# Brandbox — Brandstrom X Portal

## Stack
- Static HTML + Vanilla JS (no framework)
- Supabase (auth + database)
- Vercel (`cleanUrls: true`) — a `.html`-suffixed request 308-redirects to its clean equivalent, and that redirect **drops the query string entirely** (confirmed via `curl -i`: `.../page.html?id=1` redirects to `Location: /page`, no `?id`). Bit once already as a menu-active-underline mismatch (no query string involved, so silent); bit again building b-quest-view.html (`window.open('page.html?id=...')` — the id vanished after the redirect). Any link/navigation that needs to carry a query string on first load must target the CLEAN url directly (no `.html`), not rely on the redirect to strip it. Internal `window.location.replace('page.html')` calls without a query string are fine as-is (matches the existing convention throughout the codebase) — only query-string-carrying links need this fix.
- Domain: `bx.brandboxplatform.com` (Google Cloud)

## Project Structure

```
system/
  config.js         — Supabase credentials, SITE_URL, LOGO_URL
  system.js         — Auth guard, layout init, header inject, shared utils
  header.html       — Fixed header template (injected via JS)
  setting.html      — System Settings (Setting tab: Branding/Projects/Departments; Holiday tab; Member tab: Users & Access)
  color-picker.js   — Shared color-picker popover (Presets grid + wheel/hex), self-injecting
                      CSS/markup convention like select-picker.js/people-picker.js. Loaded by
                      setting.html and b-quest-settings.html.
  icon-picker.js    — Shared icon-picker popover (searchable Bootstrap Icons grid), same
                      self-injecting convention/API shape as color-picker.js
                      ({getValue, onSelect}). Loaded by setting.html only so far —
                      b-quest-settings.html still has its own separate, page-local icon
                      picker (ICON_PALETTE/openIconPicker there), not migrated to this file.
auth/
  auth.js           — Login / Signup / Forgot / Reset password functions
  *.html            — Auth pages (signup.html loads departments from DB)
index.html          — Portal home (project cards grid + top-right gear/logout icons)
b-quest/
  b-quest.js            — Config, permission loader, God mode logic; also shared
                          helpers for other B-Quest pages: hexToRgba() and
                          createRoleSegControl() (sliding role-segment filter)
  b-quest-assign-picker.js — Shared assign-picker popup (search + pick-a-person
                          list, clear-to-unassign), self-injecting CSS/markup
                          convention like system/multi-select.js. Loaded by any
                          page that needs it (currently b-quest-assignment.html).
  b-quest-modal.js      — Task create/edit modal (IIFE: BQuestApp)
  b-quest-list.html     — Task list with infinite scroll + filter
  b-quest-assignment.html — Unassigned task queue
  b-quest-settings.html — Member permissions management
  b-quest-dashboard.html — Charts & capacity overview (uses Chart.js CDN)
vercel.json
```

## Database Schema (Supabase)

All table names are `snake_case` (no hyphens) — standardized 2026-08-27, see [[project:db-table-rename-2026-08]] memory for the full before/after list and why.

| Table | Key Columns |
|---|---|
| `profiles` | id (uuid), codename, employee_id, nick_name, full_name, email, department, level, created_at |
| `system_department` | name (text, PK) — list of departments, RLS: SELECT open to authenticated |
| `b_quest_list` | id, account_name, opportunity_name, task_name, detail, link, publish_date, owner, create_date, last_update — per-role fields (deadline/assign/weight/status/etc.) live on `b_quest_task_role` instead, not flat columns here |
| `b_quest_task_role` | id, quest_id (FK → `b_quest_list.id`), role_id (FK → `b_quest_role.id`), role (denormalized name), status_id (FK → `b_quest_status.id`), status (denormalized name), work, type, deadline, weight, day, max_per_day, assign — one row per role a task has open |
| `b_quest_role` | id, name, color, icon, active, sort_order, max_capacity — dynamic role list (Designer/Creative/IT/...), `max_capacity` is the per-role daily cap Dashboard/Modal both read |
| `b_quest_status` | id, name, color, active, sort_order — dynamic status list |
| `b_quest_type` | id, name, active, sort_order |
| `b_quest_work` | role, work, day, weight |
| `b_account_setting` | codename (PK) — B-Account's Member permission row, one flat set per user (no per-role dimension, unlike B-Quest). Columns: `dashboard`/`account`/`duplicate`/`share` (module/action access — Account List, Dashboard, and the Opportunity card's Duplicate/Share menu items), `new`/`edit`/`delete` (task CRUD), `edit_scope`/`delete_scope` (text `own`/`all`, default `own` — Own only allows a record whose `owner`/`create_by` matches the viewer's own codename; checked via `canActOnRecord()` in `b-account.js`), `setting`/`member` (admin — **Setting is a forced superset of Member**, same rule as `system_access`: Setting on auto-forces Member on, Member off auto-forces Setting off; the Setting/Member toggle columns themselves are only in the DOM for a viewer who already has `setting`, mirroring `system/setting.html`'s `canSeeSystemAccess()`). `ae` (dead, unused anywhere) dropped 2026-10-03 alongside this redesign. |
| `b_opportunity_config` | type (text), value (text), composite unique `(type, value)` — one shared table backing B-Account Settings' 5 config lists (`status`/`bu`/`business_type`/`company`/`lead_source`), discriminated by `type`. `id` (uuid, PK), `color` (text, nullable), `active` (boolean, default true), `sort_order` (integer) — confirmed live on BX (2026-10-06, verified via direct schema dump), so `b-account-settings.html`'s color/toggle/drag UI now has real columns to save against. Only `status`/`bu` use `color`+`active`; `business_type`/`company`/`lead_source` only use `sort_order`+rename. Renaming a `value` does NOT cascade into `b_opportunity_list`/`b_opportunity_qt`/`b_opportunity_qt_item`'s plain-text references to it — explicitly out of scope, a known gap for whenever this is wired for real. |
| `b_quest_setting` | rule, value — misc B-Quest-wide settings (e.g. Data Visibility mode) |
| `b_quest_member` | codename (PK), creative, designer, setting, permissions |
| `b_quest_member_role` | id, codename, role_id, new, edit, delete, assign, accept, edit_scope, delete_scope — per-role permission grants (replaces the old flat `b-quest-setting` table) |
| `system_access` | codename (PK), bquest, bdashboard, baccount, bcommission, bfinance, system_setting, system_holiday, system_member — `bdashboard` is dead (Dashboard project was cut from `PROJECTS`/`PROJECT_LIST` 2026-09-25), column kept as-is, not read anywhere. `system_setting`/`system_holiday`/`system_member` are per-tab access to `/system/setting.html` (Setting⊇Member forced superset, Holiday independent — see Auth & Permission System section) |
| `system_setting` | key (PK), value, updated_at — platform-wide key-value settings (same shape as `b_quest_setting`), first used by System Settings' Branding section (`logo_header_url`, `logo_icon_url`, `theme_accent`, `theme_accent_light`, `theme_accent_dark`, `theme_dark`) |
| `system_project` | key (PK, matches a `PROJECTS` entry's key), status (text: `active`/`disabled`/`hidden`, default `active`, check-constrained), sort_order (integer, nullable), label (text, nullable), icon (text, nullable) — admin-managed 3-state switch + display order + cosmetic overrides per project, separate from `system_access` which is per-user permission. Absent row = `active` / array order; absent/null label or icon = fall back to that project's hardcoded entry in `PROJECTS`/`PROJECT_LIST` (label/icon are the ONLY overridable fields — `key`/`href`/`live` always stay fixed in code, since those tie to real routing). `disabled` grays the card out but still shows it to anyone with permission; `hidden` removes it entirely for a regular user (same as no permission) — except GOD, who always sees every project and gets `hidden` downgraded to the same grayed `disabled` look, never a true hide. Enforced at two layers, not just the index.html card: `system.js`'s `guardProjectAccess()` also checks it (cached as `bx_sys_access_status_<key>`, swept on every index visit like the other `bx_sys_access_*` keys) so a regular user who bookmarks a project's direct URL gets bounced to `/index.html` the moment an admin sets it to anything but `active` — GOD is exempt from this guard too |

`b_quest_capacity` (role, max_capacity) and 14 legacy flat designer_*/creative_* columns on `b_quest_list` were dropped 2026-08-27 — dead since the task-role cutover, nothing in the codebase read them anymore.

### Codename Cascade

`profiles.codename` is used as a soft join key (plain string match, no FK) across several tables. An `AFTER UPDATE` trigger on `profiles` (`trg_profiles_cascade_codename` → `fn_cascade_codename_rename()`, current version in `supabase/migrations/20260910000001_cascade_codename_opportunity.sql`) auto-propagates a codename rename into every table below — this is automatic, no manual step needed when a codename actually changes.

Tables currently covered: `system_access.codename`, `b_account_setting.codename`, `b_finance_setting.codename`, `b_quest_member_role.codename`, `b_quest_member.codename`, `b_quest_task_role.assign`, `b_quest_list.owner`, `b_account_list.create_by`/`update_by`, `b_opportunity_list.owner`/`am`/`sub_am`/`create_by`/`update_by`.

**Standing rule:** any new table/column that stores a person's codename as free text (not a `profiles.id` FK) MUST be added to `fn_cascade_codename_rename()` in the same migration that creates it — otherwise a future codename rename will silently leave that column stale (this already happened once, after the 2026-08-27 snake_case table rename). When adding schema, check new column names like `codename`/`owner`/`assign`/`create_by` against this list, not just when a bug is reported.

## Auth & Permission System

**Auth guard:** `initLayout()` → `initAuthGuard()` called on every page. Redirects to `/auth/login.html` if no session.

**User profile:** Stored in `sessionStorage` as `bx_user` after login.

**God mode:** `profiles.level === 'god'` → bypasses all permission checks, never shown in member lists (always filter `.neq('level', 'god')`). God user is not listed in any project's member/setting table.

**Per-project permissions:** Each project has its own settings table (e.g. `b-quest-setting`). Permissions are cached in `sessionStorage` with key `bx_perms_<project>` (e.g. `bx_perms_bquest`). Cleared on index and on every project page load to ensure fresh perms on refresh.

**Permission columns in b-quest-setting:**
- ROLE: `ae`, `creative`, `designer`
- TASK: `new`, `edit`, `delete`
- ADMIN: `assign`, `setting`

**System-level access (`system_access`):**
- Per-project toggles: `bquest`, `bdashboard` (dead, see DB schema table), `baccount`, `bcommission`, `bfinance`
- `system_setting`/`system_holiday`/`system_member` — per-tab access to `/system/setting.html`'s 3 tabs (Setting/Holiday/Member respectively). Same principle as B-Quest's own Setting/Member split (`b-quest-members.html`'s `onMemberSettingToggle`/`onMemberMemberToggle`), adapted from 2 flags to 3:
  - **Setting is a forced superset of Member** (bidirectional, enforced in JS on toggle, not a DB constraint): turning Setting on auto-forces Member on; turning Member off auto-forces Setting off. "Setting but not Member" can never exist as a state — the permission-toggle table itself lives on the Member tab, so a Setting-only user with Member off could never reach it to manage anyone's access.
  - **Holiday is fully independent** of both — its tab holds no permission UI, so there's no dependency to enforce.
  - **Visibility gate**: the Setting/Holiday/Member toggle columns in the Member tab's Users & Access table are only present in the DOM (not just CSS-hidden) for a viewer who has `system_setting` themselves — `system/setting.html`'s `canSeeSystemAccess()`, mirrors B-Quest's `canSeeAccess = canBquest('setting')` exactly. A Member-only or Holiday-only user can't see who else has admin-level access.
  - **Self-lockout guard**: toggling any of the 3 off for the CURRENTLY LOGGED-IN user shows a SweetAlert2 confirm first (`confirmSelfToggleOff()`) — editing someone else's is a normal Save/Cancel/Undo-covered edit, no confirm.
  - GOD bypasses all 3 flags always, same as every other permission check.

## JS Architecture Rules

- **Shared JS** → separate `.js` file (used across multiple pages of same project)
- **Page-specific JS** → inline `<script>` at bottom of that HTML file
- **System-level JS** → `system/system.js` and `system/config.js` (loaded on every page)
- Each project has its own config object (e.g. `B_QUEST_CONFIG`) in its `.js` file

## Page Init Pattern

Every project page follows this exact order:
```js
async function initPage() {
    sessionStorage.removeItem('bx_perms_<project>');  // clear cache ก่อนเสมอ
    await initLayout(CONFIG);                          // fetch perms + render header
    // guard หลัง initLayout — ตรวจ perms แล้ว redirect ถ้าไม่มีสิทธิ์
    // ตัวอย่าง: if (!perms?.setting) window.location.replace('...');
    await loadMasterData();                            // filter/dropdown data ครบก่อน render
    await fetchData(true);                             // โหลด list แรก — ต้อง await
}
// IntersectionObserver ต้อง active หลัง initPage เสร็จเท่านั้น
initPage().then(() => observer.observe(triggerEl));
```
- `initLayout` เรียก `getMenuPerms` (= `loadPerms`) อยู่แล้ว → perms set ใน sessionStorage ก่อน guard รัน
- **ห้าม guard ก่อน initLayout** — perms ยังไม่โหลด จะ redirect ผิด
- **ห้าม observer.observe ก่อน initPage เสร็จ** — observer จะ trigger fetchData ก่อน perms/masterData พร้อม ทำให้ 10 card แรกไม่มีปุ่ม Edit
- Auth pages และ index.html ไม่ต้องทำ pattern นี้

## CSS Architecture Rules

- แต่ละ project มีไฟล์ CSS ของตัวเอง เช่น `b-quest.css`
- `:root` variables ทั้งหมดอยู่ใน `<project>.css` เท่านั้น (ยกเว้น theme tokens ด้านล่าง) — ห้ามประกาศซ้ำใน HTML
- แต่ละ HTML โหลด `<project>.css` แทน และมีแค่ style เฉพาะหน้านั้น
- โหลดลำดับ: supabase → sweetalert2 → config.js → system.js → `<project>.js` → `/system/theme.css` → `<project>.css`

### Shared Theme Tokens (`system/theme.css`)

- `--c-accent` (#bdc432), `--c-accent-light` (#f4f7a1), `--c-accent-dark` (#7a8500) — สีเขียวแบรนด์ที่ใช้ซ้ำทุก project (ปุ่ม/border/icon เต็มค่า, พื้น active-hover อ่อน, ตัวหนังสือบนพื้นอ่อน ตามลำดับ)
- `--c-on-accent` (#1e293b) — ตัวหนังสือที่วางทับพื้น `--c-accent` เต็มค่าโดยตรง (เช่น badge, ปุ่ม solid) แยกจาก `--c-dark` (สีตัวหนังสือทั่วไปของแต่ละ project) โดยตั้งใจ — วันนี้เผอิญค่าเท่ากัน แต่ธีมสีเข้มในอนาคตอาจต้องให้ `--c-on-accent` เป็นขาว ในขณะที่ `--c-dark` (หัวข้อ/เนื้อหาทั่วไป) ไม่ต้องเปลี่ยน
- `--c-accent-rgb` (`189, 196, 50`) — ค่า R,G,B ของ `--c-accent` แบบ comma-separated สำหรับ `rgba(var(--c-accent-rgb), 0.2)` ที่ต้องมี alpha (เงา/glow) — CSS variable เติม alpha เองไม่ได้ ต้องมีตัวนี้แยกไว้ และต้องอัปเดตคู่กับ `--c-accent` เองด้วยมือเสมอ (derive กันไม่ได้)
- โหลดทุกหน้า (ทุก project + `system/setting.html`) ก่อน `<project>.css` — ห้ามประกาศ `--c-accent`/`--c-accent-light`/`--c-accent-dark`/`--c-on-accent`/`--c-accent-rgb` ซ้ำใน `<project>.css` หรือ inline `<style>` อีก
- เวลาหา hardcode สีเขียวที่ยังไม่ผูกกับ theme — grep เลข `#bdc432` เฉยๆ ไม่พอ ต้อง grep `rgba(189` ด้วย เพราะ hardcode มักซ่อนอยู่ใน `rgba(189,196,50,...)` ของ box-shadow/glow ที่ grep หา hex ตรงๆ จะมองไม่เห็น
- สีความหมายอื่น (แดง danger, สี role แต่ละแบบ) ยังอยู่ใน `<project>.css` ของตัวเองเหมือนเดิม ไม่ย้ายเข้ามาที่นี่
- Text วางทับพื้น `--c-accent` เต็มค่าโดยตรง (ไม่ใช่ `--c-accent-light`) ต้องใช้ `--c-on-accent` เสมอ ห้ามใช้ `--c-dark`/hardcode hex ตรงๆ — ตอนสร้างหน้าเลือกสีธีมในอนาคต จุดที่ต้องคำนวณสี (เทียบ contrast ดำ/ขาว) คือ token นี้ตัวเดียว
- ออกแบบไว้ให้ future Setting เปลี่ยน theme สีหลักได้ — เปลี่ยน 3 ค่านี้พร้อมกันเป็นชุดเดียวเท่านั้น (ห้ามเปลี่ยนแค่ตัวเดียว จะพังคอนทราสต์)
- Hover ของ item ใน dropdown/filter/checkbox list ทั่วระบบ (`select-picker.js`, `multi-select.js`, column-filter popover ของ `setting.html`/`b-quest-members.html`) ใช้ `--c-accent-light` ตรงๆ เหมือนกันหมด (เคยแยกเป็น token ชื่อ `--c-hover-bg` ต่างหาก แต่รวมกลับมาใช้ตัวเดียวกับสีเขียวแล้วตามที่ user ตัดสินใจ 2026-09-13)

## Performance Rules

- List pages use **infinite scroll**: 10–15 items per page via `IntersectionObserver`
- Filter/search must work across **all data** (not just current page) — fetch complete datasets for filter options separately
- Master data (work list, profiles, etc.) loaded once per page via `Promise.all`
- Modal helper data (profiles, capacity) cached per page load with `_loaded` flag — re-fetched on page refresh, not on every modal open

## Brand & UI

- **Brand lime:** `#bdc432` (also `rgb(189, 196, 50)`)
- **Brand dark:** `#1e293b` (headers, buttons) or `#111111` (portal)
- **Background:** `#f8fafc`
- **Font:** Outfit (portal/auth), Inter + Sarabun (project pages)
- **UI style:** Clean, modern, minimal — no clutter. Bootstrap 5 + Bootstrap Icons via CDN
- **Notifications:** SweetAlert2 via `notify()` wrapper in system.js

## User Display

Users are always shown as **codename** (nickname). Format reference: `codename : nickname (employee_id)`

## index.html — Portal Home

- Top-right: gear icon (⚙️ → `/system/setting.html`) shown only to god/system_setting users; logout icon shown to all
- Project cards rendered from `system_access`/member-table permission data AND `system_project`'s status — a regular user needs permission first, then status decides how the card looks AND whether it's clickable: `active` = clickable, `disabled` = grayed (`.app-card.disabled`, "UNAVAILABLE") and NOT clickable, `hidden` = not rendered at all, same as lacking permission. God bypasses the per-user permission check (sees every project) and never gets a true `hidden` — `renderGrid(access, sysProj, isGod)`'s `isGod` flag downgrades `hidden` to the same grayed `disabled` look — but for GOD specifically, grayed is cosmetic only: a `disabled`/downgraded-`hidden` card still renders as a real `<a href>` and God can click straight in, since God is the one who'd need to get in to flip the switch back anyway. Only a regular user's grayed card is actually non-clickable. Icon/label shown are `system_project.icon`/`.label` when set (edited from Settings → Projects), falling back to `PROJECTS`' own hardcoded values — both are DB-sourced now, so both go through `esc()` before the `innerHTML` render (added alongside this feature; this page had never needed `esc()` before, since everything on it used to be a hardcoded literal).
- A project with no code behind it yet (`href === null`, e.g. Commission) always shows "COMING SOON" regardless of status — the "UNAVAILABLE" label is reserved for a built project an admin actually disabled/hid
- God user sees all projects + gear icon automatically

## System Settings (`/system/setting.html`)

Three tabs (`top-tabs`/`switchTopTab()`, a JS-driven single-page tab switch, not separate files — unlike the other projects' Setting/Member split): **Setting**, **Holiday**, **Member** (`#tab-settings`/`#tab-holiday`/`#tab-access`). Holiday used to be a stacked section inside Setting; split out into its own tab 2026-09-25 since Setting keeps growing a new section every so often and Holiday is a full add/import/edit workflow of its own, not just a short config list — same reasoning applies to any future section that outgrows being "just a list."

Access is now per-tab, not one page-wide gate: each tab's button is shown/hidden per the viewer's own `system_setting`/`system_holiday`/`system_member` flag (`applyTabAccessVisibility()`), and lands on the first tab they actually have if Setting itself is off. The page as a whole admits anyone with at least one of the 3 flags (`guardAfterLoad()`); only someone with none of them gets bounced to `/index.html`. See the Auth & Permission System section above for the Setting⊇Member superset rule and the visibility-gated toggle columns.

**Setting tab** — three sections, stacked in this order (Branding/Projects first — the two an admin reaches for most day-to-day; Departments is lower-traffic reference data):
1. **Branding** — logo upload (2 slots: header wordmark + icon mark, staged as `File` objects, uploaded to the `Brandbox` Storage bucket on Save, with a Cropper.js crop step locked to each slot's own ratio — 3.75:1 header, 1:1 icon — plus HEIC/HEIF client-side conversion via `heic2any` so iPhone photos work too) + theme color pickers (Primary/Primary Light/Primary Dark/Dark Base, via the shared `/system/color-picker.js` popover) backed by the `system_setting` key-value table. **Dark Base** (`theme_dark` → `--c-dark`) is independent of Primary, not auto-derived from it — set manually like the other three; backs the "dark button" pattern (Add buttons, active nav tab: dark bg + accent-colored text/icon) that every project's own CSS otherwise hardcodes to `#1e293b`. Applied site-wide at runtime by `system.js`'s `applyCachedBranding()`/`refreshBranding()` (header logo, theme colors — including `--c-dark`, which overrides every project's own CSS since the override is an inline `:root` style — and `auth/login.html`'s logo since it calls `initLayout()`) — `auth/signup.html`/`forgot-password.html`/`reset-password.html` don't call `initLayout()`, so they still show the hardcoded default logo. The browser-tab favicon (`<link rel="icon">`) is also swapped to `logo_icon_url` here — a separate mechanism from `vercel.json`'s static `/favicon.ico` redirect (which points at a fixed file in the `Brandbox` Storage bucket, fork-specific, and only changes via manually re-uploading a file there — confirmed stale on CB 2026-10-14, predating Branding entirely). Same `initLayout()` caveat applies: the 3 auth pages above don't get the dynamic favicon either, same as the logo.
2. **Projects** — fixed list, one row per entry in `index.html`'s own `PROJECTS` array (`PROJECT_LIST` here is kept in sync by hand — no add/remove UI, a project only exists once real code backs it; `key`/`href`/`live` are NOT editable from here, only cosmetics + status are). Each row: a clickable icon swatch (`.proj-toggle-icon`, opens `/system/icon-picker.js`) + an editable name field (`.proj-toggle-name-input`, borderless until hover/focus like `.dept-name-input`) + a 3-state segmented control (Active/Disable/Hide, `.proj-status-seg`/`.proj-status-btn`, styled like the Holiday form's Full/Half Day pill, light-tint+border fill per state matching every other sliding-pill in the app) + drag-handle reorder (`sort_order`, staged/dropped same pattern as Departments). Icon/name changes stage into `projectChanges[key].icon`/`.label` same as status; a name cleared to empty saves as `null` (falls back to the hardcoded default) rather than an empty string. Backed by `system_project`. Status/reorder are only meaningful for projects that already have a real page (toggling `bcommission` does nothing — `href` is still `null` until someone builds it) — icon/label work regardless, including for not-yet-built projects.
3. **Departments** — row list (drag-handle reorder, Active toggle, trash), 2-column layout filled top-to-bottom (not left-right interleaved). Data from `system_department` table (`name` PK + `active`/`sort_order`), ordered by `sort_order`; A-Z sort button available as an explicit action, not automatic-on-save anymore. Staging pattern same as b-quest-settings.

**Holiday tab** — per-year list, staging pattern same as Departments. Lives in `#tab-holiday`, but its staging state (`holidayChanges`) and save/undo/cancel wiring aren't tab-scoped — `document.querySelectorAll('.section')` (used by the global dirty-clear/undo logic) runs document-wide regardless of which top-level tab a `.section` sits under, so moving a section between tabs needs no changes there.

**Member tab** — Users & Access: manage profiles + read-only project-membership badges (`PROJECT_COLS`, driven by each project's own member table via `USR_PROJECT_MEMBER_TABLE`) for everyone; the Setting/Holiday/Member toggle columns themselves only render for a viewer with `system_setting` (see Auth & Permission System section). Table header/colgroup are JS-rendered (`renderUsrTableHead()`), not static HTML, specifically so that admin zone can be genuinely absent from the DOM rather than just hidden — `PROJECT_COLS` also drives the project-access header now instead of a second hand-written copy (that copy had drifted: it still listed a "Dashboard" column and 5 project slots after `PROJECT_COLS` was cut to 4, until this fix). Department cell is dropdown from `system_department` DB.

## Departments Table

- Table: `system_department` (named `departments` until 2026-09-22, see `20260922000008_rename_departments_table.sql`) — columns: `name` (text, PK), `active` (boolean, default true), `sort_order` (integer) — `active`/`sort_order` added 2026-09-22 (`20260922000004_departments_active_sort_order.sql`) to back the drag-reorder + Active toggle on `system/setting.html`'s Department list
- RLS: `SELECT` open to authenticated (`USING (true)`)
- Write policy: authenticated users (or manage via SQL Editor)
- Ordered by `sort_order` on query (was a-z by `name` before the migration above)
- Used in: `system/setting.html` (manage), `auth/signup.html` (dropdown), Users & Access dept dropdown

## Adding a New Project

1. Add a card in `index.html` (app-grid section) + add key to `PROJECTS` array
2. Create a new folder `/<project-name>/`
3. Create `<project-name>.js` — config object, `loadPerms()`, `canProject(perm)`, `canProjectEditRole(role)` (follow `b-quest.js`)
4. Create `<project-name>.css` — `:root` variables + shared styles (follow `b-quest.css`)
5. Create HTML pages, each loading: supabase → sweetalert2 → config.js → system.js → `<project-name>.js` → `<project-name>.css`
6. Create a settings table in Supabase: `<project>-setting` with columns: codename (PK), role columns, task columns (new/edit/delete), admin columns (assign/setting)
7. Add column to `system_access` table for the new project key
8. sessionStorage key: `bx_perms_<project>` — system.js clears all `bx_perms_*` keys on index automatically
9. Add the same entry to `system/setting.html`'s `PROJECT_LIST` array (Projects section) — kept in sync with `index.html`'s `PROJECTS` by hand, no shared source

## Security Patterns

- **HTML escaping:** All DB fields rendered via `innerHTML` must go through `esc(s)` — escapes `&`, `<`, `>`, `"`. Defined inline per page (not in system.js).
- **Safe links:** External URLs from DB must use `safeLink(url)` — allows only `http://` and `https://` protocols, returns `'#'` otherwise.
- **External links:** Always add `rel="noopener"` on `target="_blank"` anchors.
- **Input value attributes:** Escape `"` → `&quot;` when interpolating DB strings into HTML `value="..."` attributes.
- b-quest-assignment already uses `esc()` globally. b-quest-list applies it to all card render fields.

## B-QUEST List Filter Pattern

Advanced filter zone (`flt-advanced-row`) contains:
- **Status segmented control** — 3-button group (All / Progress / Done), single-select, default = All
  - `setStatusFilter(type)` toggles `.active` class and calls `applyFilters()`
  - Done filter: `or('designer.is.null,designer.eq.-,designer_status.eq.Done')` + same for creative — handles tasks with only one role (other role = null)
  - Progress filter: `or('designer_status.neq.Done,creative_status.neq.Done')`
- **Work / Type / Assign / Owner** dropdowns
- **RESET** resets all dropdowns + returns status to All

## Projects Status

| Project | Status |
|---|---|
| B-QUEST | Live |
| B-ACCOUNT | Live |
| B-COMMISSION | Coming Soon |
| B-FINANCE | Live |

## Planned Features (Future)

- Email notifications
- Per-project dashboard with settings access
