import nodemailer from "nodemailer";

// ── SMTP Configuration ────────────────────────────────────────────
const SMTP_CONFIG = {
    host: process.env.SMTP_HOST || "smtp.hostinger.com",
    port: parseInt(process.env.SMTP_PORT) || 465,
    secure: true, // true for 465 (SSL), false for 587 (TLS)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
};

const FROM_EMAIL = process.env.FROM_EMAIL || process.env.SMTP_USER;
const FROM_NAME = process.env.FROM_NAME || "Internal Analyst Stock";
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

// ── Create Nodemailer Transporter ─────────────────────────────────
let transporter;

try {
    transporter = nodemailer.createTransporter(SMTP_CONFIG);
} catch (error) {
    console.error("[EmailService] Failed to create transporter:", error.message);
}

// ── Send Verification Email ───────────────────────────────────────
/**
 * Send email verification link to new user
 * @param {string} email - User's email address
 * @param {string} token - Verification token
 * @param {string} username - User's username for personalization
 */
export async function sendVerificationEmail(email, token, username = "User") {
    if (!transporter) {
        throw new Error("Email service not configured");
    }

    const verificationUrl = `${CLIENT_URL}/verify-email/${token}`;

    const mailOptions = {
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: email,
        subject: "Verifikasi Email Anda - Internal Analyst Stock",
        html: `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verifikasi Email</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #0f0f12; color: #e0e0e0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1f; border: 1px solid #2d2d2d; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                                📊 Internal Analyst Stock
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                                Halo, ${username}! 👋
                            </h2>
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                                Terima kasih telah mendaftar di <strong style="color: #ffffff;">Internal Analyst Stock</strong>. 
                                Untuk melanjutkan, silakan verifikasi email Anda dengan mengklik tombol di bawah ini:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${verificationUrl}" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
                                            ✨ Verifikasi Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 10px 0; font-size: 14px; line-height: 1.6; color: #808080;">
                                Atau salin dan tempelkan link berikut ke browser Anda:
                            </p>
                            <p style="margin: 0; padding: 12px; background-color: #0f0f12; border: 1px solid #2d2d2d; border-radius: 8px; font-size: 13px; word-break: break-all; color: #6366f1;">
                                ${verificationUrl}
                            </p>
                            
                            <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 1.6; color: #808080;">
                                <strong>Link akan kedaluwarsa dalam 24 jam.</strong><br>
                                Jika Anda tidak mendaftar, abaikan email ini.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid #2d2d2d; text-align: center; background-color: #0f0f12;">
                            <p style="margin: 0; font-size: 12px; color: #606060;">
                                © 2026 Internal Analyst Stock. Semua hak dilindungi.<br>
                                Email ini dikirim otomatis, mohon tidak membalas.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        // Plain text fallback
        text: `
Halo ${username},

Terima kasih telah mendaftar di Internal Analyst Stock!

Untuk melanjutkan, silakan verifikasi email Anda dengan mengklik link berikut:
${verificationUrl}

Link akan kedaluwarsa dalam 24 jam.

Jika Anda tidak mendaftar, abaikan email ini.

---
Internal Analyst Stock
© 2026 Semua hak dilindungi
        `.trim(),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Verification email sent to ${email}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${email}:`, error.message);
        throw error;
    }
}

// ── Send Password Reset Email ─────────────────────────────────────
/**
 * Send password reset link to user
 * @param {string} email - User's email address
 * @param {string} token - Reset token
 * @param {string} username - User's username for personalization
 */
export async function sendPasswordResetEmail(email, token, username = "User") {
    if (!transporter) {
        throw new Error("Email service not configured");
    }

    const resetUrl = `${CLIENT_URL}/reset-password/${token}`;

    const mailOptions = {
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: email,
        subject: "Reset Password — Internal Analyst Stock",
        html: `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', Arial, sans-serif; background-color: #0f0f12; color: #e0e0e0;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1a1a1f; border: 1px solid #2d2d2d; border-radius: 16px; overflow: hidden;">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="padding: 40px 20px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%);">
                            <h1 style="margin: 0; font-size: 28px; font-weight: 700; color: #ffffff;">
                                🔐 Reset Password
                            </h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; font-size: 24px; font-weight: 600; color: #ffffff;">
                                Halo, ${username}! 👋
                            </h2>
                            <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #b0b0b0;">
                                Kami menerima permintaan untuk mereset password akun Anda di <strong style="color: #ffffff;">Internal Analyst Stock</strong>. 
                                Klik tombol di bawah ini untuk membuat password baru:
                            </p>
                            
                            <!-- Button -->
                            <table role="presentation" style="margin: 30px 0;">
                                <tr>
                                    <td align="center">
                                        <a href="${resetUrl}" 
                                           style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #ef4444 0%, #f97316 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);">
                                            🔑 Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 20px 0 10px 0; font-size: 14px; line-height: 1.6; color: #808080;">
                                Atau salin dan tempelkan link berikut ke browser Anda:
                            </p>
                            <p style="margin: 0; padding: 12px; background-color: #0f0f12; border: 1px solid #2d2d2d; border-radius: 8px; font-size: 13px; word-break: break-all; color: #ef4444;">
                                ${resetUrl}
                            </p>
                            
                            <p style="margin: 25px 0 0 0; font-size: 14px; line-height: 1.6; color: #808080;">
                                <strong>Link akan kedaluwarsa dalam 1 jam.</strong><br>
                                Jika Anda tidak meminta reset password, abaikan email ini. Password Anda tidak akan berubah.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px; border-top: 1px solid #2d2d2d; text-align: center; background-color: #0f0f12;">
                            <p style="margin: 0; font-size: 12px; color: #606060;">
                                © 2026 Internal Analyst Stock. Semua hak dilindungi.<br>
                                Email ini dikirim otomatis, mohon tidak membalas.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
Halo ${username},

Kami menerima permintaan untuk mereset password akun Anda di Internal Analyst Stock.

Klik link berikut untuk membuat password baru:
${resetUrl}

Link akan kedaluwarsa dalam 1 jam.

Jika Anda tidak meminta reset password, abaikan email ini.

---
Internal Analyst Stock
© 2026 Semua hak dilindungi
        `.trim(),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log(`[EmailService] Password reset email sent to ${email}:`, info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[EmailService] Failed to send reset email to ${email}:`, error.message);
        throw error;
    }
}

// ── Test Email Configuration ──────────────────────────────────────
/**
 * Verify SMTP connection is working
 */
export async function verifyEmailConfig() {
    if (!transporter) {
        return { success: false, error: "Transporter not configured" };
    }

    try {
        await transporter.verify();
        console.log("[EmailService] SMTP connection verified successfully");
        return { success: true };
    } catch (error) {
        console.error("[EmailService] SMTP verification failed:", error.message);
        return { success: false, error: error.message };
    }
}
