const B_QUEST_MODAL_HTML = `
<style>
    #b-quest-modal .modal-content { background: #f8fafc; border-radius: 24px; border: none; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.14); }
    .bq-modal-1000 { max-width: 1000px !important; }

    /* ── Header ── */
    .bq-modern-header { background: #fff; padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; }
    .bq-header-title { display: none; }
    /* Was plain Bootstrap .btn-close (no custom hover) — matches the same
       close-button recipe used everywhere else (Add Member, Column Filter). */
    .bq-modal-close { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #94a3b8; transition: 0.2s; flex-shrink: 0; }
    .bq-modal-close:hover { background: #e2e8f0; color: var(--c-dark, #1e293b); }

    /* Task ID pill — shown only when editing an existing task (a new one
       has no id yet), sits beside the Owner block. Ref b-quest-view.html's
       own .bqv-id-badge — same pill so a task's id reads the same way in
       both places instead of inventing a second convention for it here. */
    .bq-header-left { display: flex; align-items: center; gap: 10px; }
    .bq-modal-id-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.68rem; font-weight: 800; color: var(--c-accent-dark); letter-spacing: 0.6px; background: var(--c-accent-light); border-radius: 20px; padding: 6px 12px; }
    .bq-owner-wrap { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 14px 7px 8px; }
    /* Circular, matching the person-avatar convention used elsewhere
       (e.g. Add Member modal) — a rounded square here read as a generic
       icon badge rather than "this represents a person". Shows the
       owner's real photo when they have one (setModalOwnerAvatar()),
       falls back to initials, or the generic bi-person-fill icon before
       any owner is known at all. */
    .bq-owner-icon { width: 28px; height: 28px; background: var(--c-accent-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: var(--c-accent-dark); flex-shrink: 0; overflow: hidden; }
    .bq-owner-icon img { width: 100%; height: 100%; object-fit: cover; }
    .bq-owner-icon span { font-size: 0.62rem; }
    .bq-owner-label { font-size: 0.52rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; line-height: 1; margin-bottom: 2px; }
    .bq-owner-name { font-size: 0.82rem; font-weight: 700; color: var(--c-dark, #1e293b); line-height: 1; }

    /* ── Body ── */
    .bq-modern-body { padding: 20px 28px; }
    /* CSS alone can't cap one column's height to match a *shorter*
       sibling's natural height — stretch only pulls short content up to
       match tall content, never the other way. So the right column's
       max-height is set in JS (syncRoleColHeight, measured off the left
       glass-card once the modal is actually visible) instead of anything
       expressible here. */
    .bq-main-row { display: flex; align-items: flex-start; }
    .bq-role-col-wrap { position: relative; }
    .bq-role-col { overflow-y: auto; padding-right: 4px; }
    /* Bottom fade — only shown while there's actually more to scroll to
       (toggled via JS, not just "always on"), same idea as the horizontal
       fade edges used elsewhere in this app's carousels. */
    .bq-role-col-wrap::after { content: ''; position: absolute; left: 0; right: 4px; bottom: 0; height: 34px; background: linear-gradient(to top, #f8fafc, transparent); pointer-events: none; opacity: 0; transition: opacity 0.2s; border-radius: 0 0 6px 6px; }
    .bq-role-col-wrap.has-scroll::after { opacity: 1; }

    /* Left card */
    .bq-glass-card { background: #fff; border-radius: 18px; padding: 20px; border: 1px solid #eef2f7; height: 100%; display: flex; flex-direction: column; box-shadow: 0 2px 8px -2px rgba(0,0,0,0.04); }
    .bq-label-modern { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
    .bq-input-modern { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 12px; font-size: 0.85rem; color: #334155; margin-bottom: 10px; text-align-last: center; height: 35px; transition: 0.2s; font-family: inherit; }
    .bq-input-modern:hover { border-color: var(--c-accent); }
    .bq-input-modern:focus { outline: none; border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .was-validated .bq-input-modern:invalid { border-color: #dc3545 !important; background-color: #fff8f8; }
    /* ── Links + Publish Date row (renderLinkZone) ──
       mode-0: no links on → Publish Date takes the whole row.
       mode-btn: 1-3 links → one button per link sharing the space, date
       kept at a fixed width so it doesn't change size with the setting. */
    .bq-link-date-row { display: flex; gap: 16px; align-items: flex-end; margin-bottom: 10px; }
    .bq-link-zone { flex: 1 1 0; min-width: 0; }
    .bq-date-zone { flex: 1 1 0; min-width: 0; }
    .bq-link-date-row.mode-0 .bq-link-zone { display: none; }
    .bq-link-date-row.mode-btn .bq-date-zone { flex: 0 0 130px; }
    @media (max-width: 767.98px) {
        .bq-link-date-row { flex-wrap: wrap; }
        .bq-link-date-row .bq-link-zone, .bq-link-date-row .bq-date-zone { flex: 1 1 100% !important; }
    }
    .bq-link-btns { display: flex; gap: 6px; }
    .bq-link-btn { flex: 1 1 0; min-width: 0; height: 35px; display: flex; align-items: center; justify-content: center; gap: 5px; padding: 0 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; font-family: inherit; font-size: 0.8rem; font-weight: 700; color: #64748b; cursor: pointer; transition: 0.2s; }
    .bq-link-btn i { flex-shrink: 0; font-size: 0.95rem; }
    .bq-link-btn .bq-link-text { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .bq-link-btn:hover, .bq-link-btn.is-open { border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bq-link-btn.is-filled { background: var(--c-accent-light); border-color: var(--c-accent); color: var(--c-accent-dark); }

    .bq-link-pop { position: fixed; z-index: 1200; display: none; flex-direction: column; gap: 8px; width: min(440px, calc(100vw - 32px)); background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 12px; box-shadow: 0 12px 32px rgba(15,23,42,0.16); }
    .bq-link-pop.show { display: flex; }
    .bq-link-pop-label { font-size: 0.6rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    /* Wraps instead of scrolling sideways — most links (Drive, Figma) are
       far longer than one line, and seeing the whole URL is how you check
       you pasted the right one. ~150 chars visible across 3 lines. */
    .bq-link-pop .bq-input-modern { height: auto; text-align: left; text-align-last: left; resize: none; line-height: 1.45; padding: 8px 12px; word-break: break-all; }
    .bq-link-pop .bq-input-modern.is-invalid { border-color: #dc3545; background: #fff8f8; }
    .bq-link-pop-error { display: none; margin-top: -2px; font-size: 0.72rem; font-weight: 600; color: #dc3545; }
    .bq-link-pop.has-error .bq-link-pop-error { display: block; }
    .bq-link-pop-actions { display: flex; justify-content: space-between; align-items: center; }
    .bq-link-pop-clear { background: none; border: none; padding: 4px 6px; font-family: inherit; font-size: 0.75rem; font-weight: 700; color: #94a3b8; cursor: pointer; border-radius: 6px; }
    .bq-link-pop-clear:hover:not(:disabled) { color: #ef4444; background: #fef2f2; }
    .bq-link-pop-clear:disabled { opacity: 0.4; cursor: default; }
    .bq-link-pop-ok { background: var(--c-dark); color: var(--c-accent); border: none; height: 30px; padding: 0 18px; border-radius: 8px; font-family: inherit; font-size: 0.75rem; font-weight: 800; cursor: pointer; }
    .bq-link-pop-ok:hover { background: #0f172a; }

    .bq-input-detail { flex-grow: 1; min-height: 100px; text-align: left !important; text-align-last: left !important; resize: none; padding-top: 10px; }

    /* Type/Work custom picker — a native <select> can't be restyled (its
       open popup always renders in the OS/browser's own look), so the
       select stays as the real form control (kept "rendered" via
       opacity:0 rather than display:none/visibility:hidden, which the
       constraint-validation spec excludes from validation entirely —
       required would silently stop working) and a styled button drives it
       via .value + a dispatched change event, so every existing onchange
       side effect (Work's weight/day/maxPerDay fill, capacity check) keeps
       firing unchanged. The popup itself (search+list+positioning) is
       /system/select-picker.js's shared component — same one System
       Settings' Department picker uses — so only the trigger button's own
       look needs styling here; .bx-sp-trigger-open (added by that shared
       script while its panel is open) already supplies the accent
       border/glow, same recipe as .bq-input-modern:focus. */
    .bq-picker-wrap { position: relative; margin-bottom: 10px; }
    .bq-picker-wrap .bq-input-modern { position: absolute; inset: 0; opacity: 0; pointer-events: none; margin: 0; }
    /* Same text color whether placeholder or filled — dimming the empty
       state read as "disabled" instead of "click to choose" (a normal
       native <select>'s placeholder isn't grayed out either). The chevron
       is what signals "this is a dropdown", not a faded look. */
    .bq-picker-trigger { position: relative; width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 24px 5px 12px; font-size: 0.85rem; color: #334155; text-align: center; height: 35px; transition: 0.2s; font-family: inherit; cursor: pointer; }
    .bq-picker-trigger::after {
        content: ''; position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
        width: 10px; height: 10px; opacity: 0.5; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%2394a3b8' d='M7.247 11.14 2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }
    .bq-picker-trigger:hover { border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .was-validated .bq-picker-wrap:has(.bq-input-modern:invalid) .bq-picker-trigger { border-color: #dc3545 !important; background-color: #fff8f8; }

    /* Re-triggering validation on a field that's already red (e.g. hit
       Save twice without fixing it) changes nothing visually — nothing
       draws the eye back to it. Same shake idea as b-opportunity-modal.js's
       own shakeInvalid(). */
    @keyframes bq-shake {
        0%,100% { transform: translateX(0); }
        15%     { transform: translateX(-6px); }
        30%     { transform: translateX(6px); }
        45%     { transform: translateX(-4px); }
        60%     { transform: translateX(4px); }
        75%     { transform: translateX(-2px); }
        90%     { transform: translateX(2px); }
    }
    .bq-shake { animation: bq-shake 0.4s ease; }

    /* Search button — a soft accent tint so it still reads as "clickable"
       at a glance (unlike a fully gray/quiet icon button), but restrained
       rather than the old solid lime-highlighter block — blooms into the
       full accent color with a soft glow on hover for a bit of polish. */
    .bq-search-btn { width: 44px; height: 35px; flex-shrink: 0; border: 1px solid var(--c-accent-light); border-left: none; border-radius: 0 10px 10px 0; background: var(--c-accent-light); color: var(--c-accent-dark); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: 0.2s; }
    .bq-search-btn:hover { background: var(--c-accent); color: var(--c-on-accent); border-color: var(--c-accent); box-shadow: 0 4px 14px rgba(var(--c-accent-rgb), 0.35); }

    /* ── Role Cards ── */
    .role-card { background: #fff; border-radius: 18px; border: 1.5px solid #eef2f7; margin-bottom: 16px; overflow: hidden; transition: border-color 0.25s, box-shadow 0.25s; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
    .role-card.disabled { opacity: 0.7; background: #f8fafc; box-shadow: none; }
    .role-card.disabled .role-card-body { display: none; }

    /* Active/accent color comes from each role's own config color, set as
       an inline --role-color custom property per card (see roleCardHtml)
       — roles are admin-managed now, not a fixed Designer/Creative pair,
       so the color can't be baked into CSS by id anymore. */
    .role-card.active { border-color: var(--role-color); box-shadow: 0 4px 16px var(--role-color-15); }
    .role-card.active .role-card-header { background: var(--role-color-08); }

    .role-card-header { padding: 14px 18px; display: flex; align-items: center; gap: 10px; cursor: pointer; border-radius: 18px; transition: background 0.15s, box-shadow 0.15s; }
    .role-card:not(.active):not(.disabled) .role-card-header:hover { background: #f1f5f9; box-shadow: inset 0 -2px 0 #e2e8f0; }
    .role-card.active .role-card-header { border-radius: 18px 18px 0 0; }
    .role-card-title { font-size: 0.85rem; font-weight: 800; color: var(--c-dark, #1e293b); margin: 0; display: flex; align-items: center; gap: 5px; line-height: 1; }
    .role-card-title i.role-icon { color: var(--role-color); }
    /* Toggle */
    .bq-role-toggle-wrap { display: flex; align-items: center; gap: 7px; flex-shrink: 0; line-height: 1; }

    .role-card-body { max-height: 0; padding: 0; overflow: hidden; transition: all 0.35s ease; visibility: hidden; opacity: 0; }
    .role-card.active .role-card-body { max-height: 450px; padding: 14px 16px 16px; border-top: 1px solid #f1f5f9; visibility: visible; opacity: 1; }

    /* Assign badge — interactive pill in role card header */
    .bq-assign-badge { display: none; align-items: center; gap: 5px; border-radius: 8px; padding: 3px 9px 3px 7px; font-size: 0.7rem; font-weight: 700; white-space: nowrap; transition: background 0.15s, border-color 0.15s; }
    .bq-assign-badge.bq-ab-show { display: inline-flex; }
    .bq-assign-badge.bq-ab-clickable { cursor: pointer; }
    .bq-assign-badge.bq-ab-empty { background: transparent; border: 1.5px dashed #cbd5e1; color: #94a3b8; }
    .bq-assign-badge.bq-ab-empty:hover { border-color: #94a3b8; color: #64748b; }
    .bq-assign-badge:not(.bq-ab-empty) { background: var(--role-color-10); color: var(--role-color-text); border: 1px solid var(--role-color-30); }
    .bq-assign-badge.bq-ab-clickable:not(.bq-ab-empty):hover { background: var(--role-color-18); }

    /* Status select — colored per the status's own configured color (set
       inline via updateStatusUI), not a fixed progress/done pair. */
    /* Status colors come entirely from State.statusList (admin-managed —
       any hex an admin picks, not a fixed palette), set as inline styles
       by updateStatusUI. Solid fill + a fixed white ring (not a color-
       matched border) is what makes this survive an arbitrary color
       reliably: the ring keeps the chip crisp against whatever sits
       behind it (the card header's own tint changes when active) without
       needing to compute a second color, and pairing solid fill with a
       proper luminance-based text pick (pickBadgeTextColor) — rather than
       a same-hue pale-tint background + darkened-same-hue text — is what
       actually guarantees readable contrast for light hues like yellow/
       lime, where "same hue, just darker" still reads as washed out. */
    /* flex-shrink:0 — without it, a long role name (e.g. "Performance
       Marketing") squeezes this flex item below its own content's natural
       width inside .role-card-header, wrapping "On Progress" onto two
       lines inside the pill. The status pill must always keep its full
       size; the role title is what should give way and wrap instead. */
    .bq-status-wrap { display: none; margin-left: auto; flex-shrink: 0; }
    .bq-status-select { display: none; }
    .bq-status-trigger { border: 2px solid #fff; border-radius: 20px; font-size: 0.68rem; font-weight: 700; padding: 3px 20px 3px 12px; min-width: 90px; text-align: center; height: 26px; cursor: pointer; font-family: inherit; letter-spacing: 0.3px; transition: transform 0.15s, filter 0.15s; box-shadow: 0 1px 4px rgba(0,0,0,0.18); position: relative; white-space: nowrap; }
    .bq-status-trigger:hover { transform: scale(1.05); filter: brightness(0.97); }
    .bq-status-trigger::after {
        content: ''; position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
        width: 8px; height: 8px; opacity: 0.6; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='currentColor' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }

    /* ── Timeline Zone ── */
    .timeline-zone { background: #f8fafc; border: 1px solid #eef2f7; border-radius: 14px; padding: 12px 12px 10px; height: 100%; display: flex; flex-direction: column; gap: 6px; }

    /* Capacity — progress bar display */
    .bq-cap-info { display: none; }
    .bq-cap-info.visible { display: block; }
    .bq-cap-nums { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .bq-cap-badge { font-size: 0.65rem; font-weight: 800; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; border-radius: 6px; padding: 2px 7px; }
    .bq-cap-badge.over { background: #fef2f2; color: #dc2626; border-color: #fecaca; }
    .bq-cap-frac { font-size: 0.72rem; font-weight: 700; color: #64748b; }
    .bq-cap-frac.over { color: #dc2626; font-weight: 800; }
    /* "(2+1)" breakdown ahead of the "3 / 6" total — smaller/lighter so
       the total stays the number that's scanned first, this is just the
       "where did 3 come from" explanation next to it. The "+1" part is
       colored to match .bq-cap-fill-new inline (same existing/new tie-in
       the bar itself already uses), so the number and the bar segment
       read as the same thing. */
    .bq-cap-breakdown { font-size: 0.62rem; font-weight: 600; color: #94a3b8; margin-right: 3px; }
    /* flex row of two segments — overflow:hidden + the track's own
       border-radius rounds off whichever segment ends up at each edge, so
       neither segment needs its own radius. */
    .bq-cap-track { height: 4px; background: #e2e8f0; border-radius: 10px; overflow: hidden; display: flex; }
    .bq-cap-fill-existing { height: 100%; background: #94a3b8; } /* already booked by other tasks */
    .bq-cap-fill-new { height: 100%; transition: width 0.4s ease, background-color 0.3s; } /* what this save adds */
    /* Per-work daily count limit — separate rule from the role's overall
       capacity bar above (a Work item can cap how many of ITSELF land on
       the same day, regardless of whether points/capacity still have
       room). */
    .bq-cap-worklimit { display: flex; align-items: center; gap: 4px; font-size: 0.65rem; font-weight: 700; color: #64748b; margin-top: 5px; }
    .bq-cap-worklimit.over { color: #dc2626; font-weight: 800; }

    /* Deadline-label info button + popover — shows the raw Weight/Day/Max
       settings behind the selected Work + this role's Max Capacity, so a
       user filling the modal can see the conditions without leaving to
       check Settings. Deliberately just the configured numbers, not the
       computed running-total the capacity bar (.bq-cap-info) above
       already shows — a plain reference card, not a duplicate of that. */
    .bq-info-btn { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; margin-left: 3px; border-radius: 50%; color: #c7c7cc; cursor: pointer; font-size: 0.8rem; vertical-align: -2px; transition: color 0.15s, transform 0.15s; }
    .bq-info-btn:hover { color: var(--c-accent-dark); transform: scale(1.15); }
    /* Frosted-glass surface + a soft, diffuse (not hard-edged) shadow
       stack instead of a visible border — the border used to be what
       separated the panel from the page, now the blur+shadow alone do
       that, which is what reads as "soft"/Apple-like instead of a flat
       white card with a hairline around it. Entrance animation is a
       small scale+fade, same easing feel as a macOS popover/menu. */
    .bq-info-popover { position: fixed; z-index: 10050; background: rgba(255,255,255,0.88); backdrop-filter: blur(26px) saturate(180%); -webkit-backdrop-filter: blur(26px) saturate(180%); border-radius: 20px; box-shadow: 0 0 0 0.5px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.05), 0 24px 60px rgba(0,0,0,0.14); padding: 16px 16px 10px; width: 400px; max-height: 420px; overflow-y: auto; box-sizing: border-box; animation: bqInfoPopIn 0.16s cubic-bezier(.2,.8,.2,1); }
    @keyframes bqInfoPopIn { from { opacity: 0; transform: scale(0.97) translateY(-4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
    .bq-info-popover-title { font-size: 0.62rem; font-weight: 700; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .bq-info-maxcap { font-size: 0.68rem; font-weight: 700; color: var(--c-accent-dark); background: rgba(var(--c-accent-rgb), 0.16); border-radius: 20px; padding: 3px 10px; text-transform: none; letter-spacing: normal; white-space: nowrap; }
    .bq-info-table { width: 100%; border-collapse: collapse; }
    .bq-info-table th { font-size: 0.6rem; font-weight: 700; color: #8e8e93; text-transform: uppercase; letter-spacing: 0.4px; text-align: left; padding: 0 10px 10px 12px; border-bottom: 1px solid rgba(60,60,67,0.1); }
    .bq-info-table th.num, .bq-info-table td.num { text-align: right; }
    .bq-info-table td { font-size: 0.8rem; font-weight: 600; color: #3a3a3c; padding: 10px 10px 10px 12px; border-bottom: 1px solid rgba(60,60,67,0.06); font-variant-numeric: tabular-nums; }
    /* Work name wraps instead of truncating+native-tooltip — the popover
       is wide enough now that most names fit on one line, and the ones
       that don't read fine on two rather than needing a hover to reveal
       the rest (the browser's default title-attribute tooltip box looked
       out of place next to everything else here). */
    .bq-info-table td:first-child { white-space: normal; word-break: break-word; }
    .bq-info-table tr:last-child td { border-bottom: none; }
    /* Selected row reads as a soft floating pill (rounded on both ends,
       not flush to the table's own edges) rather than a full-bleed
       highlight band or a hard accent stripe — closer to how macOS lists
       mark a selection. */
    /* --c-accent-light, not a neutral tint — matches the platform-wide
       hover convention for dropdown/filter/checkbox list items (see
       select-picker.js's own .bx-sp-item:hover), so this reads as part
       of the same app instead of an isolated one-off gray. Rounded the
       same way as the selected-row pill above, so hover previews that
       same shape rather than a square patch against a rounded pill. */
    .bq-info-table tr:not(.is-selected):hover td { background: var(--c-accent-light); }
    .bq-info-table tr:not(.is-selected):hover td:first-child { border-radius: 10px 0 0 10px; }
    .bq-info-table tr:not(.is-selected):hover td:last-child { border-radius: 0 10px 10px 0; }
    .bq-info-table tr.is-selected td { color: var(--c-accent-dark); background: rgba(var(--c-accent-rgb), 0.14); }
    .bq-info-table tr.is-selected td:first-child { border-radius: 10px 0 0 10px; }
    .bq-info-table tr.is-selected td:last-child { border-radius: 0 10px 10px 0; }
    .bq-info-empty { font-size: 0.8rem; font-weight: 600; color: #8e8e93; text-align: center; padding: 18px 0; }

    /* Toggle */
    .bq-toggle { position: relative; display: inline-block; width: 34px; height: 18px; margin: 0; vertical-align: middle; }
    .bq-toggle input { opacity: 0; width: 0; height: 0; }
    .bq-slider { position: absolute; cursor: pointer; inset: 0; background: #cbd5e1; transition: .3s; border-radius: 34px; }
    .bq-slider:before { position: absolute; content: ""; height: 12px; width: 12px; left: 3px; bottom: 3px; background: #fff; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.12); }
    .role-card .bq-toggle input:checked + .bq-slider { background-color: var(--role-color); }
    input:checked + .bq-slider:before { transform: translateX(16px); }
    /* Same glow-ring hover as the identically-named .bq-toggle in Settings
       — was missing here entirely, tinted with the role's own color
       instead of the fixed brand accent since roles aren't a fixed pair. */
    .bq-toggle:hover .bq-slider { box-shadow: 0 0 0 4px rgba(0,0,0,0.06); }
    .bq-toggle:hover input:checked + .bq-slider { box-shadow: 0 0 0 4px var(--role-color-25); }

    /* Search overlay */
    .bq-search-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 10001; display: none; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
    .bq-search-card { background: #fff; width: 480px; max-height: 80vh; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); }
    .bq-search-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--c-border); }
    .bq-search-title { font-size: 1rem; font-weight: 800; color: var(--c-dark); margin: 0; display: flex; align-items: center; gap: 8px; }
    .bq-search-title i { color: var(--c-accent); }
    .bq-uni-search-wrap { position: relative; margin-bottom: 14px; }
    .bq-uni-search { width: 100%; border-radius: 12px; padding: 9px 34px 9px 14px; font-size: 0.85rem; border: 1px solid var(--c-border); outline: none; font-family: inherit; transition: 0.2s; background: var(--c-bg); box-sizing: border-box; }
    .bq-uni-search:focus { border-color: var(--c-accent); background: #fff; box-shadow: none; }
    .bq-uni-clear { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #cbd5e1; cursor: pointer; font-size: 0.85rem; transition: color 0.15s; }
    .bq-uni-clear:hover { color: #94a3b8; }
    /* Borderless, subtle-hover row style for openSearchOverlay's plain
       string rows (account/opportunity names) — no avatar/subtitle, since
       these have no person-like metadata to show. Assign's own rows used
       to live here too (.bq-am-*) but now go through the shared
       b-quest-assign-picker.js component instead — see openAssignPicker()
       below. .bq-am-empty stays: openSearchOverlay's "no results" state
       still uses it. */
    .uni-item-modern { display: flex; align-items: center; border: none; background: none; border-radius: 12px; margin-bottom: 2px; padding: 10px 12px; font-size: 0.85rem; font-weight: 600; text-align: left; cursor: pointer; transition: background 0.15s; color: #334155; width: 100%; font-family: inherit; }
    .uni-item-modern:hover { background: var(--c-accent-light); color: var(--c-accent-dark); }
    #uni-list-container { min-height: 280px; }
    .bq-am-empty { padding: 30px; text-align: center; color: var(--c-muted); font-size: 0.82rem; font-weight: 600; }

    /* ── Footer ── */
    .bq-footer-actions { padding: 14px 28px; display: flex; justify-content: flex-end; gap: 10px; background: #fff; border-top: 1px solid #f1f5f9; }
    .btn-bq-delete { background: #fee2e2; color: #ef4444; border: none; padding: 0 20px; border-radius: 10px; font-weight: 700; height: 40px; font-size: 0.85rem; display: none; cursor: pointer; transition: 0.2s; }
    /* Some lift for consistency with Save Changes, but no spring/scale —
       a dangerous action shouldn't feel inviting to press. */
    .btn-bq-delete:hover { background: #fecaca; transform: translateY(-1px); box-shadow: 0 4px 10px rgba(239,68,68,0.18); }
    .btn-bq-delete:active { transform: translateY(0); box-shadow: none; transition-duration: 0.1s; }

    /* Create/Save — spring hover effect */
    .btn-bq-create { background: var(--c-dark); color: var(--c-accent); border: none; padding: 0 26px; border-radius: 10px; font-weight: 800; height: 40px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
    .btn-bq-create i { font-size: 0.9rem; }
    .btn-bq-create:hover { background: #0f172a; transform: translateY(-2px) scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
    .btn-bq-create:active { transform: translateY(0) scale(0.97); box-shadow: none; transition-duration: 0.1s; }
</style>

<div class="modal fade" id="b-quest-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog bq-modal-1000 modal-dialog-centered">
        <div class="modal-content">
            <div id="bq-search-overlay" class="bq-search-overlay" onclick="BQuestApp.closeSearchOverlay()">
                <div class="bq-search-card" onclick="event.stopPropagation()">
                    <div class="bq-search-header">
                        <h5 class="bq-search-title"><i class="bi bi-search" id="uni-search-icon"></i> <span id="uni-search-title">Select Data</span></h5>
                        <button type="button" class="bq-modal-close" onclick="BQuestApp.closeSearchOverlay()"><i class="bi bi-x"></i></button>
                    </div>
                    <div class="bq-uni-search-wrap">
                        <input type="text" class="bq-uni-search" id="uni-search-input" placeholder="Search...">
                        <i class="bi bi-x-circle-fill bq-uni-clear" id="uni-search-clear" style="display:none;"></i>
                    </div>
                    <div id="uni-list-container" style="overflow-y: auto; flex: 1; padding-right:5px;"></div>
                </div>
            </div>

            <div class="bq-modern-header">
                <div class="bq-header-left">
                    <div class="bq-owner-wrap">
                        <div class="bq-owner-icon" id="modal-owner-icon"><i class="bi bi-person-fill"></i></div>
                        <div>
                            <div class="bq-owner-label">Owner</div>
                            <div class="bq-owner-name" id="modal-owner-display">—</div>
                        </div>
                    </div>
                    <span class="bq-modal-id-badge" id="modal-id-badge" style="display:none;"><i class="bi bi-hash"></i><span id="modal-id-badge-text"></span></span>
                </div>
                <div id="b-quest-modal-label-text" style="display:none;"></div>
                <button type="button" class="bq-modal-close" data-bs-dismiss="modal"><i class="bi bi-x"></i></button>
            </div>

            <form id="b-quest-modal-form" novalidate>
                <input type="hidden" id="b-quest-modal-id" name="id">
                <div class="bq-modern-body">
                    <div class="row g-4 bq-main-row">
                        <div class="col-lg-6">
                            <div class="bq-glass-card">
                                <label class="bq-label-modern">Account Name</label>
                                <div class="d-flex mb-2">
                                    <input type="text" class="bq-input-modern m-0" style="border-radius: 10px 0 0 10px; text-align-last: left;" id="b-quest-modal-account" name="account_name" required>
                                    <button type="button" class="bq-search-btn" onclick="BQuestApp.openSearchOverlay('account_name', 'b-quest-modal-account')"><i class="bi bi-search"></i></button>
                                </div>
                                <label class="bq-label-modern">Opportunity Name</label>
                                <div class="d-flex mb-2">
                                    <input type="text" class="bq-input-modern m-0" style="border-radius: 10px 0 0 10px; text-align-last: left;" id="b-quest-modal-opportunity" name="opportunity_name" required>
                                    <button type="button" class="bq-search-btn" onclick="BQuestApp.openSearchOverlay('opportunity_name', 'b-quest-modal-opportunity')"><i class="bi bi-search"></i></button>
                                </div>
                                <label class="bq-label-modern">Task Name</label>
                                <input type="text" class="bq-input-modern" style="text-align-last: left;" id="b-quest-modal-taskname" name="task_name" required>
                                <div class="bq-link-date-row mode-btn" id="bq-link-date-row">
                                    <!-- Filled by renderLinkZone() on every open, from Settings → Links -->
                                    <div class="bq-link-zone" id="bq-link-zone"></div>
                                    <div class="bq-date-zone">
                                        <label class="bq-label-modern text-center d-block">Publish Date</label>
                                        <input type="text" class="bq-input-modern m-0" id="b-quest-modal-publish-date" name="publish_date" required>
                                    </div>
                                </div>
                                <label class="bq-label-modern">Detail</label>
                                <textarea class="bq-input-modern bq-input-detail m-0" id="b-quest-modal-detail" name="detail"></textarea>
                            </div>
                        </div>

                        <div class="col-lg-6 bq-role-col-wrap" id="bq-role-col-wrap">
                            <!-- Cards generated by renderRoleCards() from b-quest-role,
                                 filtered to roles this user has New on. -->
                            <div class="bq-role-col" id="role-cards-container"></div>
                        </div>
                    </div>
                </div>

                <div class="bq-footer-actions">
                    <button type="button" class="btn-bq-delete" id="btn-delete-task" onclick="handleDeleteTask(document.getElementById('b-quest-modal-id').value)"><i class="bi bi-trash3 me-1"></i> Delete</button>
                    <button type="submit" class="btn-bq-create" id="btn-submit-text">
                        <i class="bi bi-plus-circle-fill" id="btn-submit-icon"></i>
                        <span id="btn-submit-label">Create Task</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
    <!-- Link popover lives inside the modal element (not <body>) for the
         same FocusTrap reason as select-picker.js's panel; position:fixed
         still places it relative to the viewport. -->
    <div class="bq-link-pop" id="bq-link-pop">
        <div class="bq-link-pop-label" id="bq-link-pop-label"></div>
        <textarea class="bq-input-modern m-0" id="bq-link-pop-input" rows="3" maxlength="2000" placeholder="https://..." autocomplete="off" spellcheck="false"></textarea>
        <div class="bq-link-pop-error" id="bq-link-pop-error">Enter a full link starting with http:// or https://</div>
        <div class="bq-link-pop-actions">
            <button type="button" class="bq-link-pop-clear" id="bq-link-pop-clear" onclick="BQuestApp.clearLinkPopover()">Clear</button>
            <button type="button" class="bq-link-pop-ok" onclick="BQuestApp.commitLinkPopover()">OK</button>
        </div>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', B_QUEST_MODAL_HTML);
// Turns the plain input above into a hidden ISO carrier + a visible
// DD-MM-YYYY masked field + calendar icon (see system/date-picker.js).
// Attached once here, not per modal open, same as every other one-time
// init in this file. fillFormData() below uses the returned handle
// instead of the generic field-fill loop, since the element `el()` finds
// by this id is now the hidden field — setting it directly wouldn't
// update what's actually visible.
const publishDatePicker = attachDatePicker(document.getElementById('b-quest-modal-publish-date'));

const BQuestApp = (() => {
    // Task-level fields (account/opportunity/task name/link/date/detail/
    // owner) live on b-quest-list, same as always. Everything role-specific
    // lives in b-quest-task-role, one row per (quest_id, role_id) — no more
    // designer_*/creative_* flat columns, and no more "only these two roles
    // are actually saveable" limitation.
    const State = { capacities: {}, maxCap: {}, maxCapEffective: {}, workCounts: {}, workLimits: {}, assignProfiles: { _loaded: false }, visibleRoles: [], roleNameById: {}, typeList: [], statusList: [], defaultStatusId: null, workdayWeight: null, mergeCompanyHolidays: false, holidays: [], currentRoleRows: {}, allowAssign: false, currentData: null,
        linkCfg: null, // Settings → Links (normalizeQuestLinks), loaded once per page via loadQuestLinkConfig()
        deadlinePickers: {} }; // roleId -> attachDatePicker() handle, rebuilt every renderRoleCards()+setupDropdowns() cycle since role cards are fully re-rendered per modal open
    const el = id => document.getElementById(id);
    const show = (id, condition, display = 'block') => { const e = el(id); if(e) e.style.display = condition ? display : 'none'; };
    // Owner avatar (#modal-owner-icon) — the current user's own avatar_url
    // is already in getBxUser() (new task / duplicate, both owned by
    // whoever's creating them), so only an edit of someone ELSE's task
    // needs a network lookup. Fire-and-forget async: called right after
    // the synchronous modal-owner-display text update at each of its 3
    // call sites, never awaited there — a brief icon fallback→photo swap
    // is fine, same reasoning as applyCachedBranding()/refreshBranding().
    async function setModalOwnerAvatar(codename) {
        const iconEl = el('modal-owner-icon');
        if (!iconEl) return;
        if (!codename) { iconEl.innerHTML = '<i class="bi bi-person-fill"></i>'; return; }
        const cleanName = n => (n || '').replace(/\s*\(.*$/, '');
        const bxUser = getBxUser();
        if (bxUser?.codename === codename) {
            iconEl.innerHTML = bxUser.avatar_url
                ? `<img src="${esc(bxUser.avatar_url)}" alt="">`
                : `<span>${esc(getInitials(cleanName(bxUser.nick_name || bxUser.full_name || codename)))}</span>`;
            return;
        }
        const { data } = await supabaseClient.from('profiles').select('avatar_url, nick_name, full_name').eq('codename', codename).maybeSingle();
        iconEl.innerHTML = data?.avatar_url
            ? `<img src="${esc(data.avatar_url)}" alt="">`
            : `<span>${esc(getInitials(cleanName(data?.nick_name || data?.full_name || codename)))}</span>`;
    }
    // Work names reach the Capacity Settings popover (openCapSettingsInfo)
    // as raw DB text rendered via innerHTML — everywhere else in this file
    // that inserts a Work/role name uses new Option()/.textContent, which
    // the browser escapes on its own, so this wasn't needed until now.
    const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    const BQuestService = {
        async getQuestById(id) {
            const { data, error } = await supabaseClient.from('b_quest_list').select('*').eq('id', id).single();
            return error ? null : data;
        },
        async getTaskRoles(questId) {
            const { data } = await supabaseClient.from('b_quest_task_role').select('*').eq('quest_id', questId);
            return data || [];
        },
        async loadProfiles() {
            if (State.assignProfiles._loaded) return;
            // Candidates to assign work TO — only members who can Accept
            // work in that role, not everyone who merely has a row for it
            // (e.g. someone with only Edit/Delete on a role isn't
            // necessarily willing/able to take on new work in it).
            const { data: memberRoles } = await supabaseClient.from('b_quest_member_role').select('codename, role_id').eq('accept', true);
            const codenames = [...new Set((memberRoles || []).map(r => r.codename))];
            const { data: profiles } = codenames.length
                ? await supabaseClient.from('profiles').select('codename, nick_name, full_name, department, avatar_url').in('codename', codenames)
                : { data: [] };
            const profileByCodename = Object.fromEntries((profiles || []).map(p => [p.codename, p]));
            (memberRoles || []).forEach(r => {
                if (!r.role_id) return;
                (State.assignProfiles[r.role_id] ||= []).push(profileByCodename[r.codename] || { codename: r.codename });
            });
            State.assignProfiles._loaded = true;
        },
        async loadTypes() {
            if (State.typeList.length) return;
            const { data } = await supabaseClient.from('b_quest_type').select('name').eq('active', true).order('sort_order');
            State.typeList = data || [];
        },
        async loadStatuses() {
            if (State.statusList.length) return;
            const [{ data }, { data: cfg }] = await Promise.all([
                supabaseClient.from('b_quest_status').select('id, name, color').eq('active', true).order('sort_order'),
                supabaseClient.from('b_quest_setting').select('value').eq('rule', 'default_status_id').maybeSingle()
            ]);
            State.statusList = data || [];
            State.defaultStatusId = cfg?.value || null;
        },
        // Per-weekday % of a role's normal daily capacity — set in
        // Settings' Daily Capacity section. Missing/unset days default to
        // 100% (full capacity), same default the Settings page itself uses.
        // Also loads the company holiday list when "Include Holidays" is
        // OFF (merge_company_holidays true) — a holiday date overrides the
        // weekday % entirely (full day = 0%, half day = flat 50%) instead
        // of being counted at its normal weekday rate. Holiday data lives
        // in the system-level `holiday` table (system/setting.html), not a
        // B-Quest one, since it's meant to be reused by other projects too.
        async loadWorkdayWeight() {
            if (State.workdayWeight) return;
            const [{ data }, { data: mergeCfg }] = await Promise.all([
                supabaseClient.from('b_quest_setting').select('value').eq('rule', 'workday_weight').maybeSingle(),
                supabaseClient.from('b_quest_setting').select('value').eq('rule', 'merge_company_holidays').maybeSingle(),
            ]);
            State.workdayWeight = { mon: 100, tue: 100, wed: 100, thu: 100, fri: 100, sat: 100, sun: 100, ...(data?.value || {}) };
            State.mergeCompanyHolidays = mergeCfg?.value === true;
            if (State.mergeCompanyHolidays) {
                const { data: holidays } = await supabaseClient.from('holiday').select('date_from, date_to, day_type');
                State.holidays = holidays || [];
            }
        }
    };

    // Roles the current user can actually open (has New on) — a role
    // without that permission just never gets a card, not a disabled one.
    async function loadVisibleRoles() {
        // Unfiltered — a deactivated role can still be on an existing
        // task's data, and State.roleNameById has to resolve it (for the
        // delete-scope check below, and canBquestActOnRole in general) or
        // that task silently loses Edit/Delete for everyone. The active +
        // 'new'-permission filtering only applies to which roles get an
        // actual CARD in this modal (State.visibleRoles), not to the name
        // lookup itself.
        const { data } = await supabaseClient.from('b_quest_role').select('id, name, color, icon, max_capacity, active').order('sort_order');
        State.roleNameById = Object.fromEntries((data || []).map(r => [r.id, r.name]));
        State.visibleRoles = (data || []).filter(r => r.active !== false && (typeof canBquestEditRole !== 'function' || canBquestEditRole(r.name, 'new')));
        State.visibleRoles.forEach(r => { State.maxCap[r.id] = r.max_capacity ?? 10; });
    }

    // Falls back to the first (sort_order'd) status whenever the configured
    // default is unset or points at a status that's since been
    // deactivated/deleted.
    function getDefaultStatusId() {
        return State.statusList.some(s => s.id === State.defaultStatusId) ? State.defaultStatusId : State.statusList[0]?.id;
    }


    // hexToRgba()/hexToRgbParts()/yiqLuma()/pickBadgeTextColor()/
    // pickTintTextColor() are now shared helpers in b-quest.js (loaded
    // before this file wherever it's used) — were identical local copies
    // here.

    function roleCardHtml(role) {
        const c = role.color || '#64748b';
        const vars = `--role-color:${c}; --role-color-text:${pickTintTextColor(c)}; --role-color-08:${hexToRgba(c,0.08)}; --role-color-10:${hexToRgba(c,0.1)}; --role-color-15:${hexToRgba(c,0.15)}; --role-color-18:${hexToRgba(c,0.18)}; --role-color-25:${hexToRgba(c,0.25)}; --role-color-30:${hexToRgba(c,0.3)};`;
        const defaultId = getDefaultStatusId();
        const statusOptions = State.statusList.map(s => `<option value="${s.id}" ${s.id === defaultId ? 'selected' : ''}>${esc(s.name)}</option>`).join('');
        return `
        <div id="card-${role.id}" class="role-card" style="${vars}">
            <div class="role-card-header">
                <div class="bq-role-toggle-wrap">
                    <label class="bq-toggle"><input type="checkbox" id="check-${role.id}" onchange="BQuestApp.updateRoleUI('${role.id}')"><span class="bq-slider"></span></label>
                </div>
                <div class="role-card-title"><i class="bi ${role.icon || 'bi-person-workspace'} ms-1 me-1 role-icon"></i> ${esc(role.name)}</div>
                <span class="bq-assign-badge" id="badge-assign-${role.id}"></span>
                <div class="bq-status-wrap" id="b-quest-modal-${role.id}-status-wrap">
                    <select class="bq-status-select" id="b-quest-modal-${role.id}-status" onchange="BQuestApp.updateStatusUI(this)">
                        ${statusOptions}
                    </select>
                    <button type="button" class="bq-status-trigger" onclick="BQuestApp.openBqPicker(this, 'b-quest-modal-${role.id}-status')"></button>
                </div>
            </div>
            <div class="role-card-body">
                <div class="row g-3">
                    <div class="col-6">
                        <label class="bq-label-modern">Type</label>
                        <div class="bq-picker-wrap">
                            <select class="bq-input-modern" id="b-quest-modal-${role.id}-type"></select>
                            <button type="button" class="bq-picker-trigger placeholder" id="b-quest-modal-${role.id}-type-trigger" onclick="BQuestApp.openBqPicker(this, 'b-quest-modal-${role.id}-type')">Select...</button>
                        </div>
                        <label class="bq-label-modern">Work</label>
                        <div class="bq-picker-wrap m-0">
                            <select class="bq-input-modern" id="b-quest-modal-${role.id}-work"></select>
                            <button type="button" class="bq-picker-trigger placeholder" id="b-quest-modal-${role.id}-work-trigger" onclick="BQuestApp.openBqPicker(this, 'b-quest-modal-${role.id}-work')">Select...</button>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="timeline-zone">
                            <label class="bq-label-modern"><i class="bi bi-calendar3 me-1" style="opacity:0.5"></i>Deadline<i class="bi bi-info-circle bq-info-btn" onclick="BQuestApp.openCapSettingsInfo(event, '${role.id}')" title="Weight / Day / Max settings"></i></label>
                            <input type="date" class="bq-input-modern m-0" id="b-quest-modal-${role.id}-deadline">
                            <div id="${role.id}-capacity-info" class="bq-cap-info"></div>
                        </div>
                    </div>
                </div>
                <input type="hidden" id="b-quest-modal-${role.id}-weight" value="0">
                <input type="hidden" id="b-quest-modal-${role.id}-day" value="1">
                <input type="hidden" id="b-quest-modal-${role.id}-maxperday" value="">
                <input type="hidden" id="b-quest-modal-${role.id}-assign" value="">
            </div>
        </div>`;
    }

    function renderRoleCards() {
        el('role-cards-container').innerHTML = State.visibleRoles.map(roleCardHtml).join('');
        updateRoleColFade();
    }

    // Shows the bottom fade only while there's actually something below to
    // scroll to — re-run after anything that can change the column's
    // content height (render, and a role card expanding/collapsing).
    function updateRoleColFade() {
        const scrollEl = el('role-cards-container');
        const wrap = el('bq-role-col-wrap');
        if (!scrollEl || !wrap) return;
        const hasMore = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight > 4;
        wrap.classList.toggle('has-scroll', hasMore);
    }

    // Only meaningful once the modal is actually visible — offsetHeight on
    // a display:none element (i.e. before Bootstrap's shown.bs.modal) is
    // just 0, so this can't run at the same time as openModal/renderRoleCards.
    function syncRoleColHeight() {
        const leftCol = document.querySelector('#b-quest-modal .bq-glass-card');
        const rightCol = el('role-cards-container');
        if (!leftCol || !rightCol) return;
        rightCol.style.maxHeight = leftCol.offsetHeight + 'px';
        updateRoleColFade();
    }

    function setupDropdowns(workData) {
        State.visibleRoles.forEach(role => {
            const workSelect = el(`b-quest-modal-${role.id}-work`);
            workSelect.innerHTML = '<option value="" selected disabled>Select...</option>';
            (workData || []).filter(i => i.role_id === role.id).forEach(i => {
                const opt = new Option(i.work, i.work);
                opt.dataset.weight = i.weight || 0;
                opt.dataset.day = i.day || 1;
                opt.dataset.maxPerDay = i.max_per_day ?? ''; // '' = no limit
                workSelect.appendChild(opt);
            });
            workSelect.onchange = () => {
                const selected = workSelect.options[workSelect.selectedIndex];
                el(`b-quest-modal-${role.id}-weight`).value = selected.dataset.weight;
                el(`b-quest-modal-${role.id}-day`).value = selected.dataset.day || 1;
                el(`b-quest-modal-${role.id}-maxperday`).value = selected.dataset.maxPerDay || '';
                checkCapacity(role.id);
            };
            syncBqPickerTrigger(workSelect.id);

            const typeSelect = el(`b-quest-modal-${role.id}-type`);
            typeSelect.innerHTML = '<option value="" selected disabled>Select...</option>';
            State.typeList.forEach(t => typeSelect.add(new Option(t.name, t.name)));
            syncBqPickerTrigger(typeSelect.id);

            // Role cards are torn down and rebuilt (renderRoleCards()'s
            // innerHTML replace) on every modal open, so this — like the
            // rest of setupDropdowns() — runs fresh each time too; no
            // separate cleanup needed for the previous cycle's handle.
            State.deadlinePickers[role.id] = attachDatePicker(el(`b-quest-modal-${role.id}-deadline`));
            el(`b-quest-modal-${role.id}-deadline`).addEventListener('change', () => checkCapacity(role.id));
        });
    }

    // Only task-level fields now — role data is populated separately from
    // b-quest-task-role rows (see openModal/openDuplicateModal).
    function fillFormData(data) {
        const fields = {
            'account_name': 'b-quest-modal-account',
            'opportunity_name': 'b-quest-modal-opportunity',
            'task_name': 'b-quest-modal-taskname',
            'detail': 'b-quest-modal-detail'
        };
        for (let key in fields) {
            const element = el(fields[key]);
            if (element) element.value = data[key] || '';
        }
        fillLinkInputs(data);
        publishDatePicker.setValue(data.publish_date || null);
        if (data.owner !== undefined) { el('modal-owner-display').innerText = data.owner || '—'; setModalOwnerAvatar(data.owner); }
    }

    function fillRoleCardData(roleId, row) {
        el(`b-quest-modal-${roleId}-type`).value = row?.type || '';
        syncBqPickerTrigger(`b-quest-modal-${roleId}-type`);
        el(`b-quest-modal-${roleId}-work`).value = row?.work || '';
        syncBqPickerTrigger(`b-quest-modal-${roleId}-work`);
        State.deadlinePickers[roleId]?.setValue(row?.deadline || null);
        el(`b-quest-modal-${roleId}-weight`).value = row?.weight ?? 0;
        el(`b-quest-modal-${roleId}-day`).value = row?.day ?? 1;
        el(`b-quest-modal-${roleId}-maxperday`).value = row?.max_per_day ?? '';
        el(`b-quest-modal-${roleId}-assign`).value = row?.assign || '';
        const statusEl = el(`b-quest-modal-${roleId}-status`);
        if (row?.status_id) statusEl.value = row.status_id;
    }

    // ── Type/Work custom picker — a real <select> stays the source of
    // truth (value, required, native validation); this just drives it from
    // /system/select-picker.js's shared popup instead of the select's own
    // unstyleable native one. Thin wrapper only — the actual
    // search+list+positioning code lives in exactly one shared place.
    function syncBqPickerTrigger(selectId) {
        const select = document.getElementById(selectId);
        const trigger = document.getElementById(`${selectId}-trigger`);
        if (!select || !trigger) return;
        const opt = select.options[select.selectedIndex];
        const hasValue = opt && opt.value !== '';
        trigger.textContent = hasValue ? opt.textContent : 'Select...';
        trigger.classList.toggle('placeholder', !hasValue);
    }

    function openBqPicker(triggerBtn, selectId) {
        const select = document.getElementById(selectId);
        openSelectPicker(triggerBtn, {
            getOptions: () => [...select.options].filter(o => o.value !== '').map(o => ({ value: o.value, label: o.textContent })),
            getValue: () => select.value,
            onSelect: (value) => {
                select.value = value;
                syncBqPickerTrigger(selectId);
                select.dispatchEvent(new Event('change'));
            },
        });
    }

    function updateStatusUI(selectEl) {
        const status = State.statusList.find(s => s.id === selectEl.value);
        const color = status?.color || '#94a3b8';
        const trigger = selectEl.nextElementSibling;
        trigger.textContent = status?.name || selectEl.options[selectEl.selectedIndex]?.textContent || '';
        trigger.style.background = color;
        trigger.style.color = pickBadgeTextColor(color);
    }

    function updateRoleUI(roleId) {
        const isChecked = el(`check-${roleId}`).checked;
        const canAssign = State.allowAssign;
        const card = el(`card-${roleId}`);
        // Deadline handled separately below via its picker handle — setting
        // .required/.value directly on that field would target the hidden
        // ISO carrier, not the visible field the user (and native
        // validation) actually sees.
        const inputs = ['type', 'work'].map(s => el(`b-quest-modal-${roleId}-${s}`));
        const deadlinePicker = State.deadlinePickers[roleId];

        if (isChecked) {
            card.classList.add('active'); card.classList.remove('disabled');
            inputs.forEach(input => input.required = true);
            deadlinePicker?.setRequired(true);
            const currentAssign = el(`b-quest-modal-${roleId}-assign`).value || '';
            refreshAssignBadge(roleId, currentAssign, canAssign);
            show(`b-quest-modal-${roleId}-status-wrap`, true, 'flex');
        } else {
            card.classList.remove('active'); card.classList.add('disabled');
            inputs.forEach(input => { input.required = false; input.value = ''; syncBqPickerTrigger(input.id); });
            deadlinePicker?.setRequired(false);
            deadlinePicker?.setValue(null);
            el(`b-quest-modal-${roleId}-weight`).value = '0';
            el(`b-quest-modal-${roleId}-assign`).value = '';

            const capEl = el(`${roleId}-capacity-info`);
            if (capEl) { capEl.className = 'bq-cap-info'; capEl.innerHTML = ''; }
            refreshAssignBadge(roleId, '', false);
            show(`b-quest-modal-${roleId}-status-wrap`, false);
        }
        // Card body expand/collapse is an animated max-height transition
        // (0.35s), so the column's scrollHeight isn't final yet on this
        // tick — check again now (covers the collapse case, height already
        // shrinking) and once more after the transition settles.
        updateRoleColFade();
        setTimeout(updateRoleColFade, 380);
    }

    function refreshAssignBadge(roleId, name, canAssign) {
        const badge = el(`badge-assign-${roleId}`);
        if (!badge) return;
        badge.className = 'bq-assign-badge';
        badge.onclick = null;

        const hasName = name && name !== '-' && name !== '';
        const role = State.visibleRoles.find(r => r.id === roleId);
        const canEditRole = role && typeof canBquestEditRole === 'function' ? canBquestEditRole(role.name) : true;

        if (canAssign && canEditRole) {
            badge.classList.add('bq-ab-show', 'bq-ab-clickable');
            badge.onclick = (e) => { e.stopPropagation(); BQuestApp.openAssignPicker(roleId); };
            if (hasName) {
                badge.innerHTML = `<i class="bi bi-person-fill" style="font-size:0.72rem"></i>${esc(name)}`;
            } else {
                badge.classList.add('bq-ab-empty');
                badge.innerHTML = `<i class="bi bi-person-plus" style="font-size:0.72rem"></i> Assign`;
            }
        } else {
            if (hasName) {
                badge.classList.add('bq-ab-show');
                badge.innerHTML = `<i class="bi bi-person-fill" style="font-size:0.72rem"></i>${esc(name)}`;
            }
        }
    }

    function setAssign(roleId, name) {
        const canAssign = typeof canBquest === 'function' ? canBquest('assign') : false;
        el(`b-quest-modal-${roleId}-assign`).value = name;
        refreshAssignBadge(roleId, name, canAssign);
    }

    // A task's Weight×Day is a total BUDGET, not "weight every day" — walk
    // backward from its own deadline spending that budget, capped per day
    // at weight × (that weekday's Daily Capacity %). A day at 0% (or a low
    // %) absorbs less than its share, so the leftover rolls further back
    // until the budget runs out — including the deadline day itself, which
    // is just the first day walked. contributionOnDate answers "how much
    // of THIS row's spread lands on targetDateStr specifically", which is
    // all capacity-checking here ever needs (see checkCapacity below).
    // guard caps the walk so a pathological config (e.g. every day at 0%)
    // can't loop forever — purely a technical safety valve, not a business
    // rule; real Weight/Day values are small enough to never approach it.
    const WEEK_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']; // index = Date.getDay()
    const SPREAD_LOOKBACK_GUARD = 3650;

    function toDateStr(d) {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // 'full' | 'half' | null — a holiday date overrides the weekday %
    // entirely rather than being counted at its normal weekday rate. Only
    // ever non-null when Skip Holidays is on (State.holidays stays empty
    // otherwise, see loadWorkdayWeight above), so this is a no-op — same
    // behavior as before this feature existed — for anyone who hasn't
    // opted in.
    function holidayTypeForDate(dateStr) {
        if (!State.holidays?.length) return null;
        const hit = State.holidays.find(h => dateStr >= h.date_from && dateStr <= (h.date_to || h.date_from));
        return hit ? (hit.day_type || 'full') : null;
    }

    // Full day = 0% (skipped entirely); half day = a flat 50%, not half of
    // whatever the weekday would normally be — confirmed with the user as
    // the intended reading of "Half Day" in the holiday list.
    function dayPct(workdayWeight, date) {
        const holType = holidayTypeForDate(toDateStr(date));
        if (holType === 'full') return 0;
        if (holType === 'half') return 50;
        return workdayWeight[WEEK_KEYS[date.getDay()]] ?? 100;
    }

    function contributionOnDate(weight, day, deadlineStr, workdayWeight, targetDateStr) {
        let budget = weight * (Number(day) || 1);
        let cursor = new Date(deadlineStr + 'T00:00:00');
        const target = new Date(targetDateStr + 'T00:00:00');
        let guard = 0;
        while (budget > 1e-9 && cursor >= target && guard < SPREAD_LOOKBACK_GUARD) {
            const pct = dayPct(workdayWeight, cursor);
            const cap = weight * (pct / 100);
            const absorb = Math.min(budget, cap);
            if (cursor.getTime() === target.getTime()) return absorb;
            budget -= absorb;
            cursor.setDate(cursor.getDate() - 1);
            guard++;
        }
        return 0;
    }

    // Role's flat max_capacity scaled by the target day's own Daily
    // Capacity % — e.g. a 10pt role on a 50% Saturday can only take 5pt
    // that day.
    function effectiveMaxCap(roleId, targetDateStr) {
        const pct = dayPct(State.workdayWeight || {}, new Date(targetDateStr + 'T00:00:00'));
        return (State.maxCap[roleId] ?? 10) * (pct / 100);
    }

    // Info popover next to the Deadline label — the raw Weight/Day/Max
    // settings behind the currently-selected Work, plus this role's flat
    // Max Capacity, read straight off the hidden inputs setupDropdowns()
    // already keeps in sync on every Work change (no extra query). Shown
    // as-configured, not date-scaled — that computed version is what the
    // capacity bar (checkCapacity()) already shows once a Deadline is set.
    let capInfoPopoverEl = null;
    function closeCapSettingsInfo() {
        if (!capInfoPopoverEl) return;
        capInfoPopoverEl.remove();
        capInfoPopoverEl = null;
        document.removeEventListener('click', onCapInfoDocClick, true);
        document.removeEventListener('scroll', onCapInfoDocScroll, true);
    }
    function onCapInfoDocClick(e) {
        if (capInfoPopoverEl && !capInfoPopoverEl.contains(e.target) && !e.target.closest('.bq-info-btn')) closeCapSettingsInfo();
    }
    function onCapInfoDocScroll(e) {
        if (capInfoPopoverEl && !capInfoPopoverEl.contains(e.target)) closeCapSettingsInfo();
    }
    function openCapSettingsInfo(event, roleId) {
        event.stopPropagation();
        closeCapSettingsInfo();

        // Always available, not gated on a Work being selected — reads
        // every <option> already sitting on the Work <select> (populated
        // once by setupDropdowns(), dataset.weight/day/maxPerDay attached
        // per option) rather than just the current selection, so this is
        // the full reference table for the role, not a single-row echo.
        const workSelect = el(`b-quest-modal-${roleId}-work`);
        const currentWork = workSelect.value;
        const items = Array.from(workSelect.options).filter(opt => opt.value);
        const maxCap = State.maxCap[roleId] ?? 10;
        const roleName = State.roleNameById[roleId] || '';

        const popover = document.createElement('div');
        popover.className = 'bq-info-popover';
        popover.innerHTML = `
            <div class="bq-info-popover-title">
                <span>Capacity${roleName ? ' ' + esc(roleName) : ''}</span>
                <span class="bq-info-maxcap">Max ${maxCap}</span>
            </div>
            ${!items.length ? `<div class="bq-info-empty">No work items configured for this role</div>` : `
            <table class="bq-info-table">
                <thead><tr><th>Work</th><th class="num">Weight</th><th class="num">Day</th><th class="num">Max/day</th></tr></thead>
                <tbody>
                    ${items.map(opt => `
                    <tr class="${opt.value === currentWork ? 'is-selected' : ''}">
                        <td>${esc(opt.value)}</td>
                        <td class="num">${esc(opt.dataset.weight || '0')}</td>
                        <td class="num">${esc(opt.dataset.day || '1')}</td>
                        <td class="num">${opt.dataset.maxPerDay ? esc(opt.dataset.maxPerDay) : '—'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>`}
        `;
        document.body.appendChild(popover);
        capInfoPopoverEl = popover;

        const r = event.currentTarget.getBoundingClientRect();
        const width = 400;
        popover.style.left = Math.min(r.left, window.innerWidth - width - 12) + 'px';
        popover.style.top = (r.bottom + 8) + 'px';
        const popRect = popover.getBoundingClientRect();
        if (popRect.bottom > window.innerHeight - 12) {
            popover.style.top = Math.max(12, r.top - popRect.height - 8) + 'px';
        }

        setTimeout(() => {
            document.addEventListener('click', onCapInfoDocClick, true);
            document.addEventListener('scroll', onCapInfoDocScroll, true);
        }, 0);
    }

    async function checkCapacity(roleId) {
        const info = el(`${roleId}-capacity-info`);
        const hideInfo = () => { if (info) { info.className = 'bq-cap-info'; info.innerHTML = ''; } };

        const dl     = el(`b-quest-modal-${roleId}-deadline`).value;
        const work   = el(`b-quest-modal-${roleId}-work`).value;
        const weight = Number(el(`b-quest-modal-${roleId}-weight`).value) || 0;
        const dayVal = Number(el(`b-quest-modal-${roleId}-day`).value) || 1;

        if (!dl || !work) { hideInfo(); return; }

        try {
            const existingRow = State.currentRoleRows[roleId];
            if (existingRow && existingRow.work === work && existingRow.deadline === dl) { hideInfo(); return; }

            const currentQuestId = el('b-quest-modal-id').value || null;
            await BQuestService.loadWorkdayWeight();
            const workdayWeight = State.workdayWeight;

            // deadline < dl can never contribute (its own spread walks
            // backward from ITS OWN deadline, never forward past it) — one
            // query suffices, where the original legacy version needed two
            // ("same day" + "later deadline reaching back") only because it
            // filtered per-field instead of with a single >= comparison.
            const { data: rows } = await supabaseClient
                .from('b_quest_task_role')
                .select('quest_id, weight, day, deadline, work')
                .eq('role_id', roleId)
                .gte('deadline', dl);

            const relevant = currentQuestId ? (rows || []).filter(r => r.quest_id !== currentQuestId) : (rows || []);
            const existingTotal = relevant.reduce((sum, r) => sum + contributionOnDate(Number(r.weight) || 0, r.day, r.deadline, workdayWeight, dl), 0);
            // This task's own contribution to dl — normally just its full
            // Weight, but if dl itself lands on a low-% day even this first
            // slot gets capped, same rule as every other day in the spread.
            const newContribution = contributionOnDate(weight, dayVal, dl, workdayWeight, dl);
            const total = existingTotal + newContribution;
            const maxCap = effectiveMaxCap(roleId, dl);
            State.capacities[roleId] = total;
            State.maxCapEffective[roleId] = maxCap;

            const isOver   = total > maxCap;
            const barColor = isOver ? '#ef4444' : total >= maxCap * 0.8 ? '#f59e0b' : '#4ade80';
            const displayTotal = Math.round(total * 10) / 10;
            const displayMaxCap = Math.round(maxCap * 10) / 10; // maxCap can now be fractional (e.g. 10 x 75%)
            const displayExisting = Math.round(existingTotal * 10) / 10;
            const displayNew = Math.round(newContribution * 10) / 10;
            // Two segments instead of one flat fill — existing (gray, what
            // was already booked by other tasks) then new (colored, what
            // THIS task is adding) stacked side by side, so it's visually
            // obvious how much of the bar this save actually contributes.
            const existingPct = Math.min(100, Math.round(existingTotal / maxCap * 100));
            const newPct = Math.min(100 - existingPct, Math.round(newContribution / maxCap * 100));

            // Separate rule from the capacity bar above: how many OTHER
            // tasks with this exact Work item already land on this same
            // deadline date — a hard per-work daily ceiling, independent of
            // whether points/capacity still have room (checked only on the
            // deadline date, same as capacity above).
            const maxPerDayRaw = el(`b-quest-modal-${roleId}-maxperday`).value;
            const maxPerDay = maxPerDayRaw === '' ? null : Number(maxPerDayRaw);
            const workCount = relevant.filter(r => r.deadline === dl && r.work === work).length + 1;
            State.workCounts[roleId] = workCount;
            State.workLimits[roleId] = maxPerDay;
            const isOverWork = maxPerDay != null && workCount > maxPerDay;
            const workLimitHtml = maxPerDay != null
                ? `<div class="bq-cap-worklimit${isOverWork ? ' over' : ''}"><i class="bi bi-stack"></i> Limit Today <b>${workCount} / ${maxPerDay}</b></div>`
                : '';

            info.innerHTML = `
                <div class="bq-cap-nums">
                    <span class="bq-cap-badge${isOver ? ' over' : ''}">+${displayNew} Point</span>
                    <span class="bq-cap-frac${isOver ? ' over' : ''}"><span class="bq-cap-breakdown">(${displayExisting}<span style="color:${barColor}">+${displayNew}</span>)</span>${displayTotal} / ${displayMaxCap}</span>
                </div>
                <div class="bq-cap-track">
                    <div class="bq-cap-fill-existing" style="width:${existingPct}%"></div>
                    <div class="bq-cap-fill-new" style="width:${newPct}%;background:${barColor}"></div>
                </div>
                ${workLimitHtml}`;
            info.className = 'bq-cap-info visible';
        } catch (e) { console.error(e); }
    }

    // Bumped on every call to openSearchOverlay/openAssignPicker — both
    // reuse the same #uni-search-* elements, and openSearchOverlay awaits a
    // DB fetch before wiring them up. If openAssignPicker (synchronous) is
    // invoked while that fetch is still in flight, the earlier call's
    // continuation must not overwrite what the newer call already wired —
    // otherwise the overlay ends up showing "Assign" while actually still
    // wired to search account/opportunity names (or vice versa).
    let searchOverlayToken = 0;

    // Shared by openSearchOverlay/openAssignPicker — both reuse the one
    // #uni-search-input/#uni-search-clear pair in the modal's overlay.
    function wireSearchClear(searchInput, render) {
        const clearBtn = el('uni-search-clear');
        searchInput.oninput = e => {
            clearBtn.style.display = e.target.value ? 'block' : 'none';
            render(e.target.value);
        };
        clearBtn.onclick = () => {
            searchInput.value = '';
            clearBtn.style.display = 'none';
            searchInput.focus();
            render('');
        };
    }

    async function openSearchOverlay(fieldName, targetId) {
        const myToken = ++searchOverlayToken;
        const container  = el('uni-list-container');
        const searchInput = el('uni-search-input');
        el('uni-search-icon').className = 'bi bi-search';
        el('uni-search-title').textContent = fieldName.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join(' ');
        show('bq-search-overlay', true, 'flex');
        container.innerHTML = '<div class="p-3 text-center text-muted">Loading...</div>';
        searchInput.value = '';
        el('uni-search-clear').style.display = 'none';

        try {
            const { data } = await supabaseClient.from('b_quest_list').select(fieldName);
            // A newer openSearchOverlay/openAssignPicker call already took
            // over the shared overlay while this fetch was in flight —
            // don't clobber whatever it wired up.
            if (myToken !== searchOverlayToken) return;
            const unique = [...new Set((data || []).map(i => i[fieldName]))].filter(n => n && n !== '-').sort((a,b) => a.localeCompare(b, 'th'));

            const render = (filterText = '') => {
                container.innerHTML = '';
                const matches = unique.filter(i => i.toLowerCase().includes(filterText.toLowerCase()));
                if (!matches.length) {
                    container.innerHTML = `<div class="bq-am-empty">${filterText ? 'No matches' : 'No data yet'}</div>`;
                    return;
                }
                matches.forEach(val => {
                    const btn = document.createElement('button');
                    btn.className = 'uni-item-modern w-100'; btn.innerText = val;
                    btn.onclick = () => { el(targetId).value = val; show('bq-search-overlay', false); };
                    container.appendChild(btn);
                });
            };
            render();
            wireSearchClear(searchInput, render);
        } catch (e) { console.error(e); }
    }

    // Switched over to the shared b-quest-assign-picker.js component
    // (same one b-quest-assignment.html already used) instead of a local
    // copy reusing the modal's own #bq-search-overlay — that local copy
    // needed the searchOverlayToken race-guard specifically BECAUSE it
    // shared one overlay element with openSearchOverlay's generic account/
    // opportunity-name search; the shared component self-injects its own
    // separate overlay, so that race can't happen here at all and the
    // guard isn't needed for this path. Keeps avatar/red-"Unassigned"
    // styling in exactly one place instead of two copies drifting apart
    // (confirmed drift: this file's own .bq-am-* rows didn't get the
    // avatar-photo/red-Unassigned treatment the shared component did,
    // until this switch). Page(s) that load this file must also load
    // b-quest-assign-picker.js — see b-quest-list.html/b-quest-view.html.
    function openAssignPicker(roleId) {
        const role = State.visibleRoles.find(r => r.id === roleId);
        const canAssign = typeof canBquest === 'function' ? canBquest('assign') : false;
        const canEditRole = role && typeof canBquestEditRole === 'function' ? canBquestEditRole(role.name) : true;
        if (!canAssign || !canEditRole) return;
        window.openAssignPicker({
            candidates: State.assignProfiles[roleId] || [],
            title: 'Assign',
            emptyText: 'No candidates for this role',
            onSelect: (codename) => setAssign(roleId, codename)
        });
    }

    el('role-cards-container')?.addEventListener('scroll', updateRoleColFade);
    el('b-quest-modal')?.addEventListener('shown.bs.modal', syncRoleColHeight);
    // Bootstrap already locks body scroll via its own .modal-open class,
    // but SweetAlert2 (used for save/error toasts fired while this modal
    // is open) manages document.body.style.overflow independently and
    // can stomp on Bootstrap's lock when it closes — this shared,
    // reference-counted lock keeps the background from scrolling
    // regardless of which library's cleanup runs last.
    el('b-quest-modal')?.addEventListener('shown.bs.modal', lockBodyScroll);
    el('b-quest-modal')?.addEventListener('hidden.bs.modal', unlockBodyScroll);
    // A select-picker popover is appended to <body>, not this modal, and
    // only closes itself on an outside click/scroll — Escape (Bootstrap's
    // default data-bs-keyboard, not disabled here) closes the modal
    // directly with no click event at all, so a picker left open when that
    // happens would otherwise leak: an orphaned panel still floating after
    // the modal is gone, plus its document click/scroll listeners never
    // torn down.
    el('b-quest-modal')?.addEventListener('hidden.bs.modal', () => { if (typeof closeSelectPicker === 'function') closeSelectPicker(); });

    // ── Links row (Settings → Links) ──
    // Re-rendered on every open so the inputs are always fresh — and only
    // ACTIVE slots get an input at all. A slot that's turned off sends
    // nothing in the payload, so its saved link stays untouched on Edit
    // (an empty input for it would overwrite the saved link with null).
    // Each link is a button + popover; the value carriers are type="text" + hidden attribute, NOT
    // type="hidden": form.reset() doesn't clear a type="hidden" input (see
    // openModal), which would leak one task's links into the next New.
    function renderLinkZone() {
        closeLinkPopover();
        const active = (State.linkCfg || normalizeQuestLinks(null)).filter(s => s.active);
        const row = el('bq-link-date-row');
        row.classList.remove('mode-0', 'mode-btn');
        row.classList.add(active.length ? 'mode-btn' : 'mode-0');
        const zone = el('bq-link-zone');
        if (active.length) {
            zone.innerHTML = `<label class="bq-label-modern">${active.length > 1 ? 'Links' : 'Link'}</label>
                <div class="bq-link-btns">${active.map(s => `
                    <button type="button" class="bq-link-btn" id="bq-link-btn-${s.slot}" onclick="BQuestApp.openLinkPopover(${s.slot})">
                        <i class="bi bi-link-45deg"></i><span class="bq-link-text">${esc(questLinkLabel(s))}</span>
                    </button>
                    <input type="text" hidden id="b-quest-modal-link-${s.slot}" name="${BQ_LINK_COLUMNS[s.slot]}">`).join('')}
                </div>`;
        } else {
            zone.innerHTML = '';
        }
        active.forEach(s => syncLinkBtn(s.slot));
    }

    // Filled = accent fill + border; tooltip carries the URL itself.
    function syncLinkBtn(slot) {
        const btn = el(`bq-link-btn-${slot}`);
        if (!btn) return;
        const val = el(`b-quest-modal-link-${slot}`)?.value || '';
        const label = questLinkLabel((State.linkCfg || normalizeQuestLinks(null)).find(s => s.slot === slot));
        btn.classList.toggle('is-filled', !!val);
        btn.title = val ? `${label}: ${val}` : `Add ${label}`;
    }

    function fillLinkInputs(data) {
        (State.linkCfg || []).filter(s => s.active).forEach(s => {
            const input = el(`b-quest-modal-link-${s.slot}`);
            if (input) input.value = data?.[BQ_LINK_COLUMNS[s.slot]] || '';
            syncLinkBtn(s.slot);
        });
    }

    // Popover: label / input / Clear + OK. OK or Enter keeps the value,
    // Clear empties it, Esc / outside click / scroll closes without change.
    let linkPopSlot = null;

    function openLinkPopover(slot) {
        if (linkPopSlot === slot) { closeLinkPopover(); return; }
        closeLinkPopover();
        const btn = el(`bq-link-btn-${slot}`);
        const pop = el('bq-link-pop');
        const input = el('bq-link-pop-input');
        const current = el(`b-quest-modal-link-${slot}`).value;
        linkPopSlot = slot;
        el('bq-link-pop-label').textContent = questLinkLabel(State.linkCfg.find(s => s.slot === slot));
        input.value = current;
        el('bq-link-pop-clear').disabled = !current;
        setLinkError(false);
        btn.classList.add('is-open');
        pop.classList.add('show');

        const r = btn.getBoundingClientRect();
        const w = pop.offsetWidth, h = pop.offsetHeight;
        pop.style.left = Math.min(Math.max(16, r.left), window.innerWidth - w - 16) + 'px';
        pop.style.top = (r.bottom + 6 + h > window.innerHeight - 12 ? Math.max(12, r.top - h - 6) : r.bottom + 6) + 'px';
        input.focus();
        input.select();
        setTimeout(() => document.addEventListener('mousedown', onLinkPopOutside, true), 0);
    }

    function closeLinkPopover() {
        if (linkPopSlot === null) return;
        el(`bq-link-btn-${linkPopSlot}`)?.classList.remove('is-open');
        el('bq-link-pop').classList.remove('show');
        document.removeEventListener('mousedown', onLinkPopOutside, true);
        linkPopSlot = null;
    }

    // Basic format check: must parse as a URL, be http(s) — the only
    // schemes safeLink() will ever open — and have a dotted host.
    function isValidLink(value) {
        try {
            const u = new URL(value);
            return (u.protocol === 'http:' || u.protocol === 'https:') && u.hostname.includes('.');
        } catch { return false; }
    }

    function setLinkError(on) {
        el('bq-link-pop').classList.toggle('has-error', on);
        el('bq-link-pop-input').classList.toggle('is-invalid', on);
    }

    // OK / Enter. Empty is allowed (same as Clear); anything else must pass
    // isValidLink() or the popover stays open showing the error.
    function commitLinkValue(value) {
        const clean = value.replace(/\s+/g, '');
        if (clean && !isValidLink(clean)) { setLinkError(true); el('bq-link-pop-input').focus(); return; }
        setLinkValue(clean);
    }

    function setLinkValue(value) {
        const slot = linkPopSlot;
        const input = el(`b-quest-modal-link-${slot}`);
        // A URL never contains whitespace — drop line breaks/spaces a paste
        // can drag in (the popover's field is a wrapping textarea).
        if (input) input.value = value.replace(/\s+/g, '');
        closeLinkPopover();
        syncLinkBtn(slot);
    }

    function onLinkPopOutside(e) {
        if (el('bq-link-pop').contains(e.target)) return;
        // Clicking the same button again toggles via openLinkPopover itself.
        if (e.target.closest(`#bq-link-btn-${linkPopSlot}`)) return;
        closeLinkPopover();
    }

    el('bq-link-pop-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); commitLinkValue(e.target.value); }
        // Esc would otherwise also close the whole Bootstrap modal.
        else if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeLinkPopover(); }
    });
    el('bq-link-pop-input')?.addEventListener('input', e => { el('bq-link-pop-clear').disabled = !e.target.value; setLinkError(false); });
    // Fixed-position popover would drift off its button if anything behind
    // it scrolls — close instead, same as select-picker.js.
    el('b-quest-modal')?.addEventListener('scroll', e => { if (!el('bq-link-pop').contains(e.target)) closeLinkPopover(); }, true);
    window.addEventListener('resize', () => closeLinkPopover());
    el('b-quest-modal')?.addEventListener('hidden.bs.modal', () => closeLinkPopover());

    // Re-draws attention to a field already marked invalid from a previous
    // submit attempt — ref b-opportunity-modal.js's own shakeInvalid().
    // Picker-wrapped fields (.bq-picker-wrap) style their visible trigger
    // via a :has(:invalid) CSS rule on the wrap, not on the hidden <select>
    // itself, so the wrap is what needs to visibly shake, not el.
    function shakeInvalid(el) {
        if (!el) return;
        const target = el.closest('.bq-picker-wrap') || el;
        target.classList.remove('bq-shake');
        void target.offsetHeight;
        target.classList.add('bq-shake');
        target.addEventListener('animationend', () => target.classList.remove('bq-shake'), { once: true });
    }

    return {
        openLinkPopover,
        commitLinkPopover() { commitLinkValue(el('bq-link-pop-input').value); },
        clearLinkPopover() { setLinkValue(''); },
        async openModal(taskId = null, workData = []) {
            const form = el('b-quest-modal-form');
            form.reset(); form.classList.remove('was-validated');
            // form.reset() does NOT clear a type="hidden" input: setting
            // .value on one writes its default attribute, which reset()
            // restores to. So after opening any task in Edit, the next "New"
            // kept that task's id, submitForm saw isEdit=true and overwrote
            // the old task with the new data instead of inserting.
            el('b-quest-modal-id').value = '';
            State.currentData = null;
            State.currentRoleRows = {};
            const [, , , linkCfg] = await Promise.all([loadVisibleRoles(), BQuestService.loadStatuses(), BQuestService.loadWorkdayWeight(), loadQuestLinkConfig()]);
            State.linkCfg = linkCfg;
            renderRoleCards();
            renderLinkZone();
            await Promise.all([BQuestService.loadProfiles(), BQuestService.loadTypes()]);
            setupDropdowns(workData);

            // Not gated on taskId — a user with 'assign' can pick an
            // assignee while creating a brand-new task too, not just after
            // saving and reopening it in Edit. openAssignPicker() itself
            // already checked canBquest('assign') fresh, independent of
            // taskId; this just controls the badge's visibility/click state.
            const canAssign = typeof canBquest === 'function' && canBquest('assign');
            State.allowAssign = canAssign;

            if (taskId) {
                el('btn-submit-icon').className  = 'bi bi-floppy2-fill';
                el('btn-submit-label').textContent = 'Save Changes';
                el('modal-id-badge-text').textContent = taskId;
                show('modal-id-badge', true, 'inline-flex');

                const [data, roleRows] = await Promise.all([BQuestService.getQuestById(taskId), BQuestService.getTaskRoles(taskId)]);
                if (data) {
                    State.currentData = data;
                    State.currentRoleRows = Object.fromEntries(roleRows.map(r => [r.role_id, r]));
                    el('b-quest-modal-id').value = taskId;
                    fillFormData(data);

                    // Delete removes the whole task, roles and all — only
                    // offer it when this user's delete scope fully covers
                    // EVERY role row present, same rule as the List page's
                    // Delete button. Partial coverage means using Edit to
                    // drop just their own role instead (see submitForm).
                    const isOwner = data.owner === getBxUser()?.codename;
                    const canDeleteTask = roleRows.length > 0 && typeof canBquestActOnRole === 'function'
                        && roleRows.every(r => canBquestActOnRole(State.roleNameById[r.role_id], r.assign, 'delete', isOwner));
                    show('btn-delete-task', canDeleteTask);

                    State.visibleRoles.forEach(role => {
                        const row = State.currentRoleRows[role.id];
                        const hasRoleData = !!row;
                        el(`check-${role.id}`).checked = hasRoleData;
                        updateRoleUI(role.id);

                        const statusEl = el(`b-quest-modal-${role.id}-status`);
                        if (hasRoleData) fillRoleCardData(role.id, row);
                        show(`b-quest-modal-${role.id}-status-wrap`, hasRoleData, 'flex');
                        updateStatusUI(statusEl);

                        if (hasRoleData) refreshAssignBadge(role.id, row.assign || '', canAssign);

                        const capEl = el(`${role.id}-capacity-info`);
                        if (capEl) { capEl.className = 'bq-cap-info'; capEl.innerHTML = ''; }

                        // Own/All only matters once there's existing data
                        // with a real assignee to protect — a role not yet
                        // on the task is a fresh add, gated by 'new' alone
                        // (already true, or the card wouldn't be visible).
                        const canEditRole = hasRoleData
                            ? (typeof canBquestActOnRole === 'function' ? canBquestActOnRole(role.name, row.assign, 'edit', isOwner) : true)
                            : (typeof canBquestEditRole === 'function' ? canBquestEditRole(role.name) : true);
                        const card = el(`card-${role.id}`);
                        card.querySelectorAll('input, select, textarea').forEach(inp => inp.disabled = !canEditRole);
                        el(`check-${role.id}`).disabled = !canEditRole;
                        card.style.opacity = canEditRole ? '' : '0.55';
                    });
                }
            } else {
                el('btn-submit-icon').className  = 'bi bi-plus-circle-fill';
                el('btn-submit-label').textContent = 'Create Task';
                el('modal-owner-display').innerText = getBxUser()?.codename || '—';
                setModalOwnerAvatar(getBxUser()?.codename);
                show('modal-id-badge', false);
                show('btn-delete-task', false);
                State.visibleRoles.forEach(role => {
                    el(`check-${role.id}`).checked = false;
                    updateRoleUI(role.id);
                    updateStatusUI(el(`b-quest-modal-${role.id}-status`));
                    const card = el(`card-${role.id}`);
                    card.querySelectorAll('input, select, textarea, button').forEach(inp => inp.disabled = false);
                    card.style.opacity = '';
                });
            }
            bootstrap.Modal.getOrCreateInstance(el('b-quest-modal')).show();
        },

        // Task-level fields go to b-quest-list as before. Role data now
        // goes to b-quest-task-role, one row per (quest_id, role_id):
        // update if it already existed, insert if newly enabled, delete if
        // unchecked. Works for every visible role, not just the old
        // Designer/Creative pair.
        async submitForm(e) {
            e.preventDefault();
            const form = e.target;

            // Guards against a double-click or slow-network double-tap firing
            // two overlapping saves: without this, both would independently
            // see the same role as "not yet in State.currentRoleRows" and
            // both insert, producing two b-quest-task-role rows for the same
            // (quest_id, role_id) — found live on BX (BQ-0544, two Designer
            // rows), root-caused, DB now has a unique constraint as a second
            // line of defense (see 20260922000009 migration) but this is the
            // fix for the actual race, not just a safety net for its symptom.
            const submitBtn = el('btn-submit-text');
            if (submitBtn.disabled) return;
            submitBtn.disabled = true;
            try {

            if (!form.checkValidity()) {
                form.classList.add('was-validated');
                const first = form.querySelector(':invalid');
                if (first) { first.scrollIntoView({ behavior: 'smooth', block: 'center' }); first.focus(); shakeInvalid(first); }
                return;
            }

            const currentId = el('b-quest-modal-id').value;
            const enabledRoles = State.visibleRoles.filter(r => el(`check-${r.id}`)?.checked);
            if (!enabledRoles.length) return Swal.fire('Wait!', 'Select at least one role.', 'warning');

            // status_id is NOT NULL on b-quest-task-role — if Settings has
            // zero active statuses, every role's status <select> would have
            // nothing to fall back to and the save would fail at the DB
            // instead of here. Catch it up front with a clear message.
            if (!State.statusList.length) {
                return Swal.fire('Wait!', 'No active Status found — add at least one Status in Settings first.', 'warning');
            }

            for (const role of enabledRoles) {
                const dl = el(`b-quest-modal-${role.id}-deadline`).value;
                const work = el(`b-quest-modal-${role.id}-work`).value;
                const existingRow = State.currentRoleRows[role.id];
                if (existingRow && existingRow.work === work && existingRow.deadline === dl) continue; // unchanged, already counted for capacity/work-limit
                const maxCap = State.maxCapEffective[role.id] ?? State.maxCap[role.id] ?? 10;
                if (State.capacities[role.id] > maxCap) {
                    return Swal.fire({ icon: 'error', title: 'Over Capacity', text: `Limit ${Math.round(maxCap * 10) / 10} Point per Day` });
                }
                const limit = State.workLimits[role.id];
                if (limit != null && State.workCounts[role.id] > limit) {
                    return Swal.fire({ icon: 'error', title: 'Daily Limit', text: `Limit ${limit} Work per Day` });
                }
            }

            const payload = Object.fromEntries(new FormData(form).entries());
            // Trim every text field before it ever reaches the DB — a
            // leading/trailing space on Account/Opportunity Name is
            // invisible in the UI but creates a real duplicate value (see
            // Merge Duplicate Names' ␣ marker in b-quest-settings.html,
            // added to clean up existing ones; this stops new ones at
            // the source instead).
            Object.keys(payload).forEach(k => { if (typeof payload[k] === 'string') payload[k] = payload[k].trim(); });
            ['publish_date', 'detail', ...Object.values(BQ_LINK_COLUMNS)].forEach(f => { if (payload[f] === '') payload[f] = null; });
            // id used to be a UUID (36 chars), hence the old length check —
            // it's now the short "BQ-0001" text id (never > 10 chars), so
            // that check was silently always false, meaning every Edit
            // secretly created a brand-new duplicate task instead of
            // updating. Presence alone is the correct signal: it's only
            // ever set on the form when openModal's edit branch populates
            // it from an existing task.
            const isEdit = !!payload.id;
            if (!isEdit) { delete payload.id; payload.owner = getBxUser()?.codename || '-'; }
            payload.last_update = new Date().toISOString();

            const { data: savedTask, error: taskErr } = isEdit
                ? await supabaseClient.from('b_quest_list').update(payload).eq('id', currentId).select().single()
                : await supabaseClient.from('b_quest_list').insert([payload]).select().single();

            if (taskErr) return Swal.fire('Error', taskErr.message, 'error');
            const questId = savedTask.id;

            const canAssign = typeof canBquest === 'function' ? canBquest('assign') : false;
            const enabledIds = new Set(enabledRoles.map(r => r.id));
            const errors = [];
            let roleSaveSuccessCount = 0;

            for (const role of State.visibleRoles) {
                const existingRow = State.currentRoleRows[role.id];
                if (!enabledIds.has(role.id)) {
                    if (existingRow) {
                        const { error } = await supabaseClient.from('b_quest_task_role').delete().eq('id', existingRow.id);
                        if (error) errors.push(error.message);
                    }
                    continue;
                }

                const statusId = el(`b-quest-modal-${role.id}-status`).value || getDefaultStatusId() || null;
                const statusName = State.statusList.find(s => s.id === statusId)?.name || null;

                const rolePayload = {
                    quest_id: questId,
                    role_id: role.id,
                    role: role.name,     // kept in sync — some read paths still match on this text
                    status_id: statusId,
                    status: statusName,  // same reasoning
                    work: el(`b-quest-modal-${role.id}-work`).value || null,
                    type: el(`b-quest-modal-${role.id}-type`).value || null,
                    deadline: el(`b-quest-modal-${role.id}-deadline`).value || null,
                    weight: parseInt(el(`b-quest-modal-${role.id}-weight`).value) || 0,
                    day: el(`b-quest-modal-${role.id}-day`).value || '1',
                    max_per_day: (() => { const v = el(`b-quest-modal-${role.id}-maxperday`).value; return v === '' ? null : parseInt(v); })(),
                    assign: canAssign
                        ? (el(`b-quest-modal-${role.id}-assign`).value || null)
                        : (existingRow?.assign || null)
                };

                const { error } = existingRow
                    ? await supabaseClient.from('b_quest_task_role').update(rolePayload).eq('id', existingRow.id)
                    : await supabaseClient.from('b_quest_task_role').insert([rolePayload]);
                if (error) errors.push(error.message);
                else roleSaveSuccessCount++;
            }

            if (errors.length) {
                // New task, every single role failed to save — the task
                // row itself already exists at this point (it was created
                // first, separately), so without this it'd be left behind
                // as a permanent "no role" orphan. Roll it back instead of
                // leaving broken data — this is a best-effort compensating
                // delete, not a real DB transaction, but covers the actual
                // failure mode seen in practice (a role column missing
                // before its migration was applied).
                if (!isEdit && roleSaveSuccessCount === 0) {
                    await supabaseClient.from('b_quest_list').delete().eq('id', questId);
                    return Swal.fire('Error', 'Nothing was saved — the task was rolled back.\n' + errors.join('\n'), 'error');
                }
                return Swal.fire('Some errors occurred', errors.join('\n'), 'error');
            }
            // Used to be location.reload() — that lost the List page's
            // scroll position (back to page 0 of infinite scroll) and
            // silently swapped the user's own filters for the admin's
            // configured defaults, since a full reload re-runs initPage()
            // from scratch. Patching just this one card avoids both: the
            // rest of the page's JS state (filters, scroll, loaded pages)
            // is never touched. Falls back to reload only if some future
            // page loads this modal without defining the List page's own
            // helper.
            Swal.fire({ icon: 'success', title: 'Success!', showConfirmButton: false, timer: 1500 }).then(() => {
                bootstrap.Modal.getOrCreateInstance(el('b-quest-modal')).hide();
                if (typeof window.refreshSingleCard === 'function') window.refreshSingleCard(questId);
                else location.reload();
            });

            } finally {
                submitBtn.disabled = false;
            }
        },

        updateRoleUI, updateStatusUI, openSearchOverlay, openAssignPicker, openBqPicker, openCapSettingsInfo,
        async openDuplicateModal(taskId, workData = []) {
            const form = el('b-quest-modal-form');
            form.reset(); form.classList.remove('was-validated');
            State.currentData = null;
            State.currentRoleRows = {};
            const [, , , linkCfg] = await Promise.all([loadVisibleRoles(), BQuestService.loadStatuses(), BQuestService.loadWorkdayWeight(), loadQuestLinkConfig()]);
            State.linkCfg = linkCfg;
            renderRoleCards();
            renderLinkZone();
            await Promise.all([BQuestService.loadProfiles(), BQuestService.loadTypes()]);
            setupDropdowns(workData);

            State.allowAssign = false;

            const [data, roleRows] = await Promise.all([BQuestService.getQuestById(taskId), BQuestService.getTaskRoles(taskId)]);
            if (!data) return;

            el('b-quest-modal-id').value = '';
            el('btn-submit-icon').className  = 'bi bi-plus-circle-fill';
            el('btn-submit-label').textContent = 'Create Task';
            show('btn-delete-task', false);

            // Copy each role's data in, but drop the deadline/assign so the
            // duplicate doesn't silently inherit a stale due date or land on
            // someone else's plate — Duplicate is meant as a starting point,
            // not an exact clone of an in-flight assignment.
            const roleRowsByRole = Object.fromEntries(roleRows.map(r => [r.role_id, r]));
            State.visibleRoles.forEach(role => {
                const srcRow = roleRowsByRole[role.id];
                const hasRoleData = !!srcRow;
                el(`check-${role.id}`).checked = hasRoleData;
                updateRoleUI(role.id);

                const statusEl = el(`b-quest-modal-${role.id}-status`);
                if (hasRoleData) {
                    fillRoleCardData(role.id, { ...srcRow, deadline: '', assign: '' });
                }
                show(`b-quest-modal-${role.id}-status-wrap`, hasRoleData, 'flex');
                updateStatusUI(statusEl);

                refreshAssignBadge(role.id, '', false);

                const capEl = el(`${role.id}-capacity-info`);
                if (capEl) { capEl.className = 'bq-cap-info'; capEl.innerHTML = ''; }

                const card = el(`card-${role.id}`);
                card.querySelectorAll('input, select, textarea, button').forEach(inp => inp.disabled = false);
                card.style.opacity = '';
            });

            const dupData = {
                account_name: data.account_name,
                opportunity_name: data.opportunity_name,
                task_name: (data.task_name || '') + ' - Copy',
                link: data.link,
                link_2: data.link_2,
                link_3: data.link_3,
                publish_date: data.publish_date,
                detail: data.detail
            };
            const ownerName = getBxUser()?.codename || '—';

            bootstrap.Modal.getOrCreateInstance(el('b-quest-modal')).show();
            setTimeout(() => {
                fillFormData(dupData);
                el('modal-owner-display').innerText = ownerName;
                setModalOwnerAvatar(getBxUser()?.codename);
                el('b-quest-modal-taskname').value = dupData.task_name;
            }, 50);
        },
        closeSearchOverlay: () => show('bq-search-overlay', false),
        handleDeleteTask
    };
})();

window.BQuestApp = BQuestApp;
window.openTaskModal = BQuestApp.openModal;
window.openDuplicateModal = BQuestApp.openDuplicateModal;
document.getElementById('b-quest-modal-form').addEventListener('submit', BQuestApp.submitForm);
