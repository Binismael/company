'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function CreateUserPage() {
  const router = useRouter()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'student' as 'student' | 'teacher' | 'admin',
    class_id: '',
    subject_id: ''
  })

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getSession()
      setAccessToken(data.session?.access_token || null)
    }
    load()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accessToken) {
      toast.error('Not authenticated')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(form),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload.error || 'Failed to create user')
      toast.success('User created successfully')
      setForm({ full_name: '', email: '', password: '', role: 'student', class_id: '', subject_id: '' })
    } catch (err: any) {
      toast.error(err.message || 'Error creating user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New User</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input name="full_name" placeholder="Full Name" value={form.full_name} onChange={handleChange} required />
            <Input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
            <Input name="password" type="password" placeholder="Temporary Password" value={form.password} onChange={handleChange} required />
            <select name="role" value={form.role} onChange={handleChange} className="w-full border rounded px-3 py-2">
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
            {form.role === 'student' && (
              <Input name="class_id" placeholder="Class ID" value={form.class_id} onChange={handleChange} />
            )}
            {form.role === 'teacher' && (
              <Input name="subject_id" placeholder="Subject ID" value={form.subject_id} onChange={handleChange} />
            )}
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Creating…' : 'Create User'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
