import { NextResponse } from 'next/server';
import { PROMPT_TEMPLATES } from '@/lib/ai';

export async function GET() {
  const templates = Object.values(PROMPT_TEMPLATES).map(({ id, label, icon, description }) => ({
    id,
    label,
    icon,
    description,
  }));
  return NextResponse.json(templates);
}
