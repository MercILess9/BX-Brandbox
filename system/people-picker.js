// Shared "pick people from a list" modal — search + avatar rows + Select
// All + a footer confirm button. Extracted after the exact same UI/JS
// (search filter across codename/nick_name/full_name/employee_id/
// department, Select All with indeterminate state, avatar-turns-solid on
// check) turned up copy-pasted verbatim in B-Quest's "Add Members" and
// "Add Admin Access" modals — the two only ever differed in (1) which
// profiles count as already-added (so excluded from the list) and (2)
// what happens to the codenames once confirmed, both left to the caller
// here instead of being baked in. Self-injecting CSS/markup, same
// convention as multi-select.js/select-picker.js, so any project's page
// gets it by just loading this script.
//
// Usage:
//   openPeoplePicker({
//       title: 'Add Members',
//       icon: 'bi-person-plus-fill',        // Bootstrap Icons class
//       getProfiles: () => allProfiles,      // full candidate pool, called fresh each open
//       isExcluded: (p) => existingSet.has(p.codename),  // already-added — left out of the list
//       nameOf: (p) => p.codename,           // optional, primary label per row (default: codename)
//       emptyText: 'No one available',       // optional
//       noneSelectedText: 'No one selected', // optional
//       selectedText: (n) => `${n} selected`, // optional, n is always >= 1 here
//       confirmLabel: 'Add',                 // optional
//       onConfirm: (codenames) => { ... },   // array of selected codenames — caller stages/saves
//   });
//
// Profile shape expected: { codename, nick_name?, full_name?, employee_id?, department?, avatar_url? }
// — same fields both original call sites already searched across, plus
// avatar_url (optional — falls back to initials when absent/not fetched).

(function () {
    let injected = false;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .bx-pp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); backdrop-filter: blur(4px);
                z-index: 10050; display: flex; align-items: center; justify-content: center;
                opacity: 0; pointer-events: none; transition: opacity 0.25s; }
            .bx-pp-overlay.show { opacity: 1; pointer-events: all; }
            .bx-pp-modal { background: #fff; border-radius: 24px; width: 640px; max-width: calc(100vw - 32px);
                max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15);
                transform: translateY(16px); transition: transform 0.25s; overflow: hidden; }
            .bx-pp-overlay.show .bx-pp-modal { transform: translateY(0); }
            .bx-pp-header { padding: 24px 28px 18px; border-bottom: 1px solid #e2e8f0; display: flex;
                align-items: center; justify-content: space-between; flex-shrink: 0; }
            .bx-pp-title { font-size: 1rem; font-weight: 800; color: var(--c-dark, #1e293b); display: flex; align-items: center; gap: 8px; }
            .bx-pp-close { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px;
                cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem;
                color: #94a3b8; transition: 0.2s; }
            .bx-pp-close:hover { background: #e2e8f0; color: var(--c-dark, #1e293b); }
            .bx-pp-search-wrap { padding: 14px 24px; border-bottom: 1px solid #e2e8f0; flex-shrink: 0; position: relative; }
            .bx-pp-search { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 12px;
                padding: 9px 14px 9px 38px; font-size: 0.85rem; outline: none; font-family: inherit;
                transition: 0.2s; background: #f8fafc; }
            .bx-pp-search:focus { border-color: var(--c-accent); background: #fff; }
            .bx-pp-search-icon { position: absolute; left: 36px; top: 50%; transform: translateY(-50%);
                color: #94a3b8; font-size: 0.85rem; pointer-events: none; }
            .bx-pp-list { overflow-y: auto; flex: 1; padding: 8px 14px; }
            .bx-pp-item { display: flex; align-items: center; gap: 14px; padding: 11px 12px; border-radius: 14px;
                cursor: pointer; transition: background 0.15s; }
            .bx-pp-item:hover { background: #f1f5f9; }
            .bx-pp-item.checked { background: var(--c-accent-light); }
            .bx-pp-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--c-accent-light);
                display: flex; align-items: center; justify-content: center; font-size: 1.05rem; font-weight: 800;
                color: var(--c-accent-dark); flex-shrink: 0; overflow: hidden; }
            .bx-pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .bx-pp-avatar span { font-size: 0.72rem; }
            .bx-pp-item.checked .bx-pp-avatar { background: var(--c-accent); }
            .bx-pp-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
            .bx-pp-nick { font-size: 0.88rem; font-weight: 700; color: var(--c-dark, #1e293b); overflow: hidden;
                text-overflow: ellipsis; white-space: nowrap; }
            .bx-pp-line2 { font-size: 0.76rem; color: #94a3b8; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .bx-pp-dept { flex-shrink: 0; width: 220px; font-size: 0.76rem; font-weight: 600; color: #626e7f;
                text-align: left; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
                padding-left: 16px; border-left: 1px solid #e2e8f0; }
            .bx-pp-select-all { border-bottom: 1px solid #e2e8f0; margin-bottom: 6px; padding-bottom: 15px; }
            .bx-pp-select-all .bx-pp-info { flex-direction: row; align-items: baseline; gap: 10px; }
            .bx-pp-select-all .bx-pp-nick { font-weight: 800; }
            .bx-pp-select-count { font-size: 0.76rem; color: #94a3b8; font-weight: 600; }
            .bx-pp-empty { padding: 40px; text-align: center; color: #94a3b8; font-size: 0.82rem; font-weight: 600; }
            .bx-pp-footer { padding: 16px 24px; border-top: 1px solid #e2e8f0; display: flex; align-items: center;
                justify-content: space-between; flex-shrink: 0; background: #fff; }
            .bx-pp-footer-info { font-size: 0.78rem; color: #94a3b8; font-weight: 600; }
            .bx-pp-footer-actions { display: flex; gap: 8px; }
            .bx-pp-btn-cancel, .bx-pp-btn-confirm { width: 120px; border: none; border-radius: 10px; padding: 10px 0;
                font-size: 0.82rem; font-weight: 700; cursor: pointer; font-family: inherit;
                transition: background 0.2s, transform 0.15s, box-shadow 0.15s; }
            .bx-pp-btn-cancel { background: #f1f5f9; color: #626e7f; }
            .bx-pp-btn-cancel:hover { background: #e2e8f0; transform: translateY(-1px); box-shadow: 0 3px 8px rgba(0,0,0,0.08); }
            .bx-pp-btn-cancel:active { transform: translateY(0); box-shadow: none; }
            .bx-pp-btn-confirm { background: var(--c-dark, #1e293b); color: var(--c-accent); }
            .bx-pp-btn-confirm:hover:not(:disabled) { background: #0f172a; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
            .bx-pp-btn-confirm:active:not(:disabled) { transform: translateY(0); box-shadow: none; }
            .bx-pp-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
            /* Matches the platform's .modern-checkbox pixel-for-pixel (pale
               fill + dark check on checked/indeterminate, defined per-project
               today in each project's own CSS) rather than assuming that
               class exists wherever this component is loaded — but an
               earlier version of this rule got the actual colors wrong
               (solid accent fill + white check, a different, not-actually-
               used-anywhere design) instead of copying the real spec. */
            .bx-pp-cb { appearance: none; -webkit-appearance: none; width: 20px; height: 20px; border: 2px solid #e2e8f0;
                border-radius: 6px; background: #fff; cursor: pointer; flex-shrink: 0; position: relative; transition: 0.15s; }
            .bx-pp-cb:hover { border-color: var(--c-accent); }
            .bx-pp-cb:checked { background: var(--c-accent-light); border-color: var(--c-accent); }
            .bx-pp-cb:checked::after { content: ''; position: absolute; left: 6px; top: 2px; width: 5px; height: 10px;
                border: solid var(--c-accent-dark); border-width: 0 2px 2px 0; transform: rotate(45deg); }
            .bx-pp-cb:indeterminate { background: var(--c-accent-light); border-color: var(--c-accent); }
            .bx-pp-cb:indeterminate::after { content: ''; position: absolute; left: 4px; top: 8px; width: 10px; height: 2px; background: var(--c-accent-dark); }
        `;
        document.head.appendChild(style);
    }

    function escHtml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    let overlay = null;
    let ctx = null;
    let selected = new Set();

    function matchesQuery(p, ql) {
        return (p.codename || '').toLowerCase().includes(ql) ||
            (p.nick_name || '').toLowerCase().includes(ql) ||
            (p.full_name || '').toLowerCase().includes(ql) ||
            (p.employee_id || '').toLowerCase().includes(ql) ||
            (p.department || '').toLowerCase().includes(ql);
    }

    function available(q) {
        const ql = (q || '').toLowerCase();
        return ctx.getProfiles().filter(p => !ctx.isExcluded(p) && matchesQuery(p, ql));
    }

    function nameOf(p) {
        return ctx.nameOf ? ctx.nameOf(p) : p.codename;
    }

    function renderList(q) {
        const list = overlay.querySelector('.bx-pp-list');
        const avail = available(q);
        if (!avail.length) {
            list.innerHTML = `<div class="bx-pp-empty">${escHtml(ctx.emptyText || 'No one available')}</div>`;
            return;
        }
        const selectedCount = avail.filter(p => selected.has(p.codename)).length;
        list.innerHTML = `
            <label class="bx-pp-item bx-pp-select-all${selectedCount === avail.length ? ' checked' : ''}">
                <input type="checkbox" class="bx-pp-cb bx-pp-select-all-cb" ${selectedCount === avail.length ? 'checked' : ''}>
                <div class="bx-pp-avatar"><i class="bi bi-people-fill"></i></div>
                <div class="bx-pp-info">
                    <span class="bx-pp-nick">Select All</span>
                    <span class="bx-pp-select-count">${avail.length} available</span>
                </div>
            </label>
            ${avail.map(p => `
                <label class="bx-pp-item${selected.has(p.codename) ? ' checked' : ''}" data-codename="${escHtml(p.codename)}">
                    <input type="checkbox" class="bx-pp-cb bx-pp-item-cb" ${selected.has(p.codename) ? 'checked' : ''}>
                    <div class="bx-pp-avatar">${p.avatar_url
                        ? `<img src="${escHtml(p.avatar_url)}" alt="">`
                        : `<span>${escHtml(getInitials((p.nick_name || p.full_name || p.codename || '').replace(/\s*\(.*$/, '')))}</span>`}</div>
                    <div class="bx-pp-info">
                        <span class="bx-pp-nick">${escHtml(nameOf(p))}</span>
                        ${p.full_name ? `<span class="bx-pp-line2">${escHtml(p.full_name)}</span>` : ''}
                    </div>
                    ${p.department ? `<span class="bx-pp-dept">${escHtml(p.department)}</span>` : ''}
                </label>`).join('')}
        `;
        const selectAllCb = list.querySelector('.bx-pp-select-all-cb');
        selectAllCb.indeterminate = selectedCount > 0 && selectedCount < avail.length;

        selectAllCb.addEventListener('change', e => {
            avail.forEach(p => e.target.checked ? selected.add(p.codename) : selected.delete(p.codename));
            renderList(currentQuery());
            updateFooter();
        });
        list.querySelectorAll('.bx-pp-item:not(.bx-pp-select-all)').forEach(item => {
            item.querySelector('.bx-pp-item-cb').addEventListener('change', e => {
                const codename = item.dataset.codename;
                e.target.checked ? selected.add(codename) : selected.delete(codename);
                renderList(currentQuery());
                updateFooter();
            });
        });
    }

    function currentQuery() {
        return overlay.querySelector('.bx-pp-search').value.trim();
    }

    function updateFooter() {
        const n = selected.size;
        overlay.querySelector('.bx-pp-footer-info').textContent = n === 0
            ? (ctx.noneSelectedText || 'No one selected')
            : (ctx.selectedText ? ctx.selectedText(n) : `${n} selected`);
        overlay.querySelector('.bx-pp-btn-confirm').disabled = n === 0;
    }

    function close() {
        if (!overlay) return;
        // Capture this specific element before clearing the module-level
        // `overlay` binding — a rapid close-then-reopen (within the 250ms
        // fade) would otherwise let this timeout fire AFTER a new overlay
        // has already replaced it, deleting the new one instead of the
        // stale one it was actually meant to clean up.
        const el = overlay;
        overlay = null;
        el.classList.remove('show');
        setTimeout(() => el.remove(), 250);
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
        ctx = null;
    }

    window.openPeoplePicker = function openPeoplePicker(opts) {
        injectStyles();
        if (overlay) overlay.remove();
        ctx = opts;
        selected = new Set();

        overlay = document.createElement('div');
        overlay.className = 'bx-pp-overlay';
        overlay.innerHTML = `
            <div class="bx-pp-modal">
                <div class="bx-pp-header">
                    <div class="bx-pp-title"><i class="bi ${escHtml(opts.icon || 'bi-person-plus-fill')}" style="color:var(--c-accent)"></i> ${escHtml(opts.title || 'Add')}</div>
                    <button type="button" class="bx-pp-close"><i class="bi bi-x"></i></button>
                </div>
                <div class="bx-pp-search-wrap">
                    <i class="bi bi-search bx-pp-search-icon"></i>
                    <input type="text" class="bx-pp-search" placeholder="Search..." autocomplete="off">
                </div>
                <div class="bx-pp-list"></div>
                <div class="bx-pp-footer">
                    <span class="bx-pp-footer-info"></span>
                    <div class="bx-pp-footer-actions">
                        <button type="button" class="bx-pp-btn-cancel">Cancel</button>
                        <button type="button" class="bx-pp-btn-confirm" disabled><i class="bi bi-check-lg me-1"></i> ${escHtml(opts.confirmLabel || 'Add')}</button>
                    </div>
                </div>
            </div>
        `;
        // Appended inside an open Bootstrap modal when one exists — see
        // select-picker.js's openSelectPicker() for the FocusTrap writeup
        // (same issue, same fix).
        (document.querySelector('.modal.show') || document.body).appendChild(overlay);
        if (typeof lockBodyScroll === 'function') lockBodyScroll();

        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        overlay.querySelector('.bx-pp-close').addEventListener('click', close);
        overlay.querySelector('.bx-pp-btn-cancel').addEventListener('click', close);
        overlay.querySelector('.bx-pp-btn-confirm').addEventListener('click', () => {
            const codenames = [...selected];
            close();
            opts.onConfirm(codenames);
        });
        overlay.querySelector('.bx-pp-search').addEventListener('input', e => renderList(e.target.value.trim()));

        renderList('');
        updateFooter();
        requestAnimationFrame(() => overlay.classList.add('show'));
        setTimeout(() => overlay.querySelector('.bx-pp-search').focus(), 100);
    };
})();
