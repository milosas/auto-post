import { createOpenAI } from '@ai-sdk/openai';

// OpenAI for text generation
export const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Alias for backwards compatibility (used in route.ts)
export const kieai = openai;
