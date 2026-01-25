# Technology Stack

**Project:** Social Media Post Generator for Lithuanian Service Providers
**Researched:** 2026-01-25
**Overall Confidence:** HIGH

## Recommended Stack

### Core Framework (Already Decided)

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| React | 18.3+ | UI framework | Industry standard for SPAs, excellent ecosystem, component reusability | HIGH |
| Vite | 6.x | Build tool | Fast HMR, optimized production builds via Rollup, modern ES modules | HIGH |
| Tailwind CSS | 3.4+ | Styling | Rapid UI development, consistent design system, small production bundle | HIGH |
| TypeScript | 5.7+ | Type safety | Catch errors early, better DX, essential for maintainability | HIGH |

**Rationale for Vite over Next.js:** Since this is a single-page app with no auth and serverless API routes on Vercel, Vite provides faster development experience without the overhead of Next.js SSR/SSG features. For image optimization (which Next.js excels at), we'll use dedicated libraries since we're generating images programmatically, not serving static assets.

### Backend & Deployment (Already Decided)

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| Vercel | Latest | Hosting & serverless | Zero-config deployment, edge network, serverless functions for API routes | HIGH |
| Vercel Serverless Functions | N/A | API routes | Handle OpenAI API calls server-side to protect API keys | HIGH |

**Security Note:** API keys MUST be stored as Vercel environment variables (OPENAI_API_KEY, KIE_API_KEY) and accessed only in serverless functions, never exposed to client.

### AI Integration (Already Decided + Optimizations)

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| Vercel AI SDK | 6.0.49 | AI integration framework | Unified API for LLMs, streaming support, OpenAI integration, provider switching | HIGH |
| @ai-sdk/openai | 3.0.18 | OpenAI provider | Official Vercel AI SDK provider for OpenAI models | HIGH |
| kie.ai proxy | N/A | Cost optimization | 30-50% lower API costs vs direct OpenAI, same API interface | MEDIUM |

**Implementation Strategy:**
1. Use Vercel AI SDK with @ai-sdk/openai provider for OpenAI integration
2. Configure kie.ai as OpenAI-compatible proxy endpoint via AI SDK's `baseURL` option
3. Streaming response support for better UX during text generation
4. Switch between kie.ai and direct OpenAI with single environment variable change

**Why Vercel AI SDK over direct OpenAI SDK:**
- Streaming responses work seamlessly with React components
- Provider-agnostic (easy to switch from OpenAI to Anthropic/Google if needed)
- Built-in error handling and retry logic
- Better DX with React hooks (useChat, useCompletion)
- Designed specifically for Vercel serverless functions

**Lithuanian Language Support:** GPT-4 and GPT-4o models support Lithuanian natively. For best results, include explicit instruction in system prompt: "Respond in Lithuanian only" or "Atsakyk tik lietuviškai".

**DALL-E 3 Consideration:** OpenAI is deprecating DALL-E 3 on May 12, 2026. The project should plan migration to GPT-Image-1 (ChatGPT-4o's native image generation) before this date. Kie.ai already supports GPT-Image-1 at 40-80% lower cost than DALL-E 3.

### State Management

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| Zustand | 5.0.10 | Global state | Lightweight (1.2kb), no boilerplate, prevents Context re-render issues, hooks-first API | HIGH |
| @tanstack/react-query | 5.90.20 | Server state | Cache AI responses, handle loading/error states, retry logic, request deduplication | HIGH |

**Why Zustand over Context API:**
- Context API causes entire tree re-renders on any state change
- Zustand allows granular subscriptions (only re-render components using changed state)
- For this app: store UI state (selected template, current step, form data) in Zustand
- Perfect for 60-second generation requirement (minimal re-renders = faster UI)

**Why TanStack Query:**
- Server state (AI responses, image generation) is different from UI state
- Automatic caching prevents redundant API calls (save costs)
- Built-in retry logic for flaky AI API responses
- Loading/error states handled declaratively
- Request deduplication (if user clicks generate twice, only one API call)

**Architecture Pattern:**
```
Zustand → Client state (form inputs, UI state, selected options)
TanStack Query → Server state (AI responses, image URLs, API calls)
```

### Form Management

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| React Hook Form | 7.71.1 | Form handling | Minimal re-renders, built-in validation, tiny bundle (8.5kb), excellent TypeScript support | HIGH |

**Why React Hook Form:**
- Uncontrolled components by default (fewer re-renders = faster 60-second flow)
- Built-in validation with schema support (use with Zod for type-safe validation)
- Perfect for multi-step forms (remember values across steps without full re-renders)
- DevTools for debugging form state

**Alternative Considered:** Native HTML5 validation. Rejected because React Hook Form provides better UX (inline errors, async validation for AI-generated suggestions), better DX (TypeScript integration), and better performance (uncontrolled inputs).

### Image Generation & Export

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| html-to-image | 1.11.13 | DOM to image export | Modern fork of dom-to-image, 1.6M monthly downloads, supports PNG/JPEG/SVG, active maintenance | HIGH |
| @hugocxl/react-to-image | Latest | React wrapper | React-specific hooks for html-to-image, simplified API for component export | MEDIUM |

**Why html-to-image over html2canvas:**
- html-to-image: Uses SVG foreignObject (cleaner, better text rendering)
- html2canvas: Uses canvas painting (can have text rendering artifacts)
- html-to-image: Better maintained (2025 updates), smaller bundle
- html-to-image: Multiple output formats (PNG, JPEG, SVG) with one API

**Implementation Strategy:**
1. User designs post in React components (styled with Tailwind)
2. Preview rendered in browser (live preview)
3. Export button triggers html-to-image
4. Generated image downloaded as PNG (optimal for Facebook/Instagram)
5. Resolution: 1080x1080px (Instagram square) or 1200x630px (Facebook optimal)

**Lithuanian Font Consideration:** Use Google Fonts with `latin-ext` subset to support Lithuanian characters (ą, č, ę, ė, į, š, ų, ū, ž). Recommended fonts: Inter, Roboto, Open Sans (all support extended Latin).

### UI Components & Icons

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| Headless UI | 2.2+ | Accessible UI primitives | Official Tailwind Labs library, fully accessible, unstyled (style with Tailwind) | HIGH |
| react-icons | 5.5.0 | Icon library | 60+ icon packs in one package, tree-shakeable, includes Font Awesome, Material, Heroicons | HIGH |
| clsx | 2.1.1 | Conditional classes | Tiny utility (300B) for dynamic Tailwind classes, better than template literals | HIGH |

**Why Headless UI:**
- Built by Tailwind Labs (perfect integration)
- Fully accessible (ARIA, keyboard navigation)
- Unstyled (complete control with Tailwind)
- Modals, dropdowns, tabs for multi-step wizard

**Why react-icons:**
- All icon libraries in one package (Font Awesome, Material Icons, Heroicons)
- Tree-shakeable (only bundle icons you use)
- Consistent API across all icon sets
- 5.5.0 is latest stable (2025)

### Error Handling & Loading States

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| react-error-boundary | 4.1+ | Error boundaries | Declarative error handling, TypeScript support, fallback UI for failed AI calls | HIGH |
| React Suspense | Built-in | Loading states | Native React 18 feature, coordinate loading UI, works with TanStack Query | HIGH |

**Pattern for AI Calls:**
```jsx
<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<LoadingSpinner />}>
    <AIGeneratedContent />
  </Suspense>
</ErrorBoundary>
```

**Why This Matters:**
- AI APIs can fail (rate limits, network issues, service outages)
- Users need clear feedback (not cryptic errors)
- Suspense + Error Boundary = declarative async UI
- React 19 enhances Suspense with better streaming support (future-proof)

### Development Tools

| Technology | Version | Purpose | Rationale | Confidence |
|------------|---------|---------|-----------|------------|
| ESLint | 9.x | Linting | Catch bugs, enforce code style, React best practices | HIGH |
| Prettier | 3.x | Code formatting | Consistent formatting, auto-format on save | HIGH |
| @vitejs/plugin-react-swc | Latest | Fast refresh | SWC (Rust) compiler for faster HMR than Babel | HIGH |

**Why SWC over Babel:**
- 20x faster compilation
- Vite 6.x defaults to SWC
- Same features as Babel for React (JSX transform, fast refresh)
- Lower CPU usage during development

## Installation Commands

### Core Dependencies
```bash
npm install react react-dom
npm install ai @ai-sdk/openai
npm install zustand @tanstack/react-query
npm install react-hook-form
npm install html-to-image
npm install @headlessui/react react-icons clsx
npm install react-error-boundary
```

### Dev Dependencies
```bash
npm install -D vite @vitejs/plugin-react-swc
npm install -D typescript @types/react @types/react-dom
npm install -D tailwindcss postcss autoprefixer
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
npm install -D prettier prettier-plugin-tailwindcss
```

## Environment Variables

Create `.env.local` for development:
```bash
# OpenAI API (via kie.ai proxy)
VITE_KIE_API_KEY=your_kie_api_key_here

# Direct OpenAI (fallback)
VITE_OPENAI_API_KEY=your_openai_api_key_here

# API Base URL (switch between kie.ai and OpenAI)
VITE_OPENAI_BASE_URL=https://kie.ai/v1
```

**Production (Vercel):**
- Set environment variables in Vercel dashboard
- Use serverless functions to proxy API calls (never expose keys to client)
- Variables: `KIE_API_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL`

## Alternatives Considered

| Category | Recommended | Alternative | Why Not Alternative |
|----------|-------------|-------------|---------------------|
| Build tool | Vite | Next.js | Overkill for SPA, SSR not needed, slower DX |
| State mgmt | Zustand | Redux Toolkit | Too much boilerplate, overkill for simple app |
| State mgmt | Zustand | Context API | Context causes full tree re-renders, poor performance |
| Forms | React Hook Form | Formik | Formik has more re-renders, larger bundle, less active |
| Image export | html-to-image | html2canvas | html2canvas has text rendering issues, less maintained |
| AI SDK | Vercel AI SDK | OpenAI SDK | Vercel SDK has streaming, provider abstraction, better React DX |
| Icons | react-icons | Individual packages | react-icons consolidates all packs, smaller total bundle |
| UI components | Headless UI | Radix UI | Headless UI is Tailwind-official, better Tailwind integration |

## Architecture Decisions

### Why Serverless Functions for API Calls

**Problem:** Exposing OpenAI/kie.ai API keys in frontend = security vulnerability
**Solution:** Vercel serverless functions as API proxy

**Implementation:**
```
/api/generate-text.ts → Calls OpenAI via Vercel AI SDK
/api/generate-image.ts → Calls DALL-E/GPT-Image via OpenAI SDK
```

**Benefits:**
- API keys stored server-side only
- Rate limiting at server level
- Cost monitoring (track usage per request)
- Easy to switch providers (change server code, not frontend)

### Why Single Page App (No Routing)

**Requirement:** Generate post in under 60 seconds
**Decision:** No React Router, single-page wizard with conditional rendering

**Rationale:**
- No route transitions = faster perceived performance
- Simpler state management (no route state synchronization)
- Smaller bundle (no router library)
- Better for wizard flow (step 1 → step 2 → step 3 → download)

**Implementation:** Use Zustand to track current step, conditionally render components.

### Font Strategy for Lithuanian

**Requirement:** Support Lithuanian characters (ą, č, ę, ė, į, š, ų, ū, ž)
**Solution:** Google Fonts with `latin-ext` subset

**Tailwind Config:**
```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        // Inter includes latin-ext by default
      },
    },
  },
};
```

**Import in index.css:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap&subset=latin-ext');
```

## Performance Optimizations

### Vite Build Optimizations

1. **Use SWC instead of Babel** (already configured with @vitejs/plugin-react-swc)
2. **Manual chunk splitting** for better caching:
```js
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-ai': ['ai', '@ai-sdk/openai'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
        },
      },
    },
  },
});
```

3. **Modern browser target** (reduce polyfills):
```js
build: {
  target: 'esnext', // Lithuanian service providers likely use modern browsers
}
```

### Image Export Optimizations

1. **Pre-render template** before export (avoid re-layout during capture)
2. **Use `pixelRatio: 2`** for Retina displays (sharper on mobile)
3. **Cache generated images** in TanStack Query (avoid re-generation)
4. **Compress PNG** with quality option (balance file size vs quality)

```ts
toPng(node, {
  quality: 0.95,
  pixelRatio: 2,
  cacheBust: true, // Prevent stale renders
});
```

### AI Request Optimizations

1. **Request deduplication** (TanStack Query automatic)
2. **Streaming responses** (Vercel AI SDK streaming)
3. **Abort on unmount** (cancel in-flight requests if user navigates away)
4. **Cache AI responses** (5-minute cache for identical prompts)

## Migration Path

### DALL-E 3 Deprecation (May 12, 2026)

**Current:** DALL-E 3 via kie.ai proxy
**Migration Target:** GPT-Image-1 (GPT-4o native image generation)

**Timeline:**
- Q1 2026: Test GPT-Image-1 in parallel with DALL-E 3
- Q2 2026 (before May 12): Switch default to GPT-Image-1
- May 12, 2026: Complete DALL-E 3 removal

**Implementation:**
```ts
// api/generate-image.ts
const model = process.env.IMAGE_MODEL || 'gpt-image-1'; // Easy switch
```

**Cost Comparison (via kie.ai):**
- DALL-E 3: ~$0.04 per image
- GPT-Image-1: ~$0.02 per image (50% cheaper)

**Quality:** GPT-Image-1 has better text rendering and higher fidelity (important for social media posts with text overlays).

## Sources

### AI & API Integration
- [Vercel AI SDK Documentation](https://ai-sdk.dev/docs/introduction)
- [How to build AI Agents with Vercel and the AI SDK](https://vercel.com/kb/guide/how-to-build-ai-agents-with-vercel-and-the-ai-sdk)
- [Vercel & OpenAI Integration](https://vercel.com/docs/ai/openai)
- [AI SDK 6 Release](https://vercel.com/blog/ai-sdk-6)
- [Kie.ai Platform](https://kie.ai/)
- [OpenAI API Guide 2025](https://www.cursor-ide.com/blog/openai-image-generation-api-guide-2025)
- [Best Practices for API Key Safety](https://help.openai.com/en/articles/5112595-best-practices-for-api-key-safety)
- [ChatGPT Supported Languages](https://botpress.com/blog/list-of-languages-supported-by-chatgpt)

### State Management
- [React State Management in 2025: Context API vs Zustand](https://dev.to/cristiansifuentes/react-state-management-in-2025-context-api-vs-zustand-385m)
- [State Management in 2025: When to Use Context, Redux, Zustand, or Jotai](https://dev.to/hijazi313/state-management-in-2025-when-to-use-context-redux-zustand-or-jotai-2d2k)
- [Zustand and React Context](https://tkdodo.eu/blog/zustand-and-react-context)

### Forms & Validation
- [React Hook Form Documentation](https://react-hook-form.com/)
- [Best Practices for Handling Forms in React (2025 Edition)](https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f)
- [8 Best React Form Libraries for Developers (2025)](https://snappify.com/blog/best-react-form-libraries)

### Image Export
- [html-to-image on npm](https://www.npmjs.com/package/html-to-image)
- [html-to-image GitHub](https://github.com/bubkoo/html-to-image)
- [react-to-image GitHub](https://github.com/hugocxl/react-to-image)
- [Export React components as images using html2canvas](https://blog.logrocket.com/export-react-components-as-images-html2canvas/)
- [Best HTML to Canvas Solutions in 2025](https://portalzine.de/best-html-to-canvas-solutions-in-2025/)

### Vite & Build Optimization
- [Advanced Guide to Using Vite with React in 2025](https://codeparrot.ai/blogs/advanced-guide-to-using-vite-with-react-in-2025)
- [Vite Building for Production](https://vite.dev/guide/build)
- [Vite Performance Guide](https://vite.dev/guide/performance)
- [Vite vs. Webpack for React apps in 2025](https://blog.logrocket.com/vite-vs-webpack-react-apps-2025-senior-engineer/)

### Error Handling & Loading States
- [React Suspense Documentation](https://react.dev/reference/react/Suspense)
- [How to Use React Suspense: Complete Guide for 2025](https://natclark.com/how-to-use-react-suspense-complete-guide-for-2025/)
- [Mastering React Suspense: Loading States Done Right](https://dev.to/cristiansifuentes/mastering-react-suspense-loading-states-done-right-4083)
- [React 19 Suspense Deep Dive](https://dev.to/a1guy/react-19-suspense-deep-dive-data-fetching-streaming-and-error-handling-like-a-pro-3k74)

### Fonts & Typography
- [Tailwind CSS Font Family](https://tailwindcss.com/docs/font-family)
- [How to use custom fonts in Tailwind CSS](https://blog.logrocket.com/custom-fonts-tailwind-css/)

### Vercel Deployment
- [Vercel Image Optimization](https://vercel.com/docs/image-optimization)
- [Advanced: Vercel Deployment Guide](https://ai-sdk.dev/docs/advanced/vercel-deployment-guide)
- [Vite vs Next.js 2025 Comparison](https://strapi.io/blog/vite-vs-nextjs-2025-developer-framework-comparison)
