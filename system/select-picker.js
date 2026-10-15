// Shared single-select dropdown popover — replaces a native <select> (whose
// open popup is drawn by the OS/browser and can't be restyled) with a
// custom search+list panel matching the app's own theme. Same
// self-injecting CSS/markup convention as multi-select.js, so any
// page/project gets it by just loading this script.
//
// Unlike createMultiSelect() (one long-lived instance per filter dropdown,
// set up once), this is called FRESH from the trigger's own onclick each
// time it's opened — the right shape when triggers live inside rows/cards
// that get torn down and rebuilt via innerHTML on every re-render (a
// long-lived closure holding a reference to one specific trigger element
// would go stale the moment that element is replaced). The caller supplies
// getOptions()/getValue()/onSelect() fresh at open() time instead.
//
// Usage:
//   <button onclick="openSelectPicker(this, {
//       getOptions: () => list.map(x => ({ value: x.id, label: x.name })),
//       getValue:   () => currentValue,
//       onSelect:   (value) => { ...apply the pick... },
//   })">Select...</button>
//
// closeSelectPicker() is also exposed, for a caller that needs to dismiss
// the panel from elsewhere (rare — outside-click/scroll already handle the
// common case automatically).

(function () {
    let injected = false;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .bx-sp-panel { position: fixed; z-index: 1200; background: #fff;
                border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.16); border: 1px solid #e2e8f0;
                width: 220px; max-height: min(320px, calc(100vh - 24px)); display: flex; flex-direction: column; overflow: hidden; }
            .bx-sp-search-wrap { padding: 10px; border-bottom: 1px solid #f1f5f9; position: relative; flex-shrink: 0; }
            .bx-sp-search { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 10px;
                padding: 7px 10px 7px 30px; font-size: 0.78rem; outline: none; font-family: inherit;
                background: #f8fafc; transition: 0.2s; }
            .bx-sp-search:focus { border-color: var(--c-accent); background: #fff; }
            .bx-sp-search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
                color: #94a3b8; font-size: 0.75rem; pointer-events: none; }
            .bx-sp-list { overflow-y: auto; padding: 6px; flex: 1; min-height: 0; }
            .bx-sp-item { display: flex; align-items: center; gap: 8px; padding: 7px 10px; border-radius: 8px;
                cursor: pointer; font-size: 0.8rem; color: #334155; transition: background 0.12s; }
            .bx-sp-item:hover { background: var(--c-accent-light); }
            .bx-sp-item.selected { font-weight: 700; color: var(--c-accent-dark); background: var(--c-accent-light); }
            .bx-sp-check { width: 14px; flex-shrink: 0; color: var(--c-accent-dark); }
            .bx-sp-empty { padding: 20px; text-align: center; color: #94a3b8; font-size: 0.78rem; }
            .bx-sp-trigger-open { border-color: var(--c-accent) !important; background: #fff !important;
                box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
        `;
        document.head.appendChild(style);
    }

    function escHtml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    let panel = null;
    let ctx = null;       // { getOptions, getValue, onSelect } for whichever picker is open
    let triggerEl = null; // the button that opened the current panel

    function visibleOptions(filterText) {
        const fl = filterText.toLowerCase();
        return ctx.getOptions().filter(o => o.label.toLowerCase().includes(fl));
    }

    function renderList(filterText = '') {
        const list = panel.querySelector('.bx-sp-list');
        const matches = visibleOptions(filterText);
        if (!matches.length) { list.innerHTML = '<div class="bx-sp-empty">No matches</div>'; return; }
        const current = ctx.getValue();
        list.innerHTML = matches.map(o => {
            const isSel = o.value === current;
            return `
            <div class="bx-sp-item ${isSel ? 'selected' : ''}" data-value="${escHtml(o.value)}">
                <i class="bi bi-check bx-sp-check" style="visibility:${isSel ? 'visible' : 'hidden'}"></i>
                <span>${escHtml(o.label)}</span>
            </div>`;
        }).join('');
        list.querySelectorAll('.bx-sp-item').forEach((item, i) => {
            item.addEventListener('click', () => choose(matches[i].value));
        });
    }

    function choose(value) {
        const onSelect = ctx.onSelect;
        closeSelectPicker();
        onSelect(value);
    }

    function onDocClick(e) {
        if (panel && !panel.contains(e.target) && e.target !== triggerEl) closeSelectPicker();
    }
    // Fixed-position popovers don't track their trigger during scroll —
    // closing instead of drifting out of alignment, same rule
    // createMultiSelect() uses. Excludes scrolling the panel's own list.
    function onScroll(e) { if (panel && !panel.contains(e.target)) closeSelectPicker(); }

    window.closeSelectPicker = function closeSelectPicker() {
        if (!panel) return;
        triggerEl?.classList.remove('bx-sp-trigger-open');
        panel.remove();
        panel = null;
        ctx = null;
        triggerEl = null;
        document.removeEventListener('click', onDocClick, true);
        document.removeEventListener('scroll', onScroll, true);
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    };

    window.openSelectPicker = function openSelectPicker(trigger, { getOptions, getValue, onSelect, width = 220 }) {
        injectStyles();
        if (panel) closeSelectPicker();
        ctx = { getOptions, getValue, onSelect };
        triggerEl = trigger;
        trigger.classList.add('bx-sp-trigger-open');

        panel = document.createElement('div');
        panel.className = 'bx-sp-panel';
        panel.style.width = width + 'px';
        panel.innerHTML = `
            <div class="bx-sp-search-wrap">
                <i class="bi bi-search bx-sp-search-icon"></i>
                <input type="text" class="bx-sp-search" placeholder="Search...">
            </div>
            <div class="bx-sp-list"></div>
        `;
        // Bootstrap 5's modal FocusTrap forces focus back inside the modal
        // the instant a focusin fires on anything outside it — a panel
        // appended to document.body sits outside that boundary, so its
        // search input could be clicked but never actually hold focus
        // (every keystroke's focus got yanked straight back), making it
        // impossible to type into whenever this opens from inside an open
        // Bootstrap modal (e.g. the B-Quest task modal's Type/Work
        // pickers). position:fixed still renders relative to the
        // viewport regardless of DOM ancestor, so appending inside the
        // open modal instead costs nothing visually.
        (document.querySelector('.modal.show') || document.body).appendChild(panel);

        const r = trigger.getBoundingClientRect();
        panel.style.left = r.left + 'px';
        panel.style.top = (r.bottom + 4) + 'px';
        if (r.left + width > window.innerWidth - 12) {
            panel.style.left = Math.max(12, r.right - width) + 'px';
        }
        renderList();
        // Flip above the trigger if a full-height panel would otherwise
        // run off the bottom of the viewport.
        const panelRect = panel.getBoundingClientRect();
        if (panelRect.bottom > window.innerHeight - 12) {
            panel.style.top = Math.max(12, r.top - panelRect.height - 4) + 'px';
        }

        panel.querySelector('.bx-sp-search').addEventListener('input', e => renderList(e.target.value));
        if (typeof lockBodyScroll === 'function') lockBodyScroll();
        // Deferred so the click that opened the panel doesn't immediately
        // bubble into this same-tick listener and close it right away.
        setTimeout(() => {
            document.addEventListener('click', onDocClick, true);
            document.addEventListener('scroll', onScroll, true);
        }, 0);
        setTimeout(() => panel.querySelector('.bx-sp-search').focus(), 100);
    };
})();
