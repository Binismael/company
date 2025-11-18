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

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Learning',
      description: 'Personalized education with advanced AI tutoring',
    },
    {
      icon: Zap,
      title: 'Real-time Collaboration',
      description: 'Interactive classrooms and instant feedback',
    },
    {
      icon: Shield,
      title: 'Advanced Security',
      description: 'Secure authentication and protected data',
    },
  ]

  const stats = [
    { label: 'Active Students', value: '1,200+', icon: Users },
    { label: 'Expert Teachers', value: '85+', icon: BookOpen },
  ]

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!fullName.trim()) {
      setError('Full name is required')
      return
    }
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized. Please check your environment variables.')
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: { full_name: fullName, role },
        },
      })

      if (signupError) {
        const errorMsg = signupError.message || 'Unknown error'
        console.error('Signup error:', errorMsg)
        throw new Error(errorMsg)
      }

      if (!data.user) {
        throw new Error('Failed to create account - no user returned')
      }

      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

        if (signInError) {
          console.warn('Auto sign-in failed:', signInError.message)
          toast.success('Account created! Please log in.')
          router.push('/auth/login')
          return
        }
      } catch (signInErr: any) {
        console.warn('Auto sign-in error:', signInErr.message)
        toast.success('Account created! Please log in.')
        router.push('/auth/login')
        return
      }

      toast.success('Account created and logged in!')
      router.push('/student-dashboard')
    } catch (err: any) {
      const errorMessage = err?.message || 'Registration failed'
      console.error('Registration error:', errorMessage, err)

      if (errorMessage.includes('Failed to fetch')) {
        setError('Unable to reach the server. Please check your internet connection and try again.')
      } else if (errorMessage.includes('Invalid API key')) {
        setError('Authentication service misconfigured. Please contact support.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F291857ff22134997b4885aff7248bbb5%2Fee4263e9927d42dba9246b8809a43ad7?format=webp&width=800"
              alt="El Bethel Academy Logo"
              className="h-24 w-24"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-1">
            El Bethel Academy
          </h1>
          <p className="text-lg text-gray-500 mb-2">Minna</p>
          <p className="text-xl text-secondary-500 font-medium">
            Next-Generation Learning Platform
          </p>
        </div>

        {/* Stats and Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {/* Stats */}
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <Icon className="h-6 w-6 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Features */}
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <div key={feature.title} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
                <Icon className="h-6 w-6 text-primary-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            🤖 AI-Enhanced
          </Badge>
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            ☁️ Cloud-Native
          </Badge>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            📱 Mobile-First
          </Badge>
        </div>
      </div>

      {/* Registration Section */}
      <div className="max-w-md mx-auto px-4 pb-12">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F291857ff22134997b4885aff7248bbb5%2Fee4263e9927d42dba9246b8809a43ad7?format=webp&width=800"
                alt="El Bethel Academy Logo"
                className="h-12 w-12"
              />
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join El Bethel Academy today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-700">
                  I am a
                </label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-lg">
                    <SelectValue placeholder="Select your role" />
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

              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-1.5 text-gray-700">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jane Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                  className="rounded-lg"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="rounded-lg"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    className="rounded-lg pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label="Toggle password visibility"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5 text-gray-700">
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    className="rounded-lg pr-10"
                    required
                  />
                  <button
                    type="button"
                    aria-label="Toggle confirm password visibility"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Links */}
              <div className="space-y-2 text-sm text-center">
                <p>
                  Already have an account?{' '}
                  <Link
                    href="/auth/login"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-600">
          <p>Powered by Next.js 15 • Cloud Technology</p>
          <p className="mt-1">© 2025 El Bethel Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
