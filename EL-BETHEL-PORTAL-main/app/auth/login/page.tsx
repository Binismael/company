'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminCode, setAdminCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // OPTIONAL client-side quick check (recommended to move server-side)
      // NOTE: do NOT store real ADMIN_REG_CODE in client-side env in production
      if (!process.env.NEXT_PUBLIC_ALLOW_CLIENT_ADMIN_CODE) {
        // skip client check -- rely on server or DB+role checks below
      } else {
        if (adminCode.trim() !== (process.env.NEXT_PUBLIC_ADMIN_REG_CODE ?? 'ELBETA2025ADMIN')) {
          toast.error('Invalid admin security code')
          setLoading(false)
          return
        }
      }

      // sign in via Supabase Auth
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        console.error('Sign-in error:', signInError)
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

      // Lookup admin on public.users by id OR auth_id OR email, and ensure role = 'admin'
      const orFilter = `id.eq.${user.id},auth_id.eq.${user.id},email.eq.${email}`

      const { data: adminUser, error: adminError } = await supabase
        .from('users')
        .select('id, email, role, auth_id')
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
        toast.error('User account not found in the system. Please contact your administrator to create your account.')
        setLoading(false)
        return
      }

      // Success
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
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md space-y-4">
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

        <input
          type="text"
          placeholder="Admin Security Code"
          value={adminCode}
          onChange={(e) => setAdminCode(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
          {loading ? 'Logging in…' : 'Login as Admin'}
        </button>
      </form>
    </div>
  )
}
