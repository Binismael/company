import { createClient, type SupabaseClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string | undefined

export const supabaseAdmin: SupabaseClient | null = url && serviceKey ? createClient(url, serviceKey) : null

export const hasServiceRole = Boolean(url && serviceKey)
