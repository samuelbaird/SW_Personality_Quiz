import { kv } from '@vercel/kv'

interface MemoryEntry {
  value: string
  expiresAt: number
}

const memoryCache = new Map<string, MemoryEntry>()
const MEMORY_MAX_ENTRIES = 500
const MEMORY_TTL_SECONDS = 60 * 60
const KV_TTL_SECONDS = 60 * 60 * 24 * 30

function hasKvConfig(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
}

function nowMs(): number {
  return Date.now()
}

function getMemory(key: string): string | null {
  const entry = memoryCache.get(key)
  if (!entry) return null
  if (entry.expiresAt <= nowMs()) {
    memoryCache.delete(key)
    return null
  }

  memoryCache.delete(key)
  memoryCache.set(key, entry)
  return entry.value
}

function setMemory(key: string, value: string): void {
  memoryCache.set(key, {
    value,
    expiresAt: nowMs() + MEMORY_TTL_SECONDS * 1000,
  })

  if (memoryCache.size <= MEMORY_MAX_ENTRIES) {
    return
  }

  const oldestKey = memoryCache.keys().next().value
  if (oldestKey) {
    memoryCache.delete(oldestKey)
  }
}

export async function getExplainCache(key: string): Promise<{ value: string | null; layer: 'memory' | 'kv' | 'miss' }> {
  const fromMemory = getMemory(key)
  if (fromMemory) {
    return { value: fromMemory, layer: 'memory' }
  }

  if (!hasKvConfig()) {
    return { value: null, layer: 'miss' }
  }

  try {
    const value = await kv.get<string>(key)
    if (typeof value !== 'string' || value.length === 0) {
      return { value: null, layer: 'miss' }
    }

    setMemory(key, value)
    return { value, layer: 'kv' }
  } catch {
    return { value: null, layer: 'miss' }
  }
}

export async function setExplainCache(key: string, value: string): Promise<void> {
  setMemory(key, value)
  if (!hasKvConfig()) {
    return
  }

  try {
    await kv.set(key, value, { ex: KV_TTL_SECONDS })
  } catch {
    // Non-fatal: in-memory cache still works.
  }
}

export async function checkRateLimit(ip: string, maxPerMinute: number): Promise<boolean> {
  if (!hasKvConfig()) {
    return true
  }

  const window = Math.floor(Date.now() / 60000)
  const key = `explain:ratelimit:${ip}:${window}`
  try {
    const count = await kv.incr(key)
    if (count === 1) {
      await kv.expire(key, 70)
    }
    return count <= maxPerMinute
  } catch {
    return true
  }
}
