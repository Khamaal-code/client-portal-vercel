import sgMail from "@sendgrid/mail";

export async function sendOtpEmail(to: string, code: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const fromEmail = process.env.SENDGRID_FROM_EMAIL;

  if (!apiKey || !fromEmail) {
    throw new Error("SendGrid env vars are not set");
  }

  sgMail.setApiKey(apiKey);

  const subject = "Your verification code";
  const text = `Your verification code is ${code}. It expires in 15 minutes.`;

  await sgMail.send({
    to,
    from: fromEmail,
    subject,
    text,
  });
}
