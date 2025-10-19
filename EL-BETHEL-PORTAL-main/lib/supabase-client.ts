import { createClient } from "@supabase/supabase-js"

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string | undefined

const createMockSupabase = () => {
  const error = new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
  )

  const makeQueryBuilder = () => {
    const builder: any = {
      select: () => builder,
      insert: () => Promise.reject(error),
      update: () => builder,
      delete: () => builder,
      upsert: () => Promise.reject(error),
      eq: () => builder,
      neq: () => builder,
      lt: () => builder,
      lte: () => builder,
      gt: () => builder,
      gte: () => builder,
      like: () => builder,
      ilike: () => builder,
      in: () => builder,
      order: () => builder,
      limit: () => builder,
      range: () => builder,
      single: () => Promise.reject(error),
      maybeSingle: () => Promise.reject(error),
    }
    return builder
  }

  return {
    auth: {
      signInWithPassword: async () => {
        throw error
      },
      signUp: async () => {
        throw error
      },
      signOut: async () => {
        throw error
      },
      getUser: async () => {
        throw error
      },
      getSession: async () => {
        throw error
      },
      verifyOtp: async () => {
        throw error
      },
      resetPasswordForEmail: async () => {
        throw error
      },
      updateUser: async () => {
        throw error
      },
    },
    from: () => makeQueryBuilder(),
    storage: {
      from: () => makeQueryBuilder(),
    },
    rpc: async () => {
      throw error
    },
  } as any
}

export const supabase = url && anon ? createClient(url, anon) : createMockSupabase()
