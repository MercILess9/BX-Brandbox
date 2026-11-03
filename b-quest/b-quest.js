const B_QUEST_CONFIG = {
    projectName: "B-QUEST",
    version: "3.3",
    accessKey: 'bquest',
    itemsPerPage_List: 10,
    itemsPerPage_Assign: 10,
    listTypes: ["New Task", "Revise 1", "Revise 2", "Revise 3", "Revise 4", "Revise 5"],
    menus: [
        { name: "Dashboard", link: "b-quest-dashboard.html", perm: "dashboard" },
        { name: "List", link: "b-quest-list.html" },
        { name: "Assignment", link: "b-quest-assignment.html", perm: "assign" },
        { name: "Settings", link: "b-quest-settings.html", perm: "setting", activeAlso: ["b-quest-members.html"] },
    ]
};

// Permissions are per-role: p.roles['Designer'] = { role_id, new, edit, delete, assign }.
// Special/global flags (e.g. "setting" access) live in p.permissions (a plain array of keys).
async function loadBquestPerms() {
    const user = getBxUser();
    if (!user) return null;

    if (user.level === 'god') {
        const { data: allRoles } = await supabaseClient.from('b_quest_role').select('id, name').eq('active', true);
        const roles = {};
        (allRoles || []).forEach(r => { roles[r.name] = { role_id: r.id, new: true, edit: true, delete: true, accept: true, assign: true }; });
        // "setting"/"assign"/"dashboard" flat fields are also kept alongside
        // permissions/roles — system.js's generic menu-perm gate reads
        // perms[menu.perm] directly (shared across every project, not
        // b-quest-aware), so it needs a flat lookup.
        const godPerms = { _god: true, permissions: ['setting', 'member', 'dashboard'], roles, setting: true, member: true, assign: true, dashboard: true };
        sessionStorage.setItem('bx_perms_bquest', JSON.stringify(godPerms));
        return godPerms;
    }

    const cached = sessionStorage.getItem('bx_perms_bquest');
    if (cached) return JSON.parse(cached);

    const [{ data: member }, { data: memberRoles }] = await Promise.all([
        supabaseClient.from('b_quest_member').select('codename, permissions').eq('codename', user.codename).single(),
        supabaseClient.from('b_quest_member_role').select('role_id, new, edit, delete, accept, assign, edit_scope, delete_scope, role:"b_quest_role"(name)').eq('codename', user.codename)
    ]);

    let perms = null;
    if (member) {
        const roles = {};
        (memberRoles || []).forEach(mr => {
            if (mr.role?.name) roles[mr.role.name] = { role_id: mr.role_id, new: mr.new, edit: mr.edit, delete: mr.delete, accept: mr.accept, assign: mr.assign, edit_scope: mr.edit_scope, delete_scope: mr.delete_scope };
        });
        const permissions = member.permissions || [];
        perms = {
            permissions,
            roles,
            setting: permissions.includes('setting'),
            member: permissions.includes('member'),
            dashboard: permissions.includes('dashboard'),
            assign: Object.values(roles).some(r => r.assign)
        };
    }

    sessionStorage.setItem('bx_perms_bquest', JSON.stringify(perms));
    return perms;
}

function getBquestPerms() {
    try { return JSON.parse(sessionStorage.getItem('bx_perms_bquest')); }
    catch { return null; }
}

// action: 'new' | 'edit' | 'delete' | 'assign' (true if granted on ANY role) |
// 'setting' | 'member' | 'duplicate' | 'share' (flat member-level flags, not per-role)
const BQUEST_FLAT_PERMS = ['setting', 'member', 'duplicate', 'share'];
function canBquest(action) {
    const p = getBquestPerms();
    if (!p) return false;
    if (p._god) return true;
    if (BQUEST_FLAT_PERMS.includes(action)) return (p.permissions || []).includes(action);
    return Object.values(p.roles || {}).some(r => !!r[action]);
}

// roleName must match "b-quest-role".name exactly (e.g. 'Designer').
function canBquestEditRole(roleName, action = 'edit') {
    const p = getBquestPerms();
    if (!p) return false;
    if (p._god) return true;
    return !!p.roles?.[roleName]?.[action];
}

// Scope-aware edit/delete check for a SPECIFIC role-row on a task (as
// opposed to canBquestEditRole, which only answers "does this user have
// edit/delete on this role at all"). assign is that row's
// b-quest-task-role.assign value; isOwner is whether the current user is
// the task's creator (b-quest-list.owner). Per the documented scope design
// (see 20260814000001_bquest_member_role_edit_delete_scope.sql and
// [[bquest-settings-roadmap]]) 'own' is asymmetric: edit grants to the
// creator OR the assignee, delete grants to the creator ONLY — merely
// being assigned isn't enough to delete the whole task.
function canBquestActOnRole(roleName, assign, action, isOwner) {
    const p = getBquestPerms();
    if (!p) return false;
    if (p._god) return true;
    const r = p.roles?.[roleName];
    if (!r?.[action]) return false;
    if (r[`${action}_scope`] !== 'own') return true; // 'all'
    if (action === 'delete') return !!isOwner;
    return !!isOwner || (!!assign && assign === getBxUser()?.codename);
}

function guardBquestPage(perm) {
    if (!canBquest(perm)) window.location.replace('b-quest-list.html');
}

// Shared hex->rgba helper — was duplicated identically in
// b-quest-assignment.html and b-quest-modal.js; b-quest-list.html and
// b-quest-settings.html used the `color + '26'` hex-alpha-suffix hack
// (0x26/255 ≈ 0.15) instead, now switched to call this with 0.15 directly
// so there's one source of truth.
function hexToRgba(hex, alpha) {
    const h = (hex || '#64748b').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Shared luminance-based text-contrast pickers — was duplicated (a
// self-contained inline copy of just pickBadgeTextColor) in
// b-quest-view.html; b-quest-modal.js is the fuller original, split into
// these 4 pieces since pickTintTextColor needs the raw r/g/b before the
// alpha blend. Admin-picked color used directly as text — or a same-hue-
// darkened variant of it — reads fine for dark/saturated hues but goes
// muddy or nearly invisible for light-reading ones (lime, yellow, pale
// cyan), because same-hue color pairs have a low perceived-contrast
// ceiling no matter how the lightness is tuned. Both pickers below
// sidestep that by ignoring hue entirely and picking pure near-black or
// pure white via a plain YIQ luminance check — the only thing that
// reliably tracks perceived contrast regardless of what hue is picked.
function hexToRgbParts(hex) {
    const h = (hex || '#94a3b8').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function yiqLuma(r, g, b) {
    return (r * 299 + g * 587 + b * 114) / 1000;
}

// For a SOLID fill (the color used at full strength, e.g. a Status pill's
// background) — check the color itself.
function pickBadgeTextColor(hex) {
    const [r, g, b] = hexToRgbParts(hex);
    return yiqLuma(r, g, b) >= 150 ? '#1e293b' : '#ffffff';
}

// For a TRANSLUCENT TINT of the color over a white-ish surface (e.g. the
// Assign badge, which sits on a 10%/18%-alpha wash of the role color, not
// the color itself) — check the composite over white at the darkest alpha
// actually used (0.18, the hover state), since that's the hardest case for
// dark text to still clear. At these low alphas the composite stays close
// to white for nearly any hue, so this is mostly a safety net for an
// unusually dark admin-picked role color.
function pickTintTextColor(hex, alpha = 0.18) {
    const [r, g, b] = hexToRgbParts(hex).map(v => v * alpha + 255 * (1 - alpha));
    return yiqLuma(r, g, b) >= 150 ? '#1e293b' : '#ffffff';
}

// Shared iOS-style sliding role-segment control — was triplicated (with
// small behavioral differences) across b-quest-list.html, b-quest-
// assignment.html and b-quest-settings.html's Default Filters box.
//
// wrapId/outerId/sliderId: ids of the scroll track / fade-outer / slider
// pill elements (each page keeps its own markup + CSS class names —
// List/Assignment use .role-seg-*, Settings uses .fd-role-seg-* — only the
// JS behavior is shared here).
// btnClass: the per-button CSS class this page's markup expects
// (default 'role-seg-btn').
// getButtons(): () => [{ label, value, icon, color }, ...] — called fresh
// on every render() so a role added/renamed/recolored elsewhere shows up
// immediately. `value` is the role id ('' for "All"); `color` should
// already be resolved (e.g. via a roleColorMap[r.id] lookup) since the
// factory just stores it on the button's dataset for reposition() to use.
// getActiveValue(): optional. If provided, render() uses it as the sole
// source of truth for which button should start active (Settings needs
// this — its active role comes from a staged buffer, not from whatever
// the DOM happened to show before a rebuild). If omitted (List/
// Assignment), render() falls back to preserving whatever button is
// currently .active in the DOM, dropping back to "All" if that value
// isn't among the fresh button set.
// onSelect(value): called on button click with the clicked value. List/
// Assignment call setActive() themselves inside this callback (for instant
// visual feedback) before kicking off their own async re-fetch; Settings
// instead stages the value into its own change-buffer and re-renders the
// whole section — the factory doesn't assume either behavior, it just
// hands back the click.
function createRoleSegControl({ wrapId, outerId, sliderId, btnClass = 'role-seg-btn', getButtons, getActiveValue, onSelect }) {
    function currentDomValue() {
        return document.querySelector(`#${wrapId} .${btnClass}.active`)?.dataset.role || '';
    }

    function render() {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const buttons = getButtons();
        let activeValue;
        if (getActiveValue) {
            activeValue = getActiveValue() || '';
        } else {
            const prevValue = currentDomValue();
            activeValue = buttons.some(b => b.value === prevValue) ? prevValue : '';
        }

        wrap.querySelectorAll(`.${btnClass}`).forEach(b => b.remove());
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = btnClass + (b.value === activeValue ? ' active' : '');
            btn.dataset.role = b.value;
            btn.dataset.color = b.color || '';
            btn.innerHTML = b.icon ? `<i class="bi ${b.icon}"></i> ${esc(b.label)}` : esc(b.label);
            btn.onclick = () => onSelect(b.value);
            wrap.appendChild(btn);
        });
        reposition();
    }

    // Pure DOM class toggle + reposition, no onSelect side effect — for
    // callers (List/Assignment) that need immediate visual feedback before
    // their own async chain (e.g. a re-fetch) runs.
    function setActive(value) {
        const wrap = document.getElementById(wrapId);
        wrap?.querySelectorAll(`.${btnClass}`).forEach(btn => btn.classList.toggle('active', btn.dataset.role === value));
        reposition();
    }

    function reposition() {
        const wrap = document.getElementById(wrapId);
        const active = wrap?.querySelector(`.${btnClass}.active`);
        const slider = document.getElementById(sliderId);
        if (!active || !slider) return;
        slider.style.left = active.offsetLeft + 'px';
        slider.style.width = active.offsetWidth + 'px';

        // "All" keeps the default accent color (cleared inline styles fall
        // back to the CSS default); a specific role tints the slider/label
        // with that role's own color instead.
        const color = active.dataset.role ? (active.dataset.color || '') : '';
        wrap.querySelectorAll(`.${btnClass}`).forEach(b => { b.style.color = ''; });
        if (color) {
            slider.style.background = hexToRgba(color, 0.15);
            slider.style.borderColor = color;
            active.style.color = color;
        } else {
            slider.style.background = '';
            slider.style.borderColor = '';
        }

        active.scrollIntoView({ block: 'nearest', inline: 'nearest' });
        updateFade();
    }

    function updateFade() {
        const scroll = document.getElementById(wrapId);
        const outer = document.getElementById(outerId);
        if (!scroll || !outer) return;
        outer.classList.toggle('fade-left', scroll.scrollLeft > 2);
        outer.classList.toggle('fade-right', scroll.scrollLeft + scroll.clientWidth < scroll.scrollWidth - 2);
    }

    return { render, reposition, updateFade, getValue: currentDomValue, setActive };
}

B_QUEST_CONFIG.getMenuPerms = loadBquestPerms;

const BQ_ROLES = ['designer', 'creative'];

function bqCalcDayLoad(tasks, role, dl, excludeId = null) {
    const dlDate = new Date(dl);
    return tasks
        .filter(t => {
            if (excludeId && t.id === excludeId) return false;
            const deadline = t[`${role}_deadline`];
            if (!deadline) return false;
            const d = t[`${role}_day`] || 1;
            const deadlineDate = new Date(deadline);
            const startDate = new Date(deadlineDate);
            startDate.setDate(startDate.getDate() - d + 1);
            return startDate <= dlDate && deadlineDate >= dlDate;
        })
        .reduce((sum, t) => sum + (Number(t[`${role}_weight`]) || 0), 0);
}

const BQ_WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // index = Date.getDay()

// 'full' | 'half' | null — same semantics as b-quest-modal.js's own
// holidayTypeForDate (duplicated here rather than shared, since that one
// lives inside BQuestApp's IIFE and isn't reachable from this file).
function bqHolidayType(dateStr, holidays) {
    if (!holidays?.length) return null;
    const hit = holidays.find(h => dateStr >= h.date_from && dateStr <= (h.date_to || h.date_from));
    return hit ? (hit.day_type || 'full') : null;
}

// Effective % of normal capacity for dateStr: a holiday overrides the
// weekday % entirely (full day = 0%, half day = a flat 50%), else falls
// back to the weekday's own Daily Capacity %. workdayWeight/holidays are
// optional so any existing caller that doesn't pass them keeps behaving
// exactly as before this existed (always 100%, no holiday awareness).
function bqDayPct(dateStr, workdayWeight, holidays) {
    const holType = bqHolidayType(dateStr, holidays);
    if (holType === 'full') return 0;
    if (holType === 'half') return 50;
    if (!workdayWeight) return 100;
    const dow = new Date(dateStr + 'T00:00:00').getDay();
    return workdayWeight[BQ_WEEK_KEYS[dow]] ?? 100;
}

// workdayWeight/holidays are optional — omit them to spread at full
// (unscaled) weight, same as before Daily Capacity/Skip Holidays existed.
// When passed, a day at 0% effective capacity (a weekend set to 0%, or a
// full-day holiday) contributes nothing at all for that date, matching
// how b-quest-modal.js's own capacity check already treats such a day.
function bqSpreadWeight(tasks, role, start, end, pad, workdayWeight = null, holidays = []) {
    // weightMap is the combined due+ongoing total per date — the number
    // that actually matters for "is this day over capacity" (calendar
    // heatmap). dueWeightMap/ongoingWeightMap split that same total by
    // i===0 (deadline lands here) vs i>0 (spread in from a later
    // deadline), both scaled the same way — so a caller stacking them
    // for a chart gets the two segments summing back to weightMap
    // exactly, instead of re-deriving "ongoing" with a different,
    // unscaled formula that double-counted these same tasks.
    const weightMap = {}, dueWeightMap = {}, ongoingWeightMap = {}, dueCount = {}, ongoingCount = {};
    tasks.forEach(t => {
        const deadline = t[`${role}_deadline`];
        if (!deadline || deadline < start || deadline > end) return;
        const weight = t[`${role}_weight`] || 0;
        const day = t[`${role}_day`] || 1;
        const deadlineDate = new Date(deadline);
        for (let i = 0; i < day; i++) {
            const dt = new Date(deadlineDate);
            dt.setDate(dt.getDate() - i);
            const ds = `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}`;
            if (ds >= start && ds <= end) {
                const pct = bqDayPct(ds, workdayWeight, holidays);
                const scaledWeight = weight * (pct / 100);
                if (scaledWeight <= 0) continue;
                weightMap[ds] = (weightMap[ds] || 0) + scaledWeight;
                if (i === 0) {
                    dueCount[ds] = (dueCount[ds] || 0) + 1;
                    dueWeightMap[ds] = (dueWeightMap[ds] || 0) + scaledWeight;
                } else {
                    ongoingCount[ds] = (ongoingCount[ds] || 0) + 1;
                    ongoingWeightMap[ds] = (ongoingWeightMap[ds] || 0) + scaledWeight;
                }
            }
        }
    });
    return { weightMap, dueWeightMap, ongoingWeightMap, dueCount, ongoingCount };
}

// ── Task links (up to 3 per task) ──
// Slot → b_quest_list column. Slot 1 is the original `link` column, so
// tasks saved before link_2/link_3 existed need no backfill.
const BQ_LINK_COLUMNS = { 1: 'link', 2: 'link_2', 3: 'link_3' };
const BQ_LINK_LABEL_MAX = 12;

// Settings → Links stores b_quest_setting rule 'quest_links' as an array
// whose ORDER is the display order: [{ slot, label, active }, ...]. Always
// returns all 3 slots, so a missing/partial/garbled value can't drop one.
// No saved config = slot 1 on, labelled "Link", 2-3 off — exactly how the
// single Link field looked before this existed.
function normalizeQuestLinks(value) {
    const saved = Array.isArray(value) ? value : [];
    const out = [];
    saved.forEach(s => {
        const slot = Number(s?.slot);
        if (!BQ_LINK_COLUMNS[slot] || out.some(o => o.slot === slot)) return;
        out.push({ slot, label: (s.label ?? '').toString().trim().slice(0, BQ_LINK_LABEL_MAX), active: s.active === true });
    });
    [1, 2, 3].forEach(slot => {
        if (!out.some(o => o.slot === slot)) out.push({ slot, label: slot === 1 && !saved.length ? 'Link' : '', active: slot === 1 && !saved.length });
    });
    return out;
}

// Label actually shown — an empty one falls back to "Link N" so two blank
// slots never render as two identical buttons.
function questLinkLabel(cfgSlot) {
    return cfgSlot.label || `Link ${cfgSlot.slot}`;
}

// Loaded once per page load (same caching rule as other modal helper data).
let _questLinkConfigPromise = null;
function loadQuestLinkConfig() {
    _questLinkConfigPromise ||= supabaseClient.from('b_quest_setting').select('value').eq('rule', 'quest_links').maybeSingle()
        .then(({ data }) => normalizeQuestLinks(data?.value))
        .catch(() => normalizeQuestLinks(null));
    return _questLinkConfigPromise;
}

// Active slots that actually have a URL on this task, in display order.
function getQuestLinks(quest, cfg) {
    return (cfg || normalizeQuestLinks(null))
        .filter(s => s.active)
        .map(s => ({ slot: s.slot, label: questLinkLabel(s), url: (quest?.[BQ_LINK_COLUMNS[s.slot]] || '').trim() }))
        .filter(l => l.url);
}

function renderQuestLinkButtons(quest, cfg, className) {
    return getQuestLinks(quest, cfg).map(l =>
        `<a href="${esc(safeLink(l.url))}" target="_blank" rel="noopener" class="${className}" title="${esc(l.label)}: ${esc(l.url)}"><i class="bi bi-link-45deg"></i><span class="bq-link-text">${esc(l.label)}</span></a>`
    ).join('');
}

async function handleDeleteTask(id) {
    const res = await Swal.fire({
        title: 'Delete Task?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444'
    });
    if (res.isConfirmed) {
        await supabaseClient.from('b_quest_list').delete().eq('id', id);
        location.reload();
    }
}

// Copies a deep link into b-quest-view.html's read-only page for this
// task — same clipboard+notify pattern as that page's own shareLink().
// Absolute path from origin (not relative to whatever page this was
// called from) and no .html suffix (see CLAUDE.md's cleanUrls note — a
// .html link with a query string loses the query string on the redirect
// to the clean URL).
function handleShareTask(id) {
    const url = `${window.location.origin}/b-quest/b-quest-view?id=${encodeURIComponent(id)}`;
    navigator.clipboard.writeText(url)
        .then(() => notify('Link copied', url, 'success', 3000))
        .catch(() => notify('', 'Could not copy link', 'error'));
}
