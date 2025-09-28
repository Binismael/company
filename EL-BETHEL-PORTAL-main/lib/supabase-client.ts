import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

if (!url || !anon) {
  // Avoid throwing during build; runtime pages should handle missing envs gracefully
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

export const supabase = createClient(url || "", anon || "")
