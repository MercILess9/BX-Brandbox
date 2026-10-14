const B_OPP_MODAL_HTML = `
<style>
    /* ── Modal shell ── */
    #b-opp-modal .modal-content { background: #f8fafc; border-radius: 24px; border: none; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.15); display: flex; flex-direction: column; height: calc(100vh - 56px); max-height: calc(100vh - 56px); }
    #bopp-form { flex: 1; min-height: 0; display: flex; flex-direction: column; }
    .bopp-modal-wrap { max-width: 1200px !important; }

    /* ── Header ── */
    .bopp-header { background: var(--c-dark, #1e293b); padding: 15px 28px; display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .bopp-header-left { display: flex; align-items: center; gap: 10px; }
    .bopp-header-bar { width: 4px; height: 22px; background: var(--c-accent); border-radius: 2px; flex-shrink: 0; }
    .bopp-header-icon { color: var(--c-accent); font-size: 1rem; }
    .bopp-header-title { color: #fff; font-size: 0.95rem; font-weight: 800; letter-spacing: 0.2px; }
    .bopp-header-right { display: flex; align-items: center; gap: 12px; }
    .bopp-hdr-totals { display: flex; align-items: center; gap: 14px; margin-right: 4px; }
    .bopp-hdr-remain-zone { display: flex; align-items: center; gap: 14px; }
    .bopp-hdr-tbox { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .bopp-hdr-tval { font-size: 1.05rem; font-weight: 800; color: #fff; }
    .bopp-hdr-tval.gp { color: var(--c-accent); }
    .bopp-hdr-tlbl { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: rgba(255,255,255,0.4); }
    .bopp-hdr-pct-badge { background: var(--c-accent); color: var(--c-on-accent); border-radius: 100px; padding: 5px 10px; font-size: 0.85rem; font-weight: 800; line-height: 1; white-space: nowrap; }
    .bopp-hdr-pct-badge:empty { display: none; }
    .bopp-hdr-lost-zone { display: none; align-items: center; gap: 12px; border: 1px solid rgba(var(--c-churn-rgb, 249,115,22),0.45); border-radius: 10px; padding: 5px 14px; background: rgba(var(--c-churn-rgb, 249,115,22),0.08); margin-right: 6px; }
    .bopp-hdr-lost-zone .bopp-hdr-tval { color: var(--c-churn, #f97316); }
    .bopp-hdr-lost-zone .bopp-hdr-tlbl { color: rgba(255,255,255,0.4); }
    .bopp-hdr-lost-zone .bopp-hdr-tdiv { background: rgba(var(--c-churn-rgb, 249,115,22),0.3); }
    .bopp-hdr-tdiv { width: 1px; height: 26px; background: rgba(255,255,255,0.15); }
    /* Status is driven entirely by JS-set inline colors (updateStatusColor,
       one per status value) rather than a fixed palette, so the picker
       swap keeps that mechanism as-is — it now targets the trigger button
       instead of the (permanently display:none, no validation concern
       here so no opacity trick needed) <select>. */
    .bopp-status-wrap { position: relative; display: inline-flex; }
    .bopp-status-wrap select { display: none; }
    .bopp-status-trigger { appearance: none; -webkit-appearance: none; border: 1.5px solid rgba(255,255,255,0.2); border-radius: 10px; background: rgba(255,255,255,0.08); color: #e2e8f0; font-size: 0.78rem; font-weight: 700; padding: 0 28px 0 12px; height: 34px; cursor: pointer; font-family: inherit; outline: none; transition: background-color 0.2s, border-color 0.2s, color 0.2s, transform 0.15s, filter 0.15s; text-align: center; position: relative; }
    /* Background/color here are set inline per-status by JS (updateStatusColor)
       — hover can't safely override them without fighting that, so it's a
       scale+brightness nudge instead, same trick used for B-Quest's own
       status pill. */
    .bopp-status-trigger:hover { transform: scale(1.04); filter: brightness(0.97); }
    .bopp-status-trigger::after {
        content: ''; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        width: 10px; height: 10px; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%23ffffff' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }



    /* ── Body ── */
    .bopp-body { padding: 18px 28px 12px; flex: 1; min-height: 0; overflow-y: auto; }

    /* ── Section cards ── */
    .bopp-card { background: #fff; border-radius: 16px; border: 1px solid #eef2f7; padding: 15px 18px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .bopp-card-hd { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 11px; display: flex; align-items: center; gap: 6px; }
    .bopp-outer { display: grid; grid-template-columns: 70fr 30fr; gap: 14px; align-items: start; }
    .bopp-outer > .bopp-card { margin-bottom: 0; }
    .bopp-divider { height: 1px; background: #f1f5f9; margin: 12px 0; }
    .bopp-left-card { display: flex; flex-direction: column; }
    .bopp-remark-wrap { flex: 1; display: flex; flex-direction: column; }
    .bopp-remark-wrap .bq-ta { flex: 1; min-height: 80px; }
    .bopp-right-col .bopp-card { border-left: 3px solid var(--c-accent); }
    .bopp-irow { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .bopp-irow:last-child { margin-bottom: 0; }
    .bopp-ilbl { font-size: 0.68rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; width: 112px; flex-shrink: 0; white-space: nowrap; }
    .bopp-iinp { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 10px; font-size: 0.82rem; color: #334155; height: 32px; font-family: inherit; box-sizing: border-box; transition: 0.2s; }
    .bopp-iinp:focus { outline: none; border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    /* Border-only, no glow — a lighter touch than :focus so there's still
       a felt difference between "hovering near it" and "actively editing
       it". Inert on the hidden pickers (opacity:0/pointer-events:none
       never fire :hover); applies to the visible Signed/Launch Date masked
       input, which keeps this same class after attachDatePicker() runs. */
    .bopp-iinp:hover { border-color: var(--c-accent); }
    select.bopp-iinp { text-align: center; text-align-last: center; }
    input[type=date].bopp-iinp { text-align: center; }

    /* Owner/AM/Sub-AM/Lead Source pickers — a native <select> popup can't
       be restyled, so the select stays as the real (required-validated on
       Owner/Lead) form control, kept "rendered" via opacity:0 rather than
       display:none (which the constraint-validation spec excludes from
       validation entirely), and a styled button drives it via
       /system/select-picker.js, the same shared component used elsewhere
       in the app. */
    .bopp-picker-wrap { position: relative; flex: 1; }
    .bopp-picker-wrap .bopp-iinp { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    /* Same text color whether placeholder or filled — dimming the empty
       state read as "disabled" instead of "click to choose". The chevron
       is what signals "this is a dropdown" instead. */
    .bopp-picker-trigger { appearance: none; -webkit-appearance: none; position: relative; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 0 22px 0 10px; font-size: 0.82rem; color: #334155; height: 32px; font-family: inherit; box-sizing: border-box; transition: 0.2s; text-align: center; cursor: pointer; }
    /* Same border+glow recipe as every text input's :focus in this file
       (not a solid fill) — the earlier QT-row solid-fill hover/focus read
       as jarring, so triggers stay consistent with the rest of the form. */
    .bopp-picker-trigger:hover { border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bopp-picker-trigger::after {
        content: ''; position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        width: 9px; height: 9px; opacity: 0.5; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%2394a3b8' d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }
    .was-validated .bopp-picker-wrap:has(.bopp-iinp:invalid) .bopp-picker-trigger { border-color: #dc3545 !important; background: #fff8f8; }

    /* BU/Company QT per-row pickers — same idea, sized to fit inline in
       the QT item table instead of a labeled .bopp-irow. */
    .bopp-item-sel-wrap { position: relative; width: 100%; }
    .bopp-item-sel-wrap select.bopp-item-sel { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    .bopp-item-sel-trigger { appearance: none; -webkit-appearance: none; position: relative; width: 100%; background: transparent; border: 1px solid transparent; font-family: inherit; font-size: 0.78rem; color: #334155; cursor: pointer; text-align: center; padding: 2px 14px 2px 4px; border-radius: 4px; box-sizing: border-box; }
    .bopp-item-sel-trigger::after {
        content: ''; position: absolute; right: 2px; top: 50%; transform: translateY(-50%);
        width: 8px; height: 8px; opacity: 0.45; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%2394a3b8' d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }
    .bopp-item-sel-trigger:hover { border-color: var(--c-accent); background: rgba(var(--c-accent-rgb), 0.08); }
    /* :has() instead of an .is-invalid class of its own — the existing
       validation code adds/removes .is-invalid on the (now hidden)
       <select> itself, unchanged; this just mirrors that state onto the
       visible trigger without needing to touch every call site. */
    .bopp-item-sel-wrap:has(.bopp-item-sel.is-invalid) .bopp-item-sel-trigger { outline: 1px solid #dc3545; background: #fff8f8; border-radius: 4px; }

    .bopp-qt-co-wrap { position: relative; min-width: 140px; }
    .bopp-qt-co-wrap select.bopp-qt-co { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    .bopp-qt-co-trigger { appearance: none; -webkit-appearance: none; position: relative; width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 0 22px 0 10px; height: 30px; font-size: 0.8rem; font-weight: 700; color: var(--c-dark, #1e293b); font-family: inherit; cursor: pointer; text-align: center; }
    .bopp-qt-co-trigger:hover { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bopp-qt-co-trigger::after {
        content: ''; position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        width: 9px; height: 9px; opacity: 0.5; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%2394a3b8' d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }
    .bopp-qt-co-wrap:has(.bopp-qt-co.is-invalid) .bopp-qt-co-trigger { border-color: #dc3545 !important; background: #fff8f8; }

    .bopp-acc-wrap { position: relative; }
    .bopp-acc-wrap::after { content: '❯'; position: absolute; right: 13px; top: 50%; transform: translateY(-50%) rotate(90deg); color: var(--c-accent); font-size: 0.75rem; font-weight: 900; pointer-events: none; }
    #bopp-acc-name { text-align: center; padding-right: 30px; }

    /* Company picker — same hidden-select-drives-a-styled-button idea as
       Owner/AM/Sub-AM/Lead above, but sized like .bq-inp (it sits beside
       Account Name, not in a compact .bopp-irow). Its is-invalid state is
       toggled manually in JS rather than via native :invalid — a disabled
       required field is excluded from constraint validation entirely,
       which is exactly why the existing code already checks it by hand in
       handleSubmit — so it's mirrored via :has() the same way BU/Company QT
       do it, not the :invalid rule the other pickers use. */
    .bopp-company-wrap { position: relative; }
    .bopp-company-wrap #bopp-company-sel { position: absolute; inset: 0; opacity: 0; pointer-events: none; }
    .bopp-company-trigger { appearance: none; -webkit-appearance: none; position: relative; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 28px 5px 12px; font-size: 0.85rem; color: #334155; height: 35px; font-family: inherit; box-sizing: border-box; transition: 0.2s; text-align: center; cursor: pointer; }
    /* :not(.bopp-locked) — otherwise hovering it while an Account isn't
       picked yet would still light up as if it were clickable. Not a real
       disabled attribute — see openBoppPicker's own bopp-locked check for
       why (a genuinely disabled button never fires click at all, which is
       exactly what stops it from being able to shake the Account field). */
    .bopp-company-trigger:not(.bopp-locked):hover { border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bopp-company-trigger::after {
        content: ''; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        width: 9px; height: 9px; opacity: 0.5; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%2394a3b8' d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }
    .bopp-company-trigger.bopp-locked { cursor: not-allowed; opacity: 0.65; }
    .bopp-company-wrap:has(#bopp-company-sel.is-invalid) .bopp-company-trigger { border-color: #dc3545 !important; background: #fff8f8; }

    /* ── Grid ── */
    .bopp-row { display: flex; gap: 12px; margin-bottom: 10px; }
    .bopp-row:last-child { margin-bottom: 0; }
    .bopp-col { flex: 1; min-width: 0; }
    .bopp-col-2 { flex: 2; min-width: 0; }
    .bopp-col-3 { flex: 3; min-width: 0; }

    /* ── Inputs ── */
    .bq-lbl { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
    .bq-inp { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 12px; font-size: 0.85rem; color: #334155; height: 35px; transition: 0.2s; font-family: inherit; box-sizing: border-box; }
    .bq-inp:focus { outline: none; border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bq-inp:hover { border-color: var(--c-accent); }
    .bq-inp[readonly] { cursor: pointer; }
    .bq-ta { height: auto; min-height: 76px; padding: 9px 12px; resize: none; line-height: 1.6; }
    .was-validated .bq-inp:invalid,
    .was-validated .bopp-iinp:invalid,
    .bq-inp.is-invalid { border-color: #dc3545 !important; background: #fff8f8; }
    .bopp-qt-num.is-invalid { border-color: #dc3545 !important; background: #fff8f8; }
    .bopp-qt-co.is-invalid { border-color: #dc3545 !important; background: #fff8f8; }
    .bopp-item-sel.is-invalid { outline: 1px solid #dc3545; background: #fff8f8 !important; border-radius: 4px; }
    .bopp-item-inp.is-invalid { border-color: #dc3545 !important; background: #fff8f8 !important; }
    /* Re-triggering validation on a field that's already red (e.g. hit
       Save twice without fixing it) changes nothing visually — nothing
       draws the eye back to it, easy to miss on a small field. Same
       shake idea as b-finance-list.html's shakeSaveBar(), generalized
       to any invalid field via shakeInvalid() below. */
    @keyframes bopp-shake {
        0%,100% { transform: translateX(0); }
        15%     { transform: translateX(-6px); }
        30%     { transform: translateX(6px); }
        45%     { transform: translateX(-4px); }
        60%     { transform: translateX(4px); }
        75%     { transform: translateX(-2px); }
        90%     { transform: translateX(2px); }
    }
    .bopp-shake { animation: bopp-shake 0.4s ease; }
    .bopp-search-btn { width: 42px; height: 35px; flex-shrink: 0; border: 1px solid var(--c-accent); border-left: none; border-radius: 0 10px 10px 0; background: var(--c-accent-light); color: var(--c-accent-dark); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; transition: 0.2s; }
    .bopp-search-btn:hover { background: var(--c-accent); color: var(--c-on-accent); }

    /* ── QT section ── */
    .bopp-qt-lbl { font-size: 0.62rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 16px; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
    .bopp-qt-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; margin-bottom: 10px; overflow: hidden; border-left: 3px solid var(--c-accent); }
    .bopp-qt-head { background: #f1f5f9; border-bottom: 1px solid #e2e8f0; padding: 9px 14px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .bopp-qt-num { border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 0 10px; height: 30px; font-size: 0.8rem; font-weight: 700; color: var(--c-dark, #1e293b); width: 148px; font-family: inherit; outline: none; transition: 0.2s; flex-shrink: 0; }
    .bopp-qt-num:hover { border-color: var(--c-accent); }
    .bopp-qt-num:focus { border-color: var(--c-accent); box-shadow: 0 0 0 2px rgba(var(--c-accent-rgb), 0.15); }
    .bopp-qt-co { border: 1.5px solid #e2e8f0; border-radius: 8px; background: #fff; padding: 0 10px; height: 30px; font-size: 0.8rem; font-weight: 700; color: var(--c-dark, #1e293b); outline: none; font-family: inherit; cursor: pointer; min-width: 140px; text-align: center; text-align-last: center; }
    .bopp-qt-co:focus { border-color: var(--c-accent); }
    .bopp-qt-totals { margin-left: auto; display: flex; align-items: center; gap: 14px; }
    .bopp-qt-tbox { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .bopp-qt-tval { font-size: 0.88rem; font-weight: 800; color: var(--c-dark, #1e293b); }
    .bopp-qt-tval.gp { color: #16a34a; }
    .bopp-qt-tlbl { font-size: 0.58rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: #94a3b8; }
    .bopp-qt-pct-badge { background: #dcfce7; color: #16a34a; border-radius: 100px; padding: 4px 9px; font-size: 0.78rem; font-weight: 800; line-height: 1; white-space: nowrap; }
    .bopp-qt-pct-badge:empty { display: none; }
    .bopp-qt-tdiv { width: 1px; height: 26px; background: #e2e8f0; }
    .bopp-qt-rm { border: none; background: none; color: #94a3b8; cursor: pointer; padding: 4px 6px; border-radius: 6px; transition: 0.15s; display: flex; align-items: center; flex-shrink: 0; }
    .bopp-qt-rm:hover { background: #fee2e2; color: #ef4444; }

    /* ── Item table ── */
    .bopp-item-wrap { overflow-x: auto; }
    .bopp-item-tbl { width: 100%; border-collapse: collapse; min-width: 820px; font-size: 0.78rem; table-layout: fixed; }
    .bopp-item-tbl th { padding: 7px 10px; text-align: left; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; background: #f1f5f9; border-bottom: 2px solid #e2e8f0; white-space: nowrap; }
    .bopp-item-tbl th.r, .bopp-item-tbl td.r { text-align: right; }
    .bopp-item-tbl th.c, .bopp-item-tbl td.c { text-align: center; }
    .bopp-item-tbl td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
    .bopp-item-tbl tr:last-child td { border-bottom: none; }
    .bopp-item-tbl tbody tr:hover td { background: #f8fafc; }
    .bopp-item-inp { width: 100%; border: 1px solid transparent; background: transparent; font-family: inherit; font-size: 0.78rem; color: #334155; outline: none; padding: 3px 5px; border-radius: 5px; box-sizing: border-box; }
    /* Same recipe as .bq-inp/.bq-ta's own focus (Remark, Materials, etc.)
       instead of a hard inset ring — a real border-color change plus a
       soft, low-opacity OUTER glow reads as gentler than a solid inset
       line. A full lime-green background on focus (the old style) was
       jarring on a wide field like the Detail textarea and fought with
       readability of whatever's already typed, hence border-only. The
       base rule needs a transparent 1px border (not none) so this doesn't
       shift the box size when the real color appears on focus. */
    .bopp-item-inp:hover { border-color: var(--c-accent); }
    .bopp-item-inp:focus { background: #fff; border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bopp-item-disc-inp { color: #ef4444; }
    .bopp-item-disc-inp::placeholder { color: #fca5a5; }
    .bopp-item-inp.r { text-align: right; }
    .bopp-item-inp[type=number] { -moz-appearance: textfield; }
    .bopp-item-inp[type=number]::-webkit-inner-spin-button { display: none; }
    .bopp-item-sel { width: 100%; border: 1px solid transparent; background: transparent; font-family: inherit; font-size: 0.78rem; color: #334155; outline: none; cursor: pointer; text-align: center; text-align-last: center; }
    .bopp-item-sel:focus { background: #fff; border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bopp-item-ta { height: auto; min-height: calc(3 * 1.5em + 10px); max-height: calc(3 * 1.5em + 10px); overflow-y: auto; resize: none; vertical-align: top; padding-top: 5px; }
    .bopp-item-amt { font-size: 0.78rem; font-weight: 700; color: var(--c-dark, #1e293b); text-align: right; white-space: nowrap; }
    .bopp-item-disc { font-size: 0.78rem; color: #ef4444; text-align: right; white-space: nowrap; }
    .bopp-item-gp-val { font-size: 0.78rem; font-weight: 700; text-align: right; white-space: nowrap; }
    .bopp-item-gp-pct { font-size: 0.63rem; font-weight: 700; color: #16a34a; text-align: right; line-height: 1; margin-top: 2px; }
    .bopp-item-no { color: #94a3b8; font-size: 0.7rem; font-weight: 700; }
    .bopp-item-rm { border: none; background: none; color: #cbd5e1; cursor: pointer; padding: 2px 5px; border-radius: 4px; font-size: 0.9rem; transition: 0.15s; }
    .bopp-item-rm:hover { background: #fee2e2; color: #ef4444; }

    /* ── QT footer ── */
    .bopp-qt-foot { padding: 9px 14px; display: flex; justify-content: space-between; align-items: center; background: #fafbfc; border-top: 1px solid #f1f5f9; }
    .bopp-btn-add-item { border: 1px dashed #d1d5db; background: #fff; color: #64748b; border-radius: 8px; padding: 4px 13px; font-size: 0.73rem; font-weight: 700; cursor: pointer; transition: 0.15s; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-add-item:hover { border-color: var(--c-accent); background: var(--c-accent-light); color: var(--c-accent-dark); }
    .bopp-btn-del-qt { border: 1px solid #fecaca; background: #fff; color: #ef4444; border-radius: 8px; padding: 4px 13px; font-size: 0.73rem; font-weight: 700; cursor: pointer; transition: 0.15s; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-del-qt:hover { background: #fee2e2; border-color: #ef4444; }
    .bopp-btn-dup { border: 1px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 8px; padding: 4px 13px; font-size: 0.73rem; font-weight: 700; cursor: pointer; transition: 0.15s; font-family: inherit; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-dup:hover { border-color: #94a3b8; background: #f8fafc; }
    .bopp-btn-add-qt { width: 70%; border: 1.5px dashed #d1d5db; background: #fff; color: #94a3b8; border-radius: 10px; padding: 7px; font-size: 0.78rem; font-weight: 700; cursor: pointer; transition: 0.2s; font-family: inherit; display: flex; align-items: center; justify-content: center; gap: 7px; }
    .bopp-btn-add-qt:hover { border-color: var(--c-accent); color: var(--c-accent-dark); background: rgba(var(--c-accent-rgb), 0.06); }

    /* ── Account overlay ── */
    .bopp-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.45); z-index: 10001; display: none; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
    .bopp-overlay.open { display: flex; }
    .bopp-ov-card { background: #fff; width: 480px; max-height: 80vh; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); }
    .bopp-ov-list { overflow-y: auto; flex: 1; margin-top: 2px; padding-right: 4px; }
    /* Plain Bootstrap .form-control with no override falls back to
       Bootstrap's own default blue focus ring — same gap as B-Account's
       account-search overlay, missed for the same reason (never had a
       custom :focus of its own). */
    #bopp-ov-input:focus { border-color: var(--c-accent) !important; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12) !important; }
    .bopp-ov-item { border: 1px solid #f1f5f9; background: #fff; border-radius: 12px; margin-bottom: 5px; padding: 11px 16px; font-size: 0.85rem; font-weight: 600; text-align: left; cursor: pointer; transition: 0.15s; color: #334155; width: 100%; display: block; }
    .bopp-ov-item:hover { background: var(--c-accent-light); border-color: var(--c-accent); color: var(--c-accent-dark); }

    /* ── Footer ── */
    .bopp-footer { padding: 13px 28px; display: flex; align-items: center; gap: 10px; background: #fff; border-top: 1px solid #f1f5f9; }
    .bopp-btn-del { background: #fee2e2; color: #ef4444; border: none; padding: 0 18px; border-radius: 10px; font-weight: 700; height: 40px; font-size: 0.85rem; cursor: pointer; transition: 0.2s; font-family: inherit; display: none; align-items: center; gap: 6px; }
    .bopp-btn-del:hover { background: #fecaca; }
    .bopp-btn-undo { border: none; background: var(--c-accent); color: var(--c-on-accent); border-radius: 10px; font-weight: 800; height: 40px; padding: 0 16px; font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: 0.2s; display: flex; align-items: center; gap: 6px; }
    /* filter instead of a second hardcoded darker green — darkens whatever
       --c-accent currently resolves to, so a future theme change doesn't
       need a matching hand-picked "hover shade" of the new color too. */
    .bopp-btn-undo:hover { filter: brightness(0.88); }
    .bopp-btn-undo-qt { border: 1px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 8px; font-weight: 700; height: 30px; padding: 0 13px; font-size: 0.73rem; cursor: pointer; font-family: inherit; transition: 0.15s; display: inline-flex; align-items: center; gap: 5px; }
    .bopp-btn-undo-qt:hover { border-color: var(--c-accent); background: rgba(var(--c-accent-rgb), 0.06); color: var(--c-accent-dark); }
    .bopp-add-qt-row { position: relative; margin-top: 6px; display: flex; justify-content: center; }
    .bopp-btn-cancel { border: 1px solid #e2e8f0; background: #fff; color: #64748b; border-radius: 10px; font-weight: 700; height: 40px; padding: 0 18px; font-size: 0.85rem; cursor: pointer; font-family: inherit; transition: 0.2s; }
    .bopp-btn-cancel:hover { background: #f8fafc; border-color: #cbd5e1; }
    .bopp-btn-save { background: var(--c-dark, #1e293b); color: var(--c-accent); border: none; padding: 0 24px; border-radius: 10px; font-weight: 800; height: 40px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); font-family: inherit; }
    .bopp-btn-save:hover { background: #0f172a; transform: translateY(-2px) scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
    .bopp-btn-save:active { transform: translateY(0) scale(0.97); box-shadow: none; transition-duration: 0.1s; }
    .bopp-btn-save:disabled { opacity: 0.6; pointer-events: none; }

    /* ── Churn sections ── */
    .bopp-churn-wrap { border: 1.5px solid rgba(var(--c-churn-rgb, 249,115,22),0.5); border-radius: 14px; padding: 16px; position: relative; background: rgba(var(--c-churn-rgb, 249,115,22),0.03); margin-bottom: 16px; }
    .bopp-churn-label-row { position: absolute; top: -10px; left: 14px; background: #f8fafc; padding: 0 8px; display: flex; align-items: center; gap: 8px; }
    .bopp-churn-label { font-size: 0.68rem; font-weight: 800; color: var(--c-churn, #f97316); letter-spacing: 0.08em; text-transform: uppercase; }
    .bopp-churn-mode-seg { display: inline-flex; background: rgba(var(--c-churn-rgb, 249,115,22),0.08); border: 1px solid rgba(var(--c-churn-rgb, 249,115,22),0.3); border-radius: 20px; padding: 2px; }
    .bopp-churn-mode-btn { border: none; background: transparent; font-size: 0.6rem; font-weight: 800; letter-spacing: 0.04em; padding: 3px 9px; border-radius: 16px; cursor: pointer; color: var(--c-churn, #f97316); opacity: 0.55; transition: background 0.15s, opacity 0.15s, color 0.15s; }
    .bopp-churn-mode-btn:hover { opacity: 0.85; }
    .bopp-churn-mode-btn.active { background: var(--c-churn, #f97316); color: #fff; opacity: 1; }
    .bopp-churn-wrap .bopp-qt-card { border-left-color: var(--c-churn, #f97316); }
    .bopp-churn-date-wrap { position: absolute; top: -11px; right: 14px; background: #f8fafc; padding: 0 6px; display: flex; align-items: center; gap: 6px; }
    .bopp-churn-date-lbl { font-size: 0.62rem; font-weight: 700; color: rgba(var(--c-churn-rgb, 249,115,22),0.7); letter-spacing: 0.06em; text-transform: uppercase; white-space: nowrap; }
    .bopp-churn-date-inp { border: 1px solid rgba(var(--c-churn-rgb, 249,115,22),0.35); border-radius: 7px; background: #fff; color: var(--c-churn, #f97316); font-size: 0.72rem; font-weight: 700; padding: 2px 8px; height: 22px; outline: none; font-family: inherit; cursor: pointer; text-align: center; }
    .bopp-original-wrap { border: 1px solid #e2e8f0; border-radius: 14px; padding: 16px; position: relative; margin-bottom: 16px; }
    .bopp-original-label { position: absolute; top: -10px; left: 14px; background: #f8fafc; padding: 0 8px; font-size: 0.68rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.08em; text-transform: uppercase; }
    .bopp-qt-card--disabled { pointer-events: none; opacity: 0.6; }
</style>

<div class="modal fade" id="b-opp-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog bopp-modal-wrap modal-dialog-centered modal-dialog-scrollable">
        <div class="modal-content">

            <!-- Account search overlay -->
            <div id="bopp-overlay" class="bopp-overlay" onclick="BOppApp.closeOverlay()">
                <div class="bopp-ov-card" onclick="event.stopPropagation()">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold m-0" style="font-size:0.95rem;">Select Account</h5>
                        <button type="button" class="btn-close" onclick="BOppApp.closeOverlay()"></button>
                    </div>
                    <input type="text" id="bopp-ov-input" class="form-control mb-2" placeholder="Search account..." style="border-radius:12px;padding:9px 14px;border:1px solid #e2e8f0;font-size:0.85rem;">
                    <div class="bopp-ov-list" id="bopp-ov-list"></div>
                </div>
            </div>

            <!-- Header -->
            <div class="bopp-header">
                <div class="bopp-header-left">
                    <div class="bopp-header-bar"></div>
                    <i class="bi bi-briefcase-fill bopp-header-icon"></i>
                    <span class="bopp-header-title" id="bopp-modal-title">New Opportunity</span>
                    <div class="bopp-status-wrap" id="bopp-status-wrap" style="display:none;">
                        <select id="bopp-status-sel"></select>
                        <button type="button" class="bopp-status-trigger" id="bopp-status-trigger" onclick="BOppApp.openBoppPicker(this, 'bopp-status-sel')"></button>
                    </div>
                </div>
                <div class="bopp-header-right">
                    <div class="bopp-hdr-totals" id="bopp-hdr-totals">
                        <div class="bopp-hdr-lost-zone" id="bopp-hdr-lost-wrap">
                            <div class="bopp-hdr-tbox">
                                <span class="bopp-hdr-tval" id="bopp-hdr-lost-amt">0</span>
                                <span class="bopp-hdr-tlbl">Churn Amount</span>
                            </div>
                            <div class="bopp-hdr-tdiv"></div>
                            <div class="bopp-hdr-tbox">
                                <span class="bopp-hdr-tval" id="bopp-hdr-lost-gp">0</span>
                                <span class="bopp-hdr-tlbl">Churn GP</span>
                            </div>
                        </div>
                        <div class="bopp-hdr-remain-zone" id="bopp-hdr-remain-wrap">
                            <div class="bopp-hdr-tbox">
                                <span class="bopp-hdr-tval" id="bopp-hdr-amt">0</span>
                                <span class="bopp-hdr-tlbl">Amount</span>
                            </div>
                            <div class="bopp-hdr-tdiv"></div>
                            <div class="bopp-hdr-tbox">
                                <span class="bopp-hdr-tval gp" id="bopp-hdr-gp">0</span>
                                <span class="bopp-hdr-tlbl">GP</span>
                            </div>
                            <span class="bopp-hdr-pct-badge" id="bopp-hdr-pct"></span>
                        </div>
                    </div>
                    <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                </div>
            </div>

            <!-- Form -->
            <form id="bopp-form" novalidate>
                <input type="hidden" id="bopp-editing-id">
                <input type="hidden" id="bopp-account-id">

                <div class="bopp-body">

                    <div class="bopp-outer">

                        <!-- Left 72% -->
                        <div class="bopp-card bopp-left-card">
                            <div style="display:flex; gap:10px; margin-bottom:10px;">
                                <div style="flex:1; min-width:0;">
                                    <label class="bq-lbl"><i class="bi bi-person-lines-fill"></i> Account Name <span style="color:#ef4444">*</span></label>
                                    <div class="bopp-acc-wrap">
                                        <input type="text" id="bopp-acc-name" class="bq-inp" placeholder="Select account..." readonly required onclick="BOppApp.openOverlay()" style="cursor:pointer; width:100%;">
                                    </div>
                                </div>
                                <div style="flex:1; min-width:0;">
                                    <label class="bq-lbl"><i class="bi bi-building"></i> Company <span style="color:#ef4444">*</span></label>
                                    <div class="bopp-company-wrap">
                                        <select id="bopp-company-sel" required disabled>
                                            <option value="">Select company...</option>
                                        </select>
                                        <button type="button" class="bopp-company-trigger placeholder bopp-locked" id="bopp-company-sel-trigger" data-placeholder="Select company..." onclick="BOppApp.openBoppPicker(this, 'bopp-company-sel')">Select company...</button>
                                    </div>
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label class="bq-lbl"><i class="bi bi-briefcase-fill"></i> Opportunity Name <span style="color:#ef4444">*</span></label>
                                <input type="text" id="bopp-opp-name" class="bq-inp" placeholder="Project name..." required>
                            </div>
                            <div class="bopp-divider"></div>
                            <div style="display:flex; gap:14px; align-items:stretch;">
                                <div style="flex:1; min-width:0; display:flex; flex-direction:column; gap:8px;">
                                    <div>
                                        <label class="bq-lbl"><i class="bi bi-cloud-fill"></i> Materials</label>
                                        <input type="text" id="bopp-materials" class="bq-inp" placeholder="https://drive.google.com/...">
                                    </div>
                                    <div>
                                        <label class="bq-lbl"><i class="bi bi-file-earmark-text-fill"></i> Proposal</label>
                                        <input type="text" id="bopp-proposal" class="bq-inp" placeholder="https://drive.google.com/...">
                                    </div>
                                    <div>
                                        <label class="bq-lbl"><i class="bi bi-megaphone-fill"></i> Campaign</label>
                                        <input type="text" id="bopp-campaign" class="bq-inp" placeholder="https://drive.google.com/...">
                                    </div>
                                </div>
                                <div style="width:1px; background:#f1f5f9; flex-shrink:0;"></div>
                                <div style="flex:1; min-width:0; display:flex; flex-direction:column;">
                                    <label class="bq-lbl">Remark</label>
                                    <textarea id="bopp-remark" class="bq-inp bq-ta" style="flex:1;" placeholder="Note..."></textarea>
                                </div>
                            </div>
                        </div>

                        <!-- Right 30% -->
                        <div class="bopp-right-col" style="display:flex; flex-direction:column; gap:12px;">
                            <div class="bopp-card">
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Business Type <span style="color:#ef4444">*</span></span>
                                    <div class="bopp-picker-wrap">
                                        <select id="bopp-type" class="bopp-iinp" required>
                                            <option value="" disabled selected hidden></option>
                                        </select>
                                        <button type="button" class="bopp-picker-trigger placeholder" id="bopp-type-trigger" onclick="BOppApp.openBoppPicker(this, 'bopp-type')">Select...</button>
                                    </div>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Owner OPP <span style="color:#ef4444">*</span></span>
                                    <div class="bopp-picker-wrap">
                                        <select id="bopp-owner" class="bopp-iinp" required></select>
                                        <button type="button" class="bopp-picker-trigger placeholder" id="bopp-owner-trigger" onclick="BOppApp.openBoppPicker(this, 'bopp-owner')">Select...</button>
                                    </div>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Lead Source <span style="color:#ef4444">*</span></span>
                                    <div class="bopp-picker-wrap">
                                        <select id="bopp-lead" class="bopp-iinp" required></select>
                                        <button type="button" class="bopp-picker-trigger placeholder" id="bopp-lead-trigger" onclick="BOppApp.openBoppPicker(this, 'bopp-lead')">Select...</button>
                                    </div>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">AM</span>
                                    <div class="bopp-picker-wrap">
                                        <select id="bopp-am" class="bopp-iinp"></select>
                                        <button type="button" class="bopp-picker-trigger placeholder" id="bopp-am-trigger" onclick="BOppApp.openBoppPicker(this, 'bopp-am')">Select...</button>
                                    </div>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Sub AM</span>
                                    <div class="bopp-picker-wrap">
                                        <select id="bopp-subam" class="bopp-iinp"></select>
                                        <button type="button" class="bopp-picker-trigger placeholder" id="bopp-subam-trigger" onclick="BOppApp.openBoppPicker(this, 'bopp-subam')">Select...</button>
                                    </div>
                                </div>
                            </div>
                            <div class="bopp-card">
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Signed Date <span style="color:#ef4444">*</span></span>
                                    <input type="date" id="bopp-signed" class="bopp-iinp" required>
                                </div>
                                <div class="bopp-irow">
                                    <span class="bopp-ilbl">Launch Date <span style="color:#ef4444">*</span></span>
                                    <input type="date" id="bopp-launch" class="bopp-iinp" required>
                                </div>
                            </div>
                        </div>

                    </div><!-- /bopp-outer -->

                    <!-- Quotations -->
                    <div class="bopp-qt-lbl"><i class="bi bi-file-earmark-text"></i> Quotations</div>
                    <div id="bopp-qt-container"></div>
                    <div class="bopp-add-qt-row" id="bopp-add-qt-row-outer">
                        <button type="button" class="bopp-btn-add-qt" onclick="BOppApp.addQT()">
                            <i class="bi bi-plus-circle"></i> Add Quotation
                        </button>
                    </div>

                </div>



                <div class="bopp-footer">
                    <button type="button" class="bopp-btn-undo" id="bopp-btn-undo" style="display:none;" onclick="BOppApp.undo()"><i class="bi bi-arrow-counterclockwise"></i> Undo</button>
                    <div style="flex:1"></div>
                    <button type="button" class="bopp-btn-del" id="bopp-btn-del">
                        <i class="bi bi-trash3"></i> Delete
                    </button>
                    <button type="submit" class="bopp-btn-save" id="bopp-btn-save">
                        <i class="bi bi-plus-circle-fill" id="bopp-save-icon"></i>
                        <span id="bopp-save-label">Create Opportunity</span>
                    </button>
                </div>
            </form>

        </div>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', B_OPP_MODAL_HTML);
// Turns the two plain inputs above into hidden ISO carriers + visible
// DD-MM-YYYY masked fields + calendar icon (see system/date-picker.js).
// Attached once here, not per modal open — same reasoning as B-Quest's
// Publish Date (b-quest-modal.js): these two rows are static markup in
// B_OPP_MODAL_HTML, not re-rendered per role/card like B-Quest's Deadline
// fields are, so a one-time attach is enough.
const signedDatePicker = attachDatePicker(document.getElementById('bopp-signed'));
const launchDatePicker = attachDatePicker(document.getElementById('bopp-launch'));

const BOppApp = (() => {
    const el = id => document.getElementById(id);
    const escA = s => s ? String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;') : '';
    const escH = s => s ? String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') : '';
    const fmtN = n => (!isNaN(+n) && n != null) ? fmtMoney(+n) : '0';
    const parseAmt = s => { const n = parseFloat(String(s).replace(/,/g,'')); return isNaN(n) ? 0 : n; };
    const getBxUser = () => { try { return JSON.parse(sessionStorage.getItem('bx_user')); } catch { return null; } };

    let _bsModal = null, _editingId = null, _loaded = false;
    let _accounts = [], _accNames = [], _profiles = [];
    let _buList = [], _companyList = [], _statusList = [], _leadList = [], _typeList = [];
    let _statusColor = {}; // value → color, from b_opportunity_config (Settings page)
    let _qts = [], _churnQTs = [], _qtCounter = 0, _undoStack = [], _churnDate = '';

    const findQT     = id  => _qts.find(q => q.tmpId === id) || _churnQTs.find(q => q.tmpId === id);
    const isChurnMode = ()  => el('bopp-status-sel').value === 'Churn';
    const isChurnAllState = () => _churnQTs.every(qt => qt.items.length === 0);
    const getBsModal = () => _bsModal || (_bsModal = new bootstrap.Modal(el('b-opp-modal')));
    const buildOpts  = (list, sel = '') => list.map(v => `<option value="${escA(v)}"${v === sel ? ' selected' : ''}>${escH(v)}</option>`).join('');

    // ── Load helper data (once per page) ─────────────────────────────────────
    async function loadHelpers() {
        if (_loaded) return;
        const [{ data: accs }, { data: profs }, { data: cfg }] = await Promise.all([
            supabaseClient.from('b_account_list').select('account_id, account_name, company_name').order('account_name'),
            supabaseClient.from('profiles').select('codename').neq('level','god').order('codename'),
            supabaseClient.from('b_opportunity_config').select('type, value, color, active').in('type',['bu','company','status','lead_source','business_type']).order('value')
        ]);
        _accounts     = accs || [];
        _profiles     = (profs || []).map(p => p.codename).filter(Boolean);
        _buList       = (cfg || []).filter(c => c.type === 'bu' && c.active !== false).map(c => c.value);
        _companyList  = (cfg || []).filter(c => c.type === 'company' && c.active !== false).map(c => c.value);
        _statusList   = (cfg || []).filter(c => c.type === 'status' && c.active !== false).map(c => c.value);
        _leadList     = (cfg || []).filter(c => c.type === 'lead_source' && c.active !== false).map(c => c.value);
        _typeList     = (cfg || []).filter(c => c.type === 'business_type' && c.active !== false).map(c => c.value);
        _statusColor  = Object.fromEntries((cfg || []).filter(c => c.type === 'status').map(c => [c.value, c.color]));
        _accNames   = [...new Set(_accounts.map(a => a.account_name).filter(Boolean))].sort((a,b) => a.localeCompare(b,'th'));
        _loaded = true;
        buildDropdowns();
    }

    function buildDropdowns() {
        const blank = '<option value="" disabled selected hidden></option>';
        const pplOpts = buildOpts(_profiles);
        el('bopp-owner').innerHTML = blank + pplOpts;
        syncBoppPickerTrigger('bopp-owner');
        ['bopp-am','bopp-subam'].forEach(id => { const s = el(id); if (s) { s.innerHTML = blank + pplOpts; syncBoppPickerTrigger(id); } });
        el('bopp-lead').innerHTML = blank + buildOpts(_leadList);
        syncBoppPickerTrigger('bopp-lead');
        el('bopp-type').innerHTML = blank + buildOpts(_typeList);
        syncBoppPickerTrigger('bopp-type');
        el('bopp-status-sel').innerHTML = _statusList.length ? buildOpts(_statusList) : '<option value="Active">Active</option>';
    }

    // ── Owner/AM/Sub-AM/Lead Source custom picker — a real <select> stays
    // the source of truth (value, required, native validation); this just
    // drives it from /system/select-picker.js's shared popup instead of
    // the select's own unstyleable native one. ──
    function syncBoppPickerTrigger(selectId) {
        const select = el(selectId);
        const trigger = el(`${selectId}-trigger`);
        if (!select || !trigger) return;
        const opt = select.options[select.selectedIndex];
        const hasValue = opt && opt.value !== '';
        trigger.textContent = hasValue ? opt.textContent : (trigger.dataset.placeholder || 'Select...');
        trigger.classList.toggle('placeholder', !hasValue);
        // Company's select toggles .disabled until an account is chosen —
        // mirrored onto the trigger as a CSS class (not the trigger's own
        // disabled attribute) so it still fires a click; a genuinely
        // disabled button never dispatches one at all, which would stop
        // openBoppPicker from being able to shake the Account field
        // instead when the user clicks it too early. A no-op for every
        // other picker here, none of which ever disables.
        trigger.classList.toggle('bopp-locked', select.disabled);
    }

    function openBoppPicker(triggerBtn, selectId) {
        if (selectId === 'bopp-company-sel' && triggerBtn.classList.contains('bopp-locked')) {
            shakeInvalid(el('bopp-acc-name'));
            return;
        }
        const select = el(selectId);
        openSelectPicker(triggerBtn, {
            getOptions: () => [...select.options].filter(o => o.value !== '').map(o => ({ value: o.value, label: o.textContent })),
            getValue: () => select.value,
            onSelect: (value) => {
                select.value = value;
                syncBoppPickerTrigger(selectId);
                select.dispatchEvent(new Event('change'));
            },
        });
    }

    // ── BU (per item row) / Company QT (per QT card) pickers — same idea,
    // but these selects are re-rendered per row/card with no unique id, so
    // the trigger's own sibling <select> (rendered right before it in the
    // markup) is the target instead of an id lookup. The existing
    // container-level delegated 'change' listener (see below) needs a
    // *bubbling* change event to actually receive this. ──
    function openBoppItemPicker(triggerBtn) {
        const select = triggerBtn.previousElementSibling;
        openSelectPicker(triggerBtn, {
            getOptions: () => [...select.options].filter(o => o.value !== '').map(o => ({ value: o.value, label: o.textContent })),
            getValue: () => select.value,
            onSelect: (value) => {
                select.value = value;
                triggerBtn.textContent = value;
                triggerBtn.classList.remove('placeholder');
                select.dispatchEvent(new Event('change', { bubbles: true }));
            },
        });
    }

    // ── Account overlay ───────────────────────────────────────────────────────
    function openOverlay() {
        el('bopp-ov-input').value = '';
        renderOverlayList('');
        el('bopp-overlay').classList.add('open');
        setTimeout(() => el('bopp-ov-input').focus(), 50);
    }

    const closeOverlay = () => el('bopp-overlay').classList.remove('open');

    function renderOverlayList(q) {
        q = q.trim().toLowerCase();
        const filtered = q ? _accNames.filter(n => n.toLowerCase().includes(q)) : _accNames;
        el('bopp-ov-list').innerHTML = filtered.length
            ? filtered.map(n => `<button type="button" class="bopp-ov-item" data-name="${escA(n)}">${escH(n)}</button>`).join('')
            : '<p style="text-align:center;padding:20px;color:#94a3b8;font-size:0.85rem;">No accounts found</p>';
    }

    el('bopp-ov-list').addEventListener('click', e => {
        const btn = e.target.closest('.bopp-ov-item');
        if (!btn) return;
        el('bopp-acc-name').value = btn.dataset.name;
        el('bopp-acc-name').classList.remove('is-invalid');
        populateCompanies(btn.dataset.name, null);
        closeOverlay();
    });
    el('bopp-ov-input').addEventListener('input', e => renderOverlayList(e.target.value));

    // ── Account / Company ─────────────────────────────────────────────────────
    function populateCompanies(accountName, selectedId) {
        const companies = _accounts.filter(a => a.account_name === accountName);
        const sel = el('bopp-company-sel');
        if (!companies.length) {
            sel.innerHTML = '<option value="">—</option>';
            sel.disabled = false;
            el('bopp-account-id').value = '';
            syncBoppPickerTrigger('bopp-company-sel');
            return;
        }
        const opts = companies.map(c => `<option value="${escA(c.account_id)}"${c.account_id === selectedId ? ' selected' : ''}>${escH(c.company_name || c.account_id)}</option>`).join('');
        if (companies.length === 1) {
            sel.innerHTML = opts;
            sel.value = companies[0].account_id;
        } else {
            sel.innerHTML = `<option value="" disabled>Select company...</option>` + opts;
            sel.value = selectedId || '';
        }
        sel.disabled = false;
        el('bopp-account-id').value = sel.value;
        syncBoppPickerTrigger('bopp-company-sel');
    }

    el('bopp-company-sel').addEventListener('change', function() { el('bopp-account-id').value = this.value; this.classList.remove('is-invalid'); });

    // ── QT helpers ────────────────────────────────────────────────────────────
    function genQTNum() {
        const d = new Date();
        return `QT${String(d.getFullYear()).slice(-2)}${String(d.getMonth()+1).padStart(2,'0')}${String(Math.floor(Math.random()*9000)+1000)}`;
    }


    const newItem = () => ({ item_id: null, bu: '', detail: '', qty: 1, price: 0, discount: 0, amount: 0, gp: 0 });

    function renderItemRow(qtTmpId, item, idx, disabled = false) {
        const amt = +item.amount || 0, gp = +item.gp || 0;
        const buOpts = `<option value=""${!item.bu ? ' selected' : ''} disabled hidden></option>` + _buList.map(b => `<option value="${escA(b)}"${item.bu === b ? ' selected' : ''}>${escH(b)}</option>`).join('');
        const da = disabled ? ' disabled' : '';
        return `<tr data-qt="${escA(qtTmpId)}" data-item="${idx}">
            <td class="bopp-item-no c">${idx+1}</td>
            <td class="c">
                <div class="bopp-item-sel-wrap">
                    <select class="bopp-item-sel" data-field="bu"${da}>${buOpts}</select>
                    <button type="button" class="bopp-item-sel-trigger${item.bu ? '' : ' placeholder'}"${disabled ? ' disabled' : ' onclick="BOppApp.openBoppItemPicker(this)"'}>${item.bu ? escH(item.bu) : '—'}</button>
                </div>
            </td>
            <td><textarea class="bopp-item-inp bopp-item-ta" data-field="detail" placeholder="Description..." rows="3"${da}>${escH(item.detail||'')}</textarea></td>
            <td><input type="text" class="bopp-item-inp r" data-field="qty" value="${item.qty ? fmtQty(item.qty) : ''}" inputmode="numeric" placeholder="0"${da}></td>
            <td><input type="text" class="bopp-item-inp r" data-field="price" value="${item.price ? fmtN(item.price) : ''}" inputmode="decimal" placeholder="0"${da}></td>
            <td><input type="text" class="bopp-item-inp r bopp-item-disc-inp" data-field="discount" value="${item.discount ? fmtN(item.discount) : ''}" inputmode="decimal" placeholder="0"${da}></td>
            <td class="bopp-item-amt" data-amt>${amt > 0 ? fmtN(amt) : '0'}</td>
            <td><input type="text" class="bopp-item-inp r bopp-item-gp-inp" data-field="gp" value="${item.gp ? fmtN(item.gp) : ''}" inputmode="decimal" placeholder="0" style="color:${gp>0?'#16a34a':'#cbd5e1'}; font-weight:700;"${da}></td>
            <td class="c">${disabled ? '' : `<button type="button" class="bopp-item-rm" onclick="BOppApp.removeItem('${escA(qtTmpId)}',${idx})" title="Delete row"><i class="bi bi-trash3"></i></button>`}</td>
        </tr>`;
    }

    function renderQTCard(qt, idx = 0, disabled = false) {
        const tAmt = qt._totAmt || 0, tGP = qt._totGP || 0;
        const buOpts = `<option value="" disabled${!qt.company_qt ? ' selected' : ''} hidden>— Company QT —</option>` + buildOpts(_companyList, qt.company_qt);
        const da = disabled ? ' disabled' : '';
        const pct = tAmt > 0 && tGP > 0 ? `${(tGP/tAmt*100).toFixed(1)}%` : '';
        return `<div class="bopp-qt-card${disabled ? ' bopp-qt-card--disabled' : ''}" data-qt-card="${escA(qt.tmpId)}">
            <div class="bopp-qt-head">
                <i class="bi bi-file-earmark-text" style="color:#94a3b8;font-size:0.9rem;flex-shrink:0;"></i>
                <input type="text" class="bopp-qt-num" value="${escA(qt.qt_number)}" data-field="qt_number" placeholder="QT...."${da}>
                <div class="bopp-qt-co-wrap">
                    <select class="bopp-qt-co" data-field="company_qt"${da}>${buOpts}</select>
                    <button type="button" class="bopp-qt-co-trigger${qt.company_qt ? '' : ' placeholder'}"${disabled ? ' disabled' : ' onclick="BOppApp.openBoppItemPicker(this)"'}>${qt.company_qt ? escH(qt.company_qt) : 'Company QT'}</button>
                </div>
                <div class="bopp-qt-totals">
                    <div class="bopp-qt-tbox">
                        <span class="bopp-qt-tval" data-qt-amt>${fmtN(tAmt)}</span>
                        <span class="bopp-qt-tlbl">Amount</span>
                    </div>
                    <div class="bopp-qt-tdiv"></div>
                    <div class="bopp-qt-tbox">
                        <span class="bopp-qt-tval gp" data-qt-gp>${fmtN(tGP)}</span>
                        <span class="bopp-qt-tlbl">GP</span>
                    </div>
                    <span class="bopp-qt-pct-badge" data-qt-pct>${pct}</span>
                </div>
            </div>
            <div class="bopp-item-wrap">
                <table class="bopp-item-tbl">
                    <thead><tr>
                        <th class="c" style="width:38px">#</th>
                        <th style="width:78px">BU</th>
                        <th>Detail</th>
                        <th class="r" style="width:56px">Qty</th>
                        <th class="r" style="width:108px">Price</th>
                        <th class="r" style="width:100px">Discount</th>
                        <th class="r" style="width:108px">Amount</th>
                        <th class="r" style="width:96px">GP</th>
                        <th style="width:36px"></th>
                    </tr></thead>
                    <tbody id="bopp-tbody-${escA(qt.tmpId)}">${qt.items.map((item, i) => renderItemRow(qt.tmpId, item, i, disabled)).join('')}</tbody>
                </table>
            </div>
            ${disabled ? '' : `<div class="bopp-qt-foot">
                <button type="button" class="bopp-btn-add-item" onclick="BOppApp.addItem('${escA(qt.tmpId)}')"><i class="bi bi-plus"></i> Add Item</button>
                <div style="display:flex;gap:6px;align-items:center;">
                    <button type="button" class="bopp-btn-dup" onclick="BOppApp.dupQT('${escA(qt.tmpId)}')"><i class="bi bi-copy"></i> Duplicate</button>
                    <button type="button" class="bopp-btn-del-qt" onclick="BOppApp.removeQT('${escA(qt.tmpId)}')"><i class="bi bi-trash3"></i> Delete</button>
                </div>
            </div>`}
        </div>`;
    }

    function _appendQTToDOM(qt) {
        const tmp = document.createElement('div');
        tmp.innerHTML = renderQTCard(qt, _qts.length - 1);
        el('bopp-qt-container').append(...tmp.children);
        updateQTDeleteBtns();
        updateItemTrashBtns(qt);
    }

    function renderAllQTs() {
        const container = el('bopp-qt-container');
        const outerBtn = el('bopp-add-qt-row-outer');
        if (isChurnMode()) {
            const churnCards = _churnQTs.map((qt, i) => renderQTCard(qt, i, false)).join('');
            const origCards  = _qts.map((qt, i) => renderQTCard(qt, i, true)).join('');
            const isAll = isChurnAllState();
            container.innerHTML = `
                <div class="bopp-churn-wrap">
                    <div class="bopp-churn-label-row">
                        <span class="bopp-churn-label">CHURN</span>
                        <div class="bopp-churn-mode-seg">
                            <button type="button" class="bopp-churn-mode-btn${isAll ? '' : ' active'}" onclick="BOppApp.setChurnAllMode(false)">ITEMS</button>
                            <button type="button" class="bopp-churn-mode-btn${isAll ? ' active' : ''}" onclick="BOppApp.setChurnAllMode(true)">ALL</button>
                        </div>
                    </div>
                    <div class="bopp-churn-date-wrap">
                        <span class="bopp-churn-date-lbl">Churn Date</span>
                        <input type="date" class="bopp-churn-date-inp" value="${_churnDate}" onchange="BOppApp.setChurnDate(this.value)">
                    </div>
                    ${churnCards}
                    <div class="bopp-add-qt-row" style="margin-top:4px;">
                        <button type="button" class="bopp-btn-add-qt" onclick="BOppApp.addQT()"><i class="bi bi-plus-circle"></i> Add Quotation</button>
                    </div>
                </div>
                <div class="bopp-original-wrap">
                    <span class="bopp-original-label">SIGN</span>
                    ${origCards}
                </div>`;
            if (outerBtn) outerBtn.style.display = 'none';
            updateQTDeleteBtns();
            _churnQTs.forEach(updateItemTrashBtns);
        } else {
            if (outerBtn) outerBtn.style.display = '';
            if (!_qts.length) { container.innerHTML = ''; return; }
            const tmp = document.createElement('div');
            tmp.innerHTML = _qts.map((qt, i) => renderQTCard(qt, i, false)).join('');
            container.innerHTML = '';
            container.append(...tmp.children);
            updateQTDeleteBtns();
            _qts.forEach(updateItemTrashBtns);
        }
    }

    const reRenderQTBody = qt => {
        const tbody = el(`bopp-tbody-${qt.tmpId}`);
        if (tbody) tbody.innerHTML = qt.items.map((item, idx) => renderItemRow(qt.tmpId, item, idx)).join('');
    };

    // ── Totals ────────────────────────────────────────────────────────────────
    function recalcTotals() {
        const container = el('bopp-qt-container');
        [..._qts, ..._churnQTs].forEach(qt => {
            qt._totAmt = qt.items.reduce((s,i) => s + (+i.amount||0), 0);
            qt._totGP  = qt.items.reduce((s,i) => s + (+i.gp||0), 0);
            const card = container.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            if (!card) return;
            card.querySelector('[data-qt-amt]').textContent = fmtN(qt._totAmt);
            card.querySelector('[data-qt-gp]').textContent  = fmtN(qt._totGP);
            card.querySelector('[data-qt-pct]').textContent = qt._totAmt > 0 && qt._totGP > 0 ? `${(qt._totGP/qt._totAmt*100).toFixed(1)}%` : '';
        });
        const srcQTs = isChurnMode() ? _churnQTs : _qts;
        const totAmt = srcQTs.reduce((s,qt) => s + qt._totAmt, 0);
        const totGP  = srcQTs.reduce((s,qt) => s + qt._totGP, 0);
        el('bopp-hdr-amt').textContent = fmtN(totAmt);
        el('bopp-hdr-gp').textContent  = fmtN(totGP);
        el('bopp-hdr-pct').textContent = totAmt > 0 && totGP > 0 ? `${(totGP/totAmt*100).toFixed(1)}%` : '';
        const lostWrap = el('bopp-hdr-lost-wrap');
        // Plain Amount/GP here means "what remains" (srcQTs above) — under
        // the ALL toggle that's always, definitionally, 0/0 (see
        // setChurnAllMode), so showing "0.00 | 0.00" right next to the
        // Churn Amount/GP box that already states the same loss is just
        // noise, not a second real figure. Hidden only for that specific
        // case; ITEMS mode still shows the real (possibly nonzero) remainder.
        const remainWrap = el('bopp-hdr-remain-wrap');
        if (isChurnMode()) {
            const signAmt = _qts.reduce((s,qt) => s + qt._totAmt, 0);
            const signGP  = _qts.reduce((s,qt) => s + qt._totGP,  0);
            const lostAmt = signAmt - totAmt;
            const lostGP  = signGP  - totGP;
            const fmt = v => (v >= 0 ? '-' : '+') + fmtN(Math.abs(v));
            el('bopp-hdr-lost-amt').textContent = fmt(lostAmt);
            el('bopp-hdr-lost-gp').textContent  = fmt(lostGP);
            lostWrap.style.display = 'flex';
            remainWrap.style.display = isChurnAllState() ? 'none' : 'flex';
        } else {
            lostWrap.style.display = 'none';
            remainWrap.style.display = 'flex';
        }
    }

    // ── QT event delegation ───────────────────────────────────────────────────
    el('bopp-qt-container').addEventListener('input', e => {
        const inp = e.target, field = inp.dataset.field;
        if (!field) return;

        const row = inp.closest('tr[data-qt][data-item]');
        if (row) {
            const qt = findQT(row.dataset.qt), idx = +row.dataset.item;
            if (!qt || idx >= qt.items.length) return;
            const item = qt.items[idx];
            if      (field === 'qty')      item.qty      = Math.max(0, Math.floor(parseAmt(inp.value)));
            else if (field === 'price')    item.price    = parseAmt(inp.value);
            else if (field === 'discount') item.discount = parseAmt(inp.value);
            else if (field === 'gp')       item.gp       = parseAmt(inp.value);
            else if (field === 'detail')   item.detail   = inp.value;

            if (['qty','price','discount'].includes(field)) {
                item.amount = Math.max(0, item.qty * item.price - item.discount);
                const amtCell = row.querySelector('[data-amt]');
                if (amtCell) amtCell.textContent = item.amount > 0 ? fmtN(item.amount) : '0';
            }
            if (field === 'price' && +item.price > 0) inp.classList.remove('is-invalid');
            if (field === 'gp') inp.style.color = item.gp > 0 ? '#16a34a' : '#cbd5e1';
            recalcTotals();
            return;
        }

        if (field === 'qt_number') {
            const card = inp.closest('[data-qt-card]');
            const qt = card && findQT(card.dataset.qtCard);
            if (qt) qt.qt_number = inp.value;
            inp.classList.remove('is-invalid');
        }
    });

    el('bopp-qt-container').addEventListener('change', e => {
        const inp = e.target, field = inp.dataset.field;
        if (!field) return;
        const row = inp.closest('tr[data-qt][data-item]');
        if (row && field === 'bu') {
            const qt = findQT(row.dataset.qt), idx = +row.dataset.item;
            if (qt && idx < qt.items.length) qt.items[idx].bu = inp.value;
            inp.classList.remove('is-invalid');
            return;
        }
        if (field === 'company_qt') {
            const card = inp.closest('[data-qt-card]');
            const qt = card && findQT(card.dataset.qtCard);
            if (qt) qt.company_qt = inp.value;
            inp.classList.remove('is-invalid');
        }
    });

    el('bopp-qt-container').addEventListener('focusout', e => {
        const inp = e.target, field = inp.dataset.field;
        if (field === 'qty')      inp.value = inp.value ? fmtQty(parseAmt(inp.value)) : '';
        else if (['price','discount','gp'].includes(field)) inp.value = inp.value ? fmtN(parseAmt(inp.value)) : '';
    });

    // ── UI state ──────────────────────────────────────────────────────────────
    const updateUndoBtn      = () => { const b = el('bopp-btn-undo'); if (b) b.style.display = _undoStack.length ? '' : 'none'; };
    const isEmptyItem        = item => !item.detail?.trim() && (+item.price||0) === 0 && (+item.qty||0) <= 1 && (+item.discount||0) === 0 && (+item.gp||0) === 0;
    const isEmptyQT          = qt   => !qt.qt_number?.trim() && !qt.company_qt && qt.items.every(isEmptyItem);
    const updateQTDeleteBtns = () => {
        if (isChurnMode()) {
            document.querySelectorAll('.bopp-churn-wrap .bopp-btn-del-qt').forEach(b => { b.style.display = ''; });
        } else {
            document.querySelectorAll('.bopp-btn-del-qt').forEach(b => { b.style.display = _qts.length > 1 ? '' : 'none'; });
        }
    };

    function updateItemTrashBtns(qt) {
        const tbody = el(`bopp-tbody-${qt.tmpId}`);
        if (!tbody) return;
        const inChurn = _churnQTs.some(q => q.tmpId === qt.tmpId);
        const show = (inChurn || qt.items.length > 1) ? '' : 'none';
        tbody.querySelectorAll('.bopp-item-rm').forEach(b => { b.style.display = show; });
    }

    function updateChurnModeBadge() {
        const seg = document.querySelector('.bopp-churn-mode-seg');
        if (!seg) return;
        const isAll = isChurnAllState();
        const btns = seg.querySelectorAll('.bopp-churn-mode-btn');
        btns[0].classList.toggle('active', !isAll);
        btns[1].classList.toggle('active', isAll);
    }

    // ── Public QT operations ──────────────────────────────────────────────────
    function addQT() {
        _qtCounter++;
        const qt = { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: '', company_qt: '', items: [newItem()], _totAmt: 0, _totGP: 0 };
        if (isChurnMode()) {
            _churnQTs.push(qt);
            renderAllQTs();
            recalcTotals();
        } else {
            _qts.push(qt);
            _appendQTToDOM(qt);
        }
    }

    async function removeQT(tmpId) {
        const inChurn = _churnQTs.some(q => q.tmpId === tmpId);
        const arr = inChurn ? _churnQTs : _qts;
        const qtIdx = arr.findIndex(q => q.tmpId === tmpId);
        if (qtIdx < 0) return;
        const qt = arr[qtIdx];
        if (!isEmptyQT(qt)) {
            const label = qt.qt_number ? `QT "${qt.qt_number}"` : 'this quotation';
            const { isConfirmed } = await Swal.fire({
                title: 'Delete Quotation?', text: `Delete ${label} and all its items?`,
                icon: 'warning', showCancelButton: true,
                confirmButtonText: 'Delete', confirmButtonColor: '#ef4444', cancelButtonText: 'Cancel',
                reverseButtons: true
            });
            if (!isConfirmed) return;
            _undoStack.push({ type: 'qt', qtIdx, qt: JSON.parse(JSON.stringify(qt)), isChurn: inChurn });
        }
        arr.splice(qtIdx, 1);
        if (inChurn) {
            renderAllQTs();
        } else {
            el('bopp-qt-container').querySelector(`[data-qt-card="${tmpId}"]`)?.remove();
        }
        recalcTotals();
        updateQTDeleteBtns();
        updateUndoBtn();
    }

    function addItem(qtTmpId) {
        const qt = findQT(qtTmpId);
        if (!qt) return;
        if (isChurnMode() && !_churnQTs.some(q => q.tmpId === qtTmpId)) return;
        qt.items.push(newItem());
        reRenderQTBody(qt);
        updateItemTrashBtns(qt);
        recalcTotals();
    }

    function removeItem(qtTmpId, idx) {
        const qt = findQT(qtTmpId);
        if (!qt) return;
        const inChurn = _churnQTs.some(q => q.tmpId === qtTmpId);
        if (!inChurn && qt.items.length <= 1) return;
        if (!isEmptyItem(qt.items[idx])) _undoStack.push({ type: 'item', qtTmpId, idx, item: { ...qt.items[idx] }, isChurn: inChurn });
        qt.items.splice(idx, 1);
        qt.items.forEach(i => { i.amount = Math.max(0, (+i.qty||0) * (+i.price||0) - (+i.discount||0)); });
        reRenderQTBody(qt);
        updateItemTrashBtns(qt);
        recalcTotals();
        updateUndoBtn();
        if (inChurn) updateChurnModeBadge();
    }

    function undo() {
        if (!_undoStack.length) return;
        const action = _undoStack.pop();
        if (action.type === 'item') {
            const qt = findQT(action.qtTmpId);
            if (qt) { qt.items.splice(action.idx, 0, action.item); reRenderQTBody(qt); updateItemTrashBtns(qt); recalcTotals(); if (action.isChurn) updateChurnModeBadge(); }
        } else if (action.type === 'qt') {
            const arr = action.isChurn ? _churnQTs : _qts;
            arr.splice(action.qtIdx, 0, action.qt);
            renderAllQTs();
            recalcTotals();
        } else if (action.type === 'churnAll') {
            _churnQTs = action.churnQTs;
            renderAllQTs();
            recalcTotals();
        }
        updateUndoBtn();
    }

    function setChurnAllMode(makeAll) {
        if (!isChurnMode()) return;
        const currentlyAll = isChurnAllState();
        if (makeAll === currentlyAll) return;
        _undoStack.push({ type: 'churnAll', churnQTs: JSON.parse(JSON.stringify(_churnQTs)) });
        if (makeAll) {
            _churnQTs = [];
        } else {
            // Switching back to ITEMS re-clones the original (SIGN) QTs —
            // same starting point as first entering Churn mode — rather
            // than leaving the user with a single blank row to rebuild
            // the whole quotation from scratch.
            _churnQTs = _qts.map(qt => {
                _qtCounter++;
                return { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: qt.qt_number, company_qt: qt.company_qt,
                    items: qt.items.map(i => ({ ...i, item_id: null })), _totAmt: qt._totAmt, _totGP: qt._totGP };
            });
        }
        renderAllQTs();
        recalcTotals();
        updateUndoBtn();
    }

    function dupQT(srcTmpId) {
        const src = findQT(srcTmpId);
        if (!src) return;
        const inChurn = _churnQTs.some(q => q.tmpId === srcTmpId);
        _qtCounter++;
        const dup = { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: genQTNum(), company_qt: src.company_qt, items: src.items.map(i => ({ ...i, item_id: null })), _totAmt: src._totAmt, _totGP: src._totGP };
        if (inChurn) {
            _churnQTs.push(dup);
            renderAllQTs();
        } else {
            _qts.push(dup);
            _appendQTToDOM(dup);
        }
        recalcTotals();
    }

    // ── Status color — sourced from b_opportunity_config.color (Settings
    // page, _statusColor built in loadHelpers), not a hardcoded map, so a
    // color change in Settings reflects here without a code change. ──
    function updateStatusColor() {
        const sel = el('bopp-status-sel');
        const trigger = el('bopp-status-trigger');
        trigger.textContent = sel.options[sel.selectedIndex]?.textContent || sel.value;
        const bg = _statusColor[sel.value];
        if (bg) {
            trigger.style.backgroundColor = bg;
            trigger.style.color           = pickBadgeTextColor(bg);
            trigger.style.borderColor     = bg;
        } else {
            trigger.style.backgroundColor = 'rgba(255,255,255,0.08)';
            trigger.style.color           = '#e2e8f0';
            trigger.style.borderColor     = 'rgba(255,255,255,0.2)';
        }
    }

    el('bopp-status-sel').addEventListener('change', function() {
        const wasChurn = _churnQTs.length > 0;
        const nowChurn = this.value === 'Churn';
        if (nowChurn && !wasChurn && _qts.length) {
            _churnQTs = _qts.map(qt => {
                _qtCounter++;
                return { tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: qt.qt_number, company_qt: qt.company_qt,
                    items: qt.items.map(i => ({...i, item_id: null})), _totAmt: qt._totAmt, _totGP: qt._totGP };
            });
            renderAllQTs();
            recalcTotals();
        } else if (!nowChurn && wasChurn) {
            _churnQTs = [];
            renderAllQTs();
            recalcTotals();
        }
        updateStatusColor();
    });

    // ── Modal mode / Reset ────────────────────────────────────────────────────
    function _setModalMode(isEdit, oppId) {
        el('bopp-modal-title').textContent  = isEdit ? oppId : 'New Opportunity';
        el('bopp-save-icon').className      = isEdit ? 'bi bi-check-circle-fill' : 'bi bi-plus-circle-fill';
        el('bopp-save-label').textContent   = isEdit ? 'Save Changes' : 'Create Opportunity';
        el('bopp-btn-del').style.display     = isEdit ? 'flex' : 'none';
        el('bopp-status-wrap').style.display  = isEdit ? '' : 'none';
        if (isEdit) updateStatusColor();
    }

    function resetForm() {
        el('bopp-form').classList.remove('was-validated');
        ['bopp-editing-id','bopp-account-id','bopp-acc-name','bopp-opp-name',
         'bopp-materials','bopp-proposal','bopp-campaign','bopp-remark']
            .forEach(id => { const e = el(id); if (e) e.value = ''; });
        // Setting .value directly on bopp-signed/bopp-launch now (since
        // attachDatePicker) would clear the hidden ISO carrier without
        // touching what the visible masked field actually shows — and
        // wouldn't clear a stale "Invalid date" custom-validity either.
        signedDatePicker.setValue(null);
        launchDatePicker.setValue(null);
        const companySel = el('bopp-company-sel');
        companySel.innerHTML = '<option value="">Select company...</option>';
        companySel.disabled = true;
        syncBoppPickerTrigger('bopp-company-sel');
        ['bopp-type','bopp-lead','bopp-owner','bopp-am','bopp-subam'].forEach(id => { const s = el(id); if (s) s.value = ''; });
        ['bopp-type','bopp-lead','bopp-owner','bopp-am','bopp-subam'].forEach(syncBoppPickerTrigger);
        el('bopp-status-sel').selectedIndex = 0;
        el('bopp-status-wrap').style.display  = 'none';
        el('bopp-qt-container').innerHTML = '';
        const outerBtn = el('bopp-add-qt-row-outer');
        if (outerBtn) outerBtn.style.display = '';
        _qts = []; _churnQTs = []; _qtCounter = 0; _undoStack = []; _churnDate = '';
        recalcTotals();
        updateUndoBtn();
    }

    // ── Open modal ────────────────────────────────────────────────────────────
    async function openNew() {
        resetForm();
        await loadHelpers();
        const user = getBxUser();
        if (user?.codename) {
            const ownerSel = el('bopp-owner');
            if ([...ownerSel.options].some(o => o.value === user.codename)) {
                ownerSel.value = user.codename;
                syncBoppPickerTrigger('bopp-owner');
            }
        }
        addQT();
        _setModalMode(false);
        getBsModal().show();
    }

    async function openEdit(oppId) {
        resetForm();
        await loadHelpers();

        const { data: opp, error } = await supabaseClient.from('b_opportunity_list').select('*').eq('opportunity_id', oppId).single();
        if (error || !opp) { notify('Error', 'Load failed', 'error'); return; }

        _editingId = oppId;
        el('bopp-editing-id').value = oppId;
        el('bopp-account-id').value = opp.account_id || '';

        const acc = _accounts.find(a => a.account_id === opp.account_id);
        if (acc) { el('bopp-acc-name').value = acc.account_name || ''; populateCompanies(acc.account_name, opp.account_id); }

        [['bopp-opp-name','opportunity_name'],['bopp-type','business_type'],['bopp-lead','lead_source'],
         ['bopp-owner','owner'],['bopp-am','am'],['bopp-subam','sub_am'],
         ['bopp-materials','materials'],['bopp-proposal','proposal'],['bopp-campaign','campaign'],['bopp-remark','remark']]
            .forEach(([id, field]) => { el(id).value = opp[field] || ''; });
        ['bopp-type','bopp-lead','bopp-owner','bopp-am','bopp-subam'].forEach(syncBoppPickerTrigger);

        signedDatePicker.setValue(opp.signed_date ? String(opp.signed_date).slice(0,10) : null);
        launchDatePicker.setValue(opp.launch_date ? String(opp.launch_date).slice(0,10) : null);
        _churnDate = opp.churn_date ? String(opp.churn_date).slice(0,10) : '';
        el('bopp-status-sel').value = opp.status || (_statusList[0] || 'Active');

        const { data: qts } = await supabaseClient.from('b_opportunity_qt')
            .select('*, b_opportunity_qt_item(*)')
            .eq('opportunity_id', oppId)
            .order('qt_number');

        const origQTs  = (qts || []).filter(q => q.qt_type !== 'churn');
        const churnQTs = (qts || []).filter(q => q.qt_type === 'churn');

        const _loadIntoArr = (qtList, arr) => {
            qtList.forEach(qt => {
                _qtCounter++;
                const items = (qt.b_opportunity_qt_item || [])
                    .sort((a,b) => (a.no||0)-(b.no||0))
                    // amount is re-derived from qty/price/discount rather than
                    // trusted from the stored column — any item whose amount
                    // went stale for any reason (the missing-amount bug this
                    // was hit by, or otherwise) self-heals here instead of
                    // carrying the stale value forward into this edit.
                    .map(i => { const qty = +i.qty||1, price = +i.price||0, discount = +i.discount||0;
                        return { item_id: i.item_id, bu: i.bu||'', detail: i.detail||'', qty, price, discount, amount: Math.max(0, qty*price-discount), gp: +i.gp||0 }; });
                arr.push({ tmpId: `qt-${_qtCounter}`, qt_id: qt.qt_id, qt_number: qt.qt_number||'', company_qt: qt.company_qt||'',
                    items: items.length ? items : [newItem()],
                    _totAmt: items.reduce((s,i) => s+(+i.amount||0), 0),
                    _totGP:  items.reduce((s,i) => s+(+i.gp||0), 0) });
            });
        };

        if (origQTs.length) { _loadIntoArr(origQTs, _qts); } else { addQT(); }

        if (opp.status === 'Churn') {
            if (churnQTs.length) {
                _loadIntoArr(churnQTs, _churnQTs);
            }
            // else: no saved churn QT rows means this opportunity is
            // already saved as "ALL" (100% churned, nothing left — see
            // setChurnAllMode) — _churnQTs stays [] so re-opening Edit
            // shows ALL, matching what was actually saved, instead of
            // cloning the originals back in and silently turning a saved
            // ALL into ITEMS the moment the modal is reopened.
        }

        renderAllQTs();
        recalcTotals();
        _setModalMode(true, oppId);
        getBsModal().show();
    }

    // ── Public: open duplicate ───────────────────────────────────────────────
    async function openDuplicate(oppId) {
        resetForm();
        _editingId = null;
        await loadHelpers();

        const { data: opp, error } = await supabaseClient.from('b_opportunity_list').select('*').eq('opportunity_id', oppId).single();
        if (error || !opp) { notify('', 'Load failed', 'error'); return; }

        el('bopp-account-id').value = opp.account_id || '';
        const acc = _accounts.find(a => a.account_id === opp.account_id);
        if (acc) { el('bopp-acc-name').value = acc.account_name || ''; populateCompanies(acc.account_name, opp.account_id); }

        [['bopp-opp-name','opportunity_name'],['bopp-type','business_type'],['bopp-lead','lead_source'],
         ['bopp-owner','owner'],['bopp-am','am'],['bopp-subam','sub_am'],
         ['bopp-materials','materials'],['bopp-proposal','proposal'],['bopp-campaign','campaign'],['bopp-remark','remark']]
            .forEach(([id, field]) => { el(id).value = opp[field] || ''; });
        ['bopp-type','bopp-lead','bopp-owner','bopp-am','bopp-subam'].forEach(syncBoppPickerTrigger);

        signedDatePicker.setValue(opp.signed_date ? String(opp.signed_date).slice(0,10) : null);
        launchDatePicker.setValue(opp.launch_date ? String(opp.launch_date).slice(0,10) : null);

        // Copy QT items in full (bu/detail/qty/price/discount/gp) — only qt_number resets,
        // since each quotation needs its own fresh number
        const { data: qts } = await supabaseClient.from('b_opportunity_qt')
            .select('*, b_opportunity_qt_item(*)')
            .eq('opportunity_id', oppId)
            .order('qt_number');
        const origQTs = (qts || []).filter(q => q.qt_type !== 'churn');

        if (origQTs.length) {
            origQTs.forEach(qt => {
                _qtCounter++;
                // amount re-derived from qty/price/discount, not trusted
                // from the stored column — see the same note in openEdit's
                // item mapping above.
                const items = (qt.b_opportunity_qt_item || [])
                    .sort((a,b) => (a.no||0)-(b.no||0))
                    .map(i => { const qty = +i.qty||1, price = +i.price||0, discount = +i.discount||0;
                        return { item_id: null, bu: i.bu||'', detail: i.detail||'', qty, price, discount, amount: Math.max(0, qty*price-discount), gp: +i.gp||0 }; });
                _qts.push({ tmpId: `qt-${_qtCounter}`, qt_id: null, qt_number: '', company_qt: qt.company_qt || '',
                    items: items.length ? items : [newItem()],
                    _totAmt: items.reduce((s,i) => s+(+i.amount||0), 0),
                    _totGP:  items.reduce((s,i) => s+(+i.gp||0), 0) });
            });
            renderAllQTs();
            recalcTotals();
        } else {
            addQT();
        }

        _setModalMode(false);
        getBsModal().show();
    }

    // ── DB helpers ────────────────────────────────────────────────────────────
    async function _deleteOppQTs(oppId) {
        const { data: oldQts } = await supabaseClient.from('b_opportunity_qt').select('qt_id').eq('opportunity_id', oppId);
        if (oldQts?.length) {
            const qtIds = oldQts.map(q => q.qt_id);
            await supabaseClient.from('b_opportunity_qt_item').delete().in('qt_id', qtIds);
            await supabaseClient.from('b_finance_qt').delete().in('qt_id', qtIds);
            await supabaseClient.from('b_opportunity_qt').delete().eq('opportunity_id', oppId);
        }
    }

    async function _deleteChurnQTs(oppId) {
        const { data: rows } = await supabaseClient.from('b_opportunity_qt').select('qt_id').eq('opportunity_id', oppId).eq('qt_type', 'churn');
        if (rows?.length) {
            await supabaseClient.from('b_opportunity_qt_item').delete().in('qt_id', rows.map(q => q.qt_id));
            await supabaseClient.from('b_opportunity_qt').delete().in('qt_id', rows.map(q => q.qt_id));
        }
    }

    // b_opportunity_qt_item.amount is a generated column (STORED, computed
    // by Postgres as GREATEST(0, qty*price - discount)) — never include it
    // in an insert/update payload to this table anywhere in this file.
    // item.amount still gets computed client-side (see the input handler
    // and openEdit/openDuplicate's item mapping) purely for the modal's own
    // running totals while editing; it's just never sent to the DB.
    async function insertQTToDB(oppId, qt, qtType = 'original') {
        const validItems = qt.items.filter(i => i.detail.trim() || +i.price > 0 || +i.qty > 1);
        if (!qt.qt_number.trim() && !validItems.length) return;
        const { data: qtRow, error: qtErr } = await supabaseClient.from('b_opportunity_qt')
            .insert({ opportunity_id: oppId, qt_number: qt.qt_number.trim() || null, company_qt: qt.company_qt || null, qt_type: qtType })
            .select('qt_id').single();
        if (qtErr) throw qtErr;
        // amount is intentionally omitted here — it's a generated column
        // (STORED AS qty*price - discount) on the target schema, computed
        // by the DB itself and rejected if a value is explicitly sent. See
        // the note above insertQTToDB for the reasoning.
        const itemRows = qt.items
            .filter(i => i.detail.trim() || +i.price > 0)
            .map((i, idx) => ({ qt_id: qtRow.qt_id, no: idx+1, bu: i.bu||null, detail: i.detail.trim()||null, qty: +i.qty||null, price: +i.price||null, discount: +i.discount||null, gp: +i.gp||null }));
        if (itemRows.length) {
            const { error: itemErr } = await supabaseClient.from('b_opportunity_qt_item').insert(itemRows);
            if (itemErr) throw itemErr;
        }
        if (qtType === 'original') {
            const saleAmt = qt.items.reduce((s,i) => s + (+i.amount||0), 0);
            // quotation_sub and detail both left blank — matches
            // b-finance-list.html's own Add Sub behavior (no auto-generated
            // values), user fills them in themselves.
            supabaseClient.from('b_finance_qt')
                .insert({ qt_id: qtRow.qt_id, sub_index: 1, quotation_sub: null, actual_amount: saleAmt || null, detail: null })
                .then(({ error }) => { if (error) console.warn('[finance auto-create]', error); });
        }
    }

    async function _saveOppQTs(oppId, qts) {
        const { data: existingQTs } = await supabaseClient
            .from('b_opportunity_qt').select('qt_id').eq('opportunity_id', oppId).eq('qt_type', 'original');
        const existingIds = new Set((existingQTs || []).map(q => q.qt_id));
        const keepIds    = new Set(qts.filter(q => q.qt_id).map(q => q.qt_id));

        // Delete QTs removed from modal
        const toDelete = [...existingIds].filter(id => !keepIds.has(id));
        if (toDelete.length) {
            await supabaseClient.from('b_opportunity_qt_item').delete().in('qt_id', toDelete);
            await supabaseClient.from('b_finance_qt').delete().in('qt_id', toDelete);
            await supabaseClient.from('b_opportunity_qt').delete().in('qt_id', toDelete);
        }

        for (const qt of qts) {
            const saleAmt = qt.items.reduce((s,i) => s + (+i.amount||0), 0);
            const qtNum   = qt.qt_number.trim() || null;

            if (qt.qt_id) {
                // Update existing QT in place
                await supabaseClient.from('b_opportunity_qt')
                    .update({ qt_number: qtNum, company_qt: qt.company_qt || null })
                    .eq('qt_id', qt.qt_id);

                // Replace items (no downstream dependency)
                await supabaseClient.from('b_opportunity_qt_item').delete().eq('qt_id', qt.qt_id);
                const itemRows = qt.items
                    .filter(i => i.detail.trim() || +i.price > 0)
                    .map((i, idx) => ({ qt_id: qt.qt_id, no: idx+1, bu: i.bu||null, detail: i.detail.trim()||null, qty: +i.qty||null, price: +i.price||null, discount: +i.discount||null, gp: +i.gp||null }));
                if (itemRows.length) await supabaseClient.from('b_opportunity_qt_item').insert(itemRows);

                // Sync finance row only if still empty
                const { data: finRows } = await supabaseClient
                    .from('b_finance_qt')
                    .select('sub_index, invoice, bill_date, receipt_no, receipt_date, remark')
                    .eq('qt_id', qt.qt_id);
                const isEmpty = finRows?.length === 1
                    && !finRows[0].invoice && !finRows[0].bill_date
                    && !finRows[0].receipt_no && !finRows[0].receipt_date && !finRows[0].remark;
                if (isEmpty) {
                    const oppName = el('bopp-opp-name')?.value?.trim() || null;
                    supabaseClient.from('b_finance_qt')
                        .update({ actual_amount: saleAmt || null, quotation_sub: qtNum || qt.qt_id, detail: oppName })
                        .eq('qt_id', qt.qt_id)
                        .then(({ error }) => { if (error) console.warn('[finance sync]', error); });
                }
            } else {
                // New QT
                await insertQTToDB(oppId, qt, 'original');
            }
        }
    }

    // Re-draws attention to a field already marked .is-invalid from a
    // previous submit attempt — picker-wrapped fields (Company, QT
    // Company, BU) style their visible trigger via a :has(.is-invalid)
    // CSS rule on the wrap, not on the hidden <select> itself, so the
    // wrap is what needs to visibly shake, not el.
    function shakeInvalid(el) {
        if (!el) return;
        const target = el.closest('.bopp-company-wrap, .bopp-qt-co-wrap, .bopp-item-sel-wrap') || el;
        target.classList.remove('bopp-shake');
        void target.offsetHeight;
        target.classList.add('bopp-shake');
        target.addEventListener('animationend', () => target.classList.remove('bopp-shake'), { once: true });
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        el('bopp-form').classList.add('was-validated');
        // manual check: account + company (disabled/readonly ไม่ถูก checkValidity จับ)
        const accInp = el('bopp-acc-name'), compSel = el('bopp-company-sel');
        if (!el('bopp-account-id').value) {
            accInp.classList.add('is-invalid');
            accInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
            shakeInvalid(accInp);
            return;
        }
        accInp.classList.remove('is-invalid');
        if (!compSel.value) {
            compSel.classList.add('is-invalid');
            compSel.scrollIntoView({ behavior: 'smooth', block: 'center' });
            compSel.focus();
            shakeInvalid(compSel);
            return;
        }
        compSel.classList.remove('is-invalid');
        if (!el('bopp-form').checkValidity()) {
            const first = el('bopp-form').querySelector(':invalid');
            if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus(); shakeInvalid(first); }
            return;
        }
        const activeQTs = isChurnMode() ? _churnQTs : _qts;
        // Churn's "ALL" state (everything churned, nothing remaining) is
        // represented by an intentionally EMPTY _churnQTs (see
        // setChurnAllMode) — this check only guards the normal/ITEMS case
        // where a genuinely empty QT list means the user forgot to add one.
        if (!activeQTs.length && !isChurnMode()) { notify('','Please add at least 1 QT', 'warning'); return; }
        const qtContainer = el('bopp-qt-container');
        // รอบ 1: ชื่อ QT
        let firstEmptyName = null;
        activeQTs.forEach(qt => {
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            const numInp = card?.querySelector('.bopp-qt-num');
            if (numInp && !numInp.value.trim()) { numInp.classList.add('is-invalid'); if (!firstEmptyName) firstEmptyName = numInp; }
        });
        if (firstEmptyName) { firstEmptyName.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstEmptyName.focus(); shakeInvalid(firstEmptyName); return; }
        // รอบ 1.5: Company QT
        let firstEmptyCoQT = null;
        activeQTs.forEach(qt => {
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            const coSel = card?.querySelector('.bopp-qt-co');
            if (coSel && !coSel.value) { coSel.classList.add('is-invalid'); if (!firstEmptyCoQT) firstEmptyCoQT = coSel; }
        });
        if (firstEmptyCoQT) { firstEmptyCoQT.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstEmptyCoQT.focus(); shakeInvalid(firstEmptyCoQT); return; }
        // รอบ 1.6: BU ในทุก item — every item row that exists is required
        // to have a BU, no exceptions for "it's still blank so it doesn't
        // count yet". A row nobody wants gets deleted (the trash button),
        // not left half-filled and silently dropped at save time.
        let firstEmptyBU = null;
        activeQTs.forEach(qt => {
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            qt.items.forEach((item, idx) => {
                if (!item.bu) {
                    const row = card?.querySelector(`tr[data-qt="${qt.tmpId}"][data-item="${idx}"]`);
                    const buSel = row?.querySelector('.bopp-item-sel[data-field="bu"]');
                    if (buSel) { buSel.classList.add('is-invalid'); if (!firstEmptyBU) firstEmptyBU = buSel; }
                }
            });
        });
        if (firstEmptyBU) { firstEmptyBU.scrollIntoView({ behavior: 'smooth', block: 'center' }); firstEmptyBU.focus(); shakeInvalid(firstEmptyBU); return; }
        // รอบ 2: ยอดเงิน — same rule as BU: every item row needs its own
        // price, not just "the QT's total adds up to something" (that let
        // an extra blank row ride along silently as long as some other
        // item covered the total). Checks every item in every QT, not
        // just the first QT that has a problem.
        for (const qt of activeQTs) {
            const idx = qt.items.findIndex(i => !(+i.price > 0));
            if (idx < 0) continue;
            const card = qtContainer.querySelector(`[data-qt-card="${qt.tmpId}"]`);
            const priceInp = card?.querySelector(`tr[data-qt="${qt.tmpId}"][data-item="${idx}"] .bopp-item-inp[data-field="price"]`);
            if (priceInp) {
                priceInp.classList.add('is-invalid');
                priceInp.scrollIntoView({ behavior: 'smooth', block: 'center' });
                priceInp.focus();
                shakeInvalid(priceInp);
            } else {
                card?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        const user = getBxUser();
        const saveBtn = el('bopp-btn-save');
        saveBtn.disabled = true;

        const grandAmt = activeQTs.reduce((s,qt) => s + qt.items.reduce((ss,i) => ss + (+i.amount||0), 0), 0);
        const grandGP  = activeQTs.reduce((s,qt) => s + qt.items.reduce((ss,i) => ss + (+i.gp||0), 0), 0);

        const payload = {
            account_id:       el('bopp-account-id').value,
            opportunity_name: el('bopp-opp-name').value.trim(),
            business_type:    el('bopp-type').value    || null,
            lead_source:      el('bopp-lead').value    || null,
            owner:            el('bopp-owner').value   || null,
            am:               el('bopp-am').value      || null,
            sub_am:           el('bopp-subam').value   || null,
            signed_date:      el('bopp-signed').value      || null,
            launch_date:      el('bopp-launch').value      || null,
            churn_date:       isChurnMode() ? (_churnDate || new Date().toISOString().slice(0,10)) : null,
            materials:        el('bopp-materials').value.trim() || null,
            proposal:         el('bopp-proposal').value.trim()  || null,
            campaign:         el('bopp-campaign').value.trim()  || null,
            remark:           el('bopp-remark').value.trim()    || null,
            total_amount:     grandAmt,
            total_gp:         grandGP,
        };

        let _newOppId = null;
        try {
            let oppId = _editingId;
            if (_editingId) {
                payload.status      = el('bopp-status-sel').value;
                payload.update_by   = user?.codename || null;
                payload.update_date = new Date().toISOString();
                const { error } = await supabaseClient.from('b_opportunity_list').update(payload).eq('opportunity_id', _editingId);
                if (error) throw error;

                if (isChurnMode()) {
                    await _deleteChurnQTs(_editingId);
                    const { data: existingOrig } = await supabaseClient.from('b_opportunity_qt').select('qt_id').eq('opportunity_id', _editingId).eq('qt_type', 'original');
                    if (!existingOrig?.length) {
                        for (const qt of _qts) await insertQTToDB(oppId, qt, 'original');
                    }
                    for (const qt of _churnQTs) await insertQTToDB(oppId, qt, 'churn');
                } else {
                    await _saveOppQTs(oppId, _qts);
                }
            } else {
                const now = new Date().toISOString();
                payload.status      = 'Active';
                payload.create_by   = user?.codename || null;
                payload.create_date = now;
                payload.update_by   = user?.codename || null;
                payload.update_date = now;
                const { data, error } = await supabaseClient.from('b_opportunity_list').insert(payload).select('opportunity_id').single();
                if (error) throw error;
                oppId = data.opportunity_id;
                _newOppId = oppId;
                for (const qt of _qts) await insertQTToDB(oppId, qt, 'original');
                // New-Opportunity email notification — disabled 2026-10-14
                // at the user's request (recipient was hardcoded to
                // thitiphon@brand-strom.com with no way to configure it from
                // the UI). The send-notification Edge Function itself is
                // untouched/still deployed, so this can be re-enabled by
                // uncommenting once there's a real configurable recipient.
                /*
                fetch(`${SUPABASE_URL}/functions/v1/send-notification`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        opportunity_id:   oppId,
                        opportunity_name: payload.opportunity_name,
                        create_by:        user?.codename || null,
                        create_date:      payload.create_date,
                        account_name:     el('bopp-acc-name').value,
                        company_name:     _accounts.find(a => a.account_id === el('bopp-account-id').value)?.company_name || null,
                        launch_date:      payload.launch_date,
                        signed_date:      payload.signed_date,
                        remark:           payload.remark,
                        business_type:    payload.business_type,
                        lead_source:      payload.lead_source,
                        owner:            payload.owner,
                        am:               payload.am,
                        sub_am:           payload.sub_am,
                        materials:        payload.materials,
                        proposal:         payload.proposal,
                        amount:           grandAmt,
                        gp:               grandGP,
                        qts:              _qts.map(q => ({
                            qt_number:  q.qt_number,
                            company_qt: q.company_qt,
                            _totAmt:    q._totAmt,
                            _totGP:     q._totGP,
                            items:      q.items,
                        })),
                        to: ['thitiphon@brand-strom.com'],
                    }),
                }).catch(err => console.warn('[notify]', err));
                */
            }

            getBsModal().hide();
            notify('Success', _editingId ? 'Saved' : 'Opportunity created', 'success');
            _editingId = null;
            _loaded = false;
            if (typeof loadMasterData === 'function') await loadMasterData();
            if (typeof applyFilters  === 'function')  applyFilters();
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error('[B-OPP modal]', err);
            if (_newOppId) await supabaseClient.from('b_opportunity_list').delete().eq('opportunity_id', _newOppId);
            notify('Error', err?.message || 'Save failed', 'error');
        } finally {
            saveBtn.disabled = false;
        }
    }

    // ── Delete ────────────────────────────────────────────────────────────────
    async function handleDelete() {
        if (!_editingId) return;
        const oppName = el('bopp-opp-name').value.trim();
        const { isConfirmed } = await Swal.fire({
            title: 'Delete Opportunity',
            html: `<div style="font-weight:700;">${_editingId}</div>${oppName ? `<div style="margin-top:4px;">${escH(oppName)}</div>` : ''}`,
            icon: 'warning', showCancelButton: true, confirmButtonText: 'Delete',
            confirmButtonColor: '#ef4444', cancelButtonText: 'Cancel'
        });
        if (!isConfirmed) return;
        try {
            await _deleteOppQTs(_editingId);
            const { error } = await supabaseClient.from('b_opportunity_list').delete().eq('opportunity_id', _editingId);
            if (error) throw error;
            getBsModal().hide();
            notify('Success', 'Deleted', 'success');
            const delId = _editingId;
            _editingId = null;
            _loaded = false;
            if (typeof _searchIndex !== 'undefined') _searchIndex.delete(delId);
            if (typeof applyFilters === 'function') applyFilters();
        } catch (err) {
            console.error('[B-OPP modal]', err);
            notify('Error', 'Delete failed', 'error');
        }
    }

    el('bopp-form').addEventListener('submit', handleSubmit);
    el('bopp-btn-del').addEventListener('click', handleDelete);
    el('b-opp-modal').addEventListener('hidden.bs.modal', () => { _editingId = null; });
    // Bootstrap already locks body scroll via its own .modal-open class,
    // but SweetAlert2 (save/error toasts fired while this modal is open)
    // manages document.body.style.overflow independently and can stomp
    // on Bootstrap's lock when it closes — this shared, reference-counted
    // lock keeps the background from scrolling regardless of which
    // library's cleanup runs last.
    el('b-opp-modal').addEventListener('shown.bs.modal', lockBodyScroll);
    el('b-opp-modal').addEventListener('hidden.bs.modal', unlockBodyScroll);
    // A select-picker popover is appended to <body>, not this modal, and
    // only closes itself on an outside click/scroll — Escape (Bootstrap's
    // default data-bs-keyboard, not disabled here) closes the modal
    // directly with no click event at all, so a picker left open when that
    // happens would otherwise leak: an orphaned panel still floating after
    // the modal is gone, plus its document click/scroll listeners never
    // torn down.
    el('b-opp-modal').addEventListener('hidden.bs.modal', () => { if (typeof closeSelectPicker === 'function') closeSelectPicker(); });

    function setChurnDate(v) { _churnDate = v; }
    return { openNew, openEdit, openDuplicate, openOverlay, closeOverlay, addQT, addItem, removeItem, removeQT, dupQT, undo, setChurnDate, setChurnAllMode, openBoppPicker, openBoppItemPicker };
})();
