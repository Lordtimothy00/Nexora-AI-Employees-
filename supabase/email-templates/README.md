# Auth email (invites, recovery, confirmations)

Every auth email Nexora sends — an invite from the Team page, a password reset from
`/forgot-password`, a signup confirmation — goes out through Supabase Auth (GoTrue). The app never
sends mail itself, so **one SMTP setting covers all of them**, and swapping providers never touches
the code.

The project currently has no custom SMTP (`smtp_host` is null), which means mail goes through
Supabase's shared mailer: rate limited to **2 messages an hour** and prone to landing in spam. That is
fine for testing one invite; it is not fine for real users.

## 0. The prerequisite nobody mentions: a domain

Resend will not send to anyone but your own address until a domain you control is verified. Without
one you get `onboarding@resend.dev`, which only delivers to the account's own inbox — enough to prove
the pipeline, useless for customers. So the order is: register a domain → verify it at Resend →
only then configure Supabase.

Send from a subdomain (`mail.example.com`) rather than the root: auth mail is the least valuable
traffic a domain sends, and you want it isolated from the reputation of anything you send later.
Nothing here requires the marketing site to move to that domain.

## 1. Verify the domain at Resend

Add the domain at [resend.com/domains](https://resend.com/domains) → *Add domain* → `mail.<domain>`.
Resend returns the records it needs; add them at your DNS host and wait for *Verified*:

| Record | Purpose |
| ------ | ------- |
| `MX` on the sending subdomain | return path — where bounces go |
| `TXT` on the sending subdomain | SPF, authorising Resend to send for you |
| `TXT` on `resend._domainkey.<subdomain>` | DKIM signature |

If the root domain has no DMARC record, add one in the same change — inboxes treat a missing policy
as a signal: `v=DMARC1; p=none; rua=mailto:dmarc@<domain>`.

Check it without waiting on a dashboard refresh:

```bash
dig +short TXT send.mail.<domain>          # SPF
dig +short TXT resend._domainkey.mail.<domain>   # DKIM
dig +short TXT _dmarc.<domain>             # DMARC
```

## 2. Point Supabase at it

Dashboard → **Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:

| Field         | Value                                  |
| ------------- | -------------------------------------- |
| Host          | `smtp.resend.com`                      |
| Port          | `587` (STARTTLS) — `465` is implicit TLS and works with clients that require it |
| Username      | `resend` (literally)                   |
| Password      | a Resend API key with *Sending access* |
| Sender email  | `hello@mail.<domain>` — must be on the verified domain |
| Sender name   | `Nexora`                               |

Create the key at [resend.com/api-keys](https://resend.com/api-keys) as **sending-only, restricted to
that domain**. It only ever lives in Supabase's SMTP password field — not in the repo, not in a chat,
not in Vercel env vars, because the app never calls Resend directly.

Use **Send test email** on that page before going further. If it fails there, every flow below fails
for the same reason.

## 3. Paste the templates

Dashboard → **Authentication → Emails** → the *Invite user* and *Reset password* templates.

| Template        | Subject                                  | Body                       |
| --------------- | ---------------------------------------- | -------------------------- |
| Invite user     | `You're invited to a Nexora workspace`   | `invite.html` in this folder   |
| Reset password  | `Reset your Nexora password`             | `recovery.html` in this folder |

Both use `{{ .ConfirmationURL }}` — GoTrue fills it in. Anything else in those files is plain HTML
that survives Gmail, Outlook and Apple Mail. Signup confirmations are not sent today
(`mailer_autoconfirm` is on), so that template is left at its default.

## 4. Raise the send limit

Dashboard → **Authentication → Rate Limits** → *Rate limit for sending emails*: `2` → `30` per hour.
That is comfortable for a small team and still stops the project being used as a relay. Resend's own
per-second limit is far higher, so GoTrue is the binding constraint — and the invite function has a
separate ceiling of 20 invites per workspace per hour.

## 5. Check it

1. Team page → **Send invite** to an address you control.
2. The toast says *Invite emailed to …*. If it instead says the link is on your clipboard, the send
   failed — the exact reason is in the `invite-member` logs (Edge Functions → Logs), usually an
   `email rate limit exceeded`, an unverified sender, or a wrong SMTP password.
3. `/forgot-password` uses the same pipeline; one reset email proves both.
4. The email appears in [resend.com/emails](https://resend.com/emails), including anything sent over
   SMTP, with its delivery status.

| Symptom | Cause |
| ------- | ----- |
| `email rate limit exceeded` | Step 4 skipped, or you are over 30/hour |
| Invite logs `550` / `not verified` | Sender address is on a different domain than the one verified at Resend |
| Test email fine, invites not | SMTP password is a full-access key that has since been revoked |
| Delivered but in spam | SPF/DKIM/DMARC missing or still propagating |
| `connection refused` | Wrong port — use `587`, or `465` with implicit TLS |

Nothing in the app breaks while SMTP is unset: invites fall back to the copy-link flow, and
`/forgot-password` reports the failure rather than claiming an email was sent.
