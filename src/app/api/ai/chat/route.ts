import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimit } from '@/lib/rate-limit';
import { getOpenAIClient, AI_MODEL, PROMPT_TEMPLATES, type TemplateId } from '@/lib/ai';
import { ChatMessageSchema } from '@/lib/validations/ai';

async function getUserId(req: NextRequest): Promise<string> {
  const auth = req.headers.get('authorization') ?? '';
  const payload = await verifyAccessToken(auth.slice(7));
  return payload.userId;
}

export async function POST(req: NextRequest) {
  let userId: string;
  try {
    userId = await getUserId(req);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Per-user rate limit (not IP-based so it can't be spoofed via proxy)
  const maxReqs = Number(process.env.AI_RATE_LIMIT_MAX ?? 20);
  const windowMs = Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 600_000);
  const rl = rateLimit(`ai:${userId}`, maxReqs, windowMs);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `Rate limit reached. Try again in ${Math.ceil(rl.retryAfterMs / 60000)} min.` },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = ChatMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { message, conversationId, templateId, newTitle } = parsed.data;

  // Resolve or create the conversation
  let convId = conversationId;
  if (!convId) {
    const title = newTitle ?? message.slice(0, 80);
    const conv = await db.conversation.create({ data: { userId, title } });
    convId = conv.id;
  } else {
    const existing = await db.conversation.findFirst({ where: { id: convId, userId } });
    if (!existing) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
  }

  // Load history (last 20 exchanges = 40 messages to cap token usage)
  const history = await db.aiMessage.findMany({
    where: { conversationId: convId },
    orderBy: { createdAt: 'asc' },
    take: 40,
    select: { role: true, content: true },
  });

  // Build OpenAI messages
  const systemPrompt =
    templateId && templateId in PROMPT_TEMPLATES
      ? PROMPT_TEMPLATES[templateId as TemplateId].systemPrompt
      : 'You are a helpful sales assistant for SalesPilot CRM. Help users with sales strategies, email writing, lead qualification, and pipeline management.';

  const openaiMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((m) => ({
      role: m.role.toLowerCase() as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // Call OpenAI
  let aiText: string;
  let promptTokens: number | undefined;
  let completionTokens: number | undefined;

  try {
    const client = getOpenAIClient();
    const completion = await client.chat.completions.create({
      model: AI_MODEL,
      messages: openaiMessages,
      max_tokens: 1500,
      temperature: 0.7,
    });
    aiText = completion.choices[0]?.message?.content ?? '';
    promptTokens = completion.usage?.prompt_tokens;
    completionTokens = completion.usage?.completion_tokens;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'OpenAI request failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Persist both messages
  await db.$transaction([
    db.aiMessage.create({
      data: { conversationId: convId, role: 'USER', content: message },
    }),
    db.aiMessage.create({
      data: {
        conversationId: convId,
        role: 'ASSISTANT',
        content: aiText,
        promptTokens,
        completionTokens,
      },
    }),
    db.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    }),
  ]);

  return NextResponse.json({
    conversationId: convId,
    message: aiText,
    usage: { promptTokens, completionTokens },
  });
}
