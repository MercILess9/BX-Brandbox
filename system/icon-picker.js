// Shared icon-picker popover — a searchable grid of Bootstrap Icons.
// Same self-injecting CSS/markup convention as color-picker.js: no static
// backdrop markup needed on the host page, the panel is created fresh in
// document.body each time and removed on close, positioned near its
// trigger and flipping above it instead of ever needing an internal
// scrollbar when there isn't room below.
//
// Usage:
//   <div class="cs-icp-swatch" onclick="openIconPicker(this, {
//            getValue: () => icon,
//            onSelect: (ic) => { ...apply the pick... },
//        })"><i class="bi ${icon}"></i></div>
//
// closeIconPicker() is also exposed for a caller that needs to dismiss it
// from elsewhere (rare — outside-click/scroll already handle the common case).

(function () {
    let injected = false;

    // Started from b-quest-settings.html's own (page-local) icon picker's
    // curated list for Roles, plus a few extras so PROJECT_LIST's own
    // hardcoded default icons (bi-rocket-takeoff-fill, bi-person-vcard-fill,
    // bi-wallet2, ...) actually show up selected in this grid — the two
    // lists are NOT kept identical on purpose, this is a superset.
    // b-quest-settings.html isn't touched/migrated to this shared file,
    // to avoid risking its already-working Role/Status/Type pickers.
    const ICON_PALETTE = [
        'bi-0-circle-fill', 'bi-1-circle-fill', 'bi-2-circle-fill', 'bi-3-circle-fill', 'bi-4-circle-fill', 'bi-5-circle-fill', 'bi-6-circle-fill', 'bi-7-circle-fill', 'bi-8-circle-fill', 'bi-9-circle-fill',
        'bi-brush', 'bi-palette-fill', 'bi-palette', 'bi-easel-fill', 'bi-easel', 'bi-vector-pen', 'bi-pen', 'bi-pencil-fill', 'bi-pencil', 'bi-eyedropper', 'bi-image-fill', 'bi-image', 'bi-crop', 'bi-magic', 'bi-stars', 'bi-aspect-ratio-fill', 'bi-aspect-ratio', 'bi-scissors', 'bi-layers-fill', 'bi-grid-3x3-gap-fill', 'bi-columns-gap', 'bi-type', 'bi-fonts', 'bi-droplet-fill', 'bi-brightness-high-fill',
        'bi-camera-fill', 'bi-camera', 'bi-camera-reels-fill', 'bi-camera-reels', 'bi-film', 'bi-play-btn-fill', 'bi-play-btn', 'bi-mic-fill', 'bi-mic', 'bi-soundwave', 'bi-music-note-beamed', 'bi-music-note-list', 'bi-broadcast', 'bi-collection-play-fill', 'bi-collection-play', 'bi-vinyl-fill', 'bi-boombox-fill', 'bi-cast', 'bi-record-circle-fill',
        'bi-code-slash', 'bi-terminal-fill', 'bi-terminal', 'bi-bug-fill', 'bi-bug', 'bi-cpu-fill', 'bi-window', 'bi-hdd-stack-fill', 'bi-diagram-3-fill', 'bi-server', 'bi-database-fill', 'bi-cloud-fill', 'bi-cloud', 'bi-wifi', 'bi-plug-fill', 'bi-robot', 'bi-braces', 'bi-git', 'bi-github',
        'bi-megaphone-fill', 'bi-megaphone', 'bi-badge-ad-fill', 'bi-graph-up-arrow', 'bi-bullseye', 'bi-share-fill', 'bi-send-fill', 'bi-trophy-fill', 'bi-trophy', 'bi-emoji-smile-fill', 'bi-hand-thumbs-up-fill', 'bi-hand-thumbs-up', 'bi-eye-fill', 'bi-eye', 'bi-funnel-fill', 'bi-funnel', 'bi-percent',
        'bi-file-earmark-text-fill', 'bi-file-earmark-text', 'bi-pencil-square', 'bi-journal-richtext', 'bi-chat-square-text-fill', 'bi-chat-square-text', 'bi-book-fill', 'bi-book', 'bi-newspaper', 'bi-blockquote-left', 'bi-list-columns', 'bi-card-text', 'bi-sticky-fill', 'bi-bookmark-fill', 'bi-bookmark',
        'bi-briefcase-fill', 'bi-briefcase', 'bi-person-workspace', 'bi-clipboard-check-fill', 'bi-clipboard-check', 'bi-calculator-fill', 'bi-bank', 'bi-building-fill', 'bi-building', 'bi-cash-stack', 'bi-graph-up', 'bi-wallet-fill', 'bi-credit-card-fill', 'bi-receipt', 'bi-safe-fill', 'bi-folder-fill', 'bi-folder', 'bi-archive-fill', 'bi-archive',
        'bi-people-fill', 'bi-people', 'bi-headset', 'bi-chat-dots-fill', 'bi-envelope-fill', 'bi-envelope', 'bi-telephone-fill', 'bi-globe', 'bi-person-badge-fill', 'bi-person-badge', 'bi-person-fill-check', 'bi-person-fill-gear', 'bi-chat-left-text-fill', 'bi-telephone-forward-fill',
        'bi-rocket', 'bi-rocket-takeoff-fill', 'bi-lightbulb-fill', 'bi-gear-fill', 'bi-gear', 'bi-star-fill', 'bi-star', 'bi-flag-fill', 'bi-flag', 'bi-award-fill', 'bi-award', 'bi-tools', 'bi-puzzle-fill', 'bi-compass-fill', 'bi-compass', 'bi-check-circle-fill', 'bi-check-circle', 'bi-shield-check', 'bi-box-seam-fill', 'bi-box-seam', 'bi-house-fill', 'bi-house', 'bi-map-fill', 'bi-map', 'bi-geo-alt-fill', 'bi-geo-alt', 'bi-clock-fill', 'bi-clock', 'bi-calendar-fill', 'bi-calendar', 'bi-calendar-check-fill', 'bi-calendar-check', 'bi-alarm-fill', 'bi-alarm', 'bi-hourglass-split', 'bi-lock-fill', 'bi-lock', 'bi-unlock-fill', 'bi-unlock', 'bi-key-fill', 'bi-key', 'bi-heart-fill', 'bi-heart', 'bi-hand-index-thumb-fill', 'bi-x-circle-fill', 'bi-x-circle', 'bi-exclamation-triangle-fill', 'bi-exclamation-triangle', 'bi-question-circle-fill', 'bi-question-circle', 'bi-info-circle-fill', 'bi-info-circle', 'bi-plus-circle-fill', 'bi-plus-circle', 'bi-shield-fill', 'bi-shield', 'bi-shield-lock-fill', 'bi-shield-lock', 'bi-truck', 'bi-airplane-fill', 'bi-car-front-fill', 'bi-basket-fill', 'bi-cart-fill', 'bi-bag-fill', 'bi-gift-fill', 'bi-cup-hot-fill', 'bi-umbrella-fill',
        'bi-person-vcard-fill', 'bi-wallet2', 'bi-grid-3x3-gap-fill', 'bi-pie-chart-fill', 'bi-bar-chart-fill', 'bi-kanban-fill', 'bi-list-check', 'bi-ui-checks-grid'
    ];
    window.ICON_PALETTE = ICON_PALETTE;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .cs-icp-panel { position: fixed; z-index: 1200; background: #fff; border: 1px solid #e2e8f0;
                border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.16); padding: 12px; box-sizing: border-box;
                display: flex; flex-direction: column; }
            .cs-icp-search { width: 100%; border: 1px solid #e2e8f0; border-radius: 8px; padding: 7px 10px;
                font-size: 0.8rem; outline: none; font-family: inherit; box-sizing: border-box; margin-bottom: 10px; flex-shrink: 0; }
            .cs-icp-search:focus { border-color: var(--c-accent); }
            .cs-icp-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; overflow-y: auto; }
            .cs-icp-icon { width: 100%; aspect-ratio: 1; border-radius: 9px; border: 1.5px solid transparent;
                display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--c-slate, #626e7f);
                font-size: 1.05rem; transition: 0.15s; }
            .cs-icp-icon:hover { background: var(--c-bg, #f8fafc); color: var(--c-dark, #1e293b); }
            .cs-icp-icon.sel { border-color: var(--c-accent); background: var(--c-accent-light); color: var(--c-accent-dark); }
            .cs-icp-empty { grid-column: 1/-1; text-align: center; color: var(--c-muted, #94a3b8); font-size: 0.78rem; padding: 20px 0; }
        `;
        document.head.appendChild(style);
    }

    let panel = null;
    let ctx = null; // { getValue, onSelect }
    let triggerEl = null;

    function choose(ic) {
        ctx.onSelect(ic);
        closeIconPicker();
    }

    function renderGrid(icons) {
        const grid = panel.querySelector('.cs-icp-grid');
        const current = ctx.getValue();
        grid.innerHTML = icons.length
            ? icons.map(ic => `<div class="cs-icp-icon ${current === ic ? 'sel' : ''}" data-ic="${ic}"><i class="bi ${ic}"></i></div>`).join('')
            : '<div class="cs-icp-empty">No icons found</div>';
        grid.querySelectorAll('.cs-icp-icon').forEach(el => {
            el.addEventListener('click', () => choose(el.dataset.ic));
        });
    }

    function render() {
        panel.innerHTML = `
            <input type="text" class="cs-icp-search" placeholder="Search icons...">
            <div class="cs-icp-grid"></div>
        `;
        renderGrid(ICON_PALETTE);
        const search = panel.querySelector('.cs-icp-search');
        search.addEventListener('input', () => {
            const q = search.value.trim().toLowerCase();
            renderGrid(q ? ICON_PALETTE.filter(ic => ic.includes(q)) : ICON_PALETTE);
        });
        search.focus();
    }

    function onDocClick(e) {
        if (panel && !panel.contains(e.target) && e.target !== triggerEl && !triggerEl?.contains(e.target)) closeIconPicker();
    }
    function onScroll(e) { if (panel && !panel.contains(e.target)) closeIconPicker(); }

    window.closeIconPicker = function closeIconPicker() {
        if (!panel) return;
        panel.remove();
        panel = null;
        ctx = null;
        triggerEl = null;
        document.removeEventListener('click', onDocClick, true);
        document.removeEventListener('scroll', onScroll, true);
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    };

    // 6 columns × ~40px + 5 gaps × 6px + 24px padding ≈ 276px floor —
    // wide enough the grid doesn't need to reflow to fewer columns.
    window.openIconPicker = function openIconPicker(trigger, { getValue, onSelect, width = 280, maxHeight = 260 }) {
        injectStyles();
        if (panel) closeIconPicker();
        ctx = { getValue, onSelect };
        triggerEl = trigger;

        panel = document.createElement('div');
        panel.className = 'cs-icp-panel';
        panel.style.width = width + 'px';
        panel.style.maxHeight = maxHeight + 'px';
        // Appended inside an open Bootstrap modal when one exists —
        // Bootstrap 5's FocusTrap yanks focus back to the modal on any
        // focusin outside it, so a body-appended panel's search input
        // could never actually hold focus from in there. See
        // select-picker.js's openSelectPicker() for the full writeup.
        (document.querySelector('.modal.show') || document.body).appendChild(panel);
        render();

        const r = trigger.getBoundingClientRect();
        panel.style.left = r.left + 'px';
        panel.style.top = (r.bottom + 6) + 'px';
        if (r.left + width > window.innerWidth - 12) {
            panel.style.left = Math.max(12, r.right - width) + 'px';
        }
        const panelRect = panel.getBoundingClientRect();
        if (panelRect.bottom > window.innerHeight - 12) {
            panel.style.top = Math.max(12, r.top - panelRect.height - 6) + 'px';
        }

        if (typeof lockBodyScroll === 'function') lockBodyScroll();
        setTimeout(() => {
            document.addEventListener('click', onDocClick, true);
            document.addEventListener('scroll', onScroll, true);
        }, 0);
    };
})();
