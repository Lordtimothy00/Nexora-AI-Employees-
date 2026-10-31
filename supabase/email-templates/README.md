# Auth email (invites, recovery, confirmations)

Every auth email Nexora sends — an invite from the Team page, a password reset from
`/forgot-password`, a signup confirmation — goes out through Supabase Auth (GoTrue). The app never
sends mail itself, so **one SMTP setting covers all of them**.

The project currently has no custom SMTP, which means mail goes through Supabase's shared mailer:
heavily rate limited (a couple of messages an hour) and prone to landing in spam. That is fine for
testing one invite; it is not fine for real users.

## 1. Point Supabase at a real sender

Dashboard → **Authentication → Emails → SMTP Settings** → *Enable custom SMTP*:

| Field         | Value                                                        |
| ------------- | ------------------------------------------------------------ |
| Host          | `smtp.resend.com` (Resend), `smtp.postmarkapp.com`, `smtp.sendgrid.net`, `smtp.mailgun.org`… |
| Port          | `465` (SSL) or `587` (STARTTLS)                               |
| Username      | provider-specific — Resend uses `resend`, SendGrid uses `apikey` |
| Password      | the provider's API key / SMTP token, **never committed here** |
| Sender email  | a verified domain address, e.g. `hello@yourdomain.com`        |
| Sender name   | `Nexora`                                                      |

Use the same address in **Authentication → Emails → SMTP Settings → Sender email** and verify the
domain with the provider (SPF + DKIM). Sending from an unverified domain is what puts invites in
spam folders.

## 2. Paste the templates

Dashboard → **Authentication → Emails** → the *Invite user* and *Reset password* templates.

| Template        | Subject                                  | Body                       |
| --------------- | ---------------------------------------- | -------------------------- |
| Invite user     | `You're invited to a Nexora workspace`   | `invite.html` in this folder   |
| Reset password  | `Reset your Nexora password`             | `recovery.html` in this folder |

Both use `{{ .ConfirmationURL }}` — GoTrue fills it in. Anything else in those files is plain HTML
that survives Gmail, Outlook and Apple Mail. Signup confirmations are not sent today
(`mailer_autoconfirm` is on), so that template is left at its default.

## 3. Raise the send limit

Dashboard → **Authentication → Rate Limits** → *Rate limit for sending emails*: `30` per hour is
comfortable for a small team and still stops the project being used as a relay. The invite function
has its own ceiling of 20 invites per workspace per hour, independent of this.

## 4. Check it

1. Team page → **Send invite** to an address you control.
2. The toast says *Invite emailed to …*. If it instead says the link is on your clipboard, the send
   failed — the exact reason is in the `invite-member` logs (Edge Functions → Logs), usually a
   rate-limit (`email rate limit exceeded`) or an unverified sender domain.
3. `/forgot-password` uses the same pipeline; one reset email proves both.

Nothing in the app breaks while SMTP is unset: invites fall back to the copy-link flow, and
`/forgot-password` reports the failure rather than claiming an email was sent.
