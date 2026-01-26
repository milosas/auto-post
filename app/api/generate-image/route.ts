import OpenAI from 'openai';
import { dailyLimit } from '@/app/lib/rate-limit';

// Edge Runtime for 25s timeout
export const runtime = 'edge';
export const maxDuration = 25;

interface GenerateImageRequest {
  industry: string;
  prompt: string;
  quality?: 'standard' | 'hd';
}

interface RateLimitError {
  error: 'rate_limit_exceeded';
  limit: number;
  remaining: number;
  resetAt: string;
  message: string;
}

interface ApiError {
  error: string;
  message: string;
}

interface GenerateImageResponse {
  imageUrl: string;
  revisedPrompt: string;
}

export async function POST(request: Request) {
  try {
    // 1. Rate limit check (before any processing) - skip if Redis not configured
    let limit = 50;
    let remaining = 50;
    let reset = Date.now() + 86400000;

    if (dailyLimit) {
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous';
      const rateLimitResult = await dailyLimit.limit(ip);
      limit = rateLimitResult.limit;
      remaining = rateLimitResult.remaining;
      reset = rateLimitResult.reset;

      if (!rateLimitResult.success) {
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
    }

    // 2. Parse and validate request body
    const body: GenerateImageRequest = await request.json();

    if (!body.industry || !body.prompt) {
      const response: ApiError = {
        error: 'validation_error',
        message: 'Privalomi laukai: industry ir prompt'
      };
      return Response.json(response, { status: 400 });
    }

    // 3. Build DALL-E prompt (English for better results per RESEARCH.md)
    const dallePrompt = `${body.prompt} for ${body.industry} business, professional, high-quality, social media post image`;

    // 4. Initialize OpenAI client
    const openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 5. Generate image with DALL-E 3
    const response = await openaiClient.images.generate({
      model: 'dall-e-3',
      prompt: dallePrompt,
      size: '1024x1024',
      quality: body.quality || 'standard',
      style: 'natural',
      n: 1,
    });

    // 6. Extract image URL and revised prompt
    if (!response.data || response.data.length === 0) {
      const errorResponse: ApiError = {
        error: 'generation_error',
        message: 'Nepavyko sugeneruoti paveikslėlio'
      };
      return Response.json(errorResponse, { status: 500 });
    }

    const imageData = response.data[0];
    if (!imageData.url) {
      const errorResponse: ApiError = {
        error: 'generation_error',
        message: 'Nepavyko sugeneruoti paveikslėlio'
      };
      return Response.json(errorResponse, { status: 500 });
    }

    // 7. Return success response with rate limit headers
    const successResponse: GenerateImageResponse = {
      imageUrl: imageData.url,
      revisedPrompt: imageData.revised_prompt || dallePrompt
    };

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return new Response(JSON.stringify(successResponse), {
      status: 200,
      headers,
    });

  } catch (error) {
    console.error('Generate image API error:', error);

    // Check for OpenAI specific errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 400) {
        const response: ApiError = {
          error: 'invalid_prompt',
          message: 'Netinkamas užklausos tekstas. Pabandykite kitaip aprašyti paveikslėlį.'
        };
        return Response.json(response, { status: 400 });
      }
    }

    const response: ApiError = {
      error: 'internal_error',
      message: 'Generavimo klaida. Bandykite dar kartą.'
    };
    return Response.json(response, { status: 500 });
  }
}
