# Star Wars AI Personality Quiz

A React quiz that turns free-text answers into trait scores, matches you to a Star Wars character, and shows an animated results screen. Trait inference can use **Google Gemini** on the server (structured JSON) or fall back to a **deterministic, local text analyzer** so the app still works without the API. A separate explanation endpoint can generate a grounded "Holocron Reading" from structured trait data.

## Stack

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4** (Vite plugin)
- **Framer Motion** for transitions
- **Vercel serverless** — `api/analyze.ts` + `api/explain.ts`
- **Gemini 2.5 Flash** (`gemini-2.5-flash`) when `GEMINI_API_KEY` is set

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment file:

```bash
cp .env.example .env
```

3. Set `GEMINI_API_KEY` in `.env` for AI-powered analysis/explanations on deployed or `vercel dev` environments. `VITE_GEMINI_API_KEY` is reserved for parity; the browser does **not** call Gemini directly.

4. Run the dev server:

```bash
npm run dev
```

Plain `vite` does not mount `/api/*`, so analysis uses the **built-in deterministic pipeline** automatically (same logic the server falls back to when Gemini fails or is unset). To exercise the real API locally:

```bash
npx vercel dev
```

## Other scripts

| Command          | Purpose                          |
|------------------|----------------------------------|
| `npm run build`  | Typecheck + production Vite build |
| `npm run preview`| Serve the production build        |
| `npm run lint`   | ESLint                            |
| `npm run dry-run:explain` | Runs explain fixtures against `/api/explain` (with `vercel dev`) |

## How it works

1. **Questions** — Each session has **five** open-ended prompts: **three fixed** (conflict, power, moral ambiguity) plus **two randomly sampled** from a rotating pool (including risk, communication, and others), so replays vary which traits get extra coverage.
2. **Submit** — Answers must be at least **12 characters** per question. The client POSTs to `/api/analyze` with `answers` and optional per-question metadata (`id`, `primaryTraits`) so the backend can weight answers by which traits each question targets.
3. **Analysis** — With a valid API key, the server asks Gemini for structured trait JSON, validates it, and returns normalized scores. Otherwise (or on Gemini/validation failure), the server uses `analyzeTextResponses`: keyword- and style-based heuristics with **no randomness** for identical inputs.
4. **Matching** — `mapTraitsToCharacter` scores the user against a roster of **Star Wars profiles** using a weighted similarity layer (`similarity.ts`); partial character profiles only compare traits that are defined.
5. **UI** — Home → quiz → loading → result with character card, trait breakdown, and explanation card. The result renders immediately, then requests `/api/explain` in parallel; a skeleton is shown until the explanation arrives (or deterministic fallback is used).
6. **Explanation** — `/api/explain` receives only structured fields (traits + aligned/divergent signals + matched character), calls Gemini for prose, and applies tiered caching (in-memory + KV when configured). Raw answers are not sent.

Personality traits are a **two-layer model** (cognitive vs. expression), all normalized to **0..1**. See `src/types/quiz.ts` for the full trait list and related types.

## Project layout

```text
src/
  components/     # QuestionCard, ResultCard, TraitBreakdown, LoadingScreen, …
  pages/          # Home, Quiz, Result
  hooks/          # useQuiz — flow and submission
  lib/            # questions, traits, analysis, similarity, characterMapping,
  |               # characterThemes, api, explainApi, explainPayload, explanation,
  |               # debugGeminiClient; analysis/explainMatch sub-module
  types/          # quiz and result types
api/
  analyze.ts      # POST handler: Gemini → validate, or deterministic traits
  explain.ts      # POST handler: Gemini explanation with fallback + cache
  _lib/           # gemini client, prompt/explainPrompt, response validation, cache,
  |               # parseJsonBody, debugGemini; explainer/ provider sub-module
```

## Notes

- Error handling and validation are included on both client and API.
- UI is dark-themed, responsive, and uses a full-page background asset under `public/`.
- For production deployment, configure `GEMINI_API_KEY` in the Vercel project environment; the frontend build does not embed that secret.
- Optional controls for explanation route: `EXPLAIN_DISABLED`, `EXPLAIN_PROVIDER` (provider selector; currently only `"gemini"`), `GEMINI_EXPLAIN_MODEL`, `EXPLAIN_RATE_LIMIT_PER_MINUTE`, and KV credentials (`KV_REST_API_URL`, `KV_REST_API_TOKEN`).
- Local debug pair `DEBUG_GEMINI_RAW` + `VITE_DEBUG_GEMINI_RAW` echoes raw Gemini text into API responses when both are set to `true`. **Never enable in production.**
