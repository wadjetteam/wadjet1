import { logger } from "../lib/logger";

export interface NotificationPayload {
  triggerType: string;
  recipientType: 'Owner' | 'Reviewer' | 'DeptHead' | 'CRO' | 'CEO';
  recipientAddress: string;
  channel: 'Email' | 'SMS';
  subject?: string;
  body: string;
}

const SMTP_HOST = process.env["SMTP_HOST"] ?? "smtp.bank.eg";
const SMTP_PORT = Number(process.env["SMTP_PORT"]) || 587;
const SMTP_USER = process.env["SMTP_USER"] ?? "wadjet-grc@bank.eg";
const SMTP_PASS = process.env["SMTP_PASS"] ?? "";
const SMS_API_URL = process.env["SMS_API_URL"] ?? "https://sms.bank.eg/api/v1/send";
const SMS_API_KEY = process.env["SMS_API_KEY"] ?? "";

const TEMPLATES: Record<string, Record<string, { subject: string; body: string }>> = {
  KRI_BREACH: {
    Email: {
      subject: "ALERT: KRI Outside Risk Appetite — Immediate Action Required",
      body: `Dear {recipient},

This is an automated alert from Wajet GRC Platform.

A Key Risk Indicator (KRI) has breached the approved risk appetite threshold:

  KRI Code  : {metricCode}
  KRI Name  : {metricName}
  Category  : {riskCategory}
  Value     : {currentValue}
  Threshold : {threshold}
  Status    : Outside Risk Appetite (RED)

A Breach Remediation Task has been created and assigned to {owner}.
Due Date: {dueDate} (48-hour SLA).

Please review and take immediate action.

Regards,
Wajet GRC Platform — Central Bank Compliance`,
    },
    SMS: {
      subject: "SMS Alert",
      body: `Wajet ALERT: KRI {metricCode} breached risk appetite (Value: {currentValue}). Task assigned to {owner}. Due: {dueDate}.`,
    },
  },
  PENDING_REVIEW: {
    Email: {
      subject: "Review Required: Monthly KPI/KRI Measurement Submitted",
      body: `Dear {recipient},

A monthly measurement has been submitted for your review:

  Metric Code : {metricCode}
  Metric Name : {metricName}
  Period      : {period}
  Value       : {currentValue}
  Submitted By: {submittedBy}

Please log in to Wajet GRC to approve or request changes.

Regards,
Wajet GRC Platform`,
    },
    SMS: {
      subject: "SMS Alert",
      body: `Wajet: {metricCode} measurement submitted for {period}. Please review in Wajet GRC.`,
    },
  },
  OVERDUE_ESCALATION: {
    Email: {
      subject: "ESCALATION: Breach Remediation Task Overdue — Level {level}",
      body: `Dear {recipient},

This is an ESCALATION notification from Wajet GRC Platform.

A Breach Remediation Task has exceeded its SLA window and is being escalated:

  Task ID           : {taskId}
  Linked KRI        : {metricName}
  Owner             : {owner}
  Current Level     : {level}
  Overdue By        : {overdueHours} hours
  Original Due Date : {dueDate}

{escalationMessage}

Regards,
Wajet GRC Platform — Risk & Compliance`,
    },
    SMS: {
      subject: "SMS Alert",
      body: `Wajet ESCALATION L{level}: Task {taskId} overdue by {overdueHours}h. {escalationMessage}`,
    },
  },
};

function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}

async function sendEmail(payload: NotificationPayload): Promise<boolean> {
  try {
    logger.info(
      { to: payload.recipientAddress, subject: payload.subject },
      "Sending email notification"
    );
    if (!SMTP_HOST || SMTP_HOST === "smtp.bank.eg") {
      logger.warn("SMTP not configured — email logged but not sent");
      return true;
    }
    const nodemailer = await import("nodemailer").catch(() => null);
    if (!nodemailer) {
      logger.warn("nodemailer not installed — email skipped");
      return true;
    }
    const transporter = nodemailer.default.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({
      from: SMTP_USER,
      to: payload.recipientAddress,
      subject: payload.subject ?? "",
      text: payload.body,
    });
    return true;
  } catch (err) {
    logger.error({ err, to: payload.recipientAddress }, "Failed to send email");
    return false;
  }
}

async function sendSms(payload: NotificationPayload): Promise<boolean> {
  try {
    logger.info(
      { to: payload.recipientAddress },
      "Sending SMS notification"
    );
    if (!SMS_API_URL || SMS_API_URL === "https://sms.bank.eg/api/v1/send") {
      logger.warn("SMS API not configured — SMS logged but not sent");
      return true;
    }
    const response = await fetch(SMS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": SMS_API_KEY,
      },
      body: JSON.stringify({
        to: payload.recipientAddress,
        message: payload.body,
      }),
    });
    if (!response.ok) {
      throw new Error(`SMS API returned HTTP ${response.status}`);
    }
    return true;
  } catch (err) {
    logger.error({ err, to: payload.recipientAddress }, "Failed to send SMS");
    return false;
  }
}

export async function sendNotification(
  payload: NotificationPayload
): Promise<{ success: boolean; channel: string }> {
  let success = false;
  if (payload.channel === "Email") {
    success = await sendEmail(payload);
  } else if (payload.channel === "SMS") {
    success = await sendSms(payload);
  }
  try {
    const { getCollection } = await import("@workspace/db");
    const log = getCollection("notification_log");
    await log.create({
      triggerType: payload.triggerType,
      recipientType: payload.recipientType,
      recipientAddress: payload.recipientAddress,
      channel: payload.channel,
      subject: payload.subject ?? "",
      body: payload.body,
      status: success ? "Sent" : "Failed",
      sentAt: new Date().toISOString(),
    });
  } catch {
  }
  return { success, channel: payload.channel };
}

export function buildBreachAlert(
  vars: Record<string, string>
): { email: NotificationPayload; sms: NotificationPayload } {
  const emailTpl = TEMPLATES.KRI_BREACH.Email;
  const smsTpl = TEMPLATES.KRI_BREACH.SMS;
  return {
    email: {
      triggerType: "KRI_BREACH",
      recipientType: "Owner",
      recipientAddress: vars.recipientAddress,
      channel: "Email",
      subject: emailTpl.subject,
      body: fillTemplate(emailTpl.body, vars),
    },
    sms: {
      triggerType: "KRI_BREACH",
      recipientType: "Owner",
      recipientAddress: vars.recipientPhone ?? vars.recipientAddress,
      channel: "SMS",
      subject: smsTpl.subject,
      body: fillTemplate(smsTpl.body, vars),
    },
  };
}

export function buildReviewAlert(
  vars: Record<string, string>
): NotificationPayload {
  const tpl = TEMPLATES.PENDING_REVIEW.Email;
  return {
    triggerType: "PENDING_REVIEW",
    recipientType: "Reviewer",
    recipientAddress: vars.recipientAddress,
    channel: "Email",
    subject: tpl.subject,
    body: fillTemplate(tpl.body, vars),
  };
}

export function buildEscalationAlert(
  vars: Record<string, string>
): NotificationPayload {
  const tpl = TEMPLATES.OVERDUE_ESCALATION.Email;
  return {
    triggerType: "OVERDUE_ESCALATION",
    recipientType: (vars.recipientType as any) ?? "CRO",
    recipientAddress: vars.recipientAddress,
    channel: "Email",
    subject: fillTemplate(tpl.subject, vars),
    body: fillTemplate(tpl.body, vars),
  };
}
