# Architecture Patterns

**Domain:** AI Social Media Post Generator
**Researched:** 2026-01-25
**Confidence:** HIGH

## Executive Summary

AI content generators follow a three-tier architecture: **Frontend UI Layer** (user input and preview), **API Gateway Layer** (serverless functions), and **AI Service Layer** (OpenAI/DALL-E integration). Your proposed React + Vite + Vercel serverless structure aligns well with 2026 best practices.

**Critical pattern:** Unidirectional data flow with client-side state management, streaming responses for better UX, and security-first API design (never expose API keys client-side).

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  React SPA (Vite)                                      │ │
│  │  - Industry selection & settings                       │ │
│  │  - Image upload/generation                             │ │
│  │  - Post preview & output                               │ │
│  │  - Client-side state (no database)                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↕ HTTPS                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│              API GATEWAY (Vercel Serverless)                 │
│  ┌──────────────────┐         ┌──────────────────┐         │
│  │ /api/            │         │ /api/            │         │
│  │ generate-post.js │         │ generate-image.js│         │
│  │ - Validation     │         │ - Validation     │         │
│  │ - Rate limiting  │         │ - Rate limiting  │         │
│  │ - Streaming      │         │ - Image handling │         │
│  └──────────────────┘         └──────────────────┘         │
│           ↓                            ↓                     │
└─────────────────────────────────────────────────────────────┘
            ↓                            ↓
┌───────────────────────┐    ┌───────────────────────┐
│   OpenAI API          │    │   DALL-E 3 API        │
│   (via kie.ai proxy)  │    │   (via kie.ai proxy)  │
│   - Text generation   │    │   - Image generation  │
│   - Streaming support │    │   - Base64 response   │
└───────────────────────┘    └───────────────────────┘
```

### Data Flow Direction

**CRITICAL:** Follow unidirectional data flow (parent → child via props, child → parent via callbacks).

```
User Input
    ↓
Form Components (IndustrySelector, ImageUploader, PostSettings)
    ↓ (via callbacks)
App.jsx (State Management - single source of truth)
    ↓ (trigger API call via hooks)
useGeneratePost / useGenerateImage
    ↓ (HTTP POST)
Vercel API Routes (/api/generate-post.js, /api/generate-image.js)
    ↓ (external API call with streaming)
OpenAI / DALL-E (via kie.ai)
    ↓ (stream chunks back)
Custom Hooks (update state incrementally)
    ↓ (state update triggers re-render)
Output Components (PostOutput, PreviewCard)
    ↓
User sees result (with streaming for better UX)
```

## Component Boundaries

### Frontend Components (React)

| Component | Responsibility | Receives (Props) | Sends (Events) | State |
|-----------|---------------|------------------|----------------|-------|
| **App.jsx** | Root orchestrator, owns all state | - | - | Industry, image, settings, generated post, loading states |
| **IndustrySelector** | Display industry options | `onSelect`, `selectedIndustry` | `onSelect(industry)` | None (stateless) |
| **ImageUploader** | Handle image file upload | `onUpload`, `uploadedImage` | `onUpload(imageFile)` | None (stateless) |
| **ImageGenerator** | Trigger DALL-E image generation | `onGenerate`, `generatedImage`, `isLoading` | `onGenerate(prompt)` | None (stateless) |
| **PostSettings** | Capture tone, length, CTA preferences | `onChange`, `currentSettings` | `onChange(settings)` | None (stateless) |
| **PostOutput** | Display generated text with copy/edit | `postText`, `onEdit` | `onEdit(newText)` | Internal edit mode only |
| **PreviewCard** | Social media preview simulation | `postText`, `image`, `platform` | - | None (stateless) |

**Pattern:** Presentational/Container separation. All form components are **presentational** (receive props, emit events). App.jsx is the **container** (owns state, orchestrates logic).

### Custom Hooks (React)

| Hook | Purpose | Returns | Side Effects |
|------|---------|---------|--------------|
| **useGeneratePost** | API call to generate-post.js | `{ postText, isLoading, error, generatePost() }` | HTTP POST, state updates via streaming |
| **useGenerateImage** | API call to generate-image.js | `{ imageUrl, isLoading, error, generateImage() }` | HTTP POST, returns base64/URL |

**Pattern:** Hooks encapsulate API logic and streaming state management, keeping components clean.

### Utility Modules

| Module | Purpose | Exports |
|--------|---------|---------|
| **utils/api.js** | HTTP client configuration | `apiClient` (fetch wrapper with error handling) |
| **utils/prompts.js** | Prompt templates for OpenAI | `buildPostPrompt(industry, settings)`, `buildImagePrompt(industry, description)` |

### Backend (Vercel Serverless Functions)

| Function | HTTP Method | Input | Output | External Calls |
|----------|-------------|-------|--------|----------------|
| **/api/generate-post.js** | POST | `{ industry, tone, length, cta, imageDescription }` | Streaming text response (SSE) | OpenAI Chat Completions (via kie.ai) |
| **/api/generate-image.js** | POST | `{ prompt, size }` | JSON: `{ imageUrl }` | DALL-E 3 (via kie.ai) |

**Security:** API keys stored in Vercel environment variables, never exposed to client.

## Architectural Patterns to Follow

### Pattern 1: Synchronous Streaming Response

**What:** Progressive display of AI-generated text as it arrives (like ChatGPT).

**Why:** Better UX. Waiting 5-10 seconds for a complete response feels slow; streaming makes the app feel instant.

**How (Backend):**
```javascript
// /api/generate-post.js
export default async function handler(req, res) {
  const { industry, tone, length } = req.body;

  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const response = await fetch('https://api.kie.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: buildPrompt(industry, tone, length) }],
      stream: true // Enable streaming
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    res.write(`data: ${chunk}\n\n`); // SSE format
  }

  res.end();
}
```

**How (Frontend Hook):**
```javascript
// /src/hooks/useGeneratePost.js
export function useGeneratePost() {
  const [postText, setPostText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const generatePost = async (settings) => {
    setIsLoading(true);
    setPostText('');

    const response = await fetch('/api/generate-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      // Parse SSE format and extract text
      const text = parseSSEChunk(chunk);
      setPostText(prev => prev + text); // Append incrementally
    }

    setIsLoading(false);
  };

  return { postText, isLoading, generatePost };
}
```

**Sources:**
- [Serverless generative AI architectural patterns – Part 1](https://aws.amazon.com/blogs/compute/serverless-generative-ai-architectural-patterns/)
- [AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/)
- [Build a GPT-3 app with Next.js and Vercel Edge Functions](https://vercel.com/blog/gpt-3-app-next-js-vercel-edge-functions)

### Pattern 2: Unidirectional Data Flow

**What:** Data flows down (parent → child via props), events flow up (child → parent via callbacks).

**Why:** Predictable state changes, easier debugging, prevents spaghetti code.

**How:**
```javascript
// App.jsx - Single source of truth
function App() {
  const [industry, setIndustry] = useState(null);
  const [settings, setSettings] = useState({});
  const { postText, generatePost } = useGeneratePost();

  return (
    <>
      {/* Data flows DOWN via props */}
      <IndustrySelector
        selectedIndustry={industry}
        onSelect={setIndustry} // Event flows UP via callback
      />

      <PostSettings
        currentSettings={settings}
        onChange={setSettings}
      />

      <button onClick={() => generatePost({ industry, ...settings })}>
        Generate Post
      </button>

      <PostOutput postText={postText} />
    </>
  );
}

// IndustrySelector.jsx - Stateless presentational component
function IndustrySelector({ selectedIndustry, onSelect }) {
  return (
    <div>
      {industries.map(ind => (
        <button
          key={ind.id}
          className={selectedIndustry === ind.id ? 'selected' : ''}
          onClick={() => onSelect(ind.id)} // Emit event to parent
        >
          {ind.name}
        </button>
      ))}
    </div>
  );
}
```

**Sources:**
- [Master React Unidirectional Data Flow](https://coderpad.io/blog/development/master-react-unidirectional-data-flow/)
- [ReactJS Unidirectional Data Flow](https://www.geeksforgeeks.org/reactjs/reactjs-unidirectional-data-flow/)

### Pattern 3: Security-First API Design

**What:** Never expose API keys to the client; all external API calls happen server-side.

**Why:** Prevents unauthorized usage, API key theft, and cost abuse.

**How:**
```
❌ WRONG (Client calls OpenAI directly):
React Component → OpenAI API (exposes API key in browser)

✅ CORRECT (Proxy through serverless function):
React Component → Vercel API Route → OpenAI API
                  (API key in env vars)
```

**Additional security:**
- Rate limiting (prevent abuse): Use Vercel's built-in rate limiting or Upstash
- Input validation: Sanitize user inputs before sending to OpenAI
- Error sanitization: Don't leak internal errors to client

**Sources:**
- [Integrating AI APIs into React Apps | 2026 Guide](https://www.credosystemz.com/blog/integrating-ai-apis-into-react-app/)
- [Vercel serverless functions OpenAI best practices](https://medium.com/@kolbysisk/case-study-solving-vercels-10-second-limit-with-qstash-2bceeb35d29b)

### Pattern 4: Optimistic UI Updates

**What:** Show immediate feedback before server response arrives.

**Why:** Perceived performance boost; app feels instant.

**How:**
```javascript
function ImageGenerator({ onGenerate }) {
  const [optimisticImage, setOptimisticImage] = useState(null);

  const handleGenerate = async (prompt) => {
    // Show placeholder immediately
    setOptimisticImage({ loading: true, placeholder: '/loading.gif' });

    // Wait for real image
    const image = await generateImage(prompt);

    // Replace with real result
    setOptimisticImage(null);
    onGenerate(image);
  };

  return optimisticImage ? (
    <img src={optimisticImage.placeholder} alt="Generating..." />
  ) : null;
}
```

### Pattern 5: Feature-Based Folder Structure

**What:** Organize by features/domains, not file types.

**Why:** Easier to find related code; scales better than grouping all components together.

**Recommended structure for your project:**
```
/src
  /features                    # Feature-based organization
    /post-generation
      IndustrySelector.jsx
      PostSettings.jsx
      PostOutput.jsx
      useGeneratePost.js       # Co-located hook
    /image-generation
      ImageUploader.jsx
      ImageGenerator.jsx
      PreviewCard.jsx
      useGenerateImage.js
  /shared                      # Reusable across features
    /components
      Button.jsx
      Card.jsx
    /utils
      api.js
      prompts.js
  App.jsx
  main.jsx

/api                           # Vercel serverless functions
  generate-post.js
  generate-image.js
```

**Alternative (if keeping current structure):**
```
/src
  /components                  # All UI components
    IndustrySelector.jsx
    ImageUploader.jsx
    ImageGenerator.jsx
    PostSettings.jsx
    PostOutput.jsx
    PreviewCard.jsx
  /hooks                       # Custom hooks
    useGeneratePost.js
    useGenerateImage.js
  /utils                       # Utilities
    api.js
    prompts.js
  App.jsx
  main.jsx
```

**Note:** Current structure is acceptable for a small app (~6 components). Consider feature-based structure if you add more features (e.g., post scheduling, analytics).

**Sources:**
- [React Folder Structure in 5 Steps [2025]](https://www.robinwieruch.de/react-folder-structure/)
- [React Folder Structure with Vite & TypeScript](https://medium.com/@prajwalabraham.21/react-folder-structure-with-vite-typescript-beginner-to-advanced-9cd12d1d18a6)

## Anti-Patterns to Avoid

### Anti-Pattern 1: Prop Drilling Through Multiple Levels

**What:** Passing props through 3+ intermediate components that don't use them.

**Why bad:** Makes components tightly coupled, harder to refactor, and harder to test.

**Example:**
```javascript
// ❌ BAD: Settings passed through components that don't need them
<App settings={settings}>
  <Container settings={settings}>      {/* doesn't use settings */}
    <Wrapper settings={settings}>      {/* doesn't use settings */}
      <PostOutput settings={settings}> {/* finally uses it */}
```

**Instead:** Use React Context for deeply nested props (or keep state high enough that you don't need deep passing).

**For this project:** You shouldn't hit this issue since your structure is flat (App → Components). If you do, consider Context API or a lightweight state manager like Zustand.

**Sources:**
- [10 React Anti-patterns you should know](https://yosua-halim.medium.com/10-react-anti-patterns-you-should-know-300256bfb007)
- [6 Common React Anti-Patterns](https://itnext.io/6-common-react-anti-patterns-that-are-hurting-your-code-quality-904b9c32e933)

### Anti-Pattern 2: Using Array Index as Key

**What:** `<div key={index}>` in lists.

**Why bad:** Breaks React's reconciliation algorithm; causes bugs when list order changes.

**Instead:** Use stable, unique IDs.

```javascript
// ❌ BAD
industries.map((industry, index) => (
  <div key={index}>{industry.name}</div>
))

// ✅ GOOD
industries.map(industry => (
  <div key={industry.id}>{industry.name}</div>
))
```

**Sources:**
- [React Anti-patterns and Best Practices](https://www.perssondennis.com/articles/react-anti-patterns-and-best-practices-dos-and-donts)

### Anti-Pattern 3: Mutating State Directly

**What:** `state.value = newValue` instead of `setState(newValue)`.

**Why bad:** React won't detect the change; no re-render happens.

**Instead:** Always use setState or state updater functions.

```javascript
// ❌ BAD
const [settings, setSettings] = useState({});
settings.tone = 'professional'; // Direct mutation

// ✅ GOOD
setSettings(prev => ({ ...prev, tone: 'professional' }));
```

**Sources:**
- [React Anti Patterns](https://reactantipatterns.com/)

### Anti-Pattern 4: Over-Engineering for Day 1

**What:** Adding complex state management (Redux), database, authentication when you don't need it yet.

**Why bad:** Slows development, increases maintenance burden, harder to change direction.

**Your decision to skip database and use client-side state is CORRECT for MVP.** Add complexity only when you have evidence you need it (e.g., users want to save drafts → then add database).

**Sources:**
- [Generative AI Pitfalls](https://medium.com/@sahin.samia/generative-ai-pitfalls-the-common-mistakes-that-can-derail-your-ai-project-d741239d0ffa)

### Anti-Pattern 5: Blocking UI During AI Generation

**What:** Disabling entire app or showing spinner while waiting for OpenAI response.

**Why bad:** Poor UX; users can't adjust settings or cancel.

**Instead:** Use streaming + optimistic updates + allow cancellation.

```javascript
// ✅ GOOD: Stream results, allow editing while loading
const { postText, isLoading, cancelGeneration } = useGeneratePost();

return (
  <>
    <PostSettings disabled={false} /> {/* Still editable */}
    {isLoading && <button onClick={cancelGeneration}>Cancel</button>}
    <PostOutput postText={postText} streaming={isLoading} />
  </>
);
```

**Sources:**
- [AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/)

### Anti-Pattern 6: Trusting AI Output Without Validation

**What:** Displaying generated posts directly without client-side validation or editing capability.

**Why bad:** AI can hallucinate, produce inappropriate content, or miss brand voice.

**Instead:** Always provide edit capability and consider basic content validation.

```javascript
// ✅ GOOD: Allow editing before publishing
function PostOutput({ postText, onEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(postText);

  return isEditing ? (
    <textarea
      value={editedText}
      onChange={(e) => setEditedText(e.target.value)}
    />
  ) : (
    <div>
      <p>{postText}</p>
      <button onClick={() => setIsEditing(true)}>Edit</button>
    </div>
  );
}
```

**Sources:**
- [Common Pitfalls in AI-Generated Content](https://www.highervisibility.com/seo/learn/common-pitfalls-ai-generated-content/)
- [Make the Most of AI Content Creation: 10 Common Mistakes to Avoid](https://narrato.io/blog/10-ai-content-creation-mistakes-to-avoid/)

## Build Order (Dependency-Based Roadmap Suggestions)

### Phase 1: Foundation (Vertical Slice)
**Goal:** Get ONE working flow end-to-end.

**Build order:**
1. Vite + React project setup
2. Basic App.jsx with hardcoded state
3. One API route: `/api/generate-post.js` (no streaming yet, just fetch)
4. One hook: `useGeneratePost` (basic fetch)
5. One component: `PostOutput` (display result)

**Why this order:** Proves integration with OpenAI works before building UI.

### Phase 2: Input Layer
**Goal:** Add user controls.

**Build order:**
1. `IndustrySelector` component
2. `PostSettings` component
3. Wire to App.jsx state
4. Update API route to use settings

**Why this order:** Build from data source (user input) to consumer (API).

### Phase 3: Streaming UX
**Goal:** Add progressive display.

**Build order:**
1. Update `/api/generate-post.js` to stream
2. Update `useGeneratePost` to handle streaming
3. Update `PostOutput` to show streaming state

**Why this order:** Streaming requires coordinated changes across stack.

### Phase 4: Image Generation
**Goal:** Add DALL-E support.

**Build order:**
1. `/api/generate-image.js` endpoint
2. `useGenerateImage` hook
3. `ImageGenerator` component
4. `ImageUploader` component (alternative input)
5. `PreviewCard` component (shows image + text together)

**Why this order:** Image generation is independent; can be built in parallel with text streaming if you have the bandwidth.

### Phase 5: Polish
**Goal:** Production-ready details.

**Build order:**
1. Error handling (retry logic, user-friendly messages)
2. Loading states and skeletons
3. Rate limiting in API routes
4. Input validation
5. Edit capability in PostOutput
6. Copy-to-clipboard functionality

**Why this order:** Features that make the app feel polished but don't change core functionality.

## Scalability Considerations

| Concern | At 10 users/day | At 100 users/day | At 1000 users/day |
|---------|-----------------|------------------|-------------------|
| **API costs** | Negligible (~$1/month) | ~$10-20/month | ~$100-200/month; consider caching common prompts |
| **Vercel serverless** | Free tier sufficient | Free tier sufficient | May need Pro tier ($20/month) for increased function invocations |
| **State management** | Client-side state fine | Client-side state fine | Consider adding persistence (LocalStorage or DB) for draft saving |
| **Rate limiting** | Not needed | Add per-IP rate limiting (10 req/min) | Add per-user rate limiting + CAPTCHA |
| **Image storage** | Base64 in state fine | Base64 in state fine | Store in Cloudinary/S3, return URLs instead |
| **Monitoring** | Console logs | Vercel Analytics | Add Sentry for error tracking, Vercel Analytics for usage metrics |

**Note:** Your architecture is designed to scale horizontally (serverless auto-scales). Main concern is cost management, not technical limits.

## Technology-Specific Notes

### Vite Considerations

- **HMR (Hot Module Replacement):** Works out-of-box; state resets on edit. Use `import.meta.hot.accept()` for preserving state during dev.
- **Build optimization:** Vite automatically code-splits; no config needed for basic app.
- **Environment variables:** Use `VITE_` prefix for client-side vars, but **DO NOT put API keys there** (they're exposed in bundle).

### Vercel Serverless Limitations

- **Timeout:** 10s (Hobby), 60s (Pro). OpenAI usually responds in 5-15s, so this is acceptable.
- **Cold starts:** First request after idle may be slow (~500ms). Not a concern for this use case.
- **Payload size:** Max 4.5MB request body. Images should be URLs or compressed before upload.

### OpenAI via kie.ai

- **Proxy benefits:** Handles rate limiting, provides Lithuanian IP routing if needed.
- **API compatibility:** Uses standard OpenAI SDK format; easy to switch to direct OpenAI later.
- **Rate limits:** Check kie.ai docs for specific limits (varies by plan).

## Confidence Assessment

| Area | Confidence | Source Quality |
|------|------------|----------------|
| React architecture patterns | **HIGH** | Multiple official sources (React.dev, Vercel, Patterns.dev) |
| Serverless AI integration | **HIGH** | AWS official blog, Vercel official docs |
| Streaming implementation | **HIGH** | Vercel AI SDK docs, multiple tutorials |
| Vite + React structure | **HIGH** | Official Vite docs, recent 2026 guides |
| Anti-patterns | **HIGH** | Well-documented in community |

## Summary for Roadmap Creation

**Component dependency graph:**
```
App.jsx (root)
  ↓
  ├─ IndustrySelector (independent)
  ├─ ImageUploader (independent)
  ├─ ImageGenerator (depends on useGenerateImage)
  ├─ PostSettings (independent)
  ├─ PostOutput (depends on useGeneratePost)
  └─ PreviewCard (depends on PostOutput + ImageGenerator)

Hooks:
  useGeneratePost (depends on /api/generate-post.js)
  useGenerateImage (depends on /api/generate-image.js)
```

**Suggested build order for phases:**
1. **Foundation:** API routes + basic hooks + minimal UI
2. **Input layer:** Form components → state → API
3. **Streaming:** Upgrade API + hooks + output component
4. **Images:** Separate feature, can be parallel
5. **Polish:** Error handling, UX refinements

**Architecture decisions validated:**
- ✅ React + Vite: Modern, fast, AI-friendly stack
- ✅ Vercel serverless: Correct choice for AI workloads (auto-scaling, pay-per-use)
- ✅ Client-side state: Appropriate for MVP (no database needed yet)
- ✅ Component structure: Clean separation, follows best practices

**Key risks to address in phases:**
- Phase 1: Ensure streaming works (most complex technical piece)
- Phase 4: DALL-E rate limits and cost management
- Phase 5: Error handling (OpenAI can fail; need graceful degradation)

---

## Sources

### Architecture Patterns
- [Google's Eight Essential Multi-Agent Design Patterns - InfoQ](https://www.infoq.com/news/2026/01/multi-agent-design-patterns/)
- [Top 5 Generative AI Architecture Patterns](https://www.clickittech.com/ai/generative-ai-architecture-patterns/)
- [Serverless generative AI architectural patterns – Part 1 | AWS](https://aws.amazon.com/blogs/compute/serverless-generative-ai-architectural-patterns/)
- [Serverless generative AI architectural patterns – Part 2 | AWS](https://aws.amazon.com/blogs/compute/part-2-serverless-generative-ai-architectural-patterns/)

### React Best Practices (2026)
- [The React + AI Stack for 2026](https://www.builder.io/blog/react-ai-stack-2026)
- [Introducing: React Best Practices - Vercel](https://vercel.com/blog/introducing-react-best-practices)
- [React Architecture Patterns and Best Practices for 2026](https://www.bacancytechnology.com/blog/react-architecture-patterns-and-best-practices)
- [Integrating AI APIs into React Apps | 2026 Guide](https://www.credosystemz.com/blog/integrating-ai-apis-into-react-app/)

### Streaming & AI Integration
- [AI UI Patterns](https://www.patterns.dev/react/ai-ui-patterns/)
- [Build a GPT-3 app with Next.js and Vercel Edge Functions](https://vercel.com/blog/gpt-3-app-next-js-vercel-edge-functions)
- [Real-time AI in Next.js: How to stream responses with the Vercel AI SDK](https://blog.logrocket.com/nextjs-vercel-ai-sdk-streaming/)

### Unidirectional Data Flow
- [Master React Unidirectional Data Flow - CoderPad](https://coderpad.io/blog/development/master-react-unidirectional-data-flow/)
- [ReactJS Unidirectional Data Flow - GeeksforGeeks](https://www.geeksforgeeks.org/reactjs/reactjs-unidirectional-data-flow/)
- [Thinking in React – React](https://react.dev/learn/thinking-in-react)

### Component Patterns
- [Essential React Design Patterns: Guide for 2026](https://trio.dev/essential-react-design-patterns/)
- [Understanding the Composition Pattern in React](https://dev.to/wallacefreitas/understanding-the-composition-pattern-in-react-3dfp)
- [React Component Design Patterns - Part 1](https://dev.to/fpaghar/react-component-design-patterns-part-1-5f0g)

### Project Structure
- [React Folder Structure in 5 Steps [2025]](https://www.robinwieruch.de/react-folder-structure/)
- [React Folder Structure with Vite & TypeScript](https://medium.com/@prajwalabraham.21/react-folder-structure-with-vite-typescript-beginner-to-advanced-9cd12d1d18a6)
- [Understanding Vite Flow and Structure in a React Project](https://medium.com/@vshall/understanding-vite-flow-and-structure-in-a-react-project-8c8672d62a77)

### Anti-Patterns
- [10 React Anti-patterns you should know](https://yosua-halim.medium.com/10-react-anti-patterns-you-should-know-300256bfb007)
- [6 Common React Anti-Patterns](https://itnext.io/6-common-react-anti-patterns-that-are-hurting-your-code-quality-904b9c32e933)
- [React Anti-patterns and Best Practices](https://www.perssondennis.com/articles/react-anti-patterns-and-best-practices-dos-and-donts)

### AI Content Generation Pitfalls
- [Common Pitfalls in AI-Generated Content](https://www.highervisibility.com/seo/learn/common-pitfalls-ai-generated-content/)
- [Generative AI Pitfalls: Common Mistakes](https://medium.com/@sahin.samia/generative-ai-pitfalls-the-common-mistakes-that-can-derail-your-ai-project-d741239d0ffa)
- [Make the Most of AI Content Creation: 10 Common Mistakes to Avoid](https://narrato.io/blog/10-ai-content-creation-mistakes-to-avoid/)

### DALL-E Integration
- [How to Generate Images using React and the Dall-E 2 API](https://www.freecodecamp.org/news/generate-images-using-react-and-dall-e-api-react-and-openai-api-tutorial/)
- [Build a React Application for AI-Powered Image Generation Using OpenAI DALL-E API](https://kinsta.com/blog/ai-image-generator/)
- [Implementing an event-driven serverless story generation with ChatGPT and DALL-E](https://aws.amazon.com/blogs/compute/implementing-an-event-driven-serverless-story-generation-application-with-chatgpt-and-dall-e/)

### Vercel Serverless Best Practices
- [Case Study: Solving Vercel's 10-Second Limit with QStash](https://medium.com/@kolbysisk/case-study-solving-vercels-10-second-limit-with-qstash-2bceeb35d29b)
- [Why Vercel overhauled its serverless infrastructure for the AI era](https://www.runtime.news/why-vercel-overhauled-its-serverless-infrastructure-for-the-ai-era/)
- [How AI Gateway runs on Fluid compute](https://vercel.com/blog/how-ai-gateway-runs-on-fluid-compute)

### State Management
- [AI SDK RSC: Managing Generative UI State](https://ai-sdk.dev/docs/ai-sdk-rsc/generative-ui-state)
- [Building real-time state management with React and Fluent-State](https://blog.logrocket.com/building-real-time-state-management-react-fluent-state/)
