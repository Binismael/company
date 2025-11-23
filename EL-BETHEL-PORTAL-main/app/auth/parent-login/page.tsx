'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Eye, EyeOff, Users } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function ParentLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Email is required')
      return
    }
    if (!password) {
      setError('Password is required')
      return
    }

    setLoading(true)
    try {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        throw new Error(signInError.message)
      }

      if (!signInData.user) {
        throw new Error('Failed to authenticate')
      }

      // Check if user is a parent
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role, is_approved')
        .eq('id', signInData.user.id)
        .single()

      if (userError) {
        throw new Error(userError.message)
      }

      if (userData.role !== 'parent') {
        throw new Error('This account is not authorized as a parent')
      }

      if (!userData.is_approved) {
        throw new Error('Your account is pending approval')
      }

      toast.success('Login successful!')
      router.push('/parent-dashboard')
    } catch (err: any) {
      setError(err?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex flex-col">
      {/* Header */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-gray-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">El Bethel Academy</h1>
              <p className="text-xs text-gray-500">Parent Portal</p>
            </div>
          </div>
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
            Student Login
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Illustration */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Parent Login</h2>
            <p className="text-gray-600">
              Access your child's academic records and progress
            </p>
          </div>

          {/* Login Card */}
          <Card className="shadow-lg border-0 rounded-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">Sign in to your account</CardTitle>
              <CardDescription>
                Enter your email and password to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-50 border-red-200">
                    <AlertDescription className="text-red-800">{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="parent@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    className="rounded-lg border-gray-300"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="rounded-lg border-gray-300 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-gray-300 text-blue-600"
                      disabled={loading}
                    />
                    <span className="text-gray-700">Remember me</span>
                  </label>
                  <Link href="/auth/forgot-password" className="text-blue-600 hover:text-blue-700 font-medium">
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </form>

              {/* Footer Links */}
              <div className="mt-6 space-y-3 border-t border-gray-200 pt-6">
                <p className="text-center text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-semibold">
                    Register here
                  </Link>
                </p>
                <p className="text-center text-xs text-gray-500">
                  Student? Use your{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
                    student login
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Help Section */}
          <div className="mt-8 bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Need help?</h3>
            <p className="text-xs text-gray-600 mb-3">
              Contact the school admin if you don't have a parent account yet.
            </p>
            <Link
              href="mailto:admin@elbethel.edu"
              className="inline-block text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              Contact Admin
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-t border-gray-200 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-xs text-gray-600">
          <p>© 2025 El Bethel Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
