import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const FROM_EMAIL = "Clean <hello@tryclean.ai>";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendWaitlistNotification(name: string, email: string) {
  try {
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    await getResend().emails.send({
      from: FROM_EMAIL,
      to: "hello@tryclean.ai",
      subject: `New waitlist signup: ${safeName}`,
      html: `
        <h2>New Waitlist Signup</h2>
        <p><strong>Name:</strong> ${safeName}</p>
        <p><strong>Email:</strong> ${safeEmail}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      `,
    });
  } catch (err) {
    console.error("Failed to send waitlist notification:", err);
  }
}

export async function sendAcceptanceEmail(name: string, email: string) {
  try {
    const safeName = escapeHtml(name);
    const signUpUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://tryclean.ai"}/sign-up`;

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "You're in! Welcome to Clean",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 16px;">Welcome to Clean, ${safeName}!</h1>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
            Your waitlist request has been approved. You can now create your account and start using Clean to give your AI agents semantic code search.
          </p>
          <a href="${signUpUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; font-size: 15px;">
            Create Your Account
          </a>
          <p style="color: #999; font-size: 13px; margin-top: 32px;">
            If you have any questions, reply to this email and we'll help you get started.
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send acceptance email:", err);
  }
}

export async function sendFollowUpEmail(name: string, email: string) {
  try {
    const safeName = escapeHtml(name);

    await getResend().emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "How's it going with Clean?",
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">Hey ${safeName},</p>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            It's been about a week since you got access to Clean. I'd love to hear how things are going — whether you've had a chance to try it out, run into any issues, or have any feedback at all.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 16px;">
            Just reply to this email with your thoughts. Even a one-liner helps us a ton.
          </p>
          <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 8px;">
            Thanks,<br/>
            The Clean Team
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error("Failed to send follow-up email:", err);
  }
}
