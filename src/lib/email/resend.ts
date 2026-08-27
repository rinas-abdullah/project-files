import "server-only";
import { Resend } from "resend";

export async function sendOtpEmail(to: string, code: string, name: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is not set. Create a free key at https://resend.com and add it to your environment."
    );
  }

  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Dithar <onboarding@resend.dev>";

  const { error } = await resend.emails.send({
    from,
    to,
    subject: `${code} — رمز التحقق من حسابك في دِثار`,
    html: `
      <div dir="rtl" style="font-family: Tahoma, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #0f172a;">
        <h2 style="color: #0B4D8D; margin-bottom: 8px;">مرحباً ${name}،</h2>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          استخدم الرمز التالي لتفعيل حسابك في منصة دِثار للرعاية الرقمية:
        </p>
        <div style="background: #f0f6ff; border: 1px solid #dbeafe; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0B4D8D; font-family: monospace;">${code}</span>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">
          هذا الرمز صالح لمدة 10 دقائق. إذا لم تطلب إنشاء هذا الحساب، تجاهل هذه الرسالة.
        </p>
      </div>
    `,
  });

  if (error) {
    throw new Error(`Failed to send verification email: ${error.message}`);
  }
}
