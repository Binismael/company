'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { toast } from 'sonner'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/auth/reset-password`,
      })

      if (resetError) {
        throw new Error(resetError.message)
      }

      setSubmitted(true)
      toast.success('Password reset link sent to your email!')
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to send reset link. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex flex-col justify-center items-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Back Link */}
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-medium mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <Card className="shadow-xl border-0 rounded-2xl">
          {submitted ? (
            <>
              <CardHeader className="text-center pb-6">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Check Your Email</CardTitle>
                <CardDescription className="mt-2">
                  We've sent a password reset link to:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <p className="font-medium text-gray-900">{email}</p>
                </div>

                <div className="space-y-4 text-sm text-gray-600">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>Check your email inbox (and spam folder)</li>
                    <li>Click the password reset link</li>
                    <li>Enter your new password</li>
                    <li>Log in with your new password</li>
                  </ol>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-4">
                    Didn't receive the email?
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSubmitted(false)
                      setEmail('')
                      setError('')
                    }}
                  >
                    Try Again
                  </Button>
                </div>

                <Link href="/auth/login">
                  <Button variant="ghost" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </CardContent>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Forgot Password?</CardTitle>
                <CardDescription className="mt-2">
                  Enter your email address and we'll send you a link to reset your password.
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
                    <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="rounded-lg"
                      autoFocus
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use the email address associated with your account
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending Link...
                      </>
                    ) : (
                      'Send Reset Link'
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
