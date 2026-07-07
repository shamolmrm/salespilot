import OpenAI from 'openai';

// Instantiated lazily so the import doesn't fail if OPENAI_API_KEY is missing at startup
let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.startsWith('sk-placeholder')) {
      throw new Error(
        'OPENAI_API_KEY is not set. Add your real key to the .env file and restart the app.',
      );
    }
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

export const AI_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

export const PROMPT_TEMPLATES = {
  email_writer: {
    id: 'email_writer',
    label: 'AI Email Writer',
    icon: 'Mail',
    description: 'Write professional sales emails',
    systemPrompt:
      'You are an expert sales email writer. Write professional, persuasive sales emails that are concise, value-focused, and include a clear call to action. Format output as plain text ready to copy.',
    placeholder: 'Describe the email you want — recipient role, context, goal…',
  },
  proposal_writer: {
    id: 'proposal_writer',
    label: 'AI Proposal Writer',
    icon: 'FileText',
    description: 'Create compelling sales proposals',
    systemPrompt:
      'You are an expert sales proposal writer. Create professional, structured proposals with an executive summary, problem statement, solution, pricing overview, and next steps. Use clear headings.',
    placeholder: 'Describe the company, product/service, requirements, and budget if known…',
  },
  follow_up: {
    id: 'follow_up',
    label: 'AI Follow-up Generator',
    icon: 'RefreshCw',
    description: 'Generate timely follow-up messages',
    systemPrompt:
      'You are a sales follow-up specialist. Write timely, contextual follow-up messages that re-engage prospects without being pushy. Reference prior context naturally and suggest a clear next step.',
    placeholder: 'Describe the previous interaction, when it happened, and what you need…',
  },
  cold_email: {
    id: 'cold_email',
    label: 'AI Cold Email',
    icon: 'Send',
    description: 'Write attention-grabbing cold outreach',
    systemPrompt:
      'You are a cold email specialist. Write brief (under 150 words), personalized cold outreach emails that grab attention, establish credibility quickly, and drive a single clear ask. Avoid generic openers.',
    placeholder: 'Describe your target prospect, their company, your offer, and the ask…',
  },
  sales_script: {
    id: 'sales_script',
    label: 'AI Sales Script',
    icon: 'Mic',
    description: 'Build call and demo scripts',
    systemPrompt:
      'You are a sales script expert. Create professional, conversational call/demo scripts with an opening, discovery questions, value presentation, objection handling section, and closing. Format with clear section labels.',
    placeholder: 'Describe the product/service, target customer segment, and call scenario…',
  },
} as const;

export type TemplateId = keyof typeof PROMPT_TEMPLATES;
