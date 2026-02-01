'use client';

import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { IndustryAutocomplete } from './components/IndustryAutocomplete';
import { PostConfiguration, PostConfigurationValues } from './components/PostConfiguration';
import { StreamingDisplay } from './components/StreamingDisplay';
import { ActionButtons } from './components/ActionButtons';
import { ImageSource } from './components/ImageSource';
import { ImageUpload } from './components/ImageUpload';
import { SocialPreview } from './components/SocialPreview';
import { DownloadButton } from './components/DownloadButton';
import { GenerationOptions } from './components/GenerationOptions';
import { SavePostButton } from './components/SavePostButton';
import { UpgradeCTA } from './components/UpgradeCTA';
import { useImagePreview } from './lib/image-utils';
import AuthHeader from './components/AuthHeader';
import { INDUSTRIES, getPlaceholderForIndustry } from './lib/industries';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import toast from 'react-hot-toast';

export default function HomePage() {
  const searchParams = useSearchParams();

  const [industry, setIndustry] = useState('');
  const [prompt, setPrompt] = useState('');
  const [config, setConfig] = useState<PostConfigurationValues>({
    tone: 'friendly',
    emoji: 'minimal',
    length: 'medium',
  });
  const [imageSource, setImageSource] = useState<'upload' | 'ai'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generateText, setGenerateText] = useState(true);
  const [generateImage, setGenerateImage] = useState(true);
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [usage, setUsage] = useState<{
    used: number;
    limit: number;
    resetAt: string;
  } | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Image preview from uploaded file
  const uploadedImagePreview = useImagePreview(imageFile);
  const displayImageUrl = imageSource === 'upload' ? uploadedImagePreview : imageUrl;

  // Helper to get timezone
  const getTimezone = () => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    } catch {
      return 'UTC';
    }
  };

  // Check if limit reached
  const isLimitReached = usage && usage.used >= usage.limit;

  // Pre-fill form fields from URL searchParams (for regenerate flow)
  useEffect(() => {
    const industryParam = searchParams.get('industry');
    const topicParam = searchParams.get('topic');
    const toneParam = searchParams.get('tone');
    const lengthParam = searchParams.get('length');
    const emojiParam = searchParams.get('emoji');
    const imageStyleParam = searchParams.get('imageStyle');

    if (industryParam) setIndustry(industryParam);
    if (topicParam) setPrompt(topicParam);

    // Map config params with proper type validation
    if (toneParam || lengthParam || emojiParam) {
      const validTones = ['professional', 'friendly', 'motivational', 'humorous'] as const;
      const validEmojis = ['yes', 'no', 'minimal'] as const;
      const validLengths = ['short', 'medium', 'long'] as const;

      setConfig(prev => ({
        tone: (toneParam && validTones.includes(toneParam as any)) ? toneParam as typeof validTones[number] : prev.tone,
        emoji: emojiParam === 'true' ? 'yes' : emojiParam === 'false' ? 'no' : prev.emoji,
        length: lengthParam === '100' ? 'short' : lengthParam === '200' ? 'medium' : lengthParam === '300' ? 'long' : prev.length,
      }));
    }

    // Clear URL params after reading (cleaner UX)
    if (searchParams.toString()) {
      window.history.replaceState({}, '', '/');
    }
  }, [searchParams]);

  // Check authentication status and fetch usage on mount
  useEffect(() => {
    const checkUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      // Fetch usage for authenticated users
      if (user) {
        setUsageLoading(true);
        try {
          const response = await fetch('/api/usage', {
            headers: { 'X-Timezone': getTimezone() },
          });
          if (response.ok) {
            const data = await response.json();
            setUsage(data);
          }
        } catch (error) {
          console.error('Failed to fetch usage:', error);
        } finally {
          setUsageLoading(false);
        }
      } else {
        setUsageLoading(false);
      }
    };
    checkUser();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('Įveskite temą arba tikslą įrašui');
      return;
    }

    // Check if at least one generation option is selected
    if (!generateText && !(generateImage && imageSource === 'ai')) {
      toast.error('Pasirinkite bent vieną generavimo parinktį');
      return;
    }

    // Abort any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setError(null);

    // Prepare promises for parallel execution
    const promises: Promise<void>[] = [];

    // Text generation
    if (generateText) {
      setIsLoading(true);
      setGeneratedText('');

      const textPromise = (async () => {
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
            signal: abortControllerRef.current!.signal,
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
              toast.error(errorData.message || 'Teksto generavimo klaida');
            }

            setError(errorData.message || 'Teksto generavimo klaida');
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

          // Refetch usage after successful generation
          try {
            const usageResponse = await fetch('/api/usage', {
              headers: { 'X-Timezone': getTimezone() },
            });
            if (usageResponse.ok) {
              const usageData = await usageResponse.json();
              setUsage(usageData);
            }
          } catch (usageError) {
            console.error('Failed to refetch usage:', usageError);
          }
        } catch (err) {
          if (err instanceof Error && err.name === 'AbortError') {
            return;
          }
          toast.error('Tinklo klaida. Patikrinkite interneto ryšį ir bandykite dar kartą.');
          setError('Tinklo klaida. Bandykite dar kartą.');
          console.error('Text generation error:', err);
        } finally {
          setIsLoading(false);
        }
      })();

      promises.push(textPromise);
    }

    // Image generation (only if AI mode and checkbox selected)
    if (generateImage && imageSource === 'ai') {
      setIsGeneratingImage(true);

      const imagePromise = (async () => {
        try {
          const response = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              industry,
              prompt,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            toast.error(errorData.error || 'Paveikslelio generavimo klaida');
            setError(errorData.error || 'Paveikslelio generavimo klaida');
            return;
          }

          const data = await response.json();
          setImageUrl(data.imageUrl);
          toast.success('Paveikslelis sugeneruotas');
        } catch (err) {
          toast.error('Nepavyko sugeneruoti paveikslelio');
          setError('Paveikslelio generavimas nepavyko');
          console.error('Image generation error:', err);
        } finally {
          setIsGeneratingImage(false);
        }
      })();

      promises.push(imagePromise);
    }

    // Wait for all promises to complete
    await Promise.all(promises);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedText);
  };

  // Regenerate only text (independent of image)
  const handleRegenerateText = async () => {
    if (!prompt.trim()) {
      toast.error('Įveskite temą');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setGeneratedText('');
    setError(null);

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
        signal: abortControllerRef.current!.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Generavimo klaida');
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        toast.error('Streaming nepalaikomas');
        return;
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setGeneratedText((prev) => prev + chunk);
      }

      toast.success('Įrašas sugeneruotas');

      // Refetch usage after successful regeneration
      try {
        const usageResponse = await fetch('/api/usage', {
          headers: { 'X-Timezone': getTimezone() },
        });
        if (usageResponse.ok) {
          const usageData = await usageResponse.json();
          setUsage(usageData);
        }
      } catch (usageError) {
        console.error('Failed to refetch usage:', usageError);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        toast.error('Generavimo klaida');
        console.error('Text regeneration error:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Regenerate only image (independent of text)
  const handleRegenerateImage = async () => {
    const imagePrompt = generatedText.trim() || prompt.trim();
    if (!imagePrompt) {
      toast.error('Įveskite temą arba pirma sugeneruokite tekstą');
      return;
    }

    setIsGeneratingImage(true);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          prompt: imagePrompt.slice(0, 500),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Paveikslelio generavimo klaida');
        return;
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      setImageSource('ai');
      toast.success('Paveikslėlis sugeneruotas');
    } catch (err) {
      toast.error('Nepavyko sugeneruoti paveikslelio');
      console.error('Image regeneration error:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleImageSourceChange = (newSource: 'upload' | 'ai') => {
    setImageSource(newSource);
    // When switching to upload, clear AI-generated image
    if (newSource === 'upload') {
      setImageUrl(null);
    }
  };

  const handleImageSelect = (file: File | null) => {
    setImageFile(file);
    // When uploading new image, clear AI-generated image
    if (file) {
      setImageUrl(null);
    }
  };

  // Generate image based on already generated text
  const handleGenerateImageFromText = async () => {
    if (!generatedText.trim()) {
      toast.error('Pirma sugeneruokite tekstą');
      return;
    }

    setIsGeneratingImage(true);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          prompt: generatedText.slice(0, 500), // Use generated text as prompt (limit length)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.error || 'Paveikslelio generavimo klaida');
        return;
      }

      const data = await response.json();
      setImageUrl(data.imageUrl);
      setImageSource('ai'); // Switch to AI mode to display the generated image
      toast.success('Paveikslėlis sugeneruotas pagal įrašą');
    } catch (err) {
      toast.error('Nepavyko sugeneruoti paveikslelio');
      console.error('Image generation from text error:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 p-4 pb-32 max-w-2xl mx-auto w-full">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Social Post Generator</h1>
              <p className="text-gray-600">
                Sukurkite profesionalų socialinių tinklų įrašą per 60 sekundžių
              </p>
            </div>
            <AuthHeader />
          </div>
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
            placeholder={getPlaceholderForIndustry(industry)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
            rows={4}
          />
        </section>

        {/* Image Source Selection */}
        <section className="mb-6">
          <label className="block text-sm font-medium mb-2">Paveikslėlis</label>
          <ImageSource value={imageSource} onChange={handleImageSourceChange} />

          {imageSource === 'upload' ? (
            <div className="mt-4">
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={uploadedImagePreview}
                disabled={isLoading || isGeneratingImage}
              />
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">
              AI paveikslėlis bus sugeneruotas pagal jūsų temą
            </p>
          )}
        </section>

        {/* Configuration */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Įrašo nustatymai</h2>
          <PostConfiguration values={config} onChange={setConfig} />
        </section>

        {/* Generation Options */}
        <section className="mb-6">
          <GenerationOptions
            generateText={generateText}
            generateImage={generateImage && imageSource === 'ai'}
            onTextChange={setGenerateText}
            onImageChange={setGenerateImage}
            disabled={isLoading || isGeneratingImage}
          />
        </section>

        {/* Generate Button */}
        <section className="mb-6">
          {usageLoading ? (
            // Loading state: show skeleton/disabled button
            <button
              disabled
              className="w-full py-3 px-4 bg-gray-300 text-gray-500 rounded-lg font-medium cursor-not-allowed animate-pulse"
            >
              Kraunama...
            </button>
          ) : !user ? (
            // Unauthenticated: Show sign-in prompt
            <div className="space-y-3">
              <button
                onClick={() => {
                  toast.error('Prisijunkite, kad galėtumėte generuoti įrašus');
                }}
                className="w-full py-3 px-4 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
              >
                Generuoti įrašą
              </button>
              <p className="text-center text-sm text-gray-600">
                <a href="/sign-in" className="text-blue-600 hover:underline">Prisijunkite</a>
                {' '}arba{' '}
                <a href="/sign-up" className="text-blue-600 hover:underline">užsiregistruokite</a>
                {' '}kad galėtumėte generuoti įrašus
              </p>
            </div>
          ) : isLimitReached ? (
            // Authenticated but limit reached: Show upgrade CTA
            <div className="space-y-3">
              <UpgradeCTA resetAt={usage?.resetAt} />
              <p className="text-center text-sm text-gray-500">
                Dienos limitas pasiektas ({usage?.used}/{usage?.limit})
              </p>
            </div>
          ) : (
            // Authenticated and under limit: Show generate button
            <button
              onClick={handleGenerate}
              disabled={isLoading || isGeneratingImage}
              className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading || isGeneratingImage ? 'Generuojama...' : 'Generuoti įrašą'}
            </button>
          )}
        </section>

        {/* Generated Text Display */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Sugeneruotas tekstas</h2>
          <StreamingDisplay text={generatedText} isLoading={isLoading} />
        </section>

        {/* Generate Image from Text Button - shows when text exists but no image */}
        {generatedText && !displayImageUrl && !isLoading && (
          <section className="mb-6">
            <button
              onClick={handleGenerateImageFromText}
              disabled={isGeneratingImage}
              className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 disabled:from-purple-400 disabled:to-pink-400 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isGeneratingImage ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generuojamas paveikslėlis...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Generuoti paveikslėlį pagal įrašą
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              AI sukurs paveikslėlį pagal sugeneruotą tekstą
            </p>
          </section>
        )}

        {/* Social Preview */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Peržiūra</h2>
          <div ref={previewRef}>
            <SocialPreview
              imageUrl={displayImageUrl}
              text={generatedText}
            />
          </div>
        </section>

        {/* Save Post Button - only for authenticated users with generated content */}
        {user && generatedText && (
          <section className="mb-6">
            <SavePostButton
              text={generatedText}
              imageUrl={imageUrl || undefined}
              config={{
                industry: industry,
                topic: prompt,
                tone: config.tone,
                length: config.length === 'short' ? 100 : config.length === 'medium' ? 200 : 300,
                emoji: config.emoji === 'no' ? false : true,
                imageStyle: imageSource === 'ai' ? 'ai-generated' : undefined,
              }}
              onSaved={(postId) => {
                console.log('Post saved:', postId);
                toast.success('Įrašas sėkmingai išsaugotas!');
              }}
            />
          </section>
        )}

        {/* Sign-in prompt for unauthenticated users */}
        {!user && generatedText && (
          <section className="mb-6">
            <div className="p-4 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 text-center">
              <p className="text-sm">
                Prisijunkite, kad išsaugotumėte įrašą į savo istoriją
              </p>
            </div>
          </section>
        )}

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
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
        <div className="max-w-2xl mx-auto space-y-3">
          <ActionButtons
            onCopy={handleCopy}
            onRegenerateText={handleRegenerateText}
            onRegenerateImage={handleRegenerateImage}
            canCopy={!!generatedText && !isLoading}
            canRegenerateText={!!prompt.trim()}
            canRegenerateImage={!!(generatedText.trim() || prompt.trim())}
            isLoadingText={isLoading}
            isLoadingImage={isGeneratingImage}
          />
          <DownloadButton
            previewRef={previewRef}
            imageUrl={displayImageUrl}
            industry={industry}
            disabled={isLoading || isGeneratingImage || (!generatedText && !displayImageUrl)}
          />
        </div>
      </div>
    </main>
  );
}
