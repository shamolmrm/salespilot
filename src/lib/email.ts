import nodemailer from 'nodemailer';
import type { EmailAccount } from '@prisma/client';

export interface SmtpCredentials {
  smtpPassword: string;
  imapPassword?: string;
}

export function buildTransporter(account: EmailAccount, creds: SmtpCredentials) {
  return nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpSecure,
    auth: {
      user: account.smtpUser,
      pass: creds.smtpPassword,
    },
    // 10 second connection timeout
    connectionTimeout: 10_000,
    socketTimeout: 20_000,
  });
}

export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export async function sendEmail(
  account: EmailAccount,
  creds: SmtpCredentials,
  to: string,
  subject: string,
  body: string,
  bodyType?: 'TEXT' | 'HTML',
  attachments?: EmailAttachment[],
): Promise<string> {
  const transporter = buildTransporter(account, creds);
  const info = await transporter.sendMail({
    from: `"${account.name}" <${account.fromEmail}>`,
    to,
    subject,
    ...(bodyType === 'HTML' ? { html: body } : { text: body }),
    attachments: attachments?.map((a) => ({
      filename: a.filename,
      content: a.content,
      contentType: a.contentType,
    })),
  });
  return (info.messageId as string) ?? '';
}

export interface FetchedEmail {
  messageId: string;
  from: string;
  fromName: string;
  subject: string;
  body: string;
  bodyType: 'TEXT' | 'HTML';
  receivedAt: Date;
}

export async function fetchInboxEmails(
  account: EmailAccount,
  creds: SmtpCredentials,
  limit = 30,
): Promise<FetchedEmail[]> {
  if (!account.imapHost || !account.imapPort || !account.imapUser) return [];

  // Dynamic import so Next.js doesn't try to bundle imapflow for the browser
  const { ImapFlow } = await import('imapflow');

  const client = new ImapFlow({
    host: account.imapHost,
    port: account.imapPort,
    secure: account.imapSecure,
    auth: {
      user: account.imapUser,
      pass: creds.imapPassword ?? creds.smtpPassword,
    },
    logger: false,
  });

  const results: FetchedEmail[] = [];

  try {
    await client.connect();
    const lock = await client.getMailboxLock('INBOX');
    try {
      // Fetch last `limit` messages
      const mailbox = client.mailbox;
      // imapflow types mailbox as MailboxObject | false
      const total = mailbox ? ((mailbox as { exists?: number }).exists ?? 0) : 0;
      if (total === 0) return [];

      const from = Math.max(1, total - limit + 1);
      const range = `${from}:${total}`;

      for await (const msg of client.fetch(range, {
        envelope: true,
        bodyStructure: true,
        source: true,
      })) {
        const src = msg.source?.toString('utf-8') ?? '';
        // Extract plain text body (simple extraction — good enough for inbox preview)
        const bodyMatch = src.match(/\r?\n\r?\n([\s\S]+)$/);
        const body = bodyMatch ? bodyMatch[1].trim() : '';
        const env = msg.envelope;

        results.push({
          messageId: env?.messageId ?? `${msg.uid}@${account.imapHost}`,
          from: env?.from?.[0]?.address ?? '',
          fromName: env?.from?.[0]?.name ?? '',
          subject: env?.subject ?? '(no subject)',
          body: body.slice(0, 50_000),
          bodyType: 'TEXT',
          receivedAt: env?.date ?? new Date(),
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch {
    try { await client.logout(); } catch { /* ignore */ }
  }

  return results.reverse(); // newest first
}
