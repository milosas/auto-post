'use client';

import { useState, useRef } from 'react';
import { IndustryAutocomplete } from './components/IndustryAutocomplete';
import { PostConfiguration, PostConfigurationValues } from './components/PostConfiguration';
import { StreamingDisplay } from './components/StreamingDisplay';
import { ActionButtons } from './components/ActionButtons';
import { useLocalStorage } from './lib/useLocalStorage';
import { INDUSTRIES } from './lib/industries';
import toast from 'react-hot-toast';

export default function HomePage() {
  const [industry, setIndustryRaw] = useLocalStorage('lastIndustry', INDUSTRIES[0]);
  const setIndustry = (value: string) => setIndustryRaw(value as any);
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<PostConfigurationValues>({
    tone: 'friendly',
    emoji: 'minimal',
    length: 'medium',
  });
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Įveskite temą arba tikslą įrašui');
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
          tone: config.tone,
          emoji: config.emoji,
          length: config.length,
        }),
        signal: abortControllerRef.current.signal,
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json();

        // Specific error handling
        if (response.status === 429) {
          const resetTime = response.headers.get('X-RateLimit-Reset');
          if (resetTime) {
            const resetDate = new Date(resetTime);
            toast.error(
              `Pasiektas limitas. Bandykite po ${resetDate.toLocaleTimeString('lt-LT')}`
            );
          } else {
            toast.error('Pasiektas generavimų limitas. Bandykite vėliau.');
          }
        } else {
          toast.error(errorData.message || 'Generavimo klaida');
        }

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
        setGeneratedText((prev) => prev + chunk);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        // Ignore abort errors
        return;
      }
      toast.error('Tinklo klaida. Patikrinkite interneto ryšį ir bandykite dar kartą.');
      setError('Tinklo klaida. Bandykite dar kartą.');
      console.error('Generate error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 p-4 pb-32 max-w-2xl mx-auto w-full">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Social Post Generator</h1>
          <p className="text-gray-600">
            Sukurkite profesionalų socialinių tinklų įrašą per 60 sekundžių
          </p>
        </header>

        {/* Industry Selection */}
        <section className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Jūsų industrija / Veiklos sritis
          </label>
          <IndustryAutocomplete value={industry} onChange={setIndustry} />
        </section>

        {/* Topic Input */}
        <section className="mb-6">
          <label className="block text-sm font-medium mb-2">
            Tema / Apie ką rašyti
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Pvz.: Nauja plaukų dažymo technika, rudens akcija -20%, patarimai sveikai mitybai..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={4}
          />
        </section>

        {/* Configuration */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Įrašo nustatymai</h2>
          <PostConfiguration values={config} onChange={setConfig} />
        </section>

        {/* Generate Button */}
        <section className="mb-6">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Generuojama...' : 'Generuoti įrašą'}
          </button>
        </section>

        {/* Generated Text Display */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Sugeneruotas tekstas</h2>
          <StreamingDisplay text={generatedText} isLoading={isLoading} />
        </section>

        {/* Error Display */}
        {error && (
          <section className="mb-6">
            <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
              {error}
            </div>
          </section>
        )}
      </div>

      {/* Action Buttons */}
      <ActionButtons
        onCopy={handleCopy}
        onRegenerate={handleRegenerate}
        canCopy={!!generatedText && !isLoading}
        canRegenerate={!!generatedText}
        isLoading={isLoading}
      />
    </main>
  );
}
