// ── Form UI helpers (shared by the 4 auth pages) ───────────────────────────
// Errors show inline instead of in a SweetAlert popup: a field's own
// problem under that field (red border + message + shake, same idea as
// the modals' .is-invalid/shakeInvalid()), anything else (wrong password,
// network) in one .form-error box above the submit button. SweetAlert is
// kept only for the "it worked, now go check your email" moments.

const AUTH_ICON_EYE = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
const AUTH_ICON_EYE_OFF = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"></path><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
const AUTH_ICON_ALERT = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;

// Show/hide password. Buttons start with the eye icon ("show").
function togglePass(id, btn) {
    const input = document.getElementById(id);
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.innerHTML = show ? AUTH_ICON_EYE_OFF : AUTH_ICON_EYE;
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
}

function authShake(el) {
    if (!el) return;
    el.classList.remove('auth-shake');
    void el.offsetWidth; // restart the animation if it's already applied
    el.classList.add('auth-shake');
}

// Spinner + disabled while a request is in flight, so a double tap can't
// send it twice (signup: twice the confirmation email, against a small
// hourly email quota).
function setBtnLoading(btn, on, text) {
    if (!btn) return;
    if (on) {
        if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
        btn.disabled = true;
        btn.innerHTML = `<span class="btn-spinner" aria-hidden="true"></span><span>${text || btn.dataset.label}</span>`;
        btn.setAttribute('aria-busy', 'true');
    } else {
        btn.disabled = false;
        btn.textContent = btn.dataset.label || btn.textContent;
        btn.removeAttribute('aria-busy');
    }
}

// Red border + message under one field. Clears itself as soon as the
// user edits that field again.
function setFieldError(inputId, msg) {
    const input = document.getElementById(inputId);
    const group = input?.closest('.group');
    if (!group) return;
    let box = group.querySelector('.field-error');
    if (!box) {
        box = document.createElement('div');
        box.className = 'field-error';
        box.id = inputId + '-error';
        box.setAttribute('role', 'alert');
        group.appendChild(box);
    }
    box.textContent = msg;
    group.classList.add('has-error');
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', box.id);
    const clear = () => {
        group.classList.remove('has-error');
        input.removeAttribute('aria-invalid');
        input.removeEventListener('input', clear);
        input.removeEventListener('change', clear);
    };
    input.addEventListener('input', clear);
    input.addEventListener('change', clear);
    authShake(group);
    if (input.offsetParent !== null) input.focus(); // hidden <select> (dept) can't take focus
}

// One message for the whole form, right above the submit button.
function showFormError(form, msg) {
    if (!form) return;
    let box = form.querySelector('.form-error');
    if (!box) {
        box = document.createElement('div');
        box.className = 'form-error';
        box.setAttribute('role', 'alert');
        form.querySelector('.btn-main')?.before(box);
    }
    box.innerHTML = AUTH_ICON_ALERT + '<span></span>';
    box.querySelector('span').textContent = msg;
    box.classList.add('show');
    authShake(box);
}

function clearFormErrors(form) {
    if (!form) return;
    form.querySelectorAll('.group.has-error').forEach(g => g.classList.remove('has-error'));
    form.querySelectorAll('[aria-invalid]').forEach(i => i.removeAttribute('aria-invalid'));
    form.querySelector('.form-error')?.classList.remove('show');
}

const authSubmitBtn = form => form?.querySelector('.btn-main');

// Replaces the browser's own "Please fill out this field" bubbles (forms
// are novalidate) with the inline style above. Reads the same HTML
// attributes (required / type=email / minlength), so the rules still live
// in the markup. Returns false and marks the first bad field.
function validateAuthForm(form) {
    clearFormErrors(form);
    for (const el of form.querySelectorAll('input, select')) {
        const v = el.validity;
        if (v.valid) continue;
        const name = (form.querySelector(`label[for="${el.id}"]`)?.textContent || 'This field').trim();
        let msg = `${name} is required.`;
        if (v.typeMismatch) msg = 'Please enter a valid email address.';
        else if (v.tooShort) msg = `Must be at least ${el.minLength} characters.`;
        setFieldError(el.id, msg);
        return false;
    }
    return true;
}

// ── Auth Functions ──────────────────────────────────────────────────────────
// Each takes the <form> it was submitted from, for the loading state and
// inline errors above.

async function handleLogin(email, password, form) {
    const btn = authSubmitBtn(form);
    clearFormErrors(form);
    setBtnLoading(btn, true, 'Signing in...');
    try {
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/index.html'; // button stays in its loading state until the page leaves
    } catch (error) {
        console.error('Login Error:', error.message);
        const msg = (error.message || '').toLowerCase();
        let friendly = error.message || 'Sign in failed. Please try again.';
        if (msg.includes('invalid login credentials')) friendly = 'Incorrect email or password.';
        else if (msg.includes('email not confirmed')) friendly = 'Please confirm your email first. Check your inbox for the confirmation link.';
        else if (msg.includes('failed to fetch') || msg.includes('network')) friendly = 'Can\'t reach the server. Check your connection and try again.';
        setBtnLoading(btn, false);
        showFormError(form, friendly);
    }
}

async function handleSignup(email, password, metadata, form) {
    const btn = authSubmitBtn(form);
    setBtnLoading(btn, true, 'Creating account...');
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                emailRedirectTo: window.location.origin + '/auth/login.html',
                data: metadata
            }
        });

        if (error) throw error;

        // Supabase returns user:null when email already exists but unconfirmed
        if (!data?.user) {
            setBtnLoading(btn, false);
            setFieldError('email_val', 'This email may already be registered or is waiting for confirmation. Try signing in.');
            return;
        }

        Swal.fire({
            icon: "success",
            title: "Registration Complete!",
            text: "Please check your email for confirmation."
        }).then(() => {
            window.location.href = "login.html";
        });

    } catch (err) {
        console.error('Signup error:', err);
        setBtnLoading(btn, false);
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('already registered') || msg.includes('already been registered')) {
            return setFieldError('email_val', 'This email is already registered. Please sign in instead.');
        }
        if (msg.includes('not allowed to register')) {
            return setFieldError('email_val', 'This email domain is not allowed to register.');
        }
        let friendly;
        if (msg.includes('currently closed')) {
            friendly = 'Signups are currently closed. Please contact your administrator.';
        } else if (msg.includes('rate limit') || msg.includes('too many')) {
            friendly = 'Too many sign-up attempts right now. Please wait a while and try again.';
        } else if (msg.includes('database error') || msg.includes('unexpected_failure') || !msg || msg === '{}') {
            // Deliberately neutral — this bucket catches whatever specific
            // server-side rejection Supabase Auth swallowed before it
            // reached here (confirmed to have hit this exact path for both
            // "signups closed" and "domain not allowed" before each got
            // its own client-side pre-check). Guessing a specific cause
            // here has been wrong more than once; "contact admin" is the
            // one honest next step regardless of which check actually failed.
            friendly = 'Registration failed. Please try again or contact your administrator.';
        } else {
            friendly = err.message;
        }
        showFormError(form, friendly);
    }
}


async function handleForgotPassword(email, form) {
    const btn = authSubmitBtn(form);
    clearFormErrors(form);
    setBtnLoading(btn, true, 'Sending...');
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth/reset-password.html',
        });

        if (error) throw error;

        setBtnLoading(btn, false);
        // No confirmButtonColor — the shared .swal2-styled.swal2-confirm
        // rule in system.js already themes this correctly (var(--c-dark)),
        // a hardcoded value here would override it with a stale color.
        Swal.fire({
            icon: "success",
            title: "Link Sent!",
            text: "Please check your email to reset password."
        });

    } catch (err) {
        setBtnLoading(btn, false);
        const msg = (err.message || '').toLowerCase();
        showFormError(form, msg.includes('rate limit') || msg.includes('seconds')
            ? 'A reset link was sent recently. Please wait a minute before asking again.'
            : err.message);
    }
}

async function handleUpdatePassword(newPassword, form) {
    const btn = authSubmitBtn(form);
    clearFormErrors(form);
    setBtnLoading(btn, true, 'Updating...');
    try {
        const { error } = await supabaseClient.auth.updateUser({
            password: newPassword
        });

        if (error) throw error;

        Swal.fire("Success!", "Password updated successfully.", "success").then(() => {
            window.location.href = "login.html";
        });

    } catch (err) {
        setBtnLoading(btn, false);
        const msg = err.message?.toLowerCase() || '';
        if (msg.includes('same password') || msg.includes('different from') || msg.includes('different password')) {
            return setFieldError('pass_val', 'New password must be different from your current password.');
        }
        showFormError(form, err.message);
    }
}

// ── Shared page setup for the 4 auth pages ───────────────────────────────
// None of them call initLayout() (no session yet), so the branding sync
// that piggybacks on it elsewhere runs here instead. The logo stays
// hidden until we know which one to show: the cached Settings logo
// straight away, otherwise after the Settings fetch, falling back to the
// build's default LOGO_URL — so a first visit never flashes the default
// logo before swapping. emailInputId (optional): when Settings → Signup
// locks sign-ups to certain email domains, use the first one as that
// field's example ("name@company.com" otherwise).
async function initAuthPage({ emailInputId } = {}) {
    const logo = document.getElementById('brandbox-logo');
    const cached = (() => { try { return JSON.parse(localStorage.getItem(BX_BRANDING_CACHE_KEY) || 'null'); } catch { return null; } })();
    applyCachedBranding();
    const reveal = src => { if (!logo) return; if (src) logo.src = src; else if (!logo.getAttribute('src')) logo.src = LOGO_URL; logo.classList.remove('is-pending'); };
    if (cached?.logo_icon_url) reveal(cached.logo_icon_url);
    const fallback = setTimeout(() => reveal(null), 2500); // slow/blocked fetch: don't leave a hole
    await refreshBranding();
    clearTimeout(fallback);
    let fresh = null;
    try { fresh = JSON.parse(localStorage.getItem(BX_BRANDING_CACHE_KEY) || 'null'); } catch {}
    reveal(fresh?.logo_icon_url || null);

    const input = emailInputId && document.getElementById(emailInputId);
    if (input && fresh?.signup_domain_lock_enabled === 'true') {
        const domain = (fresh.signup_allowed_domains || '').split(',').map(d => d.trim()).filter(Boolean)[0];
        if (domain) input.placeholder = `name@${domain}`;
    }
}
