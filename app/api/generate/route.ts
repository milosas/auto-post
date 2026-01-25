import { streamText } from 'ai';
import { kieai } from '@/app/lib/ai';
import { dailyLimit } from '@/app/lib/rate-limit';
import type { GenerateRequest, RateLimitError, ApiError } from '@/app/types/api';

// Edge Runtime for 25s timeout (vs 10s serverless)
export const runtime = 'edge';
export const maxDuration = 25;

// Lithuanian system prompt - casual, friendly tone with CTAs
const SYSTEM_PROMPT = `Tu esi socialinių tinklų turinio kūrėjas, padedantis Lietuvos smulkiems paslaugų teikėjams.

Rašyk lietuviškai, draugišku ir natūraliu tonu - tarsi kalbėtum su kaimynu.
Naudok lietuviškus žodžius vietoj angliškų, kai įmanoma.
Natūralus tekstas svarbiau nei tobula gramatika.
VISADA įtrauk raginimą veikti (CTA) - susisiekti, apsilankyti, užsiregistruoti ir pan.

Formatavimas:
- Naudok emoji tik jei nurodyta
- Pritaikyk tekstą pasirinktam tonui
- Laikykis nurodyto ilgio`;

function buildUserPrompt(request: GenerateRequest): string {
  const toneMap = {
    professional: 'profesionalus',
    friendly: 'draugiškas',
    motivating: 'motyvuojantis',
    humorous: 'humoristinis'
  };

  const emojiMap = {
    yes: 'Naudok emoji',
    no: 'Nenaudok emoji',
    minimal: 'Naudok minimaliai emoji (1-2)'
  };

  const lengthMap = {
    short: 'Trumpas (2-3 sakiniai)',
    medium: 'Vidutinis (4-6 sakiniai)',
    long: 'Ilgas (7-10 sakiniai)'
  };

  return `Sukurk socialinio tinklo įrašą:

Sritis: ${request.industry}
Tema: ${request.prompt}
Tonas: ${toneMap[request.tone || 'friendly']}
Emoji: ${emojiMap[request.emoji || 'minimal']}
Ilgis: ${lengthMap[request.length || 'medium']}`;
}

export async function POST(request: Request) {
  try {
    // 1. Rate limit check (before any processing)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
    const { success, limit, remaining, reset } = await dailyLimit.limit(ip);

    if (!success) {
      const resetDate = new Date(reset);
      const response: RateLimitError = {
        error: 'rate_limit_exceeded',
        limit,
        remaining: 0,
        resetAt: resetDate.toISOString(),
        message: `Dienos limitas pasiektas. Limitas atsinaujins ${resetDate.toLocaleTimeString('lt-LT')}. Reikia daugiau? Susisiekite su mumis.`
      };
      return Response.json(response, { status: 429 });
    }

    // 2. Parse and validate request body
    const body: GenerateRequest = await request.json();

    if (!body.industry || !body.prompt) {
      const response: ApiError = {
        error: 'validation_error',
        message: 'Privalomi laukai: industry ir prompt'
      };
      return Response.json(response, { status: 400 });
    }

    // 3. Generate with streaming
    const result = streamText({
      model: kieai('gpt-4o'),
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(body) }
      ],
    });

    // 4. Return streaming response with rate limit headers
    const response = result.toTextStreamResponse();

    // Add rate limit headers to streaming response
    const headers = new Headers(response.headers);
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return new Response(response.body, {
      status: response.status,
      headers,
    });

  } catch (error) {
    console.error('Generate API error:', error);
    const response: ApiError = {
      error: 'internal_error',
      message: 'Generavimo klaida. Bandykite dar kartą.'
    };
    return Response.json(response, { status: 500 });
  }
}
