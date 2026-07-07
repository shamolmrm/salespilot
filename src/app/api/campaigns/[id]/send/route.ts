import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildTransporter } from '@/lib/email';
import { writeLog } from '@/lib/activity-log';
import { CampaignStatus } from '@prisma/client';

async function getUser(req: NextRequest) {
  const token = req.headers.get('authorization')?.slice(7);
  if (!token) throw new Error('Unauthorized');
  return verifyAccessToken(token);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId, role } = await getUser(req);
    if (role !== 'ADMIN' && role !== 'MANAGER') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    const { id } = await params;

    const campaign = await db.campaign.findUnique({ where: { id }, include: { recipients: { where: { status: 'PENDING' } } } });
    if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      return NextResponse.json({ error: 'Campaign already sent or cancelled' }, { status: 400 });
    }

    if (campaign.type !== 'EMAIL') {
      // WhatsApp / SMS are stubs — not yet integrated
      return NextResponse.json({ error: `${campaign.type} campaigns are not yet supported. Only EMAIL is available.` }, { status: 501 });
    }

    if (!campaign.subject || !campaign.body) {
      return NextResponse.json({ error: 'Campaign must have subject and body before sending' }, { status: 400 });
    }

    // Use the first configured email account to send — requires the user to have set one up
    const emailAccount = await db.emailAccount.findFirst({ where: { userId } });
    if (!emailAccount) return NextResponse.json({ error: 'No email account configured. Set one up in Email settings first.' }, { status: 400 });

    const smtpPassword = process.env[`SMTP_PASS_${emailAccount.id}`] ?? process.env.SMTP_DEFAULT_PASSWORD ?? '';
    const transporter = buildTransporter(emailAccount, { smtpPassword });

    let sentCount = 0;
    for (const recipient of campaign.recipients) {
      try {
        await transporter.sendMail({ from: emailAccount.fromEmail, to: recipient.email, subject: campaign.subject, text: campaign.body });
        await db.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'SENT' } });
        sentCount++;
      } catch {
        await db.campaignRecipient.update({ where: { id: recipient.id }, data: { status: 'FAILED' } });
      }
    }

    const updated = await db.campaign.update({
      where: { id },
      data: { status: CampaignStatus.COMPLETED, sentAt: new Date(), sentCount },
    });

    await writeLog({ userId, action: 'EXPORT', entityType: 'Campaign', entityId: id, metadata: { sentCount } });
    return NextResponse.json(updated);
  } catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 }); }
}
