# Star Wars AI Personality Quiz

A React quiz that turns free-text answers into trait scores, matches you to a Star Wars character, and shows an animated results screen. Trait inference can use **Google Gemini** on the server (structured JSON) or fall back to a **deterministic, local text analyzer** so the app still works without the API.

## Stack

- **React 19** + **Vite 8** + **TypeScript**
- **Tailwind CSS 4** (Vite plugin)
- **Framer Motion** for transitions
- **Vercel serverless** — `api/analyze.ts` (15s max duration in `vercel.json`)
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

3. Set `GEMINI_API_KEY` in `.env` for AI-powered analysis on deployed or `vercel dev` environments. `VITE_GEMINI_API_KEY` is reserved for parity; the browser does **not** call Gemini for analysis (only the serverless route does).

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

## How it works

1. **Questions** — Each session has **five** open-ended prompts: **three fixed** (conflict, risk, communication) plus **two randomly sampled** from a rotating pool, so replays vary which traits get extra coverage.
2. **Submit** — Answers must be at least **12 characters** per question. The client POSTs to `/api/analyze` with `answers` and optional per-question metadata (`id`, `primaryTraits`) so the backend can weight answers by which traits each question targets.
3. **Analysis** — With a valid API key, the server asks Gemini for structured trait JSON, validates it, and returns normalized scores. Otherwise (or on Gemini/validation failure), the server uses `analyzeTextResponses`: keyword- and style-based heuristics with **no randomness** for identical inputs.
4. **Matching** — `mapTraitsToCharacter` scores the user against a roster of **Star Wars profiles** using a weighted similarity layer (`similarity.ts`); partial character profiles only compare traits that are defined.
5. **UI** — Home → quiz → loading → result with character card, trait breakdown, optional analysis copy, **Try again** (resets to home), and **Share** (Web Share API or clipboard fallback).

Personality traits are a **two-layer model** (cognitive vs. expression), all normalized to **0..1**. See `src/types/quiz.ts` for the full trait list and related types.

## Project layout

```text
src/
  components/     # QuestionCard, ResultCard, TraitBreakdown, LoadingScreen, …
  pages/          # Home, Quiz, Result
  hooks/          # useQuiz — flow and submission
  lib/            # questions, traits, analysis, similarity, characterMapping, api, explanation
  types/          # quiz and result types
api/
  analyze.ts      # POST handler: Gemini → validate, or deterministic traits
  _lib/           # gemini client, prompt + JSON schema, response validation
```

## Notes

- Error handling and validation are included on both client and API.
- UI is dark-themed, responsive, and uses a full-page background asset under `public/`.
- For production deployment, configure `GEMINI_API_KEY` in the Vercel project environment; the frontend build does not embed that secret.
