# Phase 2: Core Generator - Research

**Researched:** 2026-01-25
**Domain:** React mobile-first UI, form state management, AI text streaming, autocomplete
**Confidence:** HIGH

## Summary

Phase 2 builds a text-only post generator with mobile-first UI delivering a 60-second workflow. Users select industry (with autocomplete), configure post settings (tone/emoji/length), generate streaming text, and copy results. The research focused on React UI patterns for mobile-first forms, AI text streaming display, autocomplete/fuzzy search, localStorage for preferences, and toast notifications.

**Key findings:**
- Next.js 15 with App Router provides production-ready Server Components with excellent mobile performance
- Vercel AI SDK (v6.0+) offers battle-tested streaming patterns with `streamText` API (already integrated in Phase 1)
- React Hot Toast or Sonner are lightweight (<5KB) toast solutions with excellent DX
- Fuse.js enables fuzzy search for industry autocomplete with minimal overhead
- localStorage requires `useEffect` guards to prevent SSR hydration errors in Next.js
- Tailwind's mobile-first approach with `sticky bottom-0` patterns ideal for thumb-accessible action buttons

**Primary recommendation:** Use built-in React state (useState) for form management, extend existing streaming implementation from Phase 1, add react-hot-toast for notifications, implement custom autocomplete with Fuse.js, and use useEffect pattern for localStorage access.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 15.1.4 | React framework with App Router | Already in use; production-ready RSC support, 71% of React jobs require it |
| React | 19.0.0 | UI library | Already in use; latest with concurrent features |
| Tailwind CSS | 3.4.1 | Utility-first CSS | Already in use; mobile-first by design |
| Vercel AI SDK | 6.0.49 | AI text streaming | Already integrated in Phase 1; streamText API proven |
| TypeScript | 5.x | Type safety | Already in use; essential for form validation |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-hot-toast | ^2.4.1 | Toast notifications | Lightweight (5KB), promise-based API, excellent mobile support |
| fuse.js | ^7.0.0 | Fuzzy search | Client-side industry autocomplete with typo tolerance |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-hot-toast | Sonner | Sonner has better animations, better for shadcn/ui projects; we're using Tailwind directly |
| Fuse.js | Manual filter | Fuse.js handles fuzzy matching, diacritics, scoring; manual implementation error-prone |
| useState | React Hook Form + Zod | Overkill for 5 simple fields; adds 16KB+ bundle size; useful for complex validation |
| Custom autocomplete | MUI/PrimeReact | Heavy dependencies (100KB+); we only need simple industry search |

**Installation:**
```bash
npm install react-hot-toast fuse.js
# Optional type definitions
npm install --save-dev @types/fuse.js
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── page.tsx                    # Main UI (client component 'use client')
├── components/
│   ├── IndustryAutocomplete.tsx  # Autocomplete with Fuse.js
│   ├── PostConfiguration.tsx     # Tone/emoji/length settings
│   ├── StreamingDisplay.tsx      # AI text streaming display
│   └── ActionButtons.tsx         # Copy/Regenerate sticky buttons
├── lib/
│   ├── industries.ts           # Lithuanian industry list
│   └── useLocalStorage.ts      # Custom hook with SSR guard
└── api/generate/route.ts       # Already exists from Phase 1
```

### Pattern 1: Mobile-First Form Layout
**What:** Tailwind mobile-first approach - base styles for mobile, breakpoints for larger screens
**When to use:** All UI components in this phase
**Example:**
```tsx
// Mobile: single column, sticky buttons at bottom
// Desktop: wider container, side-by-side configuration
<div className="min-h-screen flex flex-col">
  <main className="flex-1 p-4 pb-24 max-w-2xl mx-auto w-full">
    {/* Form content */}
  </main>

  {/* Sticky bottom buttons for mobile thumb access */}
  <div className="fixed inset-x-0 bottom-0 p-4 bg-white border-t">
    <div className="max-w-2xl mx-auto flex gap-2">
      <button className="flex-1">Copy</button>
      <button>Regenerate</button>
    </div>
  </div>
</div>
```
**Source:** [Tailwind CSS Responsive Design](https://tailwindcss.com/docs/responsive-design)

### Pattern 2: Streaming Display with Loading States
**What:** Progressive text rendering with streaming response, showing loading state immediately
**When to use:** AI text generation display
**Example:**
```tsx
// Source: Existing Phase 1 implementation
const [generatedText, setGeneratedText] = useState('');
const [isLoading, setIsLoading] = useState(false);

// Streaming response from fetch
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  setGeneratedText(prev => prev + chunk); // Progressive update
}

// UI shows: loading state → streaming text → cursor indicator
{isLoading && !generatedText && (
  <div className="animate-pulse">Loading...</div>
)}
<div className="whitespace-pre-wrap">{generatedText}</div>
{isLoading && generatedText && (
  <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1" />
)}
```
**Source:** Existing implementation in `app/page.tsx`, verified against [Vercel AI SDK patterns](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)

### Pattern 3: Autocomplete with Fuzzy Search
**What:** Input with dropdown suggestions using Fuse.js for typo-tolerant matching
**When to use:** Industry selection
**Example:**
```tsx
import Fuse from 'fuse.js';

const industries = [
  'Grožio specialistai (kirpėjai, kosmetologai)',
  'Treneriai (fitness, joga)',
  'Kineziterapeutai',
  // ...
];

// Configure Fuse.js
const fuse = new Fuse(industries, {
  threshold: 0.3, // Fuzzy matching sensitivity
  keys: ['name'], // For object arrays
});

// In component
const [query, setQuery] = useState('');
const [suggestions, setSuggestions] = useState([]);

useEffect(() => {
  if (query.length < 2) {
    setSuggestions([]);
    return;
  }

  const results = fuse.search(query);
  setSuggestions(results.map(r => r.item).slice(0, 5));
}, [query]);
```
**Source:** [Fuse.js Documentation](https://www.fusejs.io/), [React Autocomplete patterns](https://www.lucaspaganini.com/academy/autocomplete-with-fuzzy-search-and-fuse-js/)

### Pattern 4: localStorage with SSR Guard
**What:** Custom hook preventing hydration errors in Next.js by accessing localStorage only on client
**When to use:** Remembering last selected industry
**Example:**
```tsx
// lib/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize with function to avoid SSR execution
  const [storedValue, setStoredValue] = useState<T>(() => {
    // Always return initial value on server
    if (typeof window === 'undefined') return initialValue;

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Sync to localStorage on client only
  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error saving localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

// Usage
const [lastIndustry, setLastIndustry] = useLocalStorage('lastIndustry', '');
```
**Source:** [usehooks-ts useLocalStorage](https://usehooks-ts.com/react-hook/use-local-storage), [Next.js hydration error docs](https://nextjs.org/docs/messages/react-hydration-error)

### Pattern 5: Toast Notifications
**What:** Brief, non-blocking feedback for user actions (copy success, errors)
**When to use:** After copy action, on API errors
**Example:**
```tsx
import toast, { Toaster } from 'react-hot-toast';

// In layout or main component
<Toaster position="bottom-center" />

// On copy action
const handleCopy = async () => {
  try {
    await navigator.clipboard.writeText(generatedText);
    toast.success('Nukopijuota!', {
      duration: 2000,
      icon: '✓',
    });
  } catch (err) {
    toast.error('Kopijavimo klaida');
  }
};

// On API error
catch (error) {
  toast.error('Generavimo klaida. Bandykite dar kartą.');
}
```
**Source:** [react-hot-toast documentation](https://react-hot-toast.com/)

### Anti-Patterns to Avoid
- **Using `sm:` for mobile styles:** Tailwind is mobile-first; `sm:` means "small and up", not "small only". Write base classes for mobile, add breakpoint prefixes for desktop.
- **Accessing localStorage in component body:** Causes hydration errors. Always use `useEffect` or check `typeof window !== 'undefined'`.
- **Heavy autocomplete libraries:** MUI Autocomplete is 100KB+. For simple use cases, build custom with Fuse.js (10KB).
- **Managing form state with Redux/Zustand:** Overkill for 5 simple fields. Use `useState` for local, ephemeral form state.
- **Inline editing for read-only text:** Context shows "No inline editing — text is read-only, user regenerates if not satisfied". Building inline edit for read-only content is wasted effort.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fuzzy string matching | Manual Levenshtein distance, custom scoring | Fuse.js | Handles diacritics, multiple strategies, well-tested scoring algorithms |
| Toast notifications | Custom absolute-positioned divs with timers | react-hot-toast | Accessibility, stacking, mobile edge cases, promise API |
| localStorage hook | Direct localStorage.setItem in components | Custom useLocalStorage hook with SSR guard | Prevents hydration errors, handles JSON serialization, error boundaries |
| Form validation | Manual field checks, error state arrays | Keep it simple with TypeScript types or add Zod if needed | Type safety catches most issues; for 5 fields, validation is straightforward |
| Streaming text display | WebSocket, custom chunking logic | Vercel AI SDK streamText (already integrated) | Handles errors, backpressure, reconnection; battle-tested |

**Key insight:** Mobile-first UI has subtle pitfalls (sticky positioning on iOS, safe-area-inset, thumb reach zones). Use established patterns and test on real devices early.

## Common Pitfalls

### Pitfall 1: localStorage Hydration Errors
**What goes wrong:** Accessing `localStorage` during render causes "Text content does not match server-rendered HTML" errors
**Why it happens:** Server-side rendering doesn't have `window` or `localStorage`; pre-rendered HTML differs from first client render
**How to avoid:**
- Always check `typeof window !== 'undefined'` before accessing browser APIs
- Use `useEffect` for localStorage reads/writes
- Initialize state with function callback to defer execution
**Warning signs:** Console errors about hydration mismatch; flickering content on page load
**Source:** [Next.js Hydration Error docs](https://nextjs.org/docs/messages/react-hydration-error)

### Pitfall 2: Autocomplete Re-rendering Performance
**What goes wrong:** Re-instantiating Fuse.js on every render or keystroke causes lag
**Why it happens:** Fuse.js builds search index; rebuilding on every render is expensive for large datasets
**How to avoid:**
- Instantiate Fuse outside component or in `useMemo`
- Only search on input change, not on every render
- Debounce input if dataset is large (100+ items)
**Warning signs:** Typing feels laggy; high CPU usage in React DevTools profiler
**Source:** [Fuse.js performance considerations](https://www.fusejs.io/)

### Pitfall 3: Edge Runtime Limitations
**What goes wrong:** Trying to use Node.js-specific modules (fs, path, certain crypto functions) in Edge Runtime fails
**Why it happens:** Edge Runtime is lightweight, browser-like; doesn't support full Node.js API
**How to avoid:**
- Use `export const runtime = 'edge'` only when necessary (longer timeouts, global deployment)
- For Phase 2, API route is already Edge Runtime from Phase 1; frontend is client component (no runtime restrictions)
- If you need Node.js APIs, use Node runtime: `export const runtime = 'nodejs'`
**Warning signs:** "Module not found" errors for Node builtins; imports work locally but fail on Vercel
**Source:** [Next.js Edge Runtime docs](https://nextjs.org/docs/app/api-reference/edge)

### Pitfall 4: Mobile Sticky Button Safe Area
**What goes wrong:** Fixed bottom buttons get hidden behind iOS home indicator or Android navigation bar
**Why it happens:** Mobile browsers have UI elements that overlap viewport; `bottom-0` doesn't account for safe area
**How to avoid:**
- Use `pb-safe` or `env(safe-area-inset-bottom)` for padding
- Tailwind 4 has built-in safe area utilities; for Tailwind 3.4, use `@supports` or custom plugin
- Test on real iOS device or Chrome DevTools device emulation with safe area
**Warning signs:** Buttons partially obscured on iPhone X+; users can't tap bottom buttons
**Source:** [Tailwind CSS safe area discussions](https://github.com/tailwindlabs/tailwindcss/discussions/8648)

### Pitfall 5: Form State Out of Sync with API
**What goes wrong:** User changes settings, but API uses stale values from previous request
**Why it happens:** Async state updates; reading state immediately after `setState` returns old value
**How to avoid:**
- Pass form values directly to API call, don't rely on state being updated
- Use refs for values that need immediate synchronous access
- For Phase 2, simple pattern: collect form values at time of generation, pass as request body
**Warning signs:** Generated text doesn't match selected tone/emoji/length; user changes settings but output unchanged
**Example:**
```tsx
// WRONG: State may be stale
const handleGenerate = async () => {
  setTone('professional');
  await fetch('/api/generate', { body: JSON.stringify({ tone }) }); // May send old tone!
}

// RIGHT: Use values at call time
const handleGenerate = async () => {
  const currentTone = toneRef.current || tone; // Or just gather from form
  await fetch('/api/generate', { body: JSON.stringify({ tone: currentTone }) });
}
```

## Code Examples

Verified patterns from official sources and existing implementation:

### Mobile-First Responsive Container
```tsx
// Source: Tailwind CSS responsive design docs
<div className="min-h-screen flex flex-col">
  {/* Mobile: full width with padding, Desktop: max-w centered */}
  <main className="flex-1 px-4 py-6 max-w-2xl mx-auto w-full lg:px-8">
    {/* Content stretches to fill available space */}
  </main>
</div>
```

### Streaming Text Display (Existing Implementation)
```tsx
// Source: app/page.tsx (Phase 1 implementation)
const [generatedText, setGeneratedText] = useState('');
const [isLoading, setIsLoading] = useState(false);

const handleGenerate = async () => {
  setIsLoading(true);
  setGeneratedText('');

  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ industry, prompt, tone, emoji, length })
  });

  // Stream response
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    setGeneratedText(prev => prev + chunk);
  }

  setIsLoading(false);
};

// UI: Loading → Streaming → Complete
<div className="border rounded p-4 min-h-[200px]">
  {isLoading && !generatedText && (
    <div className="text-gray-400 animate-pulse">Laukiama...</div>
  )}
  <div className="whitespace-pre-wrap">{generatedText}</div>
  {isLoading && generatedText && (
    <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse" />
  )}
</div>
```

### Industry Autocomplete with Fuse.js
```tsx
// Source: Fuse.js documentation + React patterns
import { useState, useEffect, useMemo } from 'react';
import Fuse from 'fuse.js';

const INDUSTRIES = [
  'Grožio specialistai (kirpėjai, kosmetologai, nagų meistrai)',
  'Treneriai (fitness, joga, personaliniai)',
  'Kineziterapeutai',
  'Masažistai',
  'Odontologai',
  'Veterinarai',
  'Nekilnojamojo turto agentai',
  'Buhalteriai',
  'Teisininkai',
  'Fotografai',
  'Kita'
];

export default function IndustryAutocomplete({ value, onChange }) {
  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Memoize Fuse instance to avoid re-creating on every render
  const fuse = useMemo(() => new Fuse(INDUSTRIES, {
    threshold: 0.3, // Allow typos
    distance: 100,
    minMatchCharLength: 2,
  }), []);

  const suggestions = useMemo(() => {
    if (inputValue.length < 2) return INDUSTRIES;
    const results = fuse.search(inputValue);
    return results.map(r => r.item).slice(0, 5);
  }, [inputValue, fuse]);

  return (
    <div className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        className="w-full p-2 border rounded"
        placeholder="Pasirinkite sritį..."
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((item) => (
            <button
              key={item}
              onClick={() => {
                setInputValue(item);
                onChange(item);
                setShowSuggestions(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-gray-100"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Copy to Clipboard with Toast
```tsx
// Source: react-hot-toast documentation + Clipboard API
import toast from 'react-hot-toast';

const handleCopy = async () => {
  if (!generatedText) {
    toast.error('Nėra teksto kopijavimui');
    return;
  }

  try {
    await navigator.clipboard.writeText(generatedText);
    toast.success('Nukopijuota!', {
      duration: 2000,
      icon: '✓',
      style: {
        background: '#10b981',
        color: '#fff',
      },
    });
  } catch (err) {
    console.error('Copy failed:', err);
    toast.error('Kopijavimo klaida');
  }
};
```

### Sticky Bottom Action Buttons
```tsx
// Source: Tailwind CSS position documentation + mobile patterns
<div className="fixed inset-x-0 bottom-0 p-4 bg-white border-t shadow-lg z-50">
  {/* Center content with max width */}
  <div className="max-w-2xl mx-auto flex gap-2">
    <button
      onClick={handleCopy}
      disabled={!generatedText}
      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
    >
      Kopijuoti
    </button>
    <button
      onClick={handleRegenerate}
      disabled={!generatedText || isLoading}
      className="py-3 px-4 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      Generuoti iš naujo
    </button>
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pages Router | App Router with Server Components | Next.js 13+ (2022-2023) | Better performance, streaming, data fetching patterns |
| react-toastify (16KB) | react-hot-toast (5KB) or Sonner | 2023-2024 | Lighter bundles, better mobile UX, simpler API |
| Redux for all state | useState for local, context for shared | React 16.8+ hooks (2019+) | Less boilerplate, better performance for simple cases |
| Custom autocomplete | Pre-built components or Fuse.js | 2020+ | Fuzzy search, accessibility, mobile support out of box |
| window.localStorage direct | useLocalStorage hook with guards | Next.js SSR adoption | Prevents hydration errors, cleaner API |

**Deprecated/outdated:**
- **Class components for forms:** Use functional components with hooks (useState, useEffect)
- **componentWillReceiveProps for sync:** Use useEffect with dependencies
- **Inline styles for responsive:** Tailwind utility classes handle responsive better
- **moment.js for dates:** Use native Intl.DateTimeFormat or date-fns (if needed, but not in this phase)

## Open Questions

1. **Lithuanian Industry List Completeness**
   - What we know: Context specifies 10-15 core industries for Lithuanian market
   - What's unclear: Exact industries beyond the 5 listed (Grožio specialistai, Treneriai, Kineziterapeutai, Masažistai, Kita)
   - Recommendation: Research Lithuanian small business categories; add common service professions (odontologai, veterinarai, nekilnojamojo turto agentai, fotografai, etc.)

2. **Regenerate Behavior with Settings Change**
   - What we know: User can regenerate with same settings; context says "replace immediately"
   - What's unclear: Should changing tone/emoji/length auto-regenerate or wait for explicit button?
   - Recommendation: Keep explicit—user changes settings, then clicks "Regenerate" to apply. Prevents accidental API calls on every dropdown change.

3. **Mobile Keyboard Handling**
   - What we know: Input fields will open mobile keyboard, potentially obscuring UI
   - What's unclear: Does scrolling behavior need special handling? Should we blur input after selection?
   - Recommendation: Test on mobile—sticky bottom buttons should move with keyboard (iOS pushes viewport up); auto-blur after autocomplete selection to dismiss keyboard.

## Sources

### Primary (HIGH confidence)
- Vercel AI SDK - [streamText API](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot) - Streaming text patterns
- Next.js - [App Router documentation](https://nextjs.org/docs/app) - RSC, client components
- Tailwind CSS - [Responsive Design](https://tailwindcss.com/docs/responsive-design) - Mobile-first approach
- react-hot-toast - [Official documentation](https://react-hot-toast.com/) - Toast API
- Fuse.js - [Official documentation](https://www.fusejs.io/) - Fuzzy search configuration
- Next.js - [Hydration Error docs](https://nextjs.org/docs/messages/react-hydration-error) - localStorage SSR issues

### Secondary (MEDIUM confidence)
- [React State Management in 2025](https://www.developerway.com/posts/react-state-management-2025) - When to use useState vs libraries
- [AI SDK UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/) - Streaming UI patterns
- [Tailwind CSS Best Practices 2025-2026](https://www.frontendtools.com/blog/tailwind-css-best-practices-design-system-patterns) - Design tokens, responsive patterns
- [LogRocket: React Toast Libraries 2025](https://blog.logrocket.com/react-toast-libraries-compared-2025/) - Toast library comparison
- [Mastering Search in React: Fuzzy Matching](https://medium.com/@kennediowusu/mastering-search-in-react-from-basic-filtering-to-fuzzy-matching-76932818a4f9) - Fuse.js patterns

### Tertiary (LOW confidence)
- Various GitHub discussions on Next.js Edge Runtime limitations - marked for validation during implementation
- Community blog posts on mobile-first patterns - cross-referenced with official Tailwind docs

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in use or well-established with official documentation
- Architecture: HIGH - Patterns verified with official Next.js/Tailwind/AI SDK docs and existing Phase 1 code
- Pitfalls: HIGH - localStorage/hydration errors well-documented in Next.js official docs; Edge Runtime limitations from Vercel official docs

**Research date:** 2026-01-25
**Valid until:** ~30 days (stable ecosystem; Next.js 15.1, React 19, Tailwind 3.4 are current stable versions)
