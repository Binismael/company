'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'

import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isAdminLogin = searchParams.get('admin') === '1'

  const [email, setEmail] = useState('')
  const [regNumber, setRegNumber] = useState('')
  const [password, setPassword] = useState('')
  const [loginType, setLoginType] = useState<'email' | 'reg-number'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const identifier = loginType === 'email' ? email : regNumber
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginType === 'email' ? email : `${regNumber}@placeholder.com`,
        password
      })

      if (signInError) {
        setError('Invalid credentials')
        setLoading(false)
        return
      }

      const user = signInData.user
      if (!user) {
        setError('Authentication failed — user missing')
        setLoading(false)
        return
      }

      // Fetch profile by ANY matching field
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .or(`id.eq.${user.id},email.eq.${email},reg_number.eq.${regNumber}`)
        .maybeSingle()

      if (profileError) {
        setError('Failed to fetch user profile')
        setLoading(false)
        return
      }

      if (!profile) {
        setError('User account not found — contact administrator')
        setLoading(false)
        return
      }

      if (isAdminLogin && profile.role !== 'admin') {
        setError('Only admins may access this page.')
        await supabase.auth.signOut()
        setLoading(false)
        return
      }

      sessionStorage.setItem('user', JSON.stringify(profile))
      sessionStorage.setItem('session', JSON.stringify(signInData.session))

      toast.success('Login successful!')

      if (profile.role === 'admin') {
        router.push('/admin-dashboard')
      } else if (profile.role === 'student') {
        router.push('/student-dashboard')
      } else if (profile.role === 'teacher') {
        router.push('/teacher-dashboard')
      } else {
        router.push('/')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError('Unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50">

      <div className="max-w-md mx-auto px-4 pb-12 pt-16">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">{isAdminLogin ? 'Admin Login' : 'Login'}</CardTitle>
            <CardDescription>
              {isAdminLogin ? 'Admins only' : 'Access your portal'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={loginType} onValueChange={(v) => setLoginType(v as any)} className="mb-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">Email</TabsTrigger>
                <TabsTrigger value="reg-number">Reg. Number</TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4 mt-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">

                  <div>
                    <label className="text-sm font-medium">Email Address</label>
                    <Input
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <Button className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="reg-number" className="space-y-4 mt-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Registration Number</label>
                    <Input
                      type="text"
                      placeholder="ELBA/25/SS3B/001"
                      value={regNumber}
                      onChange={(e) => setRegNumber(e.target.value.toUpperCase())}
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Password</label>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <Button className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

            </Tabs>

            <div className="text-center mt-6 text-sm">
              <Link href="/auth/register" className="text-blue-600 font-medium">
                Create an account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
