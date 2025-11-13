'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('fullName') as string

    // 👇 Sign up WITHOUT email confirmation
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: undefined,
        data: { full_name: fullName },
      },
    })

    if (error) {
      console.error(error)
      toast.error(error.message)
      setLoading(false)
      return
    }

    // 👇 Immediately log in after successful signup
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    setLoading(false)

    if (signInError) {
      toast.error(signInError.message)
    } else {
      toast.success('Account created successfully!')
      router.push('/student-dashboard') // or /admin-dashboard if you auto-assign admins
    }
  }

  return (
    <form onSubmit={handleSignup} className="max-w-sm mx-auto space-y-4 p-6">
      <h1 className="text-xl font-semibold">Create an Account</h1>
      <input
        name="fullName"
        placeholder="Full Name"
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="email"
        name="email"
        placeholder="Email"
        className="w-full border p-2 rounded"
        required
      />
      <input
        type="password"
        name="password"
        placeholder="Password"
        className="w-full border p-2 rounded"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        {loading ? 'Creating...' : 'Sign Up'}
      </button>
    </form>
  )
}
