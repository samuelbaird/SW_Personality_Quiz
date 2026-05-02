import type { VercelRequest } from '@vercel/node'

/**
 * Vercel / local dev sometimes delivers `req.body` as a string or Buffer instead
 * of a pre-parsed object. Normalize to the parsed JSON value.
 */
export function getJsonBody(req: VercelRequest): unknown {
  const raw = req.body as unknown
  if (raw == null) return undefined

  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(raw)) {
    try {
      return JSON.parse(raw.toString('utf8')) as unknown
    } catch {
      return undefined
    }
  }

  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as unknown
    } catch {
      return undefined
    }
  }

  if (typeof raw === 'object') {
    return raw
  }

  return undefined
}
