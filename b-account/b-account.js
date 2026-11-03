function fmtNum(n) { return n != null && !isNaN(+n) ? fmtMoney(n) : '—'; }
function fmtAmt(n) { return n != null && !isNaN(+n) && +n > 0 ? fmtMoney(n) + ' ฿' : '—'; }
function gpPct(gp, amt) { return (gp && amt && +amt > 0) ? (+gp / +amt * 100).toFixed(1) + '%' : null; }

// Same convention as B-Quest's own hexToRgba (b-quest.js) — light-tint
// badges built from a b_opportunity_config.color hex value.
function hexToRgba(hex, alpha) {
    const h = (hex || '#64748b').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

// Same convention as B-Quest's own pickBadgeTextColor (b-quest.js) — a
// plain YIQ luminance check so a SOLID-fill badge (e.g. the Opportunity
// modal's Status pill) always reads, regardless of which hue was picked.
function pickBadgeTextColor(hex) {
    const h = (hex || '#94a3b8').replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (r * 299 + g * 587 + b * 114) / 1000 >= 150 ? '#1e293b' : '#ffffff';
}

// "Churn" has its own fixed set of CSS rules across b-opportunity-list.html/
// b-opportunity-modal.js/b-opportunity-view.html (loss box, churn badge,
// churn QT group border, modal churn-mode controls) that predate the
// Settings page's per-status color and were hardcoded to the old default
// orange (#f97316). Rather than inline-style every one of those elements,
// each now reads `var(--c-churn, #f97316)` (and `--c-churn-rgb` for the
// rgba() ones) — this sets those two CSS custom properties on <html> once,
// from the DB color, same `--c-accent-rgb` convention as system/theme.css.
function applyChurnColorVar(statusColorMap) {
    const hex = (statusColorMap && statusColorMap['Churn']) || '#f97316';
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const n = parseInt(full, 16);
    document.documentElement.style.setProperty('--c-churn', hex);
    document.documentElement.style.setProperty('--c-churn-rgb', `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`);
}

const B_ACCOUNT_CONFIG = {
    projectName: "B-ACCOUNT",
    version: "2.3",
    accessKey: 'baccount',
    menus: [
        { name: "Account",     icon: "bi-building", link: "b-account-list.html", perm: "account" },
        { name: "Opportunity", icon: "bi-briefcase", link: "b-opportunity-list.html" },
        { name: "Dashboard",   icon: "bi-grid-1x2", link: "b-account-dashboard.html", perm: "dashboard" },
        { name: "Settings",    icon: "bi-gear", link: "b-account-settings.html", perm: "setting", activeAlso: ["b-account-members.html"] },
    ]
};

async function loadBaccountPerms() {
    const user = getBxUser();
    if (!user) return null;

    if (user.level === 'god') {
        const godPerms = { ae: true, new: true, edit: true, delete: true, setting: true, _god: true };
        sessionStorage.setItem('bx_perms_baccount', JSON.stringify(godPerms));
        return godPerms;
    }

    const cached = sessionStorage.getItem('bx_perms_baccount');
    if (cached) return JSON.parse(cached);

    const { data, error } = await supabaseClient
        .from('b_account_setting')
        .select('*')
        .eq('codename', user.codename)
        .single();

    const perms = (!error && data) ? data : null;
    sessionStorage.setItem('bx_perms_baccount', JSON.stringify(perms));
    return perms;
}

function getBaccountPerms() {
    try { return JSON.parse(sessionStorage.getItem('bx_perms_baccount')); }
    catch { return null; }
}

async function loadBaccountConfig(type) {
    const { data } = await supabaseClient.from('b_opportunity_config').select('*').eq('type', type).order('sort_order', { ascending: true, nullsFirst: false });
    return data || [];
}

function canBaccount(perm) {
    const p = getBaccountPerms();
    if (!p) return false;
    if (p._god) return true;
    return !!p[perm];
}

function guardBaccountPage(perm) {
    if (!canBaccount(perm)) window.location.replace('b-opportunity-list.html');
}

// Own/All scope for a logged-in user — GOD always reads as 'all'. Only
// 'edit_scope'/'delete_scope' exist as real columns (b_account_setting).
function baccountScope(scopeCol) {
    const p = getBaccountPerms();
    if (!p) return 'own';
    if (p._god) return 'all';
    return p[scopeCol] === 'all' ? 'all' : 'own';
}

// Ownership-aware Edit/Delete check — Own scope only allows a record whose
// owner/create_by matches the logged-in user's own codename; All scope (or
// GOD) allows any record. action is 'edit' or 'delete'.
function canActOnRecord(action, ownerCodename) {
    if (!canBaccount(action)) return false;
    const scope = baccountScope(action === 'edit' ? 'edit_scope' : 'delete_scope');
    if (scope === 'all') return true;
    const user = getBxUser();
    return !!user && !!ownerCodename && ownerCodename === user.codename;
}

// Shared single-select sliding segment control — ref B-Quest's
// createRoleSegControl() in b-quest.js, generalized here since B-Account's
// use (Opportunity Status) has no per-item color like B-Quest's Role does.
// wrapId/outerId/sliderId are the scroll/outer/slider element ids;
// getButtons() returns [{value,label}], getActiveValue() the current
// value, onSelect(value) the click handler.
function createSegControl({ wrapId, outerId, sliderId, btnClass, getButtons, getActiveValue, onSelect }) {
    function currentDomValue() {
        return document.querySelector(`#${wrapId} .${btnClass}.active`)?.dataset.value || '';
    }

    function render() {
        const wrap = document.getElementById(wrapId);
        if (!wrap) return;
        const buttons = getButtons();
        const activeValue = getActiveValue ? (getActiveValue() || '') : currentDomValue();

        wrap.querySelectorAll(`.${btnClass}`).forEach(b => b.remove());
        buttons.forEach(b => {
            const btn = document.createElement('button');
            btn.className = btnClass + (b.value === activeValue ? ' active' : '');
            btn.dataset.value = b.value;
            btn.textContent = b.label;
            btn.onclick = () => onSelect(b.value);
            wrap.appendChild(btn);
        });
        reposition();
    }

    function reposition() {
        const wrap = document.getElementById(wrapId);
        const active = wrap?.querySelector(`.${btnClass}.active`);
        const slider = document.getElementById(sliderId);
        if (!active || !slider) return;
        slider.style.left = active.offsetLeft + 'px';
        slider.style.width = active.offsetWidth + 'px';
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

    return { render, reposition, updateFade, getValue: currentDomValue };
}

B_ACCOUNT_CONFIG.getMenuPerms = loadBaccountPerms;
