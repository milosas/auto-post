// Request body for POST /api/generate
export interface GenerateRequest {
  industry: string;
  prompt: string;
  tone?: 'professional' | 'friendly' | 'motivating' | 'humorous';
  emoji?: 'yes' | 'no' | 'minimal';
  length?: 'short' | 'medium' | 'long';
}

// Successful generation (streaming - actual response is text stream)
export interface GenerateResponse {
  text: string;
}

// Rate limit exceeded response
export interface RateLimitError {
  error: string;
  limit: number;
  remaining: number;
  resetAt: string;
  message: string;
}

// General API error
export interface ApiError {
  error: string;
  message: string;
}
