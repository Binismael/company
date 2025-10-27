export function getErrorMessage(input: unknown, fallback = 'An unexpected error occurred'): string {
  try {
    if (!input) return fallback

    if (typeof input === 'string') return input.trim() || fallback

    if (input instanceof Error) return input.message || fallback

    if (typeof input === 'object') {
      const anyInput = input as any

      // Common shapes: { message }, { error: string|{message}}, { data: { message } }
      if (typeof anyInput.message === 'string' && anyInput.message) return anyInput.message
      if (anyInput.error) return getErrorMessage(anyInput.error, fallback)
      if (anyInput.data) return getErrorMessage(anyInput.data, fallback)

      // Supabase/PostgREST errors often have 'details' or 'hint'
      if (typeof anyInput.details === 'string' && anyInput.details) return anyInput.details
      if (typeof anyInput.hint === 'string' && anyInput.hint) return anyInput.hint

      // Try to serialize known informative fields first
      const fields = ['code', 'status', 'title', 'description', 'detail']
      for (const key of fields) {
        if (typeof anyInput[key] === 'string' && anyInput[key]) return anyInput[key]
      }

      // As a last resort, safe stringify without throwing on circular refs
      const cache = new WeakSet()
      const json = JSON.stringify(anyInput, (_k, v) => {
        if (typeof v === 'object' && v !== null) {
          if (cache.has(v)) return undefined
          cache.add(v)
        }
        return v
      })
      if (json && json !== '{}' && json !== '[]') return json
    }
  } catch {
    // ignore and fall back
  }
  return fallback
}
