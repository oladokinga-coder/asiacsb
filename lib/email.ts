/**
 * Отправка писем через SMTP (Nodemailer).
 * Переменные окружения: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM (по умолчанию info@asiacsb.online).
 * Если SMTP не настроен — отправка пропускается без ошибки.
 */

import nodemailer from "nodemailer";

const MAIL_FROM = process.env.MAIL_FROM ?? "info@asiacsb.online";

function isSmtpConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

function getTransporter() {
  if (!isSmtpConfigured()) return null;
  const port = Number(process.env.SMTP_PORT) || 587;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Отправить клиенту письмо об успешной регистрации (на английском).
 */
export async function sendRegistrationSuccessEmail(
  to: string,
  firstName: string
): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP not configured" };
  }

  const subject = "ČSOB Asia — Registration successful";

  const logoHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="em-sph" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#7dd3fc"/>
                <stop offset="100%" stop-color="#1e3a5f"/>
              </linearGradient>
              <linearGradient id="em-bar" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stop-color="#93c5fd"/>
                <stop offset="100%" stop-color="#1e3a5f"/>
              </linearGradient>
            </defs>
            <circle cx="22" cy="14" r="10" fill="url(#em-sph)"/>
            <path d="M6 28 Q14 24 22 28 T38 28 L40 32 L4 32 Z" fill="url(#em-bar)"/>
          </svg>
        </td>
        <td style="vertical-align: middle;">
          <div style="font-weight: 700; font-size: 20px; line-height: 1.2; color: #1e293b;">ČSOB</div>
          <div style="font-weight: 700; font-size: 20px; line-height: 1.2; color: #dc2626;">Asia</div>
        </td>
      </tr>
    </table>
  `;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      ${logoHtml}
      <h2 style="color: #0d9488; font-size: 22px; margin-top: 0;">Registration successful</h2>
      <p style="color: #334155; line-height: 1.6;">Hello${firstName ? `, ${firstName}` : ""}!</p>
      <p style="color: #334155; line-height: 1.6;">Your ČSOB Asia account has been created. You can sign in to your dashboard using the email and password you provided during registration.</p>
      <p style="color: #334155; line-height: 1.6;">Best regards,<br><strong>ČSOB Asia</strong></p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  const text = `Registration successful. Hello${firstName ? `, ${firstName}` : ""}! Your ČSOB Asia account has been created. You can sign in to your dashboard using the email and password you provided during registration. Best regards, ČSOB Asia.`;

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Registration email send error:", err);
    return { ok: false, error: message };
  }
}

/**
 * Пытается распознать дату в формате DD.MM.YYYY (например 09.03.2026) и вернуть в виде "9 March 2026".
 * Иначе возвращает исходную строку.
 */
function formatDateForEmail(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) return "—";
  const s = dateStr.trim();
  const match = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
    }
  }
  return s;
}

/**
 * Отправить клиенту письмо о зачислении: «Ваш баланс пополнен на [сумма], дата [дата]».
 * Отправляется на указанный в строке транзакции email. Текст на английском.
 * Дата в формате 09.03.2026 (DD.MM.YYYY) в письме отображается как "9 March 2026".
 */
export async function sendTransactionCreditEmail(
  to: string,
  amount: number,
  date: string,
  description: string
): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP not configured" };
  }

  const dateDisplay = formatDateForEmail(date);
  const amountStr = Math.abs(amount).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " EUR";
  const subject = "ČSOB Asia — Your balance has been topped up: " + amountStr;

  const logoHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 20px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <svg width="40" height="40" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="em2-sph" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient>
              <linearGradient id="em2-bar" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient>
            </defs>
            <circle cx="22" cy="14" r="10" fill="url(#em2-sph)"/>
            <path d="M6 28 Q14 24 22 28 T38 28 L40 32 L4 32 Z" fill="url(#em2-bar)"/>
          </svg>
        </td>
        <td style="vertical-align: middle;"><div style="font-weight: 700; font-size: 18px; color: #1e293b;">ČSOB</div><div style="font-weight: 700; font-size: 18px; color: #dc2626;">Asia</div></td>
      </tr>
    </table>
  `;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      ${logoHtml}
      <h2 style="color: #0d9488; font-size: 20px; margin-top: 0;">Your balance has been topped up</h2>
      <p style="color: #334155; line-height: 1.6;">Your account has been credited with <strong>${amountStr}</strong>.</p>
      <p style="color: #334155; line-height: 1.6;">Date: <strong>${dateDisplay}</strong>.</p>
      ${description ? `<p style="color: #334155; line-height: 1.6;">Description: ${description}</p>` : ""}
      <p style="color: #334155; line-height: 1.6;">Best regards,<br><strong>ČSOB Asia</strong></p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  const text = `Your balance has been topped up by ${amountStr}. Date: ${dateDisplay}.${description ? ` Description: ${description}.` : ""} Best regards, ČSOB Asia.`;

  try {
    await transporter.sendMail({
      from: MAIL_FROM,
      to,
      subject,
      text,
      html,
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Transaction credit email send error:", err);
    return { ok: false, error: message };
  }
}

const RESET_LINK_EXPIRY_HOURS = 1;

export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  firstName: string
): Promise<{ ok: boolean; error?: string }> {
  const transporter = getTransporter();
  if (!transporter) {
    return { ok: false, error: "SMTP not configured" };
  }
  const baseUrl =
    process.env.NODE_ENV === "production"
      ? "https://www.asiacsb.online"
      : (process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "http://localhost:3000");
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const subject = "ČSOB Asia — Reset your password";
  const logoHtml = `
    <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px;">
      <tr>
        <td style="vertical-align: middle; padding-right: 12px;">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="em-res-sph" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7dd3fc"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient>
              <linearGradient id="em-res-bar" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="100%" stop-color="#1e3a5f"/></linearGradient>
            </defs>
            <circle cx="22" cy="14" r="10" fill="url(#em-res-sph)"/>
            <path d="M6 28 Q14 24 22 28 T38 28 L40 32 L4 32 Z" fill="url(#em-res-bar)"/>
          </svg>
        </td>
        <td style="vertical-align: middle;"><div style="font-weight: 700; font-size: 20px; line-height: 1.2; color: #1e293b;">ČSOB</div><div style="font-weight: 700; font-size: 20px; line-height: 1.2; color: #dc2626;">Asia</div></td>
      </tr>
    </table>
  `;
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
      ${logoHtml}
      <h2 style="color: #0d9488; font-size: 22px; margin-top: 0;">Reset your password</h2>
      <p style="color: #334155; line-height: 1.6;">Hello${firstName ? `, ${firstName}` : ""}!</p>
      <p style="color: #334155; line-height: 1.6;">You requested a password reset. Click the button below to set a new password. This link is valid for ${RESET_LINK_EXPIRY_HOURS} hour.</p>
      <p style="margin: 24px 0;"><a href="${resetUrl}" style="display: inline-block; background: #0d9488; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600;">Reset password</a></p>
      <p style="color: #64748b; font-size: 14px;">If you did not request this, you can ignore this email.</p>
      <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  const text = `Reset your password: ${resetUrl}. Valid for ${RESET_LINK_EXPIRY_HOURS} hour. If you did not request this, ignore this email.`;

  try {
    await transporter.sendMail({ from: MAIL_FROM, to, subject, text, html });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Password reset email send error:", err);
    return { ok: false, error: message };
  }
}
