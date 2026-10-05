import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import { validEmail } from '@/lib/auth/server';

export interface InvitationEmailConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  fromEmail: string;
  siteUrl: URL;
}

interface AccountInvitation {
  name: string;
  email: string;
  username: string | null;
  temporaryPassword: string;
}

const LOGO_CID = 'ict-inventory-logo@penro-batanes';

export function getInvitationEmailConfig(): InvitationEmailConfig {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const password = process.env.SMTP_PASSWORD;
  const fromEmail = process.env.SMTP_FROM_EMAIL?.trim();
  const site = process.env.INVENTORY_SITE_URL?.trim();
  const port = Number(process.env.SMTP_PORT || '587');

  if (!host || !user || !password || !fromEmail || !site || !validEmail(fromEmail) ||
      !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('Invitation email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM_EMAIL, and INVENTORY_SITE_URL.');
  }

  let siteUrl: URL;
  try {
    siteUrl = new URL(site);
  } catch {
    throw new Error('INVENTORY_SITE_URL must be an absolute HTTPS URL.');
  }
  if (siteUrl.protocol !== 'https:' && !(siteUrl.protocol === 'http:' && siteUrl.hostname === 'localhost')) {
    throw new Error('INVENTORY_SITE_URL must be an absolute HTTPS URL.');
  }

  return { host, port, user, password, fromEmail, siteUrl };
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character] || character);
}

function invitationHtml(invitation: AccountInvitation, loginUrl: string, logoSource: string): string {
  const firstName = escapeHtml(invitation.name.trim().split(/\s+/)[0] || invitation.name);
  const email = escapeHtml(invitation.email);
  const username = invitation.username ? escapeHtml(invitation.username) : null;
  const password = escapeHtml(invitation.temporaryPassword);
  const link = escapeHtml(loginUrl);
  const logo = escapeHtml(logoSource);

  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Your ICT Inventory invitation</title></head>
<body style="margin:0;padding:0;background:#eef2f3;color:#172a32;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">Your PENRO Batanes ICT Inventory access is ready. Sign in with your temporary password.</div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#eef2f3;"><tr><td align="center" style="padding:28px 12px;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #dce5e7;border-radius:14px;overflow:hidden;">
      <tr><td style="height:6px;background:#19745c;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr><td style="padding:28px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
          <td width="56" valign="middle"><img src="${logo}" width="48" height="48" alt="PENRO Batanes logo" style="display:block;width:48px;height:48px;object-fit:contain;border:0;"></td>
          <td valign="middle" style="padding-left:12px;"><div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.5px;color:#19745c;">PENRO BATANES</div><div style="font-size:17px;line-height:23px;font-weight:700;color:#172a32;">ICT Inventory</div></td>
        </tr></table>
      </td></tr>
      <tr><td style="padding:34px 32px 0;">
        <div style="font-size:11px;line-height:16px;font-weight:700;letter-spacing:1.5px;color:#19745c;">ACCOUNT INVITATION</div>
        <h1 style="margin:12px 0 0;font-size:28px;line-height:35px;font-weight:700;letter-spacing:-0.5px;color:#172a32;">Welcome to the inventory workspace, ${firstName}.</h1>
        <p style="margin:18px 0 0;font-size:15px;line-height:25px;color:#51616a;">You have been added as an authorized ICT Inventory administrator. Use the details below to sign in and begin managing equipment records.</p>
      </td></tr>
      <tr><td style="padding:26px 32px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f8f7;border:1px solid #dce9e4;border-radius:10px;">
          <tr><td style="padding:22px 22px 6px;font-size:11px;line-height:16px;font-weight:700;letter-spacing:1px;color:#58716a;">YOUR SIGN-IN DETAILS</td></tr>
          <tr><td style="padding:10px 22px;font-size:12px;line-height:18px;color:#5b6970;">Email address<br><span style="font-size:15px;line-height:24px;font-weight:700;color:#172a32;word-break:break-all;">${email}</span></td></tr>
          ${username ? `<tr><td style="padding:10px 22px;font-size:12px;line-height:18px;color:#5b6970;">Username<br><span style="font-size:15px;line-height:24px;font-weight:700;color:#172a32;word-break:break-all;">${username}</span></td></tr>` : ''}
          <tr><td style="padding:10px 22px 22px;font-size:12px;line-height:18px;color:#5b6970;">Temporary password<br><span style="display:block;margin-top:4px;padding:12px 14px;background:#ffffff;border:1px solid #d7e2df;border-radius:7px;font-family:Consolas,Monaco,monospace;font-size:15px;line-height:23px;font-weight:700;letter-spacing:0.4px;color:#172a32;white-space:pre-wrap;word-break:break-all;">${password}</span></td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:28px 32px 0;"><a href="${link}" style="display:inline-block;padding:15px 25px;background:#156b56;border-radius:8px;color:#ffffff;font-size:14px;line-height:20px;font-weight:700;text-decoration:none;">Sign in to ICT Inventory</a></td></tr>
      <tr><td style="padding:22px 32px 30px;font-size:13px;line-height:21px;color:#61717a;">After signing in, change your temporary password in Settings. You can also use “Forgot password?” on the sign-in page later. If the button does not open, copy this address into your browser:<br><a href="${link}" style="color:#156b56;word-break:break-all;">${link}</a></td></tr>
      <tr><td style="padding:20px 32px;background:#f8faf9;border-top:1px solid #e7eceb;font-size:11px;line-height:18px;color:#75838a;">This invitation was sent by PENRO Batanes ICT Inventory to ${email}. If you did not expect it, contact your system administrator.</td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export async function sendAccountInvitation(config: InvitationEmailConfig, invitation: AccountInvitation): Promise<void> {
  const loginUrl = new URL('/', config.siteUrl);
  loginUrl.searchParams.set('login_email', invitation.email);

  const logoPath = join(process.cwd(), 'public', 'auth', 'penro-batanes-mark.png');
  const logoContent = await readFile(logoPath).catch(() => null);
  const logoSource = logoContent ? `cid:${LOGO_CID}` : new URL('/auth/penro-batanes-mark.png', config.siteUrl).toString();
  const text = [
    `Hello ${invitation.name},`,
    '',
    'You have been invited as an authorized administrator of PENRO Batanes ICT Inventory.',
    '',
    `Email: ${invitation.email}`,
    ...(invitation.username ? [`Username: ${invitation.username}`] : []),
    `Temporary password: ${invitation.temporaryPassword}`,
    '',
    `Sign in: ${loginUrl.toString()}`,
    '',
    'After signing in, change your temporary password in Settings. You can also use Forgot password later.',
    'If you did not expect this invitation, contact your system administrator.',
  ].join('\n');

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    requireTLS: config.port !== 465,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    const result = await transport.sendMail({
      from: { name: 'PENRO Batanes ICT Inventory', address: config.fromEmail },
      to: invitation.email,
      subject: 'Your invitation to PENRO Batanes ICT Inventory',
      text,
      html: invitationHtml(invitation, loginUrl.toString(), logoSource),
      attachments: logoContent ? [{ filename: 'ict-inventory-logo.png', content: logoContent, cid: LOGO_CID, contentType: 'image/png' }] : [],
    });
    if (result.accepted.length === 0) throw new Error('The SMTP server did not accept the invitation recipient.');
  } finally {
    transport.close();
  }
}
