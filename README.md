# ICT Asset & PMS Inventory

Inventory dashboard for PENRO Batanes ICT equipment, built with Next.js and Supabase.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Secure Supabase setup

Authentication, the public QR detail route, account management, and the audit log use Supabase. Local storage is only a read cache; equipment changes must be accepted by Supabase before they are shown as saved.

### 1. Apply the database schema

Run the full [`lib/supabase/schema.sql`](lib/supabase/schema.sql) script in Supabase **SQL Editor**. The same secure schema is available in the app's Cloud Sync Assistant and at `/supabase-schema.sql`.

The script creates the two-account allowlist and activity log, removes previous equipment policies, permits database writes only for allowlisted signed-in users, and sets up the audit triggers. Equipment detail is read publicly through a server endpoint that returns one requested item; the equipment table itself is not readable with the public key.

Run the full script again when updating an existing installation, before deploying code that uses new database fields. It converts legacy text equipment IDs to UUIDs, repairs missing IDs, adds the ownership transfer function and custody history without deleting existing inventory, and updates transfer validation so the reason is optional. It also adds service-role-only session observations and connection snapshots to the activity log. Existing activity rows are not backfilled with IP, device, or browser location information. Apply this schema before deploying the location sign-in flow; new password and Google sign-ins require the session-recording function to accept coordinates.

Sign-in requires the user to allow browser location access. The site must use HTTPS (or localhost during development). The browser reports coordinates and an accuracy radius; it may derive a coarse position from Wi-Fi or network data, and the reading can be spoofed, so it is an audit observation rather than a geofence or trusted second factor. The login screen explains the request and blocks sign-in when permission is denied or a fresh reading cannot be obtained. While the app is open, visible session checks refresh the browser location about every five minutes. IP remains separate connection metadata; new sessions no longer infer city or country from IP.

### 2. Configure Supabase Auth

- Enable the Email provider and Google provider.
- Turn **off** Supabase's **Allow new users to sign up** setting. The application creates accounts through its server-side admin API, so public sign-up is not needed.
- Set the Supabase site URL and add your local and deployed `/auth/callback` and `/auth/reset-password` URLs to the allowed redirect URLs. Supabase Auth only redirects to URLs on this allowlist.
- Make sure the password recovery email template uses the redirect URL passed by the app (`.RedirectTo`) instead of hardcoding the site URL.
- Configure custom SMTP in Supabase for reliable password reset email delivery in production; Supabase's built-in email service is rate-limited and intended for testing.
- Configure the Google OAuth client in Supabase Auth and set Google's authorized redirect URI to the Supabase callback shown in that provider's settings.
- Google identities automatically link to an existing Auth user with the same verified email. Create that email as an authorized account in Settings first.

### 3. Set environment variables

Set these in `.env.local` for local development and in the hosting environment for deployment.

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
INVENTORY_BOOTSTRAP_SECRET=your-random-secret-of-at-least-32-characters
```

`SUPABASE_SECRET_KEY` may instead be named `SUPABASE_SERVICE_ROLE_KEY`. Keep it server-only and never prefix it with `NEXT_PUBLIC_`. `INVENTORY_BOOTSTRAP_SECRET` is used only to create the first account; once the account exists, `/api/setup` is locked.

Account creation does not require application SMTP settings. Configure SMTP in Supabase only if you want reliable password recovery email delivery.

### 4. Create the two user accounts

Open `/setup` and create the first named account using the bootstrap secret and a password of at least 12 characters. Sign in, open **Settings**, and create the second account. Both accounts have the same permissions, and no public registration route is provided.

Set a password for each account when you create it, then share the email or username and password securely with the account holder. They can change the password in Settings after signing in.

The login page accepts each account's email or optional username and password. Google sign-in is accepted only when the verified email and Auth identity match an authorized account.

For Google sign-in on Android Chrome, begin and finish the flow in the same Chrome tab. Add the deployed origin's exact `/auth/callback` URL to Supabase Auth redirect URLs, and use the same HTTPS host when opening the app. The Google provider's redirect URI in Google Cloud is the Supabase callback shown in Supabase, not this app route.

### 5. Deploy

Add the Supabase settings to the hosting environment, including Production and any Preview environment that should connect to Supabase. Google redirect URLs must include the deployed `/auth/callback` URL.

## Access and accountability

- `/` is the authorized dashboard. Unauthenticated users see the sign-in screen.
- `/verify?asset=…` and equipment QR codes remain public and read-only. Edit and QR verification controls appear only for an authorized signed-in user.
- Equipment mutations are enforced by Supabase RLS. Local cache writes do not count as successful changes.
- **Activity Log** records the user, action, equipment property number, changed fields, and timestamp. Equipment audit rows are written in the same database transaction as each equipment change. Sign-in, connection change, and explicit sign-out events include browser-reported coordinates and accuracy, the IP observed by the app server, and device details. Equipment and account changes show the latest observation from that same session when it was checked within the preceding three minutes.
- **Transfer ownership** records the former and new accountable officer and office, optional reason, acting account, server time, and a receipt ID. The equipment detail page shows its handoff history; the Activity Log keeps a separate transaction entry. Ordinary edits cannot change custody without a transfer.
- **Settings** manages the two authorized account records, including names, optional usernames, and password resets. An account is shown as active after an authenticated app check within the past two minutes; **Last online** is the latest such check or explicit sign-out. Session tracking begins only after this schema and app version are deployed.

On Vercel, the server records the IP from trusted request headers. Other hosts may show IP as unavailable. Browser location depends on device location services and can be imprecise; browsers may also hide a specific device model. Existing activity may still display older IP-based estimates.

## Install the browser app

On supported browsers, the app offers an **Install app** prompt. On iPhone or iPad, open the site in Safari, tap **Share**, then choose **Add to Home Screen**. This installs the browser version of the app; it does not download an Android APK.

When a new service worker is ready, installed and open app sessions show an **App update available** prompt. To trigger that prompt after a major change to the app or its logo, increment `APP_UPDATE_VERSION` in `public/sw.js` and update the 192px and 512px PWA icons when the logo changes. Users can refresh from the prompt; if the home screen icon remains old, they may need to remove and reinstall the app from their browser.

## Checks

```bash
npm run lint
npm run build
```
