'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CheckCircle, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [sessionError, setSessionError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    // Check if there's a valid session from the reset link
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setSessionError(true)
      }
    }
    checkSession()
  }, [])

  const validatePassword = (pwd: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (pwd.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
    if (!/[A-Z]/.test(pwd)) {
      errors.push('Password must contain at least one uppercase letter')
    }
    if (!/[0-9]/.test(pwd)) {
      errors.push('Password must contain at least one number')
    }

    return { valid: errors.length === 0, errors }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    const validation = validatePassword(password)
    if (!validation.valid) {
      setError(validation.errors[0])
      return
    }

    setLoading(true)

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        throw new Error(updateError.message)
      }

      setSubmitted(true)
      toast.success('Password updated successfully!')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to reset password. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (sessionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="max-w-md w-full">
          <Card className="shadow-xl border-0 rounded-2xl">
            <CardHeader className="text-center pb-6">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <p className="text-gray-600 text-center">
                The password reset link is invalid or has expired. Please request a new one.
              </p>

              <Link href="/auth/forgot-password">
                <Button className="w-full">Request New Reset Link</Button>
              </Link>

              <Link href="/auth/login">
                <Button variant="outline" className="w-full">
                  Back to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full">
        <Card className="shadow-xl border-0 rounded-2xl">
          {submitted ? (
            <>
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Password Reset Successful</CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <p className="text-gray-600 text-center">
                  Your password has been updated successfully. You will be redirected to the login page in a moment.
                </p>

                <Link href="/auth/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Create New Password</CardTitle>
                <CardDescription className="mt-2">
                  Enter a strong password to secure your account.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-gray-700">
                      New Password
                    </label>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      className="rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Minimum 6 characters, include uppercase letter and number
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium mb-1.5 text-gray-700">
                      Confirm Password
                    </label>
                    <Input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={loading}
                      className="rounded-lg"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="show-password"
                      checked={showPassword}
                      onChange={(e) => setShowPassword(e.target.checked)}
                      className="rounded"
                    />
                    <label htmlFor="show-password" className="text-sm text-gray-600 cursor-pointer">
                      Show password
                    </label>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Resetting...
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link
                      href="/auth/login"
                      className="text-primary-600 hover:text-primary-700 font-medium"
                    >
                      Sign In
                    </Link>
                  </p>
                </div>
              </CardContent>
            </>
          )}
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-xs text-gray-600">
          <p>© 2025 El Bethel Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
