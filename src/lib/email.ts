import { logger } from "./logger";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Sends an email notification.
 * If RESEND_API_KEY is configured in .env, it sends via Resend HTTP API.
 * If not configured, it safely logs the email in dev mode so the app never crashes.
 */
export async function sendEmail({ to, subject, html, text }: SendEmailOptions): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Yakunex CPMS <notifications@yakunex.com>";

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      logger.info(`[Email Dev Preview] To: ${to} | Subject: "${subject}"`);
    }
    return true;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]+>/g, ""),
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      logger.error("Failed to send email via Resend", new Error(errText), { to, subject });
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Error sending email notification", error, { to, subject });
    return false;
  }
}

/**
 * Template for Project Assignment Email
 */
export function assignmentEmailHtml(projectName: string, assignedByName: string, projectUrl: string) {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
      <h2 style="color: #fbbf24; margin-top: 0;">Yakunex CPMS</h2>
      <p style="font-size: 16px; line-height: 1.5;">You have been assigned to project <strong>"${projectName}"</strong> by ${assignedByName}.</p>
      <div style="margin: 24px 0;">
        <a href="${projectUrl}" style="background: #fbbf24; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">View Project</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">Yakunex Technologies (Pvt) Ltd</p>
    </div>
  `;
}

/**
 * Template for Project Deadline Alert Email
 */
export function deadlineEmailHtml(projectName: string, deadlineDate: string, daysRemaining: number, projectUrl: string) {
  const isOverdue = daysRemaining < 0;
  const statusColor = isOverdue ? "#f43f5e" : "#f59e0b";
  const statusTitle = isOverdue ? "Project Overdue Alert" : "Upcoming Deadline Alert";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; background: #0f172a; color: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #1e293b;">
      <h2 style="color: ${statusColor}; margin-top: 0;">${statusTitle}</h2>
      <p style="font-size: 16px; line-height: 1.5;">
        ${isOverdue 
          ? `Project <strong>"${projectName}"</strong> was due on ${deadlineDate} and is currently overdue.`
          : `Project <strong>"${projectName}"</strong> is due on ${deadlineDate} (${daysRemaining} days remaining).`
        }
      </p>
      <div style="margin: 24px 0;">
        <a href="${projectUrl}" style="background: #fbbf24; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Review Project</a>
      </div>
      <p style="font-size: 13px; color: #94a3b8; margin-bottom: 0;">Yakunex Technologies (Pvt) Ltd</p>
    </div>
  `;
}

