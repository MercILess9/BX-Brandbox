// Shared assign-picker popup — search input + pick-a-person list (avatar +
// name + department), clear-to-unassign. Self-injects its own markup +
// styles on first use, same convention as system/multi-select.js and
// system/save-bar.js, so any page can use it by just loading this script.
//
// Usage:
//   openAssignPicker({
//       candidates: [{ codename, full_name, department }, ...],
//       title: 'Assign',                  // header text
//       emptyText: 'No candidates for this role',
//       onSelect: (value) => { ... }       // value: codename string, or '' for Unassigned
//   });
//
// Ported from b-quest-assignment.html's own openAssignPicker (previously
// duplicated there in full — markup, CSS and JS). b-quest-modal.js also has
// an openAssignPicker, but its version was deliberately left as its own
// local copy rather than switched to this shared one: it reuses the SAME
// overlay element (and a race-guard token) as that file's generic
// account/opportunity search popup, so pulling it out into a separately
// self-injected overlay would change real behavior (two overlay elements
// instead of one, decoupling the race guard) rather than just deduplicating
// markup — see the comment on openAssignPicker in b-quest-modal.js.

(function () {
    let injected = false;
    let overlay, list, searchInput, clearIcon, titleEl;

    function injectMarkup() {
        if (injected) return;
        injected = true;

        const style = document.createElement('style');
        style.textContent = `
            /* 1000 used to be plenty when this only ever opened over a plain
               page (b-quest-assignment.html). Now the B-Quest Modal also
               opens it from inside itself — a Bootstrap modal/backdrop sits
               at z-index 1050-1055, so 1000 rendered this BEHIND it. Matched
               to b-quest-modal.js's own #bq-search-overlay (10001), the
               convention every overlay nested inside that modal already uses. */
            .bx-ap-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 10001; display: none; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
            .bx-ap-card { background: #fff; width: 480px; max-height: 80vh; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); }
            .bx-ap-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; margin-bottom: 14px; border-bottom: 1px solid var(--c-border); }
            .bx-ap-title { font-size: 1rem; font-weight: 800; color: var(--c-dark); margin: 0; display: flex; align-items: center; gap: 8px; }
            .bx-ap-title i { color: var(--c-accent); }
            .bx-ap-close { background: #f1f5f9; border: none; border-radius: 8px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: #94a3b8; transition: 0.2s; flex-shrink: 0; }
            .bx-ap-close:hover { background: #e2e8f0; color: var(--c-dark, #1e293b); }
            .bx-ap-search-wrap { position: relative; margin-bottom: 14px; }
            .bx-ap-search { width: 100%; border-radius: 12px; padding: 9px 34px 9px 14px; font-size: 0.85rem; border: 1px solid var(--c-border); outline: none; font-family: inherit; transition: 0.2s; background: var(--c-bg); box-sizing: border-box; }
            .bx-ap-search:focus { border-color: var(--c-accent); background: #fff; box-shadow: none; }
            .bx-ap-clear-icon { position: absolute; right: 12px; top: 50%; transform: translateY(-50%); color: #cbd5e1; cursor: pointer; font-size: 0.85rem; transition: color 0.15s; }
            .bx-ap-clear-icon:hover { color: #94a3b8; }
            .bx-ap-list { min-height: 280px; overflow-y: auto; flex: 1; padding-right: 5px; }
            .bx-ap-item { display: flex; align-items: center; gap: 12px; padding: 10px 12px; border-radius: 12px; cursor: pointer; transition: background 0.15s; border: none; background: none; width: 100%; text-align: left; font-family: inherit; }
            .bx-ap-item:hover { background: #f1f5f9; }
            .bx-ap-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--c-accent-light); display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 800; color: var(--c-accent-dark); flex-shrink: 0; overflow: hidden; }
            .bx-ap-avatar img { width: 100%; height: 100%; object-fit: cover; }
            .bx-ap-avatar span { font-size: 0.68rem; }
            .bx-ap-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
            .bx-ap-nick { font-size: 0.85rem; font-weight: 700; color: var(--c-dark); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .bx-ap-line2 { font-size: 0.72rem; color: var(--c-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .bx-ap-dept { flex-shrink: 0; font-size: 0.65rem; font-weight: 700; color: var(--c-slate); background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 20px; padding: 3px 10px; white-space: nowrap; }
            .bx-ap-empty { padding: 30px; text-align: center; color: var(--c-muted); font-size: 0.82rem; font-weight: 600; }
            .bx-ap-clear-row .bx-ap-avatar { background: #fee2e2; color: #dc2626; }
            .bx-ap-clear-row .bx-ap-nick { color: #dc2626; }
            .bx-ap-clear-row:hover { background: #fef2f2; }
        `;
        document.head.appendChild(style);

        overlay = document.createElement('div');
        overlay.className = 'bx-ap-overlay';
        overlay.innerHTML = `
            <div class="bx-ap-card">
                <div class="bx-ap-header">
                    <h5 class="bx-ap-title"><i class="bi bi-person-check-fill"></i> <span class="bx-ap-title-text">Assign</span></h5>
                    <button type="button" class="bx-ap-close"><i class="bi bi-x"></i></button>
                </div>
                <div class="bx-ap-search-wrap">
                    <input type="text" class="bx-ap-search" placeholder="Search...">
                    <i class="bi bi-x-circle-fill bx-ap-clear-icon" style="display:none;"></i>
                </div>
                <div class="bx-ap-list"></div>
            </div>
        `;
        // Click on the backdrop itself (not a bubbled click from the card
        // or its children) closes the popup — e.target stays the
        // originating element through bubbling, so this check is
        // equivalent to the old markup's onclick-on-wrapper +
        // stopPropagation-on-card pair, just without needing the latter.
        overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
        document.body.appendChild(overlay);
        // injectMarkup() only runs once (first use), but which modal (if
        // any) is open can differ on every call — openAssignPicker() below
        // re-parents this same overlay into whichever is open each time.

        list = overlay.querySelector('.bx-ap-list');
        searchInput = overlay.querySelector('.bx-ap-search');
        clearIcon = overlay.querySelector('.bx-ap-clear-icon');
        titleEl = overlay.querySelector('.bx-ap-title-text');
        overlay.querySelector('.bx-ap-close').addEventListener('click', close);
    }

    function escHtml(s) {
        return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function close() {
        if (overlay) overlay.style.display = 'none';
    }

    window.openAssignPicker = function ({ candidates = [], title = 'Assign', emptyText = 'No candidates for this role', allowClear = true, clearLabel = 'Unassigned', onSelect }) {
        injectMarkup();
        // Bootstrap 5's modal FocusTrap forces focus back inside the modal
        // on any focusin outside it — this overlay living under
        // document.body meant its search input could be clicked but never
        // actually hold focus whenever opened from inside the B-Quest task
        // modal. Re-parent into whichever modal is currently open (if any)
        // every time, since injectMarkup() above only runs once. See
        // select-picker.js's openSelectPicker() for the full writeup.
        (document.querySelector('.modal.show') || document.body).appendChild(overlay);

        titleEl.textContent = title;
        overlay.style.display = 'flex';
        searchInput.value = '';
        clearIcon.style.display = 'none';

        const render = (filter = '') => {
            list.innerHTML = '';
            if (allowClear) {
                const clearBtn = document.createElement('button');
                clearBtn.className = 'bx-ap-item bx-ap-clear-row w-100';
                clearBtn.innerHTML = `
                    <div class="bx-ap-avatar"><i class="bi bi-x-circle"></i></div>
                    <div class="bx-ap-info"><span class="bx-ap-nick">${escHtml(clearLabel)}</span></div>`;
                clearBtn.onclick = () => { onSelect(''); close(); };
                list.appendChild(clearBtn);
            }

            const fl = filter.toLowerCase();
            const matches = candidates.filter(c =>
                (c.codename || '').toLowerCase().includes(fl) ||
                (c.full_name || '').toLowerCase().includes(fl) ||
                (c.department || '').toLowerCase().includes(fl)
            );
            if (!matches.length) {
                list.insertAdjacentHTML('beforeend', `<div class="bx-ap-empty">${filter ? 'No matches' : escHtml(emptyText)}</div>`);
            }
            matches.forEach(c => {
                const btn = document.createElement('button');
                btn.className = 'bx-ap-item w-100';
                const avatarHtml = c.avatar_url
                    ? `<img src="${escHtml(c.avatar_url)}" alt="">`
                    : `<span>${escHtml(getInitials((c.nick_name || c.full_name || c.codename || '').replace(/\s*\(.*$/, '')))}</span>`;
                btn.innerHTML = `
                    <div class="bx-ap-avatar">${avatarHtml}</div>
                    <div class="bx-ap-info">
                        <span class="bx-ap-nick">${escHtml(c.codename)}</span>
                        ${c.full_name ? `<span class="bx-ap-line2">${escHtml(c.full_name)}</span>` : ''}
                    </div>
                    ${c.department ? `<span class="bx-ap-dept">${escHtml(c.department)}</span>` : ''}`;
                btn.onclick = () => { onSelect(c.codename); close(); };
                list.appendChild(btn);
            });
        };
        render();
        searchInput.oninput = e => {
            clearIcon.style.display = e.target.value ? 'block' : 'none';
            render(e.target.value);
        };
        clearIcon.onclick = () => {
            searchInput.value = '';
            clearIcon.style.display = 'none';
            searchInput.focus();
            render('');
        };
    };

    window.closeAssignPicker = close;
})();
