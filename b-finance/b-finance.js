const B_FINANCE_CONFIG = {
    projectName: "B-FINANCE",
    version: "1.0.5",
    accessKey: 'bfinance',
    menus: [
        { name: "Finance",  icon: "bi-cash-stack", link: "b-finance-list.html" },
        { name: "Settings", icon: "bi-gear", link: "b-finance-settings.html", perm: "setting", activeAlso: ["b-finance-members.html"] },
    ]
};

async function loadFinancePerms() {
    const user = getBxUser();
    if (!user) return null;

    if (user.level === 'god') {
        const godPerms = { view: true, edit: true, setting: true, _god: true };
        sessionStorage.setItem('bx_perms_bfinance', JSON.stringify(godPerms));
        return godPerms;
    }

    const cached = sessionStorage.getItem('bx_perms_bfinance');
    if (cached) return JSON.parse(cached);

    const { data, error } = await supabaseClient
        .from('b_finance_setting')
        .select('*')
        .eq('codename', user.codename)
        .single();

    const perms = (!error && data) ? data : null;
    sessionStorage.setItem('bx_perms_bfinance', JSON.stringify(perms));
    return perms;
}

function getFinancePerms() {
    try { return JSON.parse(sessionStorage.getItem('bx_perms_bfinance')); }
    catch { return null; }
}

function canFinance(perm) {
    const p = getFinancePerms();
    if (!p) return false;
    if (p._god) return true;
    return !!p[perm];
}

B_FINANCE_CONFIG.getMenuPerms = loadFinancePerms;
