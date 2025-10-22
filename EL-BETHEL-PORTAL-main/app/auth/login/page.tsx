'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Brain, Zap, Shield, Users, BookOpen } from 'lucide-react'
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
    console.log('Form submitted, loginType:', loginType, 'email:', email, 'regNumber:', regNumber)
    setError('')
    setLoading(true)

    try {
      let loginEmail = email

      if (loginType === 'email') {
        if (!email.trim()) {
          throw new Error('Email address is required')
        }
        if (!password.trim()) {
          throw new Error('Password is required')
        }
      } else if (loginType === 'reg-number') {
        if (!regNumber.trim()) {
          throw new Error('Registration number is required')
        }
        if (!password.trim()) {
          throw new Error('Password is required')
        }

        const student = await findStudentByRegNumber(regNumber)
        if (!student) {
          throw new Error('Registration number not found')
        }

        const { data: userDataArray, error: userError } = await supabase
          .from('users')
          .select('email')
          .eq('id', student.user_id)

        if (userError || !userDataArray || userDataArray.length === 0) {
          throw new Error('User account not found for this registration number')
        }

        loginEmail = userDataArray[0].email
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        })

      if (authError) throw new Error(authError.message)

      if (authData.user) {
        const { data: userDataArray, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authData.user.id)

        if (userError || !userDataArray || userDataArray.length === 0) {
          throw new Error('User not found')
        }

        const userData = userDataArray[0]

        sessionStorage.setItem('user', JSON.stringify(userData))
        sessionStorage.setItem('session', JSON.stringify(authData.session))

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

      {/* Login Section */}
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
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <CardDescription>
              Sign in to access your personalized portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as 'email' | 'reg-number')} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="reg-number">Registration #</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-6">
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
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="rounded-lg"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-gray-700">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
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

              <TabsContent value="reg-number" className="space-y-4 mt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive">
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div>
                    <label htmlFor="reg-number" className="block text-sm font-medium mb-1.5 text-gray-700">
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
                      className="rounded-lg"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Format: ELBA/YY/CLASSID/SEQUENCE
                    </p>
                  </div>

                  <div>
                    <label htmlFor="password-reg" className="block text-sm font-medium mb-1.5 text-gray-700">
                      Password
                    </label>
                    <Input
                      id="password-reg"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="rounded-lg"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
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

            {/* Social Login */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button
                variant="outline"
                disabled={loading}
                className="rounded-lg"
              >
                <span className="text-xl">G</span>
              </Button>
              <Button
                variant="outline"
                disabled={loading}
                className="rounded-lg"
              >
                <span className="text-xl">⚜</span>
              </Button>
            </div>

            {/* Links */}
            <div className="space-y-2 text-sm text-center">
              <p className="text-gray-500">
                Admin-managed accounts only. Contact your administrator to create an account.
              </p>
              <p>
                <Link
                  href="/auth/forgot-password"
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Forgot your password?
                </Link>
              </p>
            </div>
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
