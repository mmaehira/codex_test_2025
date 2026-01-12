import { requireEnv } from "./env";

interface SendMailParams {
  toEmail: string;
  subject: string;
  text: string;
}

export async function sendMail({
  toEmail,
  subject,
  text
}: SendMailParams): Promise<void> {
  const apiKey = requireEnv("SENDGRID_API_KEY");
  const from = requireEnv("MAIL_FROM");

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: toEmail }], subject }],
      from: { email: from },
      content: [{ type: "text/plain", value: text }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SendGrid error: ${response.status} ${errorText}`);
  }
}
