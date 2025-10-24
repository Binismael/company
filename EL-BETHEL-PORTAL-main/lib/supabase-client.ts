import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

const missingEnv = !url || !anon
if (missingEnv) {
  // Avoid throwing during build; runtime pages should handle missing envs gracefully
  // eslint-disable-next-line no-console
  console.warn("Supabase env vars are missing: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Export a safe default that doesn't throw on import. If envs are missing, any access
// to Supabase methods will throw with a clear error message.
export const supabase: SupabaseClient = !missingEnv
  ? createClient(url!, anon!)
  : (new Proxy(
      {},
      {
        get() {
          throw new Error(
            "Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
          )
        },
      }
    ) as unknown as SupabaseClient)

export const hasSupabaseConfig = !missingEnv
