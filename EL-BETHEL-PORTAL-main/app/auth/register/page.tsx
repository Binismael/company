'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Eye, EyeOff, Brain, Zap, Shield, Users, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export default function RegisterPage() {
  const router = useRouter()

  const [role, setRole] = useState('student')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) return setError('Full name is required')
    if (!email.trim()) return setError('Email is required')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    if (password !== confirmPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      })

      if (signupError) throw new Error(signupError.message)
      if (!data.user) throw new Error('Account created but no user returned')

      // Auto create user profile in the users table
      await supabase.from('users').insert({
        id: data.user.id,
        email,
        full_name: fullName,
        role,
      })

      toast.success('Account created successfully! Please log in.')
      router.push('/auth/login')
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Brain, title: 'AI-Powered Learning', description: 'Personalized education with AI' },
    { icon: Zap, title: 'Real-time Collaboration', description: 'Instant teacher feedback' },
    { icon: Shield, title: 'Secure Platform', description: 'Protected student data' },
  ]

  const stats = [
    { label: 'Active Students', value: '1,200+', icon: Users },
    { label: 'Expert Teachers', value: '85+', icon: BookOpen },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img
              src="/logo.png"
              alt="El Bethel Academy Logo"
              className="h-24 w-24"
            />
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">El Bethel Academy</h1>
          <p className="text-lg text-gray-500">Minna</p>
        </div>

        {/* Stats & Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-primary-600" />
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {features.map((f) => {
            const Icon = f.icon
            return (
              <div key={f.title} className="bg-white rounded-lg p-4 shadow-sm border">
                <Icon className="h-6 w-6 text-primary-600 mb-3" />
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-sm text-gray-600">{f.description}</p>
              </div>
            )
          })}
        </div>

        {/* Badges */}
        <div className="flex justify-center gap-2 mb-10">
          <Badge variant="outline">AI-Enhanced</Badge>
          <Badge variant="outline">Cloud-Native</Badge>
          <Badge variant="outline">Mobile-First</Badge>
        </div>
      </div>

      {/* Registration Form */}
      <div className="max-w-md mx-auto px-4 pb-12">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>Join El Bethel Academy</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="text-sm font-medium">I am a</label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="bursar">Bursar</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="Full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />

              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <Input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
              </Button>

              <p className="text-center text-sm mt-3">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 font-semibold">Sign in</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
