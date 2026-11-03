const B_ACCOUNT_MODAL_HTML = `
<style>
    #b-account-modal .modal-content { background: #f8fafc; border-radius: 24px; border: none; overflow: hidden; box-shadow: 0 24px 60px rgba(0,0,0,0.14); }
    .bac-modal-1000 { max-width: 1000px !important; }

    /* ── Header ── */
    .bac-header { background: #fff; padding: 14px 28px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; gap: 12px; }
    .bac-header-left { display: flex; align-items: center; gap: 10px; }
    /* Shown only in Edit (see openEdit()) — same ref-badge treatment as
       B-Quest Modal's own .bq-modal-id-badge, positioned after Owner so
       the layout doesn't shift between New (no badge) and Edit. */
    .bac-modal-id-badge { display: inline-flex; align-items: center; gap: 5px; font-size: 0.68rem; font-weight: 800; color: var(--c-accent-dark); letter-spacing: 0.6px; background: var(--c-accent-light); border-radius: 20px; padding: 6px 12px; }
    .bac-owner-wrap { display: flex; align-items: center; gap: 10px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 7px 14px 7px 8px; }
    /* Circular (was border-radius:8px) to match the person-avatar convention
       used everywhere else now (B-Quest Modal's own .bq-owner-icon, list
       cards, member tables) — shows the current user's real photo when
       they have one, falls back to initials. */
    .bac-owner-icon { width: 28px; height: 28px; background: var(--c-accent-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 800; color: var(--c-accent-dark); flex-shrink: 0; overflow: hidden; }
    .bac-owner-icon img { width: 100%; height: 100%; object-fit: cover; }
    .bac-owner-icon span { font-size: 0.62rem; }
    .bac-owner-label { font-size: 0.52rem; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; line-height: 1; margin-bottom: 2px; }
    .bac-owner-name { font-size: 0.82rem; font-weight: 700; color: var(--c-dark, #1e293b); line-height: 1; }
    .bac-header-right { display: flex; align-items: center; gap: 12px; }
    .bac-status-wrap { display: none; align-items: center; }
    .bac-status-wrap.visible { display: flex; }
    /* Visible trigger for the hidden #bac-header-status select — opens the
       shared select-picker.js popover (openStatusPicker()) instead of a
       plain native dropdown, same pattern b-opportunity-modal.js's own
       status field already uses. Colors/sizing kept identical to the old
       select's own status-active/status-inactive look. */
    .bac-status-trigger { appearance: none; border: 1.5px solid #e2e8f0; border-radius: 10px; font-size: 0.8rem; font-weight: 700; padding: 0 30px 0 14px; background: #fff; color: #334155; cursor: pointer; font-family: inherit; height: 36px; outline: none; transition: 0.2s; position: relative; }
    .bac-status-trigger:hover { border-color: var(--c-accent); }
    .bac-status-trigger:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .bac-status-trigger.status-active   { background: var(--c-accent-light); color: var(--c-accent-dark); border-color: var(--c-accent); }
    .bac-status-trigger.status-inactive { background: #f8fafc; color: #94a3b8; border-color: #e2e8f0; }
    .bac-status-trigger::after {
        content: ''; position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        width: 9px; height: 9px; pointer-events: none;
        background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 16 16'%3E%3Cpath fill='%23334155' d='M7.247 11.14L2.451 5.658C1.885 5.013 2.345 4 3.204 4h9.592a1 1 0 0 1 .753 1.659l-4.796 5.48a1 1 0 0 1-1.506 0z'/%3E%3C/svg%3E") no-repeat center / contain;
    }

    /* ── Body ── */
    .bac-body { padding: 20px 28px; }

    /* ── Top glass card ── */
    .bac-top-card { background: #fff; border-radius: 18px; padding: 18px 20px 14px; border: 1px solid #eef2f7; box-shadow: 0 2px 8px -2px rgba(0,0,0,0.04); margin-bottom: 14px; }
    .bac-top-row { display: flex; align-items: flex-end; gap: 12px; }
    .bac-company-row { margin-top: 10px; }
    .bac-addr-row { display: flex; align-items: flex-start; gap: 12px; margin-top: 10px; }
    .bac-addr-group { flex: 4; min-width: 0; }
    .bac-addr-taxid-group { flex: 1; min-width: 160px; }

    /* Inputs */
    .bq-label-modern { font-size: 0.6rem; font-weight: 800; color: #94a3b8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.8px; display: block; }
    .bq-input-modern { width: 100%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 5px 12px; font-size: 0.85rem; color: #334155; height: 35px; transition: 0.2s; font-family: inherit; box-sizing: border-box; }
    .bq-input-modern:hover { border-color: var(--c-accent); }
    .bq-input-modern:focus { outline: none; border-color: var(--c-accent); background: #fff; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12); }
    .was-validated .bq-input-modern:invalid { border-color: #dc3545 !important; background-color: #fff8f8; }

    /* Search button */
    .bq-search-btn { width: 44px; height: 35px; flex-shrink: 0; border: 1px solid var(--c-accent); border-left: none; border-radius: 0 10px 10px 0; background: var(--c-accent-light); color: var(--c-accent-dark); cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; transition: 0.2s; }
    .bq-search-btn:hover { background: var(--c-accent); color: var(--c-on-accent); }

    /* Duplicate warning — absolute so it doesn't shift layout */
    .bac-company-wrap { position: relative; }
    .bac-company-wrap.has-dup .bq-input-modern { border-color: #dc2626 !important; box-shadow: 0 0 0 3px rgba(220,38,38,0.1); background: #fff; }
    .bac-dup-warn { position: absolute; top: calc(100% + 3px); left: 0; font-size: 0.7rem; font-weight: 700; color: #dc2626; background: #fff; border: 1px solid #fecaca; border-radius: 8px; padding: 3px 9px; white-space: nowrap; display: none; z-index: 10; box-shadow: 0 2px 8px rgba(220,38,38,0.1); }
    .bac-dup-warn.visible { display: flex; align-items: center; gap: 5px; }

    /* ── Card-style text boxes (like ac-box) ── */
    .bac-boxes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .bac-box { background: #fff; border: 1px solid #eef2f7; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.03); }
    .bac-box-label { display: flex; align-items: center; gap: 6px; padding: 8px 14px; font-size: 0.58rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.8px; color: #94a3b8; border-bottom: 1px solid #f1f5f9; background: #fafbfc; }
    .bac-box-ta { width: 100%; border: none; background: transparent; padding: 11px 14px; font-size: 0.85rem; color: #334155; font-family: inherit; resize: none; min-height: 80px; outline: none; line-height: 1.6; box-sizing: border-box; border-radius: 0 0 14px 14px; transition: box-shadow 0.15s; }
    /* Inset ring, not a border — this textarea already sits inside
       .bac-box's own bordered card, so a real border here would double up
       against it. box-shadow needs no property beyond what's already
       there, unlike the QT table's borderless inputs elsewhere. The
       textarea needs the SAME bottom border-radius as .bac-box (it fills
       the card's bottom section, below the label bar) or its own ring
       draws with square corners that visibly clash with the card's
       rounded ones once .bac-box's overflow:hidden clips the mismatch. */
    .bac-box-ta:hover, .bac-box-ta:focus { box-shadow: inset 0 0 0 1.5px var(--c-accent); }
    .bac-box-ta::placeholder { color: #cbd5e1; }
    /* ── Account name search overlay ── */
    .bac-overlay { position: fixed; inset: 0; background: rgba(15,23,42,0.4); z-index: 10001; display: none; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
    .bac-overlay.open { display: flex; }
    .bac-overlay-card { background: #fff; width: 480px; max-height: 80vh; border-radius: 22px; padding: 22px; display: flex; flex-direction: column; box-shadow: 0 24px 60px rgba(0,0,0,0.15); }
    .bac-overlay-list { overflow-y: auto; flex: 1; padding-right: 4px; }
    /* Plain Bootstrap .form-control with no override falls back to
       Bootstrap's own default blue focus ring — every other input in this
       modal already gets the accent instead, this one was just missed. */
    #bac-overlay-input:focus { border-color: var(--c-accent) !important; box-shadow: 0 0 0 3px rgba(var(--c-accent-rgb), 0.12) !important; }
    .bac-item { border: 1px solid #f1f5f9; background: #fff; border-radius: 12px; margin-bottom: 5px; padding: 11px 16px; font-size: 0.85rem; font-weight: 600; text-align: left; cursor: pointer; transition: 0.15s; color: #334155; width: 100%; }
    /* Green, matching B-Opportunity's own account-search overlay
       (.bopp-ov-item:hover) — user override 2026-09-13, superseding the
       earlier gray-by-design call (was ref'd off B-Quest's assign-picker
       to avoid a long list "lighting up" busy on scan); consistency
       between the two near-identical overlays won out instead. */
    .bac-item:hover { background: var(--c-accent-light); }

    /* ── Footer ── */
    .bac-footer { padding: 14px 28px; display: flex; justify-content: flex-end; gap: 10px; background: #fff; border-top: 1px solid #f1f5f9; }
    .btn-bac-del { background: #fee2e2; color: #ef4444; border: none; padding: 0 20px; border-radius: 10px; font-weight: 700; height: 40px; font-size: 0.85rem; display: none; cursor: pointer; transition: 0.2s; font-family: inherit; align-items: center; gap: 6px; }
    .btn-bac-del:hover { background: #fecaca; }
    .btn-bac-save { background: var(--c-dark); color: var(--c-accent); border: none; padding: 0 26px; border-radius: 10px; font-weight: 800; height: 40px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1); font-family: inherit; }
    .btn-bac-save i { font-size: 0.9rem; }
    .btn-bac-save:hover { background: #0f172a; transform: translateY(-2px) scale(1.04); box-shadow: 0 8px 24px rgba(0,0,0,0.22); }
    .btn-bac-save:active { transform: translateY(0) scale(0.97); box-shadow: none; transition-duration: 0.1s; }
    .btn-bac-save:disabled { opacity: 0.6; pointer-events: none; }

    /* ── Phone: full screen like B-Quest's modal — header and Save footer
       pinned, only the form scrolls, everything one column. 16px inputs
       match the page viewport's no-zoom setup. ── */
    @media (max-width: 767.98px) {
        #b-account-modal .modal-dialog { margin: 0; width: 100%; max-width: none !important; height: 100%; min-height: 100%; align-items: stretch; }
        #b-account-modal .modal-content { height: 100%; border-radius: 0; display: flex; flex-direction: column; }
        #b-account-modal form { flex: 1; min-height: 0; display: flex; flex-direction: column; }
        #b-account-modal .bac-header { flex-shrink: 0; flex-wrap: wrap; padding: 10px 16px; }
        #b-account-modal .bac-body { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px; -webkit-overflow-scrolling: touch; }
        #b-account-modal .bac-top-card { padding: 14px; }
        #b-account-modal .bac-top-row, #b-account-modal .bac-addr-row { flex-direction: column; align-items: stretch; gap: 10px; }
        #b-account-modal .bac-addr-taxid-group { min-width: 0; }
        #b-account-modal .bac-boxes { grid-template-columns: minmax(0, 1fr); }
        #b-account-modal .bq-input-modern, #b-account-modal .bac-box-ta { font-size: 16px; }
        #b-account-modal .bq-input-modern, #b-account-modal .bq-search-btn { height: 42px; }
        #b-account-modal .bac-footer { flex-shrink: 0; padding: 10px 16px calc(10px + env(safe-area-inset-bottom)); }
        #b-account-modal .btn-bac-save { flex: 1; justify-content: center; height: 44px; }
        #b-account-modal .btn-bac-del { height: 44px; }
        #b-account-modal .bac-overlay { align-items: flex-end; }
        #b-account-modal .bac-overlay-card { width: 100%; height: 88dvh; max-height: none; border-radius: 22px 22px 0 0; padding: 18px 16px calc(12px + env(safe-area-inset-bottom)); }
    }
</style>

<div class="modal fade" id="b-account-modal" tabindex="-1" aria-hidden="true" data-bs-backdrop="static">
    <div class="modal-dialog bac-modal-1000 modal-dialog-centered">
        <div class="modal-content">

            <!-- Account name picker overlay -->
            <div id="bac-overlay" class="bac-overlay" onclick="BAccountApp.closeOverlay()">
                <div class="bac-overlay-card" onclick="event.stopPropagation()">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h5 class="fw-bold m-0" style="font-size:0.95rem;">Select Account</h5>
                        <button type="button" class="btn-close" onclick="BAccountApp.closeOverlay()"></button>
                    </div>
                    <input type="text" id="bac-overlay-input" class="form-control mb-3" placeholder="Search account..." style="border-radius:14px; padding: 10px 15px; border: 1px solid #e2e8f0; font-size:0.85rem;">
                    <div class="bac-overlay-list" id="bac-overlay-list"></div>
                </div>
            </div>

            <!-- Header -->
            <div class="bac-header">
                <div class="bac-header-left">
                    <div class="bac-owner-wrap">
                        <div class="bac-owner-icon" id="bac-owner-icon"><i class="bi bi-person-fill"></i></div>
                        <div>
                            <div class="bac-owner-label">Owner</div>
                            <div class="bac-owner-name" id="bac-owner-name">—</div>
                        </div>
                    </div>
                    <span class="bac-modal-id-badge" id="bac-modal-id-badge" style="display:none;"><i class="bi bi-hash"></i><span id="bac-modal-id-badge-text"></span></span>
                </div>
                <div class="bac-header-right">
                    <div class="bac-status-wrap" id="bac-status-wrap">
                        <select id="bac-header-status" style="display:none;">
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                        <button type="button" class="bac-status-trigger" id="bac-header-status-trigger" onclick="BAccountApp.openStatusPicker(this)"></button>
                    </div>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
            </div>

            <!-- Form -->
            <form id="bac-form" novalidate>
                <input type="hidden" id="bac-editing-id">
                <div class="bac-body">

                    <!-- ── Top: Account / Company / Address + Tax ID ── -->
                    <div class="bac-top-card">
                        <!-- Account Name + Company Name same row 50:50 -->
                        <div class="bac-top-row" style="margin-bottom:10px;">
                            <div style="flex:1; min-width:0;">
                                <label class="bq-label-modern">Account Name <span style="color:#ef4444">*</span></label>
                                <div class="d-flex">
                                    <input type="text" id="bac-account-name" class="bq-input-modern"
                                           style="border-radius:10px 0 0 10px; margin:0;" placeholder="Select or type..." required>
                                    <button type="button" class="bq-search-btn" onclick="BAccountApp.openOverlay()">
                                        <i class="bi bi-search"></i>
                                    </button>
                                </div>
                            </div>
                            <div style="flex:1; min-width:0;">
                                <label class="bq-label-modern">Company Name <span style="color:#ef4444">*</span></label>
                                <div class="bac-company-wrap">
                                    <input type="text" id="bac-company-name" class="bq-input-modern" style="margin:0;" placeholder="Company name..." required>
                                    <div class="bac-dup-warn" id="bac-dup-warn">
                                        <i class="bi bi-exclamation-circle"></i> Already exists
                                    </div>
                                </div>
                            </div>
                        </div>
                        <!-- Address + Tax ID same row -->
                        <div class="bac-addr-row">
                            <div class="bac-addr-group">
                                <label class="bq-label-modern">Address</label>
                                <input type="text" id="bac-address" class="bq-input-modern" style="margin:0;" placeholder="Address...">
                            </div>
                            <div class="bac-addr-taxid-group">
                                <label class="bq-label-modern">Tax ID</label>
                                <input type="text" id="bac-tax-id" class="bq-input-modern" style="margin:0; text-align:center; letter-spacing:1.5px; font-family:'Courier New',monospace;" placeholder="0000000000000">
                            </div>
                        </div>
                    </div>

                    <!-- ── 2×2 Card-style boxes ── -->
                    <div class="bac-boxes">
                        <div class="bac-box">
                            <div class="bac-box-label"><i class="bi bi-telephone-fill"></i> Contact</div>
                            <textarea id="bac-contact" class="bac-box-ta" placeholder="Phone / Email..."></textarea>
                        </div>
                        <div class="bac-box">
                            <div class="bac-box-label"><i class="bi bi-file-earmark-text-fill"></i> Document</div>
                            <textarea id="bac-document" class="bac-box-ta" placeholder="Document..."></textarea>
                        </div>
                        <div class="bac-box">
                            <div class="bac-box-label"><i class="bi bi-credit-card-fill"></i> Payment</div>
                            <textarea id="bac-payment" class="bac-box-ta" placeholder="Payment..."></textarea>
                        </div>
                        <div class="bac-box">
                            <div class="bac-box-label"><i class="bi bi-chat-left-text-fill"></i> Remark</div>
                            <textarea id="bac-remark" class="bac-box-ta" placeholder="Remark..."></textarea>
                        </div>
                    </div>

                </div>

                <div class="bac-footer">
                    <button type="button" class="btn-bac-del" id="bac-btn-del">
                        <i class="bi bi-trash3"></i> Delete
                    </button>
                    <button type="submit" class="btn-bac-save" id="bac-btn-save">
                        <i class="bi bi-plus-circle-fill" id="bac-save-icon"></i>
                        <span id="bac-save-label">Create Account</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
`;

document.body.insertAdjacentHTML('beforeend', B_ACCOUNT_MODAL_HTML);

const BAccountApp = (() => {
    const el = id => document.getElementById(id);
    let _bsModal = null;
    let _editingId = null;
    let _overlayNames = [];

    function getBsModal() {
        if (!_bsModal) {
            _bsModal = new bootstrap.Modal(el('b-account-modal'));
            // Bootstrap already locks body scroll via its own .modal-open
            // class, but SweetAlert2 (save/error toasts fired while this
            // modal is open) manages document.body.style.overflow
            // independently and can stomp on Bootstrap's lock when it
            // closes — this shared, reference-counted lock keeps the
            // background from scrolling regardless of which library's
            // cleanup runs last.
            el('b-account-modal').addEventListener('shown.bs.modal', lockBodyScroll);
            el('b-account-modal').addEventListener('hidden.bs.modal', unlockBodyScroll);
        }
        return _bsModal;
    }

    function getBxUser() {
        try { return JSON.parse(sessionStorage.getItem('bx_user')); } catch { return null; }
    }

    function escAttr(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;') : ''; }
    function escHtml(s) { return s ? String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; }

    function resetForm() {
        el('bac-form').classList.remove('was-validated');
        ['bac-editing-id','bac-account-name','bac-company-name',
         'bac-address','bac-tax-id','bac-contact','bac-document','bac-payment','bac-remark'].forEach(id => {
            const e = el(id); if (e) e.value = '';
        });
        el('bac-header-status').value = 'Active';
        updateStatusStyle();
        el('bac-dup-warn').classList.remove('visible');
        el('bac-company-name').closest('.bac-company-wrap')?.classList.remove('has-dup');
    }

    function setOwner() {
        const user = getBxUser();
        el('bac-owner-name').textContent = user ? user.codename : '—';
        const iconEl = el('bac-owner-icon');
        if (!iconEl) return;
        if (user?.avatar_url) {
            iconEl.innerHTML = `<img src="${escAttr(user.avatar_url)}" alt="">`;
        } else if (user) {
            const name = (user.nick_name || user.full_name || user.codename || '').replace(/\s*\(.*$/, '');
            iconEl.innerHTML = `<span>${escHtml(getInitials(name))}</span>`;
        } else {
            iconEl.innerHTML = '<i class="bi bi-person-fill"></i>';
        }
    }

    function buildNameList() {
        _overlayNames = [...new Set((window.allAccounts || []).map(a => a.account_name).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, 'th'));
    }

    // ── Public: open new ─────────────────────────────────
    function openNew() {
        _editingId = null;
        resetForm();
        setOwner();
        buildNameList();
        el('bac-status-wrap').classList.remove('visible');
        el('bac-modal-id-badge').style.display = 'none';
        el('bac-btn-del').style.display = 'none';
        el('bac-save-icon').className = 'bi bi-plus-circle-fill';
        el('bac-save-label').textContent = 'Create Account';
        getBsModal().show();
    }

    // ── Public: open edit ────────────────────────────────
    function openEdit(accountId) {
        const rec = (window.allAccounts || []).find(a => a.account_id === accountId);
        if (!rec) return;
        _editingId = accountId;
        resetForm();
        setOwner();
        buildNameList();
        el('bac-modal-id-badge-text').textContent = accountId;
        el('bac-modal-id-badge').style.display = 'inline-flex';
        el('bac-editing-id').value = accountId;
        el('bac-account-name').value = rec.account_name || '';
        el('bac-company-name').value = rec.company_name || '';
        el('bac-address').value = rec.address || '';
        el('bac-tax-id').value = rec.tax_id || '';
        el('bac-contact').value = rec.contact || '';
        el('bac-document').value = rec.document || '';
        el('bac-payment').value = rec.payment || '';
        el('bac-remark').value = rec.remark || '';
        el('bac-header-status').value = rec.status || 'Active';
        updateStatusStyle();
        el('bac-status-wrap').classList.add('visible');
        el('bac-btn-del').style.display = 'inline-flex';
        el('bac-save-icon').className = 'bi bi-check-circle-fill';
        el('bac-save-label').textContent = 'Save Changes';
        getBsModal().show();
    }

    // ── Overlay ──────────────────────────────────────────
    function renderOverlayList(query) {
        const q = query.trim().toLowerCase();
        const filtered = q ? _overlayNames.filter(n => n.toLowerCase().includes(q)) : _overlayNames;
        el('bac-overlay-list').innerHTML = filtered.length
            ? filtered.map(n => `<button type="button" class="bac-item" data-name="${escAttr(n)}">${escHtml(n)}</button>`).join('')
            : '<p class="text-center py-3" style="color:#94a3b8;font-size:0.85rem;">No accounts found</p>';
    }

    function openOverlay() {
        el('bac-overlay-input').value = '';
        renderOverlayList('');
        el('bac-overlay').classList.add('open');
        setTimeout(() => el('bac-overlay-input').focus(), 50);
    }

    function closeOverlay() {
        el('bac-overlay').classList.remove('open');
    }

    el('bac-overlay-list').addEventListener('click', e => {
        const btn = e.target.closest('.bac-item');
        if (btn) { el('bac-account-name').value = btn.dataset.name; closeOverlay(); }
    });
    el('bac-overlay-input').addEventListener('input', e => renderOverlayList(e.target.value));

    // ── Duplicate check ──────────────────────────────────
    function isDupCompany(name) {
        const trimmed = name.trim().toLowerCase();
        return (window.allAccounts || []).some(a =>
            a.account_id !== _editingId &&
            (a.company_name || '').trim().toLowerCase() === trimmed
        );
    }

    function updateStatusStyle() {
        const select = el('bac-header-status');
        const trigger = el('bac-header-status-trigger');
        trigger.textContent = select.value;
        trigger.classList.toggle('status-active',   select.value === 'Active');
        trigger.classList.toggle('status-inactive', select.value === 'Inactive');
    }
    el('bac-header-status').addEventListener('change', updateStatusStyle);

    // Swapped the native <select> for the shared select-picker.js popover
    // (same pattern b-opportunity-modal.js's own status field already
    // uses) — select stays as the hidden source of truth (value read by
    // saveAccount(), reset by resetForm()/openEdit()), trigger is just its
    // visible button now.
    function openStatusPicker(triggerBtn) {
        const select = el('bac-header-status');
        openSelectPicker(triggerBtn, {
            getOptions: () => [...select.options].map(o => ({ value: o.value, label: o.textContent })),
            getValue: () => select.value,
            onSelect: (value) => {
                select.value = value;
                select.dispatchEvent(new Event('change'));
            }
        });
    }

    function setDupWarn(show) {
        el('bac-dup-warn').classList.toggle('visible', show);
        el('bac-company-name').closest('.bac-company-wrap').classList.toggle('has-dup', show);
    }

    el('bac-company-name').addEventListener('input', () => setDupWarn(false));

    // ── Submit ───────────────────────────────────────────
    async function handleSubmit(e) {
        e.preventDefault();
        const form = el('bac-form');
        form.classList.add('was-validated');
        if (!form.checkValidity()) return;

        const companyName = el('bac-company-name').value.trim();
        if (isDupCompany(companyName)) {
            setDupWarn(true);
            el('bac-company-name').focus();
            return;
        }
        setDupWarn(false);

        const user = getBxUser();
        const saveBtn = el('bac-btn-save');
        saveBtn.disabled = true;

        const payload = {
            account_name: el('bac-account-name').value.trim(),
            company_name: companyName,
            address:  el('bac-address').value.trim()  || null,
            tax_id:   el('bac-tax-id').value.trim()   || null,
            contact:  el('bac-contact').value.trim()  || null,
            document: el('bac-document').value.trim() || null,
            payment:  el('bac-payment').value.trim()  || null,
            remark:   el('bac-remark').value.trim()   || null,
        };

        try {
            if (_editingId) {
                payload.status = el('bac-header-status').value;
                payload.update_by = user?.codename || null;
                const { error } = await supabaseClient.from('b_account_list').update(payload).eq('account_id', _editingId);
                if (error) throw error;
                notify('success', 'Saved');
            } else {
                payload.status = 'Active';
                payload.create_by = user?.codename || null;
                const { error } = await supabaseClient.from('b_account_list').insert(payload);
                if (error) throw error;
                notify('success', 'Account created');
            }
            getBsModal().hide();
            if (typeof loadAllAccounts === 'function') await loadAllAccounts();
        } catch (err) {
            console.error('[B-ACCOUNT modal]', err);
            notify('', 'Save failed', 'error');
        } finally {
            saveBtn.disabled = false;
        }
    }

    // ── Delete ───────────────────────────────────────────
    async function handleDelete() {
        if (!_editingId) return;
        const result = await Swal.fire({
            title: 'Delete Account?',
            text: `${_editingId} will be permanently deleted.`,
            icon: 'warning', showCancelButton: true,
            confirmButtonText: 'Delete', confirmButtonColor: '#ef4444', cancelButtonText: 'Cancel'
        });
        if (!result.isConfirmed) return;
        const { error } = await supabaseClient.from('b_account_list').delete().eq('account_id', _editingId);
        if (error) { notify('', 'Delete failed', 'error'); return; }
        getBsModal().hide();
        notify('success', 'Deleted');
        if (typeof loadAllAccounts === 'function') await loadAllAccounts();
    }

    // ── Public: open duplicate ───────────────────────────
    function openDuplicate(accountId) {
        const rec = (window.allAccounts || []).find(a => a.account_id === accountId);
        if (!rec) return;
        openNew();
        el('bac-account-name').value = rec.account_name || '';
        el('bac-address').value      = rec.address      || '';
        el('bac-contact').value      = rec.contact      || '';
        el('bac-document').value     = rec.document     || '';
        el('bac-payment').value      = rec.payment      || '';
        el('bac-remark').value       = rec.remark       || '';
        // company_name + tax_id left empty intentionally
    }

    el('bac-form').addEventListener('submit', handleSubmit);
    el('bac-btn-del').addEventListener('click', handleDelete);

    return { openNew, openEdit, openDuplicate, openOverlay, closeOverlay, openStatusPicker };
})();
