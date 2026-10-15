// Shared multi-select filter dropdown — turns a .flt-select-box (normally
// wrapping a plain <select>) into a checkbox popover, so a filter can have
// more than one value selected at once. Injects its own markup + styles on
// first use, same convention as save-bar.js, so any page/project can use
// it by just loading this script — no HTML/CSS duplication per project.
//
// Usage:
//   const ownerFilter = createMultiSelect({
//       trigger: document.getElementById('wrap-filterOwner'), // the .flt-select-box element
//       label: 'Owner',
//       getOptions: () => ownerList.map(o => ({ value: o, label: o })), // called live each time the panel opens
//       onChange: (values) => { ... },  // values: array of selected option values, fires live per click
//       onClose: () => { ... },         // optional — fires once when the panel closes, not per click
//       showTag: true, // false = no "Owner" tag baked into the pill, for callers with their own external label
//       selectedLabel: 'selected' // optional — the trailing word in "N {selectedLabel}" (e.g. 'years', 'items')
//   });
//   ownerFilter.getValues();      // current selection
//   ownerFilter.setValues([...]); // set programmatically (e.g. restoring state)
//   ownerFilter.clear();          // reset to empty, no onChange fired

(function () {
    let injected = false;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .bx-ms-trigger { cursor: pointer; text-align: center; background: transparent; border: none; }
            /* position:fixed + appended to <body>, not the trigger — the
               trigger lives inside .flt-select-box which has its own
               overflow:hidden (for the rounded-pill clip), so a panel
               parented there would be invisibly clipped the moment it
               extends past the pill's own bounds. */
            .bx-ms-panel { position: fixed; z-index: 1050; background: #fff;
                border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.16); border: 1px solid #eef2f7;
                width: 240px; max-height: min(360px, calc(100vh - 24px)); display: flex; flex-direction: column; overflow: hidden; }
            .bx-ms-search-wrap { padding: 10px; border-bottom: 1px solid #f1f5f9; position: relative; flex-shrink: 0; }
            .bx-ms-search { width: 100%; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 10px;
                padding: 7px 10px 7px 30px; font-size: 0.78rem; outline: none; font-family: inherit;
                background: #f8fafc; transition: 0.2s; }
            .bx-ms-search:focus { border-color: var(--c-accent); background: #fff; }
            .bx-ms-search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%);
                color: #94a3b8; font-size: 0.75rem; pointer-events: none; }
            /* min-height:0 is the fix — a flex item with flex:1 otherwise
               refuses to shrink below its content's natural height, so a
               long list just grew the whole panel past its max-height
               instead of scrolling internally (the panel's own
               overflow:hidden then silently clipped the tail instead of
               the list ever getting its own scrollbar). */
            .bx-ms-list { overflow-y: auto; padding: 6px; flex: 1; min-height: 0; }
            .bx-ms-group { font-size: 0.62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase;
                letter-spacing: 0.5px; padding: 8px 8px 4px; }
            .bx-ms-group:first-child { padding-top: 2px; }
            .bx-ms-item { display: flex; align-items: center; gap: 8px; padding: 7px 8px; border-radius: 8px;
                cursor: pointer; font-size: 0.8rem; color: #334155; transition: background 0.12s; }
            .bx-ms-item:hover { background: var(--c-accent-light); }
            .bx-ms-empty { padding: 20px; text-align: center; color: #94a3b8; font-size: 0.78rem; }
            .bx-ms-footer { padding: 8px 10px; border-top: 1px solid #f1f5f9; display: flex; justify-content: space-between; flex-shrink: 0; }
            .bx-ms-clear, .bx-ms-selectall { background: none; border: none; color: #94a3b8; font-size: 0.72rem; font-weight: 700;
                cursor: pointer; padding: 4px 6px; transition: color 0.15s; font-family: inherit; }
            .bx-ms-clear:hover { color: #ef4444; }
            .bx-ms-selectall:hover { color: var(--c-accent-dark); }
        `;
        document.head.appendChild(style);
    }

    function escHtml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    window.createMultiSelect = function ({ trigger, label, getOptions, onChange, onClose = null, width = 240, showTag = true, formatLabel = null, selectedLabel = 'selected' }) {
        injectStyles();
        let values = new Set();
        let panel = null;

        trigger.innerHTML = '';
        // showTag:false — for callers that already show the field name as a
        // separate label next to the box (e.g. b-quest-settings.html's
        // Default Filters rows), so the tag isn't shown twice.
        if (showTag) {
            const tag = document.createElement('span');
            tag.className = 'flt-select-tag';
            tag.textContent = label;
            trigger.appendChild(tag);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flt-select-input bx-ms-trigger';
        btn.textContent = 'All';
        trigger.appendChild(btn);

        function updateLabel() {
            const opts = getOptions();
            const arr = [...values];
            // formatLabel — for a caller whose "N selected" doesn't mean
            // anything useful on its own (e.g. a combined Year+Month picker
            // where the interesting summary is "YTD" or "Q2", not "5
            // selected") — falls back to the default text below if it
            // returns a falsy value, so a caller can defer to specific
            // cases only.
            const custom = formatLabel ? formatLabel(arr, opts) : null;
            if (custom) btn.textContent = custom;
            else if (arr.length === 0) btn.textContent = 'All';
            else if (arr.length === 1) {
                const o = opts.find(o => o.value === arr[0]);
                btn.textContent = o ? o.label : arr[0];
            } else {
                btn.textContent = `${arr.length} ${selectedLabel}`;
            }
            trigger.classList.toggle('active-filter', arr.length > 0);
        }

        function onDocClick(e) {
            if (panel && !panel.contains(e.target) && e.target !== btn) close();
        }

        // Fixed-position popovers don't track their trigger during scroll —
        // simplest correct behavior is to just close instead of drifting
        // out of alignment. Scrolling the checkbox list itself also fires
        // a (non-bubbling, but still capture-visible) scroll event though,
        // so it must be excluded or the panel would close on every scroll
        // of its own content.
        function onScroll(e) { if (!panel.contains(e.target)) close(); }

        function close() {
            if (!panel) return;
            panel.remove();
            panel = null;
            document.removeEventListener('click', onDocClick, true);
            document.removeEventListener('scroll', onScroll, true);
            if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            // Fires from a document click/scroll handler or the trigger's
            // own click — never from inside a checkbox's own 'change'
            // handler — so a caller that only wants to react once the user
            // is done (e.g. re-rendering something expensive just once,
            // not per click) can do that here safely.
            if (onClose) onClose();
        }

        // Visible = whatever the search box currently narrows the list to
        // (everything, if the search is empty) — Select All/Deselect All
        // and its own label both work against this set, not the full
        // unfiltered option list, so "search then Select All" only selects
        // what's actually showing.
        function visibleOptions(filterText) {
            const fl = filterText.toLowerCase();
            return getOptions().filter(o => o.label.toLowerCase().includes(fl));
        }

        // The footer button doubles as its own state indicator — "Select
        // All" when the visible set isn't fully selected yet, "Deselect
        // All" once it is — same toggle-by-current-state convention as a
        // header checkbox in a table, just as text instead of a tri-state
        // box.
        function updateSelectAllToggle(filterText) {
            const btn = panel.querySelector('.bx-ms-selectall');
            const vis = visibleOptions(filterText);
            const allSelected = vis.length > 0 && vis.every(o => values.has(o.value));
            btn.textContent = allSelected ? 'Deselect All' : 'Select All';
        }

        function renderList(filterText = '') {
            // options may optionally carry a `group` field (e.g. Work/Assign
            // grouped by Role) — a plain flat list just never sets it.
            const list = panel.querySelector('.bx-ms-list');
            list.innerHTML = '';
            const matches = visibleOptions(filterText);
            updateSelectAllToggle(filterText);
            if (!matches.length) {
                list.innerHTML = `<div class="bx-ms-empty">No matches</div>`;
                return;
            }
            let lastGroup;
            matches.forEach(o => {
                if (o.group !== lastGroup) {
                    lastGroup = o.group;
                    if (o.group) {
                        const gh = document.createElement('div');
                        gh.className = 'bx-ms-group';
                        gh.textContent = o.group;
                        list.appendChild(gh);
                    }
                }
                const item = document.createElement('label');
                item.className = 'bx-ms-item';
                item.innerHTML = `<input type="checkbox" class="modern-checkbox" ${values.has(o.value) ? 'checked' : ''}> ${escHtml(o.label)}`;
                item.querySelector('input').addEventListener('change', e => {
                    if (e.target.checked) values.add(o.value); else values.delete(o.value);
                    updateLabel();
                    updateSelectAllToggle(filterText);
                    onChange([...values]);
                });
                list.appendChild(item);
            });
        }

        function open() {
            if (panel) return;
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            panel = document.createElement('div');
            panel.className = 'bx-ms-panel';
            panel.innerHTML = `
                <div class="bx-ms-search-wrap">
                    <i class="bi bi-search bx-ms-search-icon"></i>
                    <input type="text" class="bx-ms-search" placeholder="Search...">
                </div>
                <div class="bx-ms-list"></div>
                <div class="bx-ms-footer">
                    <button type="button" class="bx-ms-selectall">Select All</button>
                    <button type="button" class="bx-ms-clear">Clear</button>
                </div>
            `;
            panel.style.width = width + 'px';
            // Appended inside an open Bootstrap modal when one exists —
            // see select-picker.js's openSelectPicker() for the FocusTrap
            // writeup (same issue, same fix).
            (document.querySelector('.modal.show') || document.body).appendChild(panel);
            const r = trigger.getBoundingClientRect();
            panel.style.left = r.left + 'px';
            panel.style.top = (r.bottom + 6) + 'px';
            // Flip to the left edge of the trigger if the panel would
            // otherwise overflow the right edge of the viewport.
            if (r.left + width > window.innerWidth - 12) {
                panel.style.left = Math.max(12, r.right - width) + 'px';
            }
            renderList();
            // Flip above the trigger if a full-height panel (a long list)
            // would otherwise run off the bottom of the viewport.
            const panelRect = panel.getBoundingClientRect();
            if (panelRect.bottom > window.innerHeight - 12) {
                panel.style.top = Math.max(12, r.top - panelRect.height - 6) + 'px';
            }
            panel.querySelector('.bx-ms-search').addEventListener('input', e => renderList(e.target.value));
            panel.querySelector('.bx-ms-clear').addEventListener('click', () => {
                values.clear();
                updateLabel();
                onChange([]);
                renderList(panel.querySelector('.bx-ms-search').value);
            });
            // Toggles based on its own current label — Select All when the
            // visible set isn't fully checked yet, Deselect All once it is
            // (see updateSelectAllToggle) — scoped to the search-filtered
            // set either way, same as Select All alone was.
            panel.querySelector('.bx-ms-selectall').addEventListener('click', () => {
                const searchVal = panel.querySelector('.bx-ms-search').value;
                const vis = visibleOptions(searchVal);
                const allSelected = vis.length > 0 && vis.every(o => values.has(o.value));
                vis.forEach(o => allSelected ? values.delete(o.value) : values.add(o.value));
                updateLabel();
                onChange([...values]);
                renderList(searchVal);
            });
            // Deferred so the click that opened the panel doesn't
            // immediately bubble into this same-tick listener and close it.
            setTimeout(() => {
                document.addEventListener('click', onDocClick, true);
                document.addEventListener('scroll', onScroll, true);
            }, 0);
        }

        btn.addEventListener('click', () => { panel ? close() : open(); });
        updateLabel();

        return {
            getValues: () => [...values],
            // Re-renders the open panel's checkboxes too, not just the
            // trigger label — several callers prune stale values this way
            // (e.g. b-quest-list.html dropping a filter value that no
            // longer exists after a Settings change), and without this the
            // panel's checkbox DOM would silently diverge from the Set if
            // it happened to be open when that runs.
            setValues(v) {
                values = new Set(v || []);
                updateLabel();
                if (panel) renderList(panel.querySelector('.bx-ms-search')?.value || '');
            },
            clear() { values.clear(); updateLabel(); }
        };
    };
})();
