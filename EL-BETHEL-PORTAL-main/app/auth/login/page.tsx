'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        toast.error('Invalid credentials')
        setLoading(false)
        return
      }

      const user = signInData.user
      if (!user) {
        toast.error('User not found after sign-in')
        setLoading(false)
        return
      }

      const MAIN_ADMIN_EMAIL = 'abdulmuizismael@gmail.com'
      if (email.trim().toLowerCase() === MAIN_ADMIN_EMAIL.toLowerCase()) {
        toast.success('Welcome back, Super Admin!')
        router.push('/admin-dashboard')
        return
      }

      const orFilter = `id.eq.${user.id},auth_id.eq.${user.id},email.eq.${email}`
      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id,email,role')
        .or(orFilter)
        .eq('role', 'admin')
        .maybeSingle()

      if (adminError) {
        console.error('Admin lookup error:', adminError)
        toast.error('Database error — contact support')
        setLoading(false)
        return
      }

      if (!adminUser) {
        toast.error('User account not found in the system. Please contact your administrator.')
        setLoading(false)
        return
      }

      toast.success('Welcome back, Admin!')
      router.push('/admin-dashboard')
    } catch (err) {
      console.error('Unexpected login error:', err)
      toast.error('Unexpected error during login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-4"
      >
        <h1 className="text-2xl font-bold text-center">Admin Login</h1>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? 'Logging in…' : 'Login as Admin'}
        </button>
      </form>
    </div>
  )
}
