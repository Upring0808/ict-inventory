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

Run the full script again when updating an existing installation. It adds the ownership transfer function and custody history without deleting existing inventory. Transfers require this schema update before the new action can save.

### 2. Configure Supabase Auth

- Enable the Email provider and Google provider.
- Turn **off** Supabase's **Allow new users to sign up** setting. The application creates accounts through its server-side admin API, so public sign-up is not needed.
- Set the Supabase site URL and add your local and deployed `/auth/callback` URLs to the allowed redirect URLs.
- Configure the Google OAuth client in Supabase Auth and set Google's authorized redirect URI to the Supabase callback shown in that provider's settings.
- Google identities automatically link to an existing Auth user with the same verified email. Create that email as an authorized account in Settings first.

### 3. Set environment variables

Set these in `.env.local` for local development and in the hosting environment for deployment:

```text
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
SUPABASE_SECRET_KEY=your-server-only-secret-key
INVENTORY_BOOTSTRAP_SECRET=your-random-secret-of-at-least-32-characters
```

`SUPABASE_SECRET_KEY` may instead be named `SUPABASE_SERVICE_ROLE_KEY`. Keep it server-only and never prefix it with `NEXT_PUBLIC_`. `INVENTORY_BOOTSTRAP_SECRET` is used only to create the first account; once the account exists, `/api/setup` is locked.

### 4. Create the two user accounts

Open `/setup` and create the first named account using the bootstrap secret and a password of at least 12 characters. Sign in, open **Settings**, and create the second account. Both accounts have the same permissions, and no public registration route is provided.

The login page accepts each account's email or optional username and password. Google sign-in is accepted only when the verified email and Auth identity match an authorized account.

### 5. Deploy

Add the same four environment variables to the hosting environment, including Production and any Preview environment that should connect to Supabase, then redeploy. Google redirect URLs must include the deployed `/auth/callback` URL.

## Access and accountability

- `/` is the authorized dashboard. Unauthenticated users see the sign-in screen.
- `/verify?asset=…` and equipment QR codes remain public and read-only. Edit and QR verification controls appear only for an authorized signed-in user.
- Equipment mutations are enforced by Supabase RLS. Local cache writes do not count as successful changes.
- **Activity Log** records the user, action, equipment property number, changed fields, and timestamp. Equipment audit rows are written in the same database transaction as each equipment change.
- **Transfer ownership** records the former and new accountable officer and office, reason, acting account, server time, and a receipt ID. The equipment detail page shows its handoff history; the Activity Log keeps a separate transaction entry. Ordinary edits cannot change custody without a transfer.
- **Settings** manages the two authorized account records, including names, optional usernames, and password resets.

## Checks

```bash
npm run lint
npm run build
```
