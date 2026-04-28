# Star Wars AI Personality Quiz

Production-ready baseline scaffold for a React + Vite + Tailwind + Framer Motion frontend with a Vercel serverless Gemini analysis endpoint.

## Stack

- React + Vite + TypeScript
- Tailwind CSS
- Framer Motion
- Vercel serverless functions (`api/analyze.ts`)
- Google Gemini Flash API

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env file:

```bash
cp .env.example .env
```

3. Set variables in `.env`:

- `GEMINI_API_KEY` for backend API access
- `VITE_GEMINI_API_KEY` is included for parity with requirements, but frontend does **not** call Gemini directly.

4. Run frontend:

```bash
npm run dev
```

5. For local API routes, run with Vercel dev:

```bash
npx vercel dev
```

## App Flow

1. User answers 5 open-ended prompts
2. Frontend posts answers to `/api/analyze`
3. Backend asks Gemini to return structured trait JSON
4. Traits are normalized/clamped to 0..1
5. Frontend deterministically maps traits to a Star Wars character
6. Animated result screen displays character + alignment + trait bars

## File Structure

```text
src/
  components/
  pages/
  hooks/
  lib/
  types/
api/
  analyze.ts
```

## Notes

- Error states and input validation are included
- Mobile responsive and dark-themed styles are included
- Includes Try Again and Share Result actions
