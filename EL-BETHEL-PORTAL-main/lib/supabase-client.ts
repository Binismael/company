import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables.")
  console.error("URL:", supabaseUrl ? "Set" : "Not set")
  console.error("Key:", supabaseAnonKey ? "Set" : "Not set")
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    fetch: fetch.bind(globalThis),
    headers: {
      "X-Client-Info": "supabase-js/2.57.4",
    },
  },
})
