#!/usr/bin/env python3
"""Build the Supabase Auth email templates from a fork's own Branding and push them.

Supabase's email templates can't read the database when an email is sent, so
the logo / theme colours set in System Settings -> Branding never reach the
login emails on their own. This script closes that gap: it reads the fork's
`system_setting` rows (logo_header_url, theme_accent, theme_dark), renders
every auth email from one shared layout, and writes them into that fork's
Auth config through the Management API.

Re-run it whenever Branding changes:

    python3 supabase/email-templates/sync.py bx --preview   # write HTML files only
    python3 supabase/email-templates/sync.py bx             # push to Supabase

Tokens come from the local machine only (never this repo):
  BX -> the Supabase CLI login in the macOS keychain
  CB -> ~/.config/supabase/cb-token
"""
import base64
import html
import json
import os
import subprocess
import sys
import urllib.request

FORKS = {
    'bx': {
        'ref': 'hdulohaxociujwaziszy',
        'brand': 'BrandStrom X',
        'site': 'https://bx.brandboxplatform.com',
        'token': 'keychain',
    },
    'cb': {
        'ref': 'axbegizkrahblgmovmdx',
        'brand': 'Cloudbound',
        'site': 'https://cloudbound.vercel.app',
        'token': '~/.config/supabase/cb-token',
    },
}

DEFAULTS = {'theme_accent': '#bdc432', 'theme_dark': '#1e293b'}

# One entry per auth email. `link` is the button target (a Go template
# expression Supabase fills in); None means the email carries a code instead.
# Recovery keeps its own token_hash link because reset-password.html verifies
# the token itself; it targets the clean URL so no redirect sits in between.
EMAILS = {
    'confirmation': {
        'subject': 'Confirm your {brand} account',
        'title': 'Confirm your email',
        'body': 'Thanks for signing up to {brand}. Confirm your email address to finish creating your account.',
        'button': 'Confirm Email',
        'link': '{{ .ConfirmationURL }}',
        'note': "If you didn't create an account, you can safely ignore this email.",
    },
    'recovery': {
        'subject': 'Reset your {brand} password',
        'title': 'Reset your password',
        'body': 'We received a request to reset the password for your {brand} account. Click the button below to choose a new one.',
        'button': 'Reset Password',
        'link': '{{ .SiteURL }}/auth/reset-password?token_hash={{ .TokenHash }}&type=recovery',
        'note': "If you didn't ask for this, you can safely ignore this email. Your password stays the same.<br>This link expires in 1 hour.",
    },
    'invite': {
        'subject': "You've been invited to {brand}",
        'title': "You've been invited",
        'body': "You've been invited to join {brand}. Accept the invitation to set up your account.",
        'button': 'Accept Invitation',
        'link': '{{ .ConfirmationURL }}',
        'note': "If you weren't expecting this invitation, you can safely ignore this email.",
    },
    'magic_link': {
        'subject': 'Your {brand} sign-in link',
        'title': 'Sign in to {brand}',
        'body': 'Click the button below to sign in. No password needed.',
        'button': 'Sign In',
        'link': '{{ .ConfirmationURL }}',
        'note': "If you didn't ask to sign in, you can safely ignore this email.",
    },
    'email_change': {
        'subject': 'Confirm your new {brand} email',
        'title': 'Confirm your new email',
        'body': 'Confirm that you want to change the email on your {brand} account to <strong>{{ .NewEmail }}</strong>.',
        'button': 'Confirm Change',
        'link': '{{ .ConfirmationURL }}',
        'note': "If you didn't ask for this change, contact your administrator.",
    },
    'reauthentication': {
        'subject': 'Your {brand} verification code',
        'title': 'Your verification code',
        'body': 'Enter this code to confirm it’s you:',
        'button': None,
        'link': None,
        'note': "If you didn't ask for this code, you can safely ignore this email.",
    },
}


def token(fork):
    src = FORKS[fork]['token']
    if src == 'keychain':
        raw = subprocess.run(['security', 'find-generic-password', '-s', 'Supabase CLI', '-w'],
                             capture_output=True, text=True).stdout.strip()
        if raw.startswith('go-keyring-base64:'):
            raw = base64.b64decode(raw.split(':', 1)[1]).decode()
        return raw
    return open(os.path.expanduser(src)).read().strip()


def api(fork, method, path, body=None):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{FORKS[fork]['ref']}{path}",
        data=json.dumps(body).encode() if body is not None else None, method=method,
        headers={'Authorization': 'Bearer ' + token(fork), 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def branding(fork):
    rows = api(fork, 'POST', '/database/query', {
        'query': "select key, value from system_setting where key in "
                 "('logo_header_url','theme_accent','theme_dark')", 'read_only': True})
    b = dict(DEFAULTS)
    b.update({r['key']: r['value'] for r in rows if r.get('value')})
    return b


def render(fork, b, e):
    brand = html.escape(FORKS[fork]['brand'])
    site = FORKS[fork]['site']
    accent = html.escape(b['theme_accent'])
    dark = html.escape(b['theme_dark'])
    fill = lambda s: s.replace('{brand}', brand)

    logo = b.get('logo_header_url')
    head = (f'<img src="{html.escape(logo)}" alt="{brand}" height="40" '
            f'style="display:block;margin:0 auto;height:40px;width:auto;max-width:200px;border:0;">'
            if logo else
            f'<div style="font-size:22px;font-weight:800;color:{dark};">{brand}</div>')

    if e['link']:
        action = f'''
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto 28px;">
            <tr><td style="background:{dark};border-radius:12px;">
              <a href="{e['link']}" style="display:inline-block;padding:14px 36px;font-size:15px;font-weight:700;color:{accent};text-decoration:none;">{e['button']}</a>
            </td></tr>
          </table>
          <p style="margin:0 0 24px;font-size:12px;color:#94a3b8;text-align:center;line-height:1.6;word-break:break-all;">
            Button not working? Copy this link into your browser:<br>
            <a href="{e['link']}" style="color:#64748b;">{e['link']}</a>
          </p>'''
    else:
        action = f'''
          <div style="margin:0 auto 28px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center;font-size:30px;font-weight:800;letter-spacing:8px;color:{dark};">{{{{ .Token }}}}</div>'''

    return f'''<!-- Generated by supabase/email-templates/sync.py from system_setting. Edit the script, not this. -->
<div style="margin:0;padding:40px 16px;background:#f1f5f9;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;background:#ffffff;border-radius:20px;overflow:hidden;">
        <tr><td style="height:6px;background:{accent};font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:32px 40px 8px;text-align:center;">{head}</td></tr>
        <tr><td style="padding:24px 40px 12px;">
          <h1 style="margin:0 0 10px;font-size:22px;font-weight:700;color:{dark};">{fill(e['title'])}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#64748b;line-height:1.6;">{fill(e['body'])}</p>{action}
          <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;text-align:center;line-height:1.6;">{e['note']}</p>
        </td></tr>
        <tr><td style="padding:18px 40px;background:#f8fafc;border-top:1px solid #f1f5f9;text-align:center;font-size:12px;color:#94a3b8;">
          {brand} · <a href="{site}" style="color:#94a3b8;text-decoration:none;">{site.split('//', 1)[1]}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>'''


def main():
    if len(sys.argv) < 2 or sys.argv[1] not in FORKS:
        sys.exit('usage: sync.py <bx|cb> [--preview]')
    fork, preview = sys.argv[1], '--preview' in sys.argv
    b = branding(fork)
    print(f'{fork}: logo={b.get("logo_header_url") or "(none)"} accent={b["theme_accent"]} dark={b["theme_dark"]}')

    patch = {}
    for key, e in EMAILS.items():
        patch[f'mailer_subjects_{key}'] = e['subject'].replace('{brand}', FORKS[fork]['brand'])
        patch[f'mailer_templates_{key}_content'] = render(fork, b, e)

    if preview:
        out = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'preview', fork)
        os.makedirs(out, exist_ok=True)
        for key in EMAILS:
            with open(os.path.join(out, f'{key}.html'), 'w') as f:
                f.write(patch[f'mailer_templates_{key}_content'])
        print('preview written to', out)
        return

    api(fork, 'PATCH', '/config/auth', patch)
    print(f'pushed {len(EMAILS)} templates to {fork}')


if __name__ == '__main__':
    main()
