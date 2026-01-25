'use client';

import { useState, useRef } from 'react';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
}

export default function TestPage() {
  const [industry, setIndustry] = useState('Grožio specialistai');
  const [prompt, setPrompt] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const industries = [
    'Grožio specialistai (kirpėjai, kosmetologai, nagų meistrai)',
    'Treneriai (fitness, joga, personaliniai)',
    'Kineziterapeutai',
    'Masažistai',
    'Kita'
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Įveskite temą');
      return;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setGeneratedText('');

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          prompt,
          tone: 'friendly',
          emoji: 'minimal',
          length: 'medium'
        }),
        signal: abortControllerRef.current.signal
      });

      // Extract rate limit info from headers
      const limit = response.headers.get('X-RateLimit-Limit');
      const remaining = response.headers.get('X-RateLimit-Remaining');
      const resetAt = response.headers.get('X-RateLimit-Reset');

      if (limit && remaining && resetAt) {
        setRateLimitInfo({
          limit: parseInt(limit),
          remaining: parseInt(remaining),
          resetAt
        });
      }

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || 'Generavimo klaida');
        setIsLoading(false);
        return;
      }

      // Read streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setGeneratedText(prev => prev + chunk);
      }

    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore abort errors
        return;
      }
      setError('Tinklo klaida. Bandykite dar kartą.');
      console.error('Generate error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">API Test - Streaming Generation</h1>

      {/* Rate Limit Info */}
      {rateLimitInfo && (
        <div className="mb-4 p-3 bg-blue-50 rounded text-sm">
          Liko generavimų: {rateLimitInfo.remaining} / {rateLimitInfo.limit}
          {rateLimitInfo.remaining === 0 && (
            <span className="block text-red-600">
              Limitas atsinaujins: {new Date(rateLimitInfo.resetAt).toLocaleString('lt-LT')}
            </span>
          )}
        </div>
      )}

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Sritis</label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full p-2 border rounded"
          >
            {industries.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Tema / Apie ką rašyti</label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pvz.: Nauja plaukų dažymo technika, rudens akcija -20%..."
            className="w-full p-2 border rounded h-24"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Generuojama...' : 'Generuoti įrašą'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">
          {error}
        </div>
      )}

      {/* Generated Text */}
      <div className="border rounded p-4 min-h-[200px] bg-gray-50">
        <h2 className="text-sm font-medium mb-2 text-gray-600">Sugeneruotas tekstas:</h2>
        {isLoading && !generatedText && (
          <div className="text-gray-400 animate-pulse">Laukiama atsakymo...</div>
        )}
        <div className="whitespace-pre-wrap">{generatedText}</div>
        {isLoading && generatedText && (
          <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 text-sm text-gray-500">
        <h3 className="font-medium mb-2">Testavimo instrukcijos:</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Pasirinkite sritį ir įveskite temą</li>
          <li>Spauskite &ldquo;Generuoti&rdquo; ir stebėkite kaip tekstas atsiranda palaipsniui (streaming)</li>
          <li>Tekstas turi būti lietuviškas ir su raginimu veikti (CTA)</li>
          <li>Po 50 generavimų turėtų rodyti limito klaidą</li>
        </ol>
      </div>
    </main>
  );
}
