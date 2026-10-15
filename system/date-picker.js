// Shared day-level calendar picker — replaces native <input type="date">
// with a popover calendar, same self-injecting CSS/markup convention as
// multi-select.js/save-bar.js/month-picker.js. month-picker.js
// (year + whole-month selection, for reporting periods) is a different
// tool for a different job — this one is for picking actual calendar days.
// Two entry points share one calendar-popup shell:
//
//   createDatePicker({ trigger, mode, label, onChange })
//     Owns `trigger`'s content, building its own button — for a filter
//     pill (mode:'range', a List page's Deadline filter) or a bare
//     click-only value (mode:'single').
//       const picker = createDatePicker({
//           trigger: document.getElementById('wrap-filterDeadline'), // a .flt-select-box
//           mode: 'range', label: 'Deadline',
//           onChange: ({ start, end }) => { ... } // 'YYYY-MM-DD' strings or null
//       });
//       picker.setValue({ start, end });
//       picker.getValue(); // { start, end }
//
//   attachDatePicker(inputEl, { onChange })
//     Enhances an EXISTING <input type="text"> in place (keeps its name/
//     id/required/pattern — form submission, fillFormData-style generic
//     `.value` reads, and native validation all keep working unchanged)
//     — adds a calendar-icon button beside it that opens the same
//     popover; picking a day writes 'YYYY-MM-DD' into the input. Typing
//     directly into the field still works, expected format YYYY-MM-DD
//     (matches what gets written on click and what the DB column wants,
//     so there's no separate display-vs-stored-value formats to keep in
//     sync). Used for single-date fields inside modal forms, e.g.
//     Publish Date in b-quest-modal.js.
//       attachDatePicker(document.getElementById('b-quest-modal-publish-date'));

(function () {
    let injected = false;

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .bx-dtp-trigger { cursor: pointer; text-align: center; background: transparent; border: none; font-family: inherit; }
            .bx-dtp-trigger-plain { cursor: pointer; font-family: inherit; background: #fff; border: 1px solid #e2e8f0;
                border-radius: 10px; height: 38px; padding: 0 12px; font-size: 0.85rem; color: #334155; text-align: left; transition: 0.15s; }
            .bx-dtp-trigger-plain:hover { border-color: var(--c-accent); }
            .bx-dtp-field-wrap { position: relative; width: 100%; }
            /* "DD-MM-YYYY" is 10 characters — a host field's usual font-size/
               padding (sized for shorter values) clips it, so both are
               tightened here specifically for this field. */
            .bx-dtp-field-wrap > input { padding-left: 8px !important; padding-right: 28px !important;
                font-size: 0.78rem !important; letter-spacing: 0; text-align: center !important; }
            .bx-dtp-field-icon { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); border: none;
                background: transparent; color: #94a3b8; width: 22px; height: 22px; border-radius: 6px; display: flex;
                align-items: center; justify-content: center; cursor: pointer; transition: 0.15s; padding: 0; font-size: 0.78rem; }
            .bx-dtp-field-icon:hover { background: var(--c-accent-light); color: var(--c-accent-dark); }
            /* 10001, not 1050 — Bootstrap 5's own .modal sits at z-index
               1055, so this must clear it or the panel renders invisibly
               behind an open modal (b-quest-modal.js's Publish Date field
               is exactly that case). Matches this same file's other
               above-modal overlay, .bq-search-overlay (z-index: 10001). */
            .bx-dtp-panel { position: fixed; z-index: 10001; background: #fff; border-radius: 16px;
                box-shadow: 0 16px 40px rgba(0,0,0,0.16); border: 1px solid #eef2f7; width: 280px;
                overflow: hidden; }
            .bx-dtp-nav-row { display: flex; align-items: center; justify-content: space-between;
                padding: 14px 16px; border-bottom: 1px solid #f1f5f9; }
            .bx-dtp-nav-btn { border: none; background: var(--c-bg, #f8fafc); color: var(--c-accent-dark);
                width: 30px; height: 30px; border-radius: 50%; font-size: 0.9rem; cursor: pointer;
                display: flex; align-items: center; justify-content: center; transition: 0.15s; }
            .bx-dtp-nav-btn:hover { background: var(--c-accent-light); }
            .bx-dtp-month-label { font-size: 0.95rem; font-weight: 800; color: var(--c-dark, #1e293b); cursor: pointer;
                border-radius: 8px; padding: 2px 10px; transition: 0.15s; }
            .bx-dtp-month-label:not(.bx-dtp-label-top):hover { background: var(--c-bg, #f8fafc); }
            .bx-dtp-month-label.bx-dtp-label-top { cursor: default; }
            .bx-dtp-weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
                padding: 10px 12px 0; text-align: center; font-size: 0.68rem; font-weight: 700;
                color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
            .bx-dtp-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; padding: 6px 12px 14px; }
            /* Month/Year drill-up grids — 4 columns of bigger cells instead
               of the day grid's 7, same convention as month-picker.js's own
               year-jump grid. */
            .bx-dtp-grid.bx-dtp-grid-12 { grid-template-columns: repeat(4, 1fr); padding-top: 14px; }
            .bx-dtp-day { border: none; background: transparent; color: #334155; border-radius: 10px;
                height: 34px; font-size: 0.78rem; font-weight: 600; cursor: pointer; font-family: inherit;
                transition: 0.15s; position: relative; }
            .bx-dtp-day:hover:not(:disabled) { background: var(--c-accent-light); }
            .bx-dtp-day:disabled { visibility: hidden; cursor: default; }
            .bx-dtp-day.today::after { content: ''; position: absolute; bottom: 4px; left: 50%; transform: translateX(-50%);
                width: 4px; height: 4px; border-radius: 50%; background: var(--c-accent-dark); }
            .bx-dtp-day.today.range-end::after, .bx-dtp-day.today.pending::after { background: #fff; }
            .bx-dtp-day.in-range { background: var(--c-accent-light); color: var(--c-accent-dark); border-radius: 0; }
            .bx-dtp-day.range-end { background: var(--c-accent-dark); color: #fff; }
            .bx-dtp-day.pending { background: var(--c-accent-dark); color: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb, 189,196,50), 0.3); }
        `;
        document.head.appendChild(style);
    }

    const MONTH_LABELS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const MONTH_SHORT  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const WEEKDAYS = ['S','M','T','W','T','F','S'];
    const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
    const pad = n => String(n).padStart(2, '0');
    const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
    const parse = s => { const [y, m, d] = s.split('-').map(Number); return { y, m: m - 1, d }; };

    function formatDay(dateStr) {
        const { y, m, d } = parse(dateStr);
        return `${d} ${MONTH_SHORT[m]} ${y}`;
    }

    function formatRange(start, end) {
        if (start === end) return formatDay(start);
        const a = parse(start), b = parse(end);
        if (a.y === b.y && a.m === b.m) return `${a.d}–${b.d} ${MONTH_SHORT[a.m]} ${a.y}`;
        if (a.y === b.y) return `${a.d} ${MONTH_SHORT[a.m]} – ${b.d} ${MONTH_SHORT[b.m]} ${a.y}`;
        return `${formatDay(start)} – ${formatDay(end)}`;
    }

    function buildDayCells(y, m) {
        const firstDow = new Date(y, m, 1).getDay();
        const numDays = new Date(y, m + 1, 0).getDate();
        const cells = [];
        for (let i = 0; i < firstDow; i++) cells.push(null);
        for (let d = 1; d <= numDays; d++) cells.push(d);
        while (cells.length % 7 !== 0) cells.push(null);
        return cells;
    }

    // The popover shell (positioning, open/close, outside-click, scroll-
    // lock, month nav) is identical across every use of this file — only
    // "what does a day cell look like" and "what happens on click" differ
    // per caller, supplied via renderGrid. `clickAnchor` is what counts as
    // "inside" for the outside-click check (so clicking the element that
    // opened the popup toggles it instead of the doc-click handler also
    // firing); `positionAnchor` (defaults to clickAnchor) is what the
    // panel visually anchors under — split apart because attachDatePicker
    // wants the panel under the whole input field, but only the small
    // calendar icon (not the text field itself) should count as "inside".
    function createCalendarShell({ clickAnchor, positionAnchor = clickAnchor, renderGrid, panelWidth = 280, onClose }) {
        let panel = null, viewYear, viewMonth;
        // Clicking the header label drills UP a level (day -> month -> year)
        // to jump further than prev/next would let you reasonably click to;
        // picking a cell in month/year view drills back DOWN. 'year' is the
        // top level (its own label isn't further clickable).
        let level = 'day'; // 'day' | 'month' | 'year'
        let yearPageStart; // first year shown in the current 12-year window

        function labelText() {
            if (level === 'year') return `${yearPageStart}–${yearPageStart + 11}`;
            if (level === 'month') return `${viewYear}`;
            return `${MONTH_LABELS[viewMonth]} ${viewYear}`;
        }

        function renderMonthGrid(gridEl) {
            gridEl.innerHTML = MONTH_SHORT.map((label, m) =>
                `<button type="button" class="bx-dtp-day${m === viewMonth ? ' range-end' : ''}" data-m="${m}">${label}</button>`
            ).join('');
            gridEl.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => {
                viewMonth = +b.dataset.m;
                level = 'day';
                refresh();
            }));
        }

        function renderYearGrid(gridEl) {
            const years = Array.from({ length: 12 }, (_, i) => yearPageStart + i);
            gridEl.innerHTML = years.map(y =>
                `<button type="button" class="bx-dtp-day${y === viewYear ? ' range-end' : ''}" data-y="${y}">${y}</button>`
            ).join('');
            gridEl.querySelectorAll('[data-y]').forEach(b => b.addEventListener('click', () => {
                viewYear = +b.dataset.y;
                level = 'month';
                refresh();
            }));
        }

        function refresh() {
            if (!panel) return;
            const labelEl = panel.querySelector('.bx-dtp-month-label');
            labelEl.textContent = labelText();
            labelEl.classList.toggle('bx-dtp-label-top', level === 'year');
            panel.querySelector('.bx-dtp-weekdays').style.display = level === 'day' ? '' : 'none';
            const gridEl = panel.querySelector('.bx-dtp-grid');
            gridEl.classList.toggle('bx-dtp-grid-12', level !== 'day');
            if (level === 'day') renderGrid(gridEl, viewYear, viewMonth);
            else if (level === 'month') renderMonthGrid(gridEl);
            else renderYearGrid(gridEl);
        }

        // Prev/Next steps by whatever unit the current level is browsing —
        // a month at day-level, a year at month-level, a 12-year page at
        // year-level — so they stay useful for jumping around at any depth
        // instead of only within the bottom (day) level.
        function changeStep(delta) {
            if (level === 'day') {
                viewMonth += delta;
                if (viewMonth < 0) { viewMonth = 11; viewYear--; }
                else if (viewMonth > 11) { viewMonth = 0; viewYear++; }
            } else if (level === 'month') {
                viewYear += delta;
            } else {
                yearPageStart += delta * 12;
            }
            refresh();
        }

        function drillUp() {
            if (level === 'day') level = 'month';
            else if (level === 'month') { yearPageStart = viewYear - 5; level = 'year'; }
            refresh();
        }

        function onDocClick(e) {
            if (panel && !panel.contains(e.target) && e.target !== clickAnchor && !clickAnchor.contains(e.target)) close();
        }
        function onScroll(e) { if (panel && !panel.contains(e.target)) close(); }

        function close() {
            if (!panel) return;
            panel.remove();
            panel = null;
            level = 'day'; // always reopen fresh on the day grid, not wherever drilling left off
            document.removeEventListener('click', onDocClick, true);
            document.removeEventListener('scroll', onScroll, true);
            if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
            // Lets a range-mode caller drop a half-finished 2-click
            // selection (clicked a start day, then closed without picking
            // an end) — otherwise it survives silently, and the next day
            // clicked after reopening completes a bogus range against that
            // stale start instead of beginning a fresh single-day pick.
            if (onClose) onClose();
        }

        function open(initialYear, initialMonth) {
            if (panel) return;
            if (typeof lockBodyScroll === 'function') lockBodyScroll();
            viewYear = initialYear; viewMonth = initialMonth;
            level = 'day';

            panel = document.createElement('div');
            panel.className = 'bx-dtp-panel';
            panel.innerHTML = `
                <div class="bx-dtp-nav-row">
                    <button type="button" class="bx-dtp-nav-btn bx-dtp-prev"><i class="bi bi-chevron-left"></i></button>
                    <span class="bx-dtp-month-label"></span>
                    <button type="button" class="bx-dtp-nav-btn bx-dtp-next"><i class="bi bi-chevron-right"></i></button>
                </div>
                <div class="bx-dtp-weekdays">${WEEKDAYS.map(w => `<span>${w}</span>`).join('')}</div>
                <div class="bx-dtp-grid"></div>
            `;
            // Appended inside an open Bootstrap modal when one exists —
            // see select-picker.js's openSelectPicker() for the FocusTrap
            // writeup (same issue, same fix).
            (document.querySelector('.modal.show') || document.body).appendChild(panel);
            const r = positionAnchor.getBoundingClientRect();
            panel.style.left = r.left + 'px';
            panel.style.top = (r.bottom + 6) + 'px';
            if (r.left + panelWidth > window.innerWidth - 12) panel.style.left = Math.max(12, r.right - panelWidth) + 'px';

            panel.querySelector('.bx-dtp-prev').addEventListener('click', () => changeStep(-1));
            panel.querySelector('.bx-dtp-next').addEventListener('click', () => changeStep(1));
            panel.querySelector('.bx-dtp-month-label').addEventListener('click', drillUp);
            refresh();

            const panelRect = panel.getBoundingClientRect();
            if (panelRect.bottom > window.innerHeight - 12) {
                panel.style.top = Math.max(12, r.top - panelRect.height - 6) + 'px';
            }
            setTimeout(() => {
                document.addEventListener('click', onDocClick, true);
                document.addEventListener('scroll', onScroll, true);
            }, 0);
        }

        return {
            open, close, refresh,
            isOpen: () => !!panel,
            toggle(y, m) { panel ? close() : open(y, m); }
        };
    }

    window.createDatePicker = function ({ trigger, mode = 'range', onChange, label = null }) {
        injectStyles();
        const today = new Date();
        const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate());

        let start = null, end = null;    // range mode
        let value = null;                // single mode
        let pendingStart = null;         // range mode's 2-click state

        trigger.innerHTML = '';
        if (label) {
            // Same .flt-select-tag every other filter pill uses (Type/Owner/
            // AM/Lead/...) — only added when the caller wants this trigger to
            // look like a filter pill. A modal field passes no label since
            // its own external <label> already names the input.
            const tag = document.createElement('span');
            tag.className = 'flt-select-tag';
            tag.textContent = label;
            trigger.appendChild(tag);
        }
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = label ? 'flt-select-input bx-dtp-trigger' : 'bx-dtp-trigger-plain';
        trigger.appendChild(btn);

        function updateLabel() {
            if (mode === 'single') {
                btn.textContent = value ? formatDay(value) : 'Select date';
                trigger.classList.toggle('active-filter', !!value);
            } else {
                // start/end can each be set independently — e.g. an admin's
                // Filter Defaults config (b-quest-settings.html) can leave
                // one side open-ended ("last 7 days onward, no upper limit").
                // Interactive clicking never produces this on its own (see
                // onDayClick below), but setValue() can, so handle it.
                if (start && end) btn.textContent = formatRange(start, end);
                else if (start) btn.textContent = `From ${formatDay(start)}`;
                else if (end) btn.textContent = `Until ${formatDay(end)}`;
                else btn.textContent = 'All';
                trigger.classList.toggle('active-filter', !!(start || end));
            }
        }

        function commit() {
            updateLabel();
            onChange(mode === 'single' ? { value } : { start, end });
        }

        function onDayClick(dateStr) {
            if (mode === 'single') {
                value = dateStr;
                shell.refresh();
                commit();
                shell.close();
                return;
            }
            if (pendingStart === null) {
                pendingStart = dateStr;
                start = dateStr; end = dateStr;
            } else {
                const lo = pendingStart < dateStr ? pendingStart : dateStr;
                const hi = pendingStart < dateStr ? dateStr : pendingStart;
                start = lo; end = hi;
                pendingStart = null;
            }
            shell.refresh();
            commit();
        }

        function renderGrid(gridEl, y, m) {
            gridEl.innerHTML = buildDayCells(y, m).map(d => {
                if (d === null) return `<button type="button" class="bx-dtp-day" disabled></button>`;
                const dateStr = toStr(y, m, d);
                const cls = ['bx-dtp-day'];
                if (dateStr === todayStr) cls.push('today');
                if (mode === 'single') {
                    if (dateStr === value) cls.push('range-end');
                } else if (dateStr === pendingStart) {
                    cls.push('pending');
                } else if (dateStr === start || dateStr === end) {
                    cls.push('range-end');
                } else if (start && end && dateStr > start && dateStr < end) {
                    cls.push('in-range');
                }
                return `<button type="button" class="${cls.join(' ')}" data-d="${d}">${d}</button>`;
            }).join('');
            gridEl.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => onDayClick(toStr(y, m, +b.dataset.d))));
        }

        // clickAnchor is the button specifically (not the whole trigger,
        // which also holds the .flt-select-tag label) — matches the
        // outside-click convention every other dropdown on the platform
        // uses (multi-select.js, month-picker.js): clicking a filter
        // pill's label text while its own panel is open counts as
        // "outside" and closes it, same as clicking anywhere else off-panel.
        const shell = createCalendarShell({
            clickAnchor: btn, positionAnchor: trigger, renderGrid,
            onClose: () => { pendingStart = null; }
        });

        btn.addEventListener('click', () => {
            const anchor = mode === 'single' ? value : (start || end);
            const p = anchor ? parse(anchor) : { y: today.getFullYear(), m: today.getMonth() };
            shell.toggle(p.y, p.m);
        });
        updateLabel();

        return {
            getValue() { return mode === 'single' ? { value } : { start, end }; },
            setValue(v) {
                if (mode === 'single') {
                    value = v?.value || null;
                } else {
                    start = v?.start || null;
                    end = v?.end || null;
                }
                pendingStart = null;
                updateLabel();
                if (shell.isOpen()) shell.refresh();
            }
        };
    };

    // Enhances an existing <input> in place — see file header. inputEl
    // keeps its own name/id (so a generic `el(id).value = data[key]` fill
    // loop and FormData submission still find it under the same id/name)
    // but becomes type="hidden", holding the canonical ISO 'YYYY-MM-DD'
    // value the DB column wants. A new VISIBLE text input sits next to it
    // — that's what the user actually types into, masked as DD-MM-YYYY
    // digit-by-digit (no need to type the dashes) as well as clickable via
    // the calendar icon. Kept as two elements rather than one dual-format
    // field because a hidden input is exempt from native constraint
    // validation, so `required` moves onto the visible one — the one the
    // user can actually see turn red — and because letting the display
    // format ALSO be the submitted format risks Postgres misreading an
    // ambiguous DD-MM-YYYY string (the ISO field sidesteps that entirely).
    window.attachDatePicker = function (inputEl, { onChange } = {}) {
        if (!inputEl || inputEl.dataset.bxDtpAttached) return;
        inputEl.dataset.bxDtpAttached = '1';
        injectStyles();

        const wasRequired = inputEl.required;
        const displayClass = inputEl.className || 'bq-input-modern';
        inputEl.type = 'hidden';
        inputEl.required = false;
        inputEl.removeAttribute('pattern');
        inputEl.removeAttribute('placeholder');

        const wrap = document.createElement('div');
        wrap.className = 'bx-dtp-field-wrap';
        inputEl.parentNode.insertBefore(wrap, inputEl);
        wrap.appendChild(inputEl);

        const display = document.createElement('input');
        display.type = 'text';
        display.className = displayClass;
        display.placeholder = 'DD-MM-YYYY';
        display.inputMode = 'numeric';
        display.autocomplete = 'off';
        if (wasRequired) display.required = true;
        // inputEl.value already holds the field's existing saved date (the
        // caller rendered it via the value="..." HTML attribute before this
        // ran) — without this, a field that already has a date would show
        // the underlying hidden input correctly holding it while the
        // visible masked field the user actually sees starts blank, making
        // real saved data look like it never persisted.
        if (ISO_RE.test(inputEl.value)) display.value = formatMask(isoToDigits(inputEl.value));
        wrap.appendChild(display);

        const iconBtn = document.createElement('button');
        iconBtn.type = 'button';
        iconBtn.className = 'bx-dtp-field-icon';
        iconBtn.innerHTML = '<i class="bi bi-calendar3"></i>';
        wrap.appendChild(iconBtn);

        const today = new Date();
        const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate());
        const digitsOf = s => s.replace(/\D/g, '');

        // Dash appears the moment a segment is COMPLETE (2 digits for day,
        // 4 total for day+month), even before the next segment has been
        // started — typing "25" shows "25-" right away, not only once "1"
        // of the month has followed it.
        function formatMask(digits) {
            digits = digits.slice(0, 8);
            let out = digits.slice(0, 2);
            if (digits.length >= 2) out += '-';
            out += digits.slice(2, 4);
            if (digits.length >= 4) out += '-';
            out += digits.slice(4, 8);
            return out;
        }

        // 8 digits -> a real, calendar-valid ISO string, or null — catches
        // both out-of-range fields (month 13) and dates that don't exist
        // (Feb 30) via the Date round-trip.
        function toIso(digits) {
            if (digits.length !== 8) return null;
            const d = +digits.slice(0, 2), m = +digits.slice(2, 4), y = +digits.slice(4, 8);
            const dt = new Date(y, m - 1, d);
            if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
            return toStr(y, m - 1, d);
        }

        function isoToDigits(iso) {
            if (!ISO_RE.test(iso)) return '';
            const { y, m, d } = parse(iso);
            return `${pad(d)}${pad(m + 1)}${y}`;
        }

        function syncFromDigits(digits) {
            const iso = toIso(digits);
            display.setCustomValidity(digits.length === 8 && !iso ? 'Invalid date' : '');
            if ((iso || '') !== inputEl.value) {
                inputEl.value = iso || '';
                inputEl.dispatchEvent(new Event('input', { bubbles: true }));
                inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                if (onChange) onChange(iso);
            }
        }

        // Reformats after every keystroke and restores the caret by digit
        // count (not raw character index) so typing mid-string still lands
        // in the right spot once dashes shift around it.
        function applyMask(digits, digitsBeforeCaret) {
            display.value = formatMask(digits);
            let count = 0, pos = display.value.length;
            for (let i = 0; i < display.value.length; i++) {
                if (/\d/.test(display.value[i])) count++;
                if (count === digitsBeforeCaret) {
                    pos = i + 1;
                    // Just completed a segment and formatMask appended a
                    // dash right after it — land past that dash, not
                    // before it, so the caret's ready for the next segment.
                    if (display.value[i + 1] === '-') pos = i + 2;
                    break;
                }
            }
            display.setSelectionRange(pos, pos);
            syncFromDigits(digits);
        }

        display.addEventListener('keydown', e => {
            // Backspacing onto an auto-inserted dash would otherwise look
            // like it does nothing (the dash just reappears on reformat,
            // since removing a non-digit doesn't change the digit string)
            // — skip past it and remove the digit before it too, so
            // Backspace always deletes something real.
            if (e.key !== 'Backspace' || display.selectionStart !== display.selectionEnd) return;
            const pos = display.selectionStart;
            if (pos > 0 && display.value[pos - 1] === '-') {
                e.preventDefault();
                const before = digitsOf(display.value.slice(0, pos));
                const after = digitsOf(display.value.slice(pos));
                applyMask(before.slice(0, -1) + after, before.length - 1);
            }
        });

        display.addEventListener('input', () => {
            const digitsBeforeCaret = digitsOf(display.value.slice(0, display.selectionStart)).length;
            applyMask(digitsOf(display.value), digitsBeforeCaret);
        });

        function pickDate(dateStr) {
            const digits = isoToDigits(dateStr);
            display.value = formatMask(digits);
            syncFromDigits(digits);
            shell.close();
        }

        function renderGrid(gridEl, y, m) {
            const value = inputEl.value || null;
            gridEl.innerHTML = buildDayCells(y, m).map(d => {
                if (d === null) return `<button type="button" class="bx-dtp-day" disabled></button>`;
                const dateStr = toStr(y, m, d);
                const cls = ['bx-dtp-day'];
                if (dateStr === todayStr) cls.push('today');
                if (dateStr === value) cls.push('range-end');
                return `<button type="button" class="${cls.join(' ')}" data-d="${d}">${d}</button>`;
            }).join('');
            gridEl.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => pickDate(toStr(y, m, +b.dataset.d))));
        }

        // clickAnchor is just the icon (not the whole field) — clicking
        // into the text input to type manually should count as "outside"
        // and close the popup, the same way clicking any other filter's
        // input does; positionAnchor stays the full field so the panel
        // still lines up under the whole box, not just the small icon.
        const shell = createCalendarShell({ clickAnchor: iconBtn, positionAnchor: wrap, renderGrid });

        iconBtn.addEventListener('click', () => {
            const anchor = inputEl.value || null;
            const p = anchor ? parse(anchor) : { y: today.getFullYear(), m: today.getMonth() };
            shell.toggle(p.y, p.m);
        });

        // A native form.reset() already blanks both fields' values on its
        // own (any <input> descendant of the form, hidden or not) — but it
        // doesn't know about setCustomValidity, so a stale "Invalid date"
        // from a half-typed value could otherwise survive a reset and
        // silently block the next, unrelated submit.
        if (inputEl.form) inputEl.form.addEventListener('reset', () => display.setCustomValidity(''));

        return {
            getValue: () => inputEl.value || null,
            setValue(dateStr) {
                const digits = dateStr ? isoToDigits(dateStr) : '';
                display.value = digits ? formatMask(digits) : '';
                inputEl.value = dateStr || '';
                display.setCustomValidity('');
                if (shell.isOpen()) shell.refresh();
            },
            // For a field whose required-ness is toggled at runtime (e.g. a
            // role card's Deadline, only required while that role is
            // switched on) — setting inputEl.required directly would be a
            // no-op, since a hidden input is exempt from constraint
            // validation; this is the one the browser actually checks.
            setRequired(required) { display.required = required; }
        };
    };
})();
