# Phase 3: Image & Preview - Research

**Researched:** 2026-01-26
**Domain:** File upload, image generation, social media preview, browser image export
**Confidence:** HIGH

## Summary

Phase 3 involves implementing image upload (drag-drop + file picker), AI image generation with DALL-E, social media preview components for Facebook and Instagram, and browser-based image download functionality. The research reveals a mature ecosystem for file uploads in React/Next.js with several well-maintained libraries, proven patterns for image handling, and specific considerations for mobile responsiveness.

The standard approach uses `react-dropzone` for file uploads (drag-drop + validation), OpenAI's DALL-E 3 API for AI generation, custom React components for platform previews (avoiding external mockup dependencies), and native Canvas API for image downloads. The key architectural decision is keeping image processing entirely client-side (using FileReader for previews, Canvas for exports) to minimize server load and enable instant feedback.

**Primary recommendation:** Use react-dropzone for upload UI, implement server-side DALL-E generation via Next.js Edge Functions, build custom lightweight preview components styled to match Facebook/Instagram aesthetics, and use native Canvas API with toBlob() for downloads. Avoid html2canvas for production use due to performance issues - prefer html-to-image for DOM-to-image conversion.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-dropzone | 14.x | File upload UI with drag-drop | Most popular React file upload library (2.3M+ weekly downloads), built-in validation, mobile-friendly, TypeScript support |
| @ai-sdk/openai | 3.x | DALL-E 3 integration | Already in project, official OpenAI SDK with streaming support |
| html-to-image | 1.11+ | DOM to image conversion | Better performance than html2canvas, actively maintained, handles complex layouts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | 2.x | Upload error notifications | Already in project for user feedback |
| Native FileReader API | Browser built-in | Image preview generation | No library needed for base64 preview |
| Native Canvas API | Browser built-in | Image download functionality | Built-in toBlob() and toDataURL() methods |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-dropzone | Custom drag-drop implementation | More control but requires handling touch events, validation, and cross-browser quirks manually |
| html-to-image | html2canvas | html2canvas is more popular but has known performance issues and author advises against production use |
| DALL-E 3 | DALL-E 2 | DALL-E 2 is cheaper but deprecated (ends May 12, 2026), lower quality results |
| Custom previews | External mockup services | Services like Planable require API calls, slower, less customizable |

**Installation:**
```bash
npm install react-dropzone html-to-image
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── components/
│   ├── ImageUpload.tsx         # Drag-drop upload component
│   ├── ImagePreview.tsx        # Uploaded image display with remove
│   ├── SocialPreview.tsx       # Parent preview component
│   ├── FacebookPreview.tsx     # Facebook mock UI
│   ├── InstagramPreview.tsx    # Instagram mock UI
│   └── DownloadButton.tsx      # Image/preview export
├── api/
│   └── generate-image/
│       └── route.ts            # DALL-E API endpoint (Edge Function)
└── lib/
    └── image-utils.ts          # Canvas helpers, validation
```

### Pattern 1: Client-Side Upload with Validation
**What:** Handle file upload entirely on client, validate before showing preview
**When to use:** For immediate user feedback without server roundtrip
**Example:**
```typescript
// Source: react-dropzone GitHub examples
import { useDropzone } from 'react-dropzone';
import { useState } from 'react';

function ImageUpload({ onImageSelect }: { onImageSelect: (file: File) => void }) {
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    onDrop: (acceptedFiles, rejectedFiles) => {
      setError(null);
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('Failas per didelis (maks. 5MB)');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('Netinkamas formato (JPG, PNG, WebP)');
        }
        return;
      }
      if (acceptedFiles[0]) {
        onImageSelect(acceptedFiles[0]);
      }
    }
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Paleiskite failą čia...</p>
      ) : (
        <p>Nutempkite paveikslėlį arba paspauskite pasirinkti</p>
      )}
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
}
```

### Pattern 2: FileReader for Image Preview
**What:** Convert uploaded File to base64 data URL for immediate preview
**When to use:** After file validation passes, before any server upload
**Example:**
```typescript
// Source: MDN FileReader documentation
function useImagePreview(file: File | null) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);

    // Cleanup: revoke object URL to prevent memory leak
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [file]);

  return preview;
}
```

### Pattern 3: DALL-E Generation via Edge Function
**What:** Server-side image generation with OpenAI API
**When to use:** When user selects "Generate AI image" option
**Example:**
```typescript
// app/api/generate-image/route.ts
import { openai } from '@ai-sdk/openai';

export const runtime = 'edge';
export const maxDuration = 25;

export async function POST(request: Request) {
  const { prompt, industry } = await request.json();

  // Validate inputs
  if (!prompt || !industry) {
    return Response.json(
      { error: 'Missing prompt or industry' },
      { status: 400 }
    );
  }

  try {
    // DALL-E 3 API call
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt: `${prompt} for ${industry} business, professional, high-quality`,
      size: '1024x1024',
      quality: 'standard', // or 'hd' for better quality at 2x cost
      style: 'natural', // or 'vivid' for dramatic images
      n: 1
    });

    return Response.json({
      imageUrl: response.data[0].url,
      revisedPrompt: response.data[0].revised_prompt
    });
  } catch (error) {
    console.error('DALL-E generation error:', error);
    return Response.json(
      { error: 'Image generation failed' },
      { status: 500 }
    );
  }
}
```

### Pattern 4: Social Media Preview Components
**What:** Custom components mimicking Facebook/Instagram UI without exact replication
**When to use:** For showing how post will appear on platforms
**Example:**
```typescript
// Simplified mock style - recognizable but not exact UI copy
interface PreviewProps {
  imageUrl: string;
  text: string;
  viewMode: 'mobile' | 'desktop';
}

function FacebookPreview({ imageUrl, text, viewMode }: PreviewProps) {
  const isMobile = viewMode === 'mobile';

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${
      isMobile ? 'max-w-sm' : 'max-w-xl'
    }`}>
      {/* Minimal header - no profile info per CONTEXT.md */}
      <div className="px-4 py-3 border-b">
        <span className="text-gray-400 text-sm">Facebook įrašas</span>
      </div>

      {/* Text content */}
      <div className="px-4 py-3">
        <p className="whitespace-pre-wrap">{text}</p>
      </div>

      {/* Image */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post image"
          className="w-full"
        />
      )}
    </div>
  );
}

function InstagramPreview({ imageUrl, text, viewMode }: PreviewProps) {
  const isMobile = viewMode === 'mobile';

  return (
    <div className={`bg-white border rounded-lg overflow-hidden ${
      isMobile ? 'max-w-sm' : 'max-w-lg'
    }`}>
      <div className="px-3 py-2 border-b">
        <span className="text-gray-400 text-sm">Instagram įrašas</span>
      </div>

      {/* Image first (Instagram style) */}
      {imageUrl && (
        <img
          src={imageUrl}
          alt="Post image"
          className="w-full aspect-square object-cover"
        />
      )}

      {/* Caption */}
      <div className="px-3 py-3">
        <p className="text-sm whitespace-pre-wrap">{text}</p>
      </div>
    </div>
  );
}
```

### Pattern 5: Canvas-Based Image Download
**What:** Convert DOM element or image to downloadable file
**When to use:** For exporting generated image or preview as PNG/JPEG
**Example:**
```typescript
// Source: MDN Canvas API + html-to-image
import { toPng, toJpeg } from 'html-to-image';

async function downloadPreview(
  elementRef: HTMLElement,
  filename: string,
  format: 'png' | 'jpeg'
) {
  try {
    const dataUrl = format === 'png'
      ? await toPng(elementRef, { quality: 1.0 })
      : await toJpeg(elementRef, { quality: 0.95 });

    // Create download link
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Download failed:', error);
    throw new Error('Nepavyko atsisiųsti paveikslėlio');
  }
}

// For direct image download (not DOM element)
function downloadImage(imageUrl: string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = imageUrl;
  link.click();
}
```

### Anti-Patterns to Avoid

- **Storing base64 images in state for large files:** Base64 is 33% larger than binary. Use object URLs (URL.createObjectURL) for preview, store File object
- **Not cleaning up object URLs:** Always call URL.revokeObjectURL() in useEffect cleanup to prevent memory leaks
- **Using html2canvas in production:** Known performance issues, experimental status, slower than alternatives
- **Uploading images to server unnecessarily:** For preview-only features, keep images client-side
- **Forgetting mobile touch support:** react-dropzone handles this, but custom implementations need touch event polyfills
- **Not validating file types on client AND server:** Client validation for UX, server validation for security

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Drag & drop file upload | Custom event handlers for drag/drop/click | react-dropzone | Cross-browser compatibility, touch device support, built-in validation, accessibility |
| File type validation | String manipulation on filename | react-dropzone accept prop with MIME types | MIME type checking is more reliable than extension checking, handles edge cases |
| Image preview from File | Canvas manipulation | FileReader.readAsDataURL() | Native browser API, simpler, no canvas needed |
| DOM to image conversion | Manual canvas rendering | html-to-image library | Handles CSS, layout, fonts, images correctly; very complex to implement |
| Touch device drag-drop | Custom touch event handlers | react-dropzone or @dragdroptouch/drag-drop-touch polyfill | Touch events don't map to mouse events, requires complex polyfill |
| Image download | Complex blob manipulation | Canvas toBlob() + anchor tag click | Native browser support, simpler code, better performance |

**Key insight:** File handling and image manipulation have numerous edge cases (CORS, memory management, browser compatibility, mobile touch, MIME types) that are better solved by well-tested libraries than custom implementations. The only exception is the preview components themselves - building custom is better than depending on external mockup services for performance and customization.

## Common Pitfalls

### Pitfall 1: Memory Leaks with Image Previews
**What goes wrong:** Not revoking blob URLs or cleaning up FileReader instances causes memory to accumulate, especially when users upload multiple images or regenerate frequently.
**Why it happens:** Object URLs persist in memory until explicitly revoked with URL.revokeObjectURL(). FileReader instances hold references to file data.
**How to avoid:**
- Always include cleanup in useEffect return function
- Revoke URLs when component unmounts or file changes
- Use weak references where possible
**Warning signs:**
- Browser memory usage grows with each upload/preview
- Performance degradation after multiple uploads
- DevTools memory profiler shows retained object URLs

**Example:**
```typescript
useEffect(() => {
  if (!file) return;

  const objectUrl = URL.createObjectURL(file);
  setPreview(objectUrl);

  // CRITICAL: Cleanup
  return () => {
    URL.revokeObjectURL(objectUrl);
  };
}, [file]);
```

### Pitfall 2: MIME Type Validation Inconsistency
**What goes wrong:** File.type returns different MIME types for same file format across operating systems (e.g., CSV is "text/plain" on macOS, "application/vnd.ms-excel" on Windows).
**Why it happens:** MIME type determination depends on OS file type associations, not just file extension.
**How to avoid:**
- Use both MIME type and extension validation
- For react-dropzone, specify both in accept object: `{ 'image/jpeg': ['.jpg', '.jpeg'] }`
- Add server-side validation as backup (check magic bytes)
**Warning signs:**
- Users report "invalid file type" for valid images
- Validation works on developer machine but fails for users
- Same file accepted on one OS, rejected on another

### Pitfall 3: html2canvas Performance in Production
**What goes wrong:** Preview screenshot generation takes 5-20+ seconds for complex layouts, causing timeouts and user frustration.
**Why it happens:** html2canvas renders DOM procedurally to canvas, processing every style rule and element. Performance degrades with DOM complexity (~8s for 883 nodes, ~66s for 2660 nodes).
**How to avoid:**
- Use html-to-image instead (3x faster, uses SVG foreignObject)
- Keep preview DOM simple (fewer nested elements, simpler CSS)
- Show loading indicator during conversion
- Consider server-side screenshot as alternative (Puppeteer)
**Warning signs:**
- Download button "hangs" for several seconds
- Users report app freezing during download
- Performance issues worsen in Chrome 138+ (known regression)

### Pitfall 4: Mobile Drag-Drop Not Working
**What goes wrong:** Drag-drop works on desktop but completely fails on mobile/tablet devices.
**Why it happens:** HTML5 drag-drop API expects mouse events (drag, dragover, drop), but mobile uses touch events (touchstart, touchmove, touchend) which don't trigger drag events.
**How to avoid:**
- Use react-dropzone (handles touch automatically in newer versions)
- Or add @dragdroptouch/drag-drop-touch polyfill
- Always provide click-to-upload as alternative
- Test on actual mobile devices, not just browser DevTools
**Warning signs:**
- Feature works in desktop browser mobile simulation but not real devices
- No visual feedback when user drags file on mobile
- Users report "upload button doesn't work" (actually drag-drop that's broken)

### Pitfall 5: DALL-E API Costs and Rate Limits
**What goes wrong:** Unexpected API costs or generation failures due to rate limits, especially during testing or high traffic.
**Why it happens:** DALL-E 3 costs $0.04-0.12 per image. No built-in rate limiting by OpenAI for individual users. Standard quality is default but HD costs 2x.
**How to avoid:**
- Implement user-level rate limiting (similar to text generation)
- Add loading states to prevent double-clicks
- Default to "standard" quality unless user explicitly selects HD
- Consider caching generated images if prompt is similar
- Monitor costs via OpenAI dashboard
- Note: DALL-E 3 deprecated May 12, 2026 - plan migration to gpt-image-1
**Warning signs:**
- API bill higher than expected
- Users can spam generate button
- No indication of cost to user
- Generation failures during high traffic

### Pitfall 6: Base64 Image State Performance
**What goes wrong:** App becomes sluggish when storing large base64 image strings in React state.
**Why it happens:** Base64 encoding increases file size by ~33%, and storing in state triggers re-renders with large string comparisons.
**How to avoid:**
- Store File object in state, not base64 string
- Generate preview URL on-demand or in useEffect
- Use object URLs (URL.createObjectURL) instead of base64 for preview
- Only convert to base64 when actually needed (e.g., for API payload)
**Warning signs:**
- Typing in form becomes laggy after image upload
- React DevTools shows large state objects
- Re-renders take longer after image upload

### Pitfall 7: Cross-Origin Image Loading for Canvas
**What goes wrong:** Canvas download fails with "Tainted canvas may not be exported" error when preview includes external images (e.g., DALL-E generated image URLs).
**Why it happens:** Canvas security prevents exporting canvas that contains cross-origin images without CORS headers.
**How to avoid:**
- Ensure DALL-E image URLs include CORS headers (OpenAI provides this)
- Set crossOrigin="anonymous" on img tags used in preview
- For user uploads, use object URLs (same origin)
- Test download feature, don't assume it works
**Warning signs:**
- Download works with user-uploaded images but fails with AI-generated
- Console shows CORS or "tainted canvas" errors
- Preview displays fine but download throws security error

## Code Examples

Verified patterns from official sources:

### File Upload with Validation
```typescript
// Source: react-dropzone official examples
import { useDropzone } from 'react-dropzone';
import { useCallback } from 'react';
import toast from 'react-hot-toast';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  currentImage?: string;
}

function ImageUpload({ onImageSelect, currentImage }: ImageUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Handle rejections with toast notifications
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        toast.error('Failas per didelis. Maksimalus dydis: 5MB');
      } else if (error.code === 'file-invalid-type') {
        toast.error('Netinkamas formato. Naudokite JPG, PNG arba WebP');
      } else {
        toast.error('Klaida įkeliant paveikslėlį');
      }
      return;
    }

    // Success
    if (acceptedFiles[0]) {
      onImageSelect(acceptedFiles[0]);
      toast.success('Paveikslėlis įkeltas');
    }
  }, [onImageSelect]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    multiple: false
  });

  return (
    <div>
      {!currentImage ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
            isDragActive
              ? 'border-blue-500 bg-blue-50'
              : isDragReject
              ? 'border-red-500 bg-red-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Paleiskite failą čia...'
              : 'Nutempkite paveikslėlį arba paspauskite pasirinkti'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            JPG, PNG, WebP iki 5MB
          </p>
        </div>
      ) : (
        <div className="relative">
          <img
            src={currentImage}
            alt="Preview"
            className="rounded-lg max-h-64 mx-auto"
          />
          <button
            onClick={() => onImageSelect(null as any)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
```

### DALL-E Image Generation Client Hook
```typescript
// Client-side hook for calling DALL-E API
import { useState } from 'react';
import toast from 'react-hot-toast';

interface GenerateImageOptions {
  industry: string;
  prompt: string;
  quality?: 'standard' | 'hd';
}

interface GenerateImageResult {
  imageUrl: string;
  revisedPrompt?: string;
}

export function useImageGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async (options: GenerateImageOptions): Promise<GenerateImageResult | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Generation failed');
      }

      const result = await response.json();
      toast.success('Paveikslėlis sugeneruotas');
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Generavimo klaida';
      setError(message);
      toast.error(message);
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateImage, isGenerating, error };
}
```

### Download with Format Selection
```typescript
// Source: html-to-image + MDN Canvas API
import { toPng, toJpeg } from 'html-to-image';
import toast from 'react-hot-toast';

interface DownloadOptions {
  element: HTMLElement;
  filename: string;
  format: 'png' | 'jpeg';
  industry?: string; // for filename generation
}

export async function downloadAsImage({
  element,
  filename,
  format,
  industry
}: DownloadOptions) {
  try {
    // Generate filename with industry
    const fullFilename = industry
      ? `${industry}-${filename}.${format}`
      : `${filename}.${format}`;

    // Convert element to image
    const dataUrl = format === 'png'
      ? await toPng(element, {
          quality: 1.0,
          pixelRatio: 2 // 2x for better quality
        })
      : await toJpeg(element, {
          quality: 0.95,
          pixelRatio: 2
        });

    // Trigger download
    const link = document.createElement('a');
    link.download = fullFilename;
    link.href = dataUrl;
    link.click();

    toast.success('Paveikslėlis atsisiųstas');
  } catch (error) {
    console.error('Download failed:', error);
    toast.error('Nepavyko atsisiųsti paveikslėlio');
    throw error;
  }
}

// For downloading raw images (not DOM elements)
export function downloadRawImage(imageUrl: string, filename: string, format: 'png' | 'jpeg') {
  const link = document.createElement('a');
  link.download = `${filename}.${format}`;
  link.href = imageUrl;
  link.click();
  toast.success('Paveikslėlis atsisiųstas');
}
```

### Toggle Preview Component
```typescript
// Mobile/Desktop toggle with state management
import { useState } from 'react';

type ViewMode = 'mobile' | 'desktop';

interface PreviewToggleProps {
  imageUrl: string | null;
  text: string;
  platform: 'facebook' | 'instagram';
}

function PreviewWithToggle({ imageUrl, text, platform }: PreviewToggleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('mobile');

  return (
    <div className="space-y-4">
      {/* Toggle tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setViewMode('mobile')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'mobile'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Mobilus
        </button>
        <button
          onClick={() => setViewMode('desktop')}
          className={`px-4 py-2 font-medium transition-colors ${
            viewMode === 'desktop'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Kompiuteris
        </button>
      </div>

      {/* Preview */}
      <div className="flex justify-center">
        {platform === 'facebook' ? (
          <FacebookPreview
            imageUrl={imageUrl}
            text={text}
            viewMode={viewMode}
          />
        ) : (
          <InstagramPreview
            imageUrl={imageUrl}
            text={text}
            viewMode={viewMode}
          />
        )}
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| DALL-E 2 | DALL-E 3 → gpt-image-1 | DALL-E 3 in 2023, gpt-image-1 in 2025 | Better quality, higher cost, DALL-E 2/3 deprecated May 2026 |
| html2canvas | html-to-image | 2021-2023 | 3x faster, better CSS support, actively maintained |
| Server-side image processing | Client-side FileReader + Canvas | 2018-2020 | Reduced server load, instant preview, better UX |
| Traditional form upload | Drag-drop with react-dropzone | 2016-2019 | Better mobile support, modern UX expectations |
| Class components with refs | Hooks (useDropzone, useEffect) | 2019 (React 16.8) | Cleaner code, better composition, modern React patterns |
| Server Actions for upload | Client-side with FormData API | Next.js 15 (2024) | Server Actions available but client-side still preferred for instant feedback |
| Separate mobile/desktop views | Responsive single view | 2023-2024 | Simpler code, but CONTEXT.md requires toggle for this project |

**Deprecated/outdated:**
- **html2canvas for production**: Author warns against production use, known performance issues
- **DALL-E 2 API**: Still works but deprecated May 12, 2026 - use DALL-E 3 or gpt-image-1
- **File upload to server for preview**: Modern apps preview client-side with FileReader
- **jQuery file upload plugins**: React ecosystem has mature, maintained solutions

## Open Questions

Things that couldn't be fully resolved:

1. **DALL-E 3 Multilingual Performance with Lithuanian**
   - What we know: DALL-E 3 accepts Lithuanian prompts, applies cultural influence based on training data
   - What's unclear: Whether Lithuanian prompts produce quality comparable to English for business/service imagery
   - Recommendation: Start with English prompts for image generation, translate user input if needed. Test Lithuanian prompts in development to assess quality. Consider hybrid approach: English structure + Lithuanian cultural terms.

2. **html-to-image Cross-Origin Image Support**
   - What we know: html-to-image handles CORS better than html2canvas, DALL-E URLs include CORS headers
   - What's unclear: Whether OpenAI's image URLs remain accessible long-term for download feature (they're temporary)
   - Recommendation: Test download feature with both uploaded images and DALL-E generated images. Consider caching DALL-E images to own CDN if long-term availability is needed. Add error handling for expired URLs.

3. **Mobile Touch Performance with Large Images**
   - What we know: react-dropzone supports touch, FileReader works on mobile, Canvas API available
   - What's unclear: Performance impact of html-to-image on mobile devices with complex preview DOM
   - Recommendation: Test on actual mid-range Android/iOS devices (not just Chrome DevTools). Implement loading indicator for download. Consider simplified mobile preview if performance is poor.

4. **Rate Limiting Strategy for Image Generation**
   - What we know: DALL-E 3 costs $0.04-0.12 per image, text generation has Upstash rate limit
   - What's unclear: Should image generation share same limit or have separate limit? What's reasonable limit for Lithuanian small business use case?
   - Recommendation: Start with same Upstash rate limit (50/day) for combined text+image generation. Monitor usage patterns. Consider separate, lower limit for images (e.g., 10/day) if costs are high.

5. **Preview Component Fidelity vs Legal Risk**
   - What we know: CONTEXT.md says "simplified mock style - recognizable as FB/IG but stylized, not exact UI copy"
   - What's unclear: Exact line between "recognizable" and potential trademark issues
   - Recommendation: Use generic colors (not exact Facebook blue/Instagram gradient), avoid logos, keep minimal layout. Add disclaimer text "Pavyzdys - ne tikras Facebook/Instagram vaizdas" (Example - not actual Facebook/Instagram view).

## Sources

### Primary (HIGH confidence)
- [react-dropzone GitHub repository](https://github.com/react-dropzone/react-dropzone) - Official documentation, examples, API reference
- [MDN FileReader API](https://developer.mozilla.org/en-US/docs/Web/API/FileReader) - Official browser API documentation
- [MDN Canvas API toDataURL](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) - Official canvas export documentation
- [MDN Canvas API toBlob](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob) - Official blob export documentation
- [OpenAI Platform DALL-E 3 Model](https://platform.openai.com/docs/models/dall-e-3) - Official API specifications
- [html-to-image GitHub](https://github.com/bubkoo/html-to-image) - Official documentation and examples
- [Next.js Edge Runtime Documentation](https://nextjs.org/docs/pages/api-reference/edge) - Official Next.js documentation

### Secondary (MEDIUM confidence)
- [LogRocket: Using FileReader API to preview images in React](https://blog.logrocket.com/using-filereader-api-preview-images-react/) - Verified implementation patterns
- [LogRocket: Export React components as images using html2canvas](https://blog.logrocket.com/export-react-components-as-images-html2canvas/) - Comparison of html2canvas vs alternatives
- [Complete Guide to File Uploads in Next.js 15](https://javascript.plainenglish.io/complete-guide-to-file-uploads-in-next-js-7dadf6b42b72) - Recent Next.js 15 patterns verified against official docs
- [Top 5 Drag-and-Drop Libraries for React in 2026](https://puckeditor.com/blog/top-5-drag-and-drop-libraries-for-react) - Ecosystem comparison
- [React Memory Leaks in 2026](https://rajuhemanth456.medium.com/memory-leaks-in-react-and-next-js-what-nobody-tells-you-%EF%B8%8F-eeb912a2b183) - Recent patterns for avoiding leaks
- [Strapi: Next.js 15 File Upload with Server Actions](https://strapi.io/blog/epic-next-js-15-tutorial-part-5-file-upload-using-server-actions) - Server Actions comparison

### Tertiary (LOW confidence - marked for validation)
- [Social Media Mockup Generators comparison](https://planable.io/blog/social-media-mockups/) - Feature comparison for mockup services
- [Multilingual Prompting in DALL-E 3](https://medium.com/@alexcarltully/multilingual-prompting-in-dall-e-3-867b9e5ffc80) - Community experiments, needs validation
- [html2canvas production issues discussion](https://github.com/niklasvh/html2canvas/issues/1250) - Community reports, not official

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-dropzone and html-to-image verified through official repos and multiple sources, DALL-E 3 specs from OpenAI documentation
- Architecture: HIGH - FileReader, Canvas API from MDN official docs; react-dropzone patterns from official examples; DALL-E integration verified in OpenAI docs
- Pitfalls: HIGH for memory leaks (MDN + multiple React sources), MEDIUM for html2canvas issues (GitHub issues + community reports), HIGH for MIME type issues (react-dropzone official issues)
- Mobile support: MEDIUM - React-dropzone claims touch support but specific testing recommended
- Lithuanian prompting: LOW - Limited specific research on Lithuanian, relies on general multilingual DALL-E findings

**Research date:** 2026-01-26
**Valid until:** 2026-02-26 (30 days) - Note: DALL-E 3 deprecation May 12, 2026 affects long-term validity

**Key risks:**
1. DALL-E 3 deprecation in ~3.5 months - migration to gpt-image-1 may be needed mid-project
2. html-to-image performance on mobile devices needs real-device testing
3. Lithuanian prompt quality needs validation during development
4. Image generation costs need monitoring - could exceed budget if not rate-limited
