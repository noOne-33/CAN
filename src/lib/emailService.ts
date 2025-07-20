
'use server';

import sgMail from '@sendgrid/mail';

interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string; // Optional plain text version
}

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM;

let isSendGridConfigured = false;

function configureSendGrid() {
  if (isSendGridConfigured) {
    return;
  }
  if (!SENDGRID_API_KEY || !EMAIL_FROM) {
    console.error('[emailService] CRITICAL: SendGrid is not configured. Missing SENDGRID_API_KEY or EMAIL_FROM in .env');
    throw new Error('Email service is not configured on the server.');
  }
  sgMail.setApiKey(SENDGRID_API_KEY);
  isSendGridConfigured = true;
  console.log('[emailService] SendGrid client configured.');
}

export async function sendEmail({ to, subject, html, text }: MailOptions): Promise<void> {
  console.log(`[emailService] Attempting to send email via SendGrid to: ${to}, subject: ${subject}`);
  try {
    configureSendGrid(); // Ensure client is configured

    const msg = {
      to: to,
      from: EMAIL_FROM!, // Non-null assertion because configureSendGrid would have thrown an error
      subject: subject,
      text: text || html.replace(/<[^>]*>?/gm, ''), // Basic HTML to text conversion if text not provided
      html: html,
    };

    await sgMail.send(msg);
    console.log(`[emailService] Email successfully dispatched to ${to} via SendGrid.`);

  } catch (error: any) {
    console.error(`[emailService] SendGrid Error sending email to ${to}:`, error.message);
    if (error.response) {
      console.error('[emailService] SendGrid Response Error Body:', error.response.body);
    }
    // Do not re-throw specific credential errors to client, but log them server-side.
    throw new Error('Failed to send email. Please try again later or contact support if the issue persists.');
  }
}
