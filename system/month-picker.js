// Shared Year + Month picker — currently only does range selection
// ("click a start month, click an end month", the way every modern
// analytics dashboard — Stripe, GA4, Vercel Analytics — does it, instead
// of a flat checkbox list), but named month-picker.js (not
// month-range-picker.js) on purpose: system/date-picker.js is the day-
// level sibling and already does both mode:'range' and mode:'single'
// under one name — this file follows the same convention so a future
// single-month mode here wouldn't need another rename. Self-injecting
// CSS/markup, same convention as multi-select.js/save-bar.js: load this
// file once and call createMonthPicker() wherever a range trigger
// element exists.
//
// Usage:
//   const picker = createMonthPicker({
//       trigger: document.getElementById('wrap-filterRange'), // a .flt-select-box
//       onChange: ({ year, months }) => { ... }, // months: sorted array of '01'..'12' within `year`
//       formatLabel: (year, months) => 'YTD' // optional override, return falsy to use the default "Mar–Sep 2026" text
//   });
//   picker.setValue({ year, months });  // sync programmatically (e.g. a quick-chip click, restoring from session)
//   picker.getValue();                  // { year, months }

(function () {
    let injected = false;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .bx-drp-trigger { cursor: pointer; text-align: center; background: transparent; border: none; font-family: inherit; }
            /* 10001, not 1050 — matches date-picker.js's own panel z-index.
               Not currently used inside a Bootstrap modal (which sits at
               1055) anywhere on the platform, but keeping parity here means
               the next page that DOES put this inside a modal doesn't
               silently inherit the same invisible-behind-modal bug that
               date-picker.js's Publish Date field hit. */
            .bx-drp-panel { position: fixed; z-index: 10001; background: #fff; border-radius: 16px;
                box-shadow: 0 16px 40px rgba(0,0,0,0.16); border: 1px solid #eef2f7; width: 300px;
                overflow: hidden; }
            .bx-drp-year-row { display: flex; align-items: center; justify-content: space-between;
                padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
            .bx-drp-year-btn { border: none; background: var(--c-bg, #f8fafc); color: var(--c-accent-dark);
                width: 30px; height: 30px; border-radius: 50%; font-size: 0.9rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center; transition: 0.15s; }
            .bx-drp-year-btn:hover { background: var(--c-accent-light); }
            .bx-drp-year-btn:disabled { opacity: 0.3; cursor: default; background: transparent; }
            .bx-drp-year-label { font-size: 0.95rem; font-weight: 800; color: var(--c-dark, #1e293b); cursor: pointer;
                border-radius: 8px; padding: 2px 10px; transition: 0.15s; }
            .bx-drp-year-label:hover { background: var(--c-bg, #f8fafc); }
            .bx-drp-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; padding: 14px 16px 16px; }
            .bx-drp-month { border: none; background: var(--c-bg, #f8fafc); color: #334155; border-radius: 10px;
                height: 40px; font-size: 0.8rem; font-weight: 700; cursor: pointer; font-family: inherit;
                transition: 0.15s; }
            .bx-drp-month:hover { background: var(--c-accent-light); }
            .bx-drp-month.in-range { background: var(--c-accent-light); color: var(--c-accent-dark); }
            .bx-drp-month.range-end { background: var(--c-accent-dark); color: #fff; }
            .bx-drp-month.pending { background: var(--c-accent-dark); color: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb, 189,196,50), 0.3); }
            .bx-drp-month.future { opacity: 0.35; }
        `;
        document.head.appendChild(style);
    }

    const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const pad = n => String(n).padStart(2, '0');

    // Presets (YTD/Q1-4) live entirely outside this component — a page
    // that wants them shows its own quick-chip row and calls setValue()
    // to apply one. This picker only ever does Year stepper + month-range
    // clicking.
    window.createMonthPicker = function ({ trigger, onChange, formatLabel = null, isDefault = null, minYear = 2024, label = 'Date' }) {
        injectStyles();
        let year = new Date().getFullYear();
        let months = new Set(); // '01'..'12', within `year`
        let pendingStart = null; // month number (1-12) or null — mid 2-click range selection
        let showYearGrid = false; // clicking the year label swaps the month grid for a year grid, to jump further than ±1 click
        let panel = null;

        trigger.innerHTML = '';
        // Same .flt-select-tag every other filter pill on the page uses
        // (Type/Owner/AM/Lead/...) — without it this was the one pill in
        // the row with no label at all, so "YTD" or "Mar–Sep 2026" read
        // as a value with nothing saying what it's a value OF.
        const tag = document.createElement('span');
        tag.className = 'flt-select-tag';
        tag.textContent = label; // plain text, no icon — matches Type/Owner/AM/Lead's tags exactly
        trigger.appendChild(tag);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'flt-select-input bx-drp-trigger';
        trigger.appendChild(btn);

        function updateLabel() {
            const sorted = [...months].sort();
            const custom = formatLabel ? formatLabel(year, sorted) : null;
            if (custom) {
                btn.textContent = custom;
            } else if (!sorted.length) {
                btn.textContent = 'All'; // matches the neutral default every other filter pill (Type/Owner/AM/Lead...) uses
            } else if (sorted.length === 1) {
                btn.textContent = `${MONTH_LABELS[+sorted[0] - 1]} ${year}`;
            } else {
                btn.textContent = `${MONTH_LABELS[+sorted[0] - 1]}–${MONTH_LABELS[+sorted[sorted.length - 1] - 1]} ${year}`;
            }
            // Unlike other filter pills, this one always holds a value
            // (there's no "no date range" state), so tinting on "has a
            // value" would just stay permanently on. isDefault lets the
            // caller define what counts as the un-narrowed baseline (e.g.
            // "Year-to-Date") — anything else (a quarter, a single custom
            // month) tints, same as Owner/Type/etc. do once narrowed.
            const atDefault = isDefault ? isDefault(year, sorted) : sorted.length === 0;
            trigger.classList.toggle('active-filter', !atDefault);
        }

        function commit() {
            updateLabel();
            onChange({ year, months: [...months].sort() });
        }

        function selectRange(a, b) {
            const lo = Math.min(a, b), hi = Math.max(a, b);
            months = new Set();
            for (let m = lo; m <= hi; m++) months.add(pad(m));
        }

        function onMonthClick(m) {
            if (pendingStart === null) {
                // Fresh click — select just this one month, but stay
                // "armed" so a second click on a different month extends
                // it into a range instead of always resetting to 1 month.
                pendingStart = m;
                months = new Set([pad(m)]);
            } else {
                selectRange(pendingStart, m);
                pendingStart = null;
            }
            renderPanel();
            commit();
        }

        function changeYear(delta) {
            const ny = year + delta;
            if (ny < minYear) return;
            year = ny;
            pendingStart = null;
            renderPanel();
            // Navigating the stepper alone doesn't change the active
            // filter — only picking a month/preset in the newly-shown
            // year does. Browsing years to look around shouldn't itself
            // fire onChange.
        }

        function toggleYearGrid() {
            showYearGrid = !showYearGrid;
            renderPanel();
        }

        function onYearGridClick(y) {
            year = y;
            showYearGrid = false;
            pendingStart = null;
            renderPanel();
            // Same as changeYear — picking a year alone doesn't fire
            // onChange, only a month/range click inside it does.
        }

        function renderPanel() {
            if (!panel) return;
            const curYear = new Date().getFullYear();
            const curMonth = new Date().getMonth() + 1;

            panel.querySelector('.bx-drp-year-label').textContent = showYearGrid ? 'Select Year' : year;
            panel.querySelector('.bx-drp-year-prev').disabled = showYearGrid || year <= minYear;
            panel.querySelector('.bx-drp-year-next').disabled = showYearGrid || year >= curYear;

            const sorted = [...months].sort();
            const gridEl = panel.querySelector('.bx-drp-grid');

            if (showYearGrid) {
                const years = [];
                for (let y = curYear; y >= minYear; y--) years.push(y);
                gridEl.className = 'bx-drp-grid bx-drp-grid-years';
                gridEl.innerHTML = years.map(y =>
                    `<button type="button" class="bx-drp-month${y === year ? ' range-end' : ''}" data-y="${y}">${y}</button>`
                ).join('');
                gridEl.querySelectorAll('[data-y]').forEach(b => b.addEventListener('click', () => onYearGridClick(+b.dataset.y)));
                return;
            }

            gridEl.className = 'bx-drp-grid';
            gridEl.innerHTML = MONTH_LABELS.map((label, i) => {
                const m = i + 1;
                const mm = pad(m);
                const isFuture = year === curYear && m > curMonth;
                const isPending = pendingStart === m;
                const isSelected = months.has(mm);
                const cls = ['bx-drp-month'];
                if (isFuture) cls.push('future');
                if (isPending) cls.push('pending');
                else if (isSelected) cls.push(sorted.length > 1 && (mm === sorted[0] || mm === sorted[sorted.length - 1]) ? 'range-end' : 'in-range');
                return `<button type="button" class="${cls.join(' ')}" data-m="${m}">${label}</button>`;
            }).join('');
            gridEl.querySelectorAll('.bx-drp-month').forEach(b => b.addEventListener('click', () => onMonthClick(+b.dataset.m)));
        }

        function onDocClick(e) { if (panel && !panel.contains(e.target) && e.target !== btn) close(); }
        function onScroll(e) { if (panel && !panel.contains(e.target)) close(); }

        function close() {
            if (!panel) return;
            panel.remove();
            panel = null;
            pendingStart = null;
            showYearGrid = false;
            document.removeEventListener('click', onDocClick, true);
            document.removeEventListener('scroll', onScroll, true);
            if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
        }

        function open() {
            if (panel) return;
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            panel = document.createElement('div');
            panel.className = 'bx-drp-panel';
            panel.innerHTML = `
                <div class="bx-drp-year-row">
                    <button type="button" class="bx-drp-year-btn bx-drp-year-prev"><i class="bi bi-chevron-left"></i></button>
                    <span class="bx-drp-year-label"></span>
                    <button type="button" class="bx-drp-year-btn bx-drp-year-next"><i class="bi bi-chevron-right"></i></button>
                </div>
                <div class="bx-drp-grid"></div>
            `;
            // Appended inside an open Bootstrap modal when one exists —
            // see select-picker.js's openSelectPicker() for the FocusTrap
            // writeup (same issue, same fix).
            (document.querySelector('.modal.show') || document.body).appendChild(panel);
            const r = trigger.getBoundingClientRect();
            panel.style.left = r.left + 'px';
            panel.style.top = (r.bottom + 6) + 'px';
            if (r.left + 300 > window.innerWidth - 12) panel.style.left = Math.max(12, r.right - 300) + 'px';

            panel.querySelector('.bx-drp-year-prev').addEventListener('click', () => changeYear(-1));
            panel.querySelector('.bx-drp-year-next').addEventListener('click', () => changeYear(1));
            panel.querySelector('.bx-drp-year-label').addEventListener('click', toggleYearGrid);
            renderPanel();

            const panelRect = panel.getBoundingClientRect();
            if (panelRect.bottom > window.innerHeight - 12) {
                panel.style.top = Math.max(12, r.top - panelRect.height - 6) + 'px';
            }
            setTimeout(() => {
                document.addEventListener('click', onDocClick, true);
                document.addEventListener('scroll', onScroll, true);
            }, 0);
        }

        btn.addEventListener('click', () => { panel ? close() : open(); });
        updateLabel();

        return {
            getValue() { return { year, months: [...months].sort() }; },
            setValue({ year: y, months: m }) {
                if (y != null) year = y;
                months = new Set(m || []);
                pendingStart = null;
                updateLabel();
                renderPanel();
            }
        };
    };
})();
