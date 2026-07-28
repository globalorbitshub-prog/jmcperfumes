import { Resend } from "resend";

let resendClient: Resend | null = null;
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  if (!resendClient) resendClient = new Resend(key);
  return resendClient;
}

export async function sendMail(params: { to: string; subject: string; html: string }) {
  const resend = getResend();
  const from = process.env.EMAIL_FROM || "JMC Perfumes <noreply@jmcperfumes.es>";
  if (!resend) {
    // No API key configured (e.g. local dev) — log instead of throwing so
    // flows that depend on "an email was sent" don't hard-fail.
    console.warn(`[email:skipped] to=${params.to} subject="${params.subject}"`);
    return { skipped: true };
  }
  return resend.emails.send({ from, to: params.to, subject: params.subject, html: params.html });
}
