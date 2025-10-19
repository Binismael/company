'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { findStudentByRegNumber } from '@/lib/registration-utils'

export default function LoginPage() {
  const router = useRouter()
  const [loginType, setLoginType] = useState<'email' | 'reg-number'>('email')
  const [email, setEmail] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      let loginEmail = email

      // If logging in with registration number, find the student's email
      if (loginType === 'reg-number') {
        if (!regNumber.trim()) {
          throw new Error('Registration number is required')
        }

        const student = await findStudentByRegNumber(regNumber)
        if (!student) {
          throw new Error('Registration number not found')
        }

        // Get the associated user's email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', student.user_id)
          .single()

        if (userError || !userData) {
          throw new Error('User account not found for this registration number')
        }

        loginEmail = userData.email
      }

      // Sign in with email and password
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        })

      if (authError) throw new Error(authError.message)

      if (authData.user) {
        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)
          .single()

        if (userError) throw new Error('User not found')

        // Store user data in session storage
        sessionStorage.setItem('user', JSON.stringify(userData))
        sessionStorage.setItem('session', JSON.stringify(authData.session))

        // Redirect based on role
        const roleRoutes: Record<string, string> = {
          admin: '/admin-dashboard',
          teacher: '/teacher-dashboard',
          student: '/student-dashboard',
          parent: '/parent-dashboard',
          bursar: '/bursar-dashboard',
        }

        router.push(roleRoutes[userData.role] || '/student-dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            El Bethel Academy
          </h1>
          <p className="text-gray-600">Next-Generation Learning Platform</p>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Login</CardTitle>
            <CardDescription>
              Sign in to your account to access the portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email' | 'reg-number')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="reg-number">Registration #</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-1">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
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
              </TabsContent>

              <TabsContent value="reg-number" className="space-y-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <label htmlFor="reg-number" className="block text-sm font-medium mb-1">
                      Registration Number
                    </label>
                    <Input
                      id="reg-number"
                      type="text"
                      placeholder="ELBA/25/SS3B/001"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      required
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: ELBA/YY/CLASSID/SEQUENCE
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password-reg" className="block text-sm font-medium mb-1">
                      Password
                    </label>
                    <Input
                      id="password-reg"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
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
              </TabsContent>
            </Tabs>

            <div className="text-center text-sm">
              <p className="text-gray-600">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary-600 hover:underline font-medium">
                  Register here
                </Link>
              </p>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <div className="space-y-1">
                <p><strong>Admin Email:</strong> admin@elbethel.edu</p>
                <p><strong>Student Registration:</strong> ELBA/25/SS3A/001</p>
                <p><strong>Password:</strong> Check your Supabase setup</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
