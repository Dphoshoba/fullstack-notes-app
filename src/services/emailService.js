import nodemailer from "nodemailer";

import { env } from "../config/env.js";

let transporter;
let warnedMissingConfig = false;

const appName = "Notes Workspace";

const getClientOrigin = () => env.CLIENT_ORIGIN.split(",")[0];

const isEmailConfigured = () =>
  Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS && env.EMAIL_FROM);

const getTransporter = () => {
  if (!isEmailConfigured()) {
    if (!warnedMissingConfig) {
      console.warn("Email service is not configured. Transactional email skipped.");
      warnedMissingConfig = true;
    }

    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
  }

  return transporter;
};

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const layout = ({ title, body, ctaLabel, ctaUrl }) => {
  const safeTitle = escapeHtml(title);
  const safeBody = body;
  const safeCtaLabel = escapeHtml(ctaLabel);
  const safeCtaUrl = escapeHtml(ctaUrl);

  return `
    <div style="font-family: Arial, sans-serif; background:#f8fafc; padding:24px; color:#0f172a;">
      <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:24px;">
        <p style="margin:0 0 8px; color:#047857; font-weight:700;">${appName}</p>
        <h1 style="margin:0 0 16px; font-size:22px; line-height:1.3;">${safeTitle}</h1>
        <div style="font-size:15px; line-height:1.6; color:#334155;">${safeBody}</div>
        ${
          ctaUrl
            ? `<p style="margin:24px 0 0;"><a href="${safeCtaUrl}" style="display:inline-block; background:#047857; color:#ffffff; padding:10px 14px; border-radius:6px; text-decoration:none; font-weight:700;">${safeCtaLabel}</a></p>`
            : ""
        }
      </div>
    </div>
  `;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  const mailer = getTransporter();

  if (!mailer || !to || !subject) {
    return false;
  }

  try {
    await mailer.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text
    });
    return true;
  } catch {
    console.warn("Transactional email could not be sent.");
    return false;
  }
};

export const sendWorkspaceInviteEmail = ({ to, inviterName, workspaceName, inviteLink }) =>
  sendEmail({
    to,
    subject: `${inviterName} invited you to ${workspaceName}`,
    text: `${inviterName} invited you to join ${workspaceName} in ${appName}. Open this invite link: ${inviteLink}`,
    html: layout({
      title: "You're invited to a workspace",
      body: `<p>${escapeHtml(inviterName)} invited you to join <strong>${escapeHtml(workspaceName)}</strong>.</p><p>Use the button below to accept the invite.</p>`,
      ctaLabel: "Accept invite",
      ctaUrl: inviteLink
    })
  });

export const sendNewCommentEmail = ({ to, commenterName, noteTitle, noteLink }) =>
  sendEmail({
    to,
    subject: `New comment on ${noteTitle}`,
    text: `${commenterName} commented on "${noteTitle}". Open the note: ${noteLink}`,
    html: layout({
      title: "New comment",
      body: `<p>${escapeHtml(commenterName)} commented on <strong>${escapeHtml(noteTitle)}</strong>.</p>`,
      ctaLabel: "Open note",
      ctaUrl: noteLink
    })
  });

export const sendAttachmentUploadedEmail = ({ to, uploaderName, noteTitle, noteLink }) =>
  sendEmail({
    to,
    subject: `New attachment on ${noteTitle}`,
    text: `${uploaderName} uploaded an attachment to "${noteTitle}". Open the note: ${noteLink}`,
    html: layout({
      title: "New attachment uploaded",
      body: `<p>${escapeHtml(uploaderName)} uploaded an attachment to <strong>${escapeHtml(noteTitle)}</strong>.</p>`,
      ctaLabel: "Open note",
      ctaUrl: noteLink
    })
  });

export const sendPremiumUpgradeEmail = ({ to, userName }) =>
  sendEmail({
    to,
    subject: "Premium upgrade successful",
    text: `Hi ${userName}, your ${appName} account has been upgraded to Premium.`,
    html: layout({
      title: "Premium upgrade successful",
      body: `<p>Hi ${escapeHtml(userName)}, your account has been upgraded to Premium.</p><p>You now have more AI usage and premium workspace features.</p>`,
      ctaLabel: "Open dashboard",
      ctaUrl: `${getClientOrigin()}/dashboard`
    })
  });

export const sendBillingIssueEmail = ({ to, userName }) =>
  sendEmail({
    to,
    subject: "Billing needs attention",
    text: `Hi ${userName}, there is a billing issue on your ${appName} account. Please open billing settings to review it.`,
    html: layout({
      title: "Billing needs attention",
      body: `<p>Hi ${escapeHtml(userName)}, there is a billing issue on your account.</p><p>Please open billing settings to review your subscription.</p>`,
      ctaLabel: "Open dashboard",
      ctaUrl: `${getClientOrigin()}/dashboard`
    })
  });
