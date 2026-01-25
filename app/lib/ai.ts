import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export const kieai = createOpenAICompatible({
  name: 'kieai',
  apiKey: process.env.KIEAI_API_KEY!,
  baseURL: process.env.KIEAI_BASE_URL!,
});
