import type { VercelRequest, VercelResponse } from '@vercel/node'

type TraitScores = {
  leadership: number
  morality: number
  impulsiveness: number
  independence: number
}

const GEMINI_PROMPT = `Analyze the user's responses and extract personality traits.

Return ONLY valid JSON in this format:
{
"leadership": number (0 to 1),
"morality": number (0 to 1, where 0 = dark side, 1 = light side),
"impulsiveness": number (0 to 1),
"independence": number (0 to 1)
}

User responses:
{{answers}}

Do not include any explanation or extra text.`

function clamp01(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0.5
  return Math.max(0, Math.min(1, value))
}

function normalizeTraits(data: Partial<TraitScores>): TraitScores {
  return {
    leadership: clamp01(data.leadership ?? 0.5),
    morality: clamp01(data.morality ?? 0.5),
    impulsiveness: clamp01(data.impulsiveness ?? 0.5),
    independence: clamp01(data.independence ?? 0.5),
  }
}

function parseGeminiJson(rawText: string): TraitScores {
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  const parsed = JSON.parse(cleaned) as Partial<TraitScores>
  return normalizeTraits(parsed)
}

async function callGemini(answers: string[]): Promise<TraitScores> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server')
  }

  const prompt = GEMINI_PROMPT.replace('{{answers}}', answers.map((a, i) => `${i + 1}. ${a}`).join('\n'))

  // Example Gemini request shape for gemini-2.0-flash
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
  )

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${body}`)
  }

  const data = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('Gemini did not return any text output')
  }

  return parseGeminiJson(text)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { answers } = req.body as { answers?: unknown }

    if (!Array.isArray(answers) || answers.length !== 5 || !answers.every((item) => typeof item === 'string')) {
      return res.status(400).json({ error: 'Invalid payload. Expecting { answers: string[5] }' })
    }

    const trimmedAnswers = answers.map((value) => value.trim()).filter(Boolean)
    if (trimmedAnswers.length !== 5) {
      return res.status(400).json({ error: 'All five answers must be non-empty strings' })
    }

    const traits = await callGemini(trimmedAnswers)
    return res.status(200).json(traits)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown server error'
    return res.status(500).json({ error: message })
  }
}
