import { generateText, generateObject } from 'ai';
import { google } from '@ai-sdk/google';
import { z } from 'zod/v4';
import { TEXT_EXTRACTION_MODEL, PLAN_GENERATION_MODEL } from '@/config/ai';
import { TEXT_EXTRACTION_PROMPT, PLAN_GENERATION_PROMPT, planRegenerationPrompt } from '@/prompts';

export type PlanJSON = {
  topics: {
    title: string;
    subtopics: string[];
    isKnown?: boolean;
  }[];
};

export function validatePlanJSON(data: unknown): data is PlanJSON {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  if (!Array.isArray(obj.topics) || obj.topics.length === 0) return false;
  return obj.topics.every((topic: unknown) => {
    if (!topic || typeof topic !== 'object') return false;
    const t = topic as Record<string, unknown>;
    if (typeof t.title !== 'string' || t.title.trim() === '') return false;
    if (!Array.isArray(t.subtopics) || t.subtopics.length === 0) return false;
    return t.subtopics.every(
      (s: unknown) => typeof s === 'string' && s.trim() !== '',
    );
  });
}

const planSchema = z.object({
  topics: z.array(
    z.object({
      title: z.string(),
      subtopics: z.array(z.string()),
    }),
  ),
});

export async function generatePlan(allText: string): Promise<PlanJSON> {
  const { object } = await generateObject({
    model: google(PLAN_GENERATION_MODEL),
    schema: planSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: PLAN_GENERATION_PROMPT },
          { type: 'text', text: allText },
        ],
      },
    ],
  });
  return object as PlanJSON;
}

export async function regeneratePlan(
  allText: string,
  guidance: string,
): Promise<PlanJSON> {
  const { object } = await generateObject({
    model: google(PLAN_GENERATION_MODEL),
    schema: planSchema,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: planRegenerationPrompt(guidance) },
          { type: 'text', text: allText },
        ],
      },
    ],
  });
  return object as PlanJSON;
}

export async function extractTextFromFile(
  fileBuffer: Buffer,
  mimeType: string,
): Promise<string> {
  const { text } = await generateText({
    model: google(TEXT_EXTRACTION_MODEL),
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'file',
            data: fileBuffer,
            mediaType: mimeType,
          },
          {
            type: 'text',
            text: TEXT_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  return text;
}
