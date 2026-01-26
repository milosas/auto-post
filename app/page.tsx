'use client';

import { useState, useRef } from 'react';
import { IndustryAutocomplete } from './components/IndustryAutocomplete';
import { PostConfiguration, PostConfigurationValues } from './components/PostConfiguration';
import { StreamingDisplay } from './components/StreamingDisplay';
import { ActionButtons } from './components/ActionButtons';
import { ImageSource } from './components/ImageSource';
import { ImageUpload } from './components/ImageUpload';
import { SocialPreview } from './components/SocialPreview';
import { DownloadButton } from './components/DownloadButton';
import { GenerationOptions } from './components/GenerationOptions';
import { useLocalStorage } from './lib/useLocalStorage';
import { useImagePreview } from './lib/image-utils';
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
  const [imageSource, setImageSource] = useState<'upload' | 'ai'>('upload');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generateText, setGenerateText] = useState(true);
  const [generateImage, setGenerateImage] = useState(true);
  const [generatedText, setGeneratedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // Image preview from uploaded file
  const uploadedImagePreview = useImagePreview(imageFile);
  const displayImageUrl = imageSource === 'upload' ? uploadedImagePreview : imageUrl;

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

  const handleRegenerate = () => {
    handleGenerate();
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
          <button
            onClick={handleGenerate}
            disabled={isLoading || isGeneratingImage}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || isGeneratingImage ? 'Generuojama...' : 'Generuoti įrašą'}
          </button>
        </section>

        {/* Generated Text Display */}
        <section className="mb-6">
          <h2 className="text-lg font-medium mb-3">Sugeneruotas tekstas</h2>
          <StreamingDisplay text={generatedText} isLoading={isLoading} />
        </section>

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
            onRegenerate={handleRegenerate}
            canCopy={!!generatedText && !isLoading}
            canRegenerate={!!generatedText}
            isLoading={isLoading || isGeneratingImage}
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
