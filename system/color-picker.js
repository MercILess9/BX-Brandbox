// Shared color-picker popover — a 9-hue×6-shade "Presets" swatch grid +
// a fully custom "Custom" section (saturation/value square + hue slider +
// hex input, drawn entirely in CSS/JS), matching the app's own theme
// instead of relying on the OS/browser's native <input type="color">
// picker chrome (that native picker doesn't just look inconsistent with
// the app — it's genuinely un-stylable, since its swatch fill is internal
// UA shadow-DOM content, not something CSS can theme or reliably clip).
// Same self-injecting CSS/markup convention as select-picker.js: no
// static backdrop markup needed on the host page — the panel is created
// fresh in document.body each time and removed on close, and it flips
// above the trigger instead of ever needing an internal scrollbar when
// there isn't room below.
//
// Usage:
//   <div class="cs-cp-swatch" style="background:${color}"
//        onclick="openColorPicker(this, {
//            getValue: () => color,
//            onSelect: (c) => { ...apply the pick... },
//        })"></div>
//
// closeColorPicker() is also exposed for a caller that needs to dismiss it
// from elsewhere (rare — outside-click/scroll already handle the common case).

(function () {
    let injected = false;

    const COLOR_HUES = [
        ['#e2e8f0', '#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155'], // gray
        ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c', '#991b1b'], // red
        ['#fdba74', '#fb923c', '#f97316', '#ea580c', '#c2410c', '#9a3412'], // orange
        ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309', '#92400e'], // amber
        ['#86efac', '#4ade80', '#22c55e', '#16a34a', '#15803d', '#166534'], // green
        ['#5eead4', '#2dd4bf', '#14b8a6', '#0d9488', '#0f766e', '#115e59'], // teal
        ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af'], // blue
        ['#c4b5fd', '#a78bfa', '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6'], // violet
        ['#f9a8d4', '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d']  // pink
    ];
    const COLOR_PALETTE = COLOR_HUES[0].map((_, shadeIdx) => COLOR_HUES.map(hue => hue[shadeIdx])).flat();
    // Exposed (read-only data, not something a caller should ever need to
    // mutate) so any page can also draw from the same palette for e.g.
    // auto-assigning a color to a new item, without keeping its own copy
    // that could drift out of sync with the picker's own grid.
    window.COLOR_HUES = COLOR_HUES;
    window.COLOR_PALETTE = COLOR_PALETTE;

    // ── Color math (hex <-> HSV) — needed to drive the SV square + hue
    // slider from/to the plain hex strings every caller works with. ──
    function hexToHsv(hex) {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
        let h = 0;
        if (d !== 0) {
            if (max === r) h = ((g - b) / d) % 6;
            else if (max === g) h = (b - r) / d + 2;
            else h = (r - g) / d + 4;
            h *= 60;
            if (h < 0) h += 360;
        }
        const s = max === 0 ? 0 : d / max;
        const v = max;
        return { h, s, v };
    }

    function hsvToHex(h, s, v) {
        const c = v * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = v - c;
        let r, g, b;
        if (h < 60) { r = c; g = x; b = 0; }
        else if (h < 120) { r = x; g = c; b = 0; }
        else if (h < 180) { r = 0; g = c; b = x; }
        else if (h < 240) { r = 0; g = x; b = c; }
        else if (h < 300) { r = x; g = 0; b = c; }
        else { r = c; g = 0; b = x; }
        const toHex = n => Math.round((n + m) * 255).toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function injectStyles() {
        if (injected) return;
        injected = true;
        const style = document.createElement('style');
        style.textContent = `
            .cs-cp-panel { position: fixed; z-index: 1200; background: #fff; border: 1px solid #e2e8f0;
                border-radius: 14px; box-shadow: 0 16px 40px rgba(0,0,0,0.16); padding: 12px; box-sizing: border-box; }
            .cs-cp-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin: 2px 2px 6px; }
            .cs-cp-grid { display: grid; grid-template-columns: repeat(9, 1fr); row-gap: 8px; column-gap: 6px; margin-bottom: 12px; }
            .cs-cp-swatch { width: 25px; height: 25px; border-radius: 50%; cursor: pointer; border: 2px solid transparent; }
            .cs-cp-swatch.sel { border-color: var(--c-dark, #1e293b); }

            /* Saturation/Value square — the classic 2-gradient CSS trick:
               a white-to-transparent gradient (left→right = saturation)
               layered over a black-to-transparent gradient (bottom→top =
               value), both sitting on a solid hue-colored background. No
               canvas needed, and it re-colors instantly by just changing
               one CSS custom property (--cs-hue) on drag. */
            .cs-cp-sv { position: relative; width: 100%; height: 130px; border-radius: 10px; cursor: crosshair;
                background:
                    linear-gradient(to top, #000, transparent),
                    linear-gradient(to right, #fff, transparent);
                background-color: hsl(var(--cs-hue, 0), 100%, 50%);
                touch-action: none; user-select: none; }
            .cs-cp-sv-cursor { position: absolute; width: 16px; height: 16px; border-radius: 50%;
                border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.35);
                transform: translate(-50%, -50%); pointer-events: none; }

            .cs-cp-hue { position: relative; width: 100%; height: 14px; border-radius: 7px; margin-top: 10px;
                cursor: pointer; touch-action: none; user-select: none;
                background: linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%); }
            .cs-cp-hue-handle { position: absolute; top: 50%; width: 18px; height: 18px; border-radius: 50%;
                background: #fff; border: 2px solid #fff; box-shadow: 0 0 0 1px rgba(0,0,0,0.25), 0 1px 4px rgba(0,0,0,0.35);
                transform: translate(-50%, -50%); pointer-events: none; }

            .cs-cp-custom-row { display: flex; align-items: center; gap: 8px; margin-top: 10px; }
            .cs-cp-preview { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; border: 1.5px solid #e2e8f0; box-sizing: border-box; }
            .cs-cp-hex { flex: 1; min-width: 0; box-sizing: border-box; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;
                font-size: 0.8rem; font-weight: 700; text-transform: uppercase; outline: none; font-family: inherit;
                text-align: center; letter-spacing: 0.5px; }
            .cs-cp-hex:focus { border-color: var(--c-accent); }
            .cs-cp-hex.invalid { border-color: #ef4444; color: #ef4444; }
            .cs-cp-eyedrop { width: 34px; height: 34px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; flex-shrink: 0; transition: 0.15s; }
            .cs-cp-eyedrop:hover { border-color: var(--c-accent); color: var(--c-accent-dark); background: var(--c-accent-light); }
        `;
        document.head.appendChild(style);
    }

    let panel = null;
    let ctx = null;       // { getValue, onSelect } for whichever picker is open
    let triggerEl = null;
    let hsv = { h: 0, s: 0, v: 0 }; // current picker state, source of truth while dragging

    function apply(c) { ctx.onSelect(c.toLowerCase()); }
    function choose(c) { apply(c); closeColorPicker(); }

    // Re-paints the SV cursor / hue handle / preview swatch from the
    // current `hsv` state — everything except the hex text field, which
    // the hex-input listener deliberately leaves alone while the user is
    // actively typing (overwriting it there would reset their cursor
    // position mid-keystroke). Called on every drag-move tick, so it has
    // to be cheap.
    function paintIndicators() {
        const hex = hsvToHex(hsv.h, hsv.s, hsv.v);
        panel.style.setProperty('--cs-hue', hsv.h);
        panel.querySelector('.cs-cp-sv-cursor').style.left = (hsv.s * 100) + '%';
        panel.querySelector('.cs-cp-sv-cursor').style.top = ((1 - hsv.v) * 100) + '%';
        panel.querySelector('.cs-cp-hue-handle').style.left = (hsv.h / 360 * 100) + '%';
        panel.querySelector('.cs-cp-preview').style.background = hex;
        return hex;
    }

    // Same as paintIndicators(), plus syncing the hex field — used
    // everywhere EXCEPT the hex input's own listener (see above).
    function paintCustom() {
        const hex = paintIndicators();
        const hexInput = panel.querySelector('.cs-cp-hex');
        hexInput.value = hex.toUpperCase();
        hexInput.classList.remove('invalid');
        return hex;
    }

    function setHsvFromHex(hex) {
        hsv = hexToHsv(hex);
    }

    // Generic drag helper — el gets pointerdown/move/up wired so `onMove`
    // fires with a 0..1 fraction along X (and Y, for the 2D square) on
    // every step, including the very first pointerdown (so a single click
    // — not just a drag — still moves the cursor there). Shared by both
    // the SV square and the hue bar.
    function bindDrag(el, onMove) {
        function fractionsFromEvent(e) {
            const rect = el.getBoundingClientRect();
            const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
            const y = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));
            return { x, y };
        }
        function onPointerMove(e) { onMove(fractionsFromEvent(e)); }
        function onPointerUp(e) {
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        }
        el.addEventListener('pointerdown', e => {
            e.preventDefault();
            onMove(fractionsFromEvent(e));
            document.addEventListener('pointermove', onPointerMove);
            document.addEventListener('pointerup', onPointerUp);
        });
    }

    function render() {
        const current = (ctx.getValue() || '#94a3b8').toLowerCase();
        setHsvFromHex(current);
        panel.innerHTML = `
            <div class="cs-cp-label">Presets</div>
            <div class="cs-cp-grid">
                ${COLOR_PALETTE.map(c => `<div class="cs-cp-swatch ${current === c ? 'sel' : ''}" style="background:${c}" data-c="${c}"></div>`).join('')}
            </div>
            <div class="cs-cp-label">Custom</div>
            <div class="cs-cp-sv" id="cs-cp-sv"><div class="cs-cp-sv-cursor"></div></div>
            <div class="cs-cp-hue" id="cs-cp-hue"><div class="cs-cp-hue-handle"></div></div>
            <div class="cs-cp-custom-row">
                <div class="cs-cp-preview"></div>
                <input type="text" class="cs-cp-hex" value="${current.toUpperCase()}" maxlength="7">
                ${'EyeDropper' in window ? `<button type="button" class="cs-cp-eyedrop" title="Pick color from screen"><i class="bi bi-eyedropper"></i></button>` : ''}
            </div>
        `;
        panel.querySelectorAll('.cs-cp-swatch').forEach(el => {
            el.addEventListener('click', () => choose(el.dataset.c));
        });
        paintCustom();

        bindDrag(panel.querySelector('#cs-cp-sv'), ({ x, y }) => {
            hsv.s = x;
            hsv.v = 1 - y;
            apply(paintCustom());
        });
        bindDrag(panel.querySelector('#cs-cp-hue'), ({ x }) => {
            hsv.h = x * 360;
            apply(paintCustom());
        });

        const hex = panel.querySelector('.cs-cp-hex');
        hex.addEventListener('input', () => {
            const v = hex.value;
            const valid = /^#[0-9a-fA-F]{6}$/.test(v);
            hex.classList.toggle('invalid', !valid && v.length > 0);
            if (!valid) return;
            setHsvFromHex(v.toLowerCase());
            paintIndicators();
            apply(v);
        });

        // Native browser API (Chromium-based only — the markup above
        // already feature-detects and skips rendering this button
        // entirely where it's unsupported) — lets the admin sample a
        // color from anywhere on screen (a logo, a reference image, even
        // outside the browser window), not just the gradient square above.
        const eyedrop = panel.querySelector('.cs-cp-eyedrop');
        if (eyedrop) {
            eyedrop.addEventListener('click', async () => {
                try {
                    const result = await new EyeDropper().open();
                    setHsvFromHex(result.sRGBHex);
                    apply(paintCustom());
                } catch {
                    // User pressed Esc / cancelled the pick — not an error.
                }
            });
        }
    }

    function onDocClick(e) {
        if (panel && !panel.contains(e.target) && e.target !== triggerEl) closeColorPicker();
    }
    function onScroll(e) { if (panel && !panel.contains(e.target)) closeColorPicker(); }

    window.closeColorPicker = function closeColorPicker() {
        if (!panel) return;
        panel.remove();
        panel = null;
        ctx = null;
        triggerEl = null;
        document.removeEventListener('click', onDocClick, true);
        document.removeEventListener('scroll', onScroll, true);
        if (typeof unlockBodyScroll === 'function') unlockBodyScroll();
    };

    // 330px is not arbitrary — 9 swatches × 25px + 8 gaps × 6px = 273px
    // minimum just for the grid, + 24px panel padding = 297px floor. A
    // narrower panel can't fit all 9 columns at their explicit width, so
    // the rightmost swatches get pushed past the panel's own right edge
    // instead of shrinking to fit.
    window.openColorPicker = function openColorPicker(trigger, { getValue, onSelect, width = 330 }) {
        injectStyles();
        if (panel) closeColorPicker();
        ctx = { getValue, onSelect };
        triggerEl = trigger;

        panel = document.createElement('div');
        panel.className = 'cs-cp-panel';
        panel.style.width = width + 'px';
        // Appended inside an open Bootstrap modal when one exists — see
        // select-picker.js's openSelectPicker() for the FocusTrap writeup.
        (document.querySelector('.modal.show') || document.body).appendChild(panel);
        render();

        const r = trigger.getBoundingClientRect();
        panel.style.left = r.left + 'px';
        panel.style.top = (r.bottom + 6) + 'px';
        if (r.left + width > window.innerWidth - 12) {
            panel.style.left = Math.max(12, r.right - width) + 'px';
        }
        // Flip above the trigger instead of ever clipping/scrolling — the
        // panel's content height is fixed, so there's always enough room
        // on one side or the other.
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
