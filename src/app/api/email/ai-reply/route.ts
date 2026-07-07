import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getOpenAIClient, AI_MODEL } from '@/lib/ai';
import { AiReplySchema } from '@/lib/validations/email';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const { userId } = await verifyAccessToken(auth.slice(7));
  return userId;
}

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserId(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const maxReqs = Number(process.env.AI_RATE_LIMIT_MAX ?? 20);
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 600_000);
  const rl = rateLimit(`ai:${userId}`, maxReqs, windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${Math.ceil(rl.retryAfterMs / 60000)} min.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = AiReplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { emailId, instruction } = parsed.data;
  const email = await db.emailMessage.findFirst({
    where: { id: emailId, account: { userId } },
    include: { account: { select: { name: true, fromEmail: true } } },
  });
  if (!email) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

  const systemPrompt = `You are a professional email reply assistant for ${email.account.name}.
Write a clear, professional reply to the email below. Return only the reply body, no Subject line.`;

  const userPrompt = `Original email from ${email.fromName ?? email.fromEmail}:
Subject: ${email.subject}

${email.body}

${instruction ? `Additional instruction: ${instruction}` : 'Write a professional reply.'}`;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.6,
    });
    const reply = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json({
      reply,
      subject: `Re: ${email.subject}`,
      to: email.fromEmail,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OpenAI request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
