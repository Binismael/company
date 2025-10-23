'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2, Brain, Zap, Shield, Users, BookOpen, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface StudentFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  gender: string
  dateOfBirth: string
  class: string
  section: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  address: string
}

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState('student')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState<StudentFormData>({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: 'Male',
    dateOfBirth: '',
    class: '',
    section: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const generateRegNumber = (): string => {
    const year = new Date().getFullYear().toString().slice(-2)
    const idx = Math.floor(Math.random() * 900 + 100).toString()
    return `ELBA/${year}/${formData.class}${formData.section}/${idx}`
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (role === 'student') {
        // Student-specific validation
        if (!formData.first_name.trim() || !formData.last_name.trim()) {
          throw new Error('First name and last name are required')
        }
        if (!formData.class || !formData.section) {
          throw new Error('Class and section are required')
        }
        if (!formData.guardianName.trim()) {
          throw new Error('Guardian name is required')
        }
      }

      if (!formData.email.trim()) {
        throw new Error('Email is required')
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match')
      }

      if (formData.password.length < 6) {
        throw new Error('Password must be at least 6 characters')
      }

      // Create Supabase Auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role,
          },
        },
      })

      if (authError) throw new Error(authError.message)
      if (!authData.user) throw new Error('Failed to create account')

      const userId = authData.user.id

      // Create user record
      const { error: userError } = await supabase.from('users').insert([
        {
          id: userId,
          email: formData.email,
          full_name: role === 'student' ? `${formData.first_name} ${formData.last_name}` : formData.first_name,
          role,
          is_approved: role !== 'student',
        },
      ])

      if (userError) throw new Error(userError.message)

      // If student, create student record with approval flag
      if (role === 'student') {
        const regNumber = generateRegNumber()

        const { error: studentError } = await supabase.from('students').insert([
          {
            user_id: userId,
            reg_number: regNumber,
            first_name: formData.first_name,
            last_name: formData.last_name,
            phone: formData.phone || null,
            gender: formData.gender,
            date_of_birth: formData.dateOfBirth || null,
            class: formData.class,
            section: formData.section,
            guardian_name: formData.guardianName,
            guardian_phone: formData.guardianPhone,
            guardian_email: formData.guardianEmail,
            address: formData.address || null,
            approved: true,
          },
        ])

        if (studentError) throw new Error(studentError.message)
      }

      setSuccess(true)
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        gender: 'Male',
        dateOfBirth: '',
        class: '',
        section: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        address: '',
      })

      setTimeout(() => {
        router.push('/auth/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-lg mb-4">
            <span className="text-xl font-bold text-primary-600">⚜</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            El Bethel Academy
          </h1>
          <p className="text-xl text-secondary-500 font-medium">
            Next-Generation Learning Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
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

      <div className="max-w-2xl mx-auto px-4 pb-12">
        <Card className="shadow-xl border-0 rounded-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <span className="text-xl font-bold text-white">⚜</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Create Account</CardTitle>
            <CardDescription>
              Join El Bethel Academy today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center">
                <div className="flex justify-center">
                  <CheckCircle className="h-16 w-16 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Account Created Successfully!</h3>
                <p className="text-sm text-gray-700">
                  Your account is ready. You can now log in with your email and password.
                </p>
                <p className="text-sm text-gray-600">
                  Redirecting to login page...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div>
                  <label htmlFor="role" className="block text-sm font-medium mb-1.5 text-gray-700">
                    I am a...
                  </label>
                  <Select value={role} onValueChange={setRole} disabled={loading}>
                    <SelectTrigger id="role" className="rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                      <SelectItem value="parent">Parent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {role === 'student' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="first_name" className="block text-sm font-medium mb-1.5 text-gray-700">
                          First Name
                        </label>
                        <Input
                          id="first_name"
                          name="first_name"
                          placeholder="First name"
                          value={formData.first_name}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <label htmlFor="last_name" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Last Name
                        </label>
                        <Input
                          id="last_name"
                          name="last_name"
                          placeholder="Last name"
                          value={formData.last_name}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          className="rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="gender" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Gender
                        </label>
                        <Select value={formData.gender} onValueChange={(v) => handleSelectChange('gender', v)} disabled={loading}>
                          <SelectTrigger id="gender" className="rounded-lg">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Phone Number
                        </label>
                        <Input
                          id="phone"
                          name="phone"
                          placeholder="08012345678"
                          value={formData.phone}
                          onChange={handleChange}
                          disabled={loading}
                          className="rounded-lg"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="dateOfBirth" className="block text-sm font-medium mb-1.5 text-gray-700">
                        Date of Birth
                      </label>
                      <Input
                        id="dateOfBirth"
                        name="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                        disabled={loading}
                        className="rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="class" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Class
                        </label>
                        <Select value={formData.class} onValueChange={(v) => handleSelectChange('class', v)} disabled={loading}>
                          <SelectTrigger id="class" className="rounded-lg">
                            <SelectValue placeholder="Select class" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="JSS1">JSS1</SelectItem>
                            <SelectItem value="JSS2">JSS2</SelectItem>
                            <SelectItem value="JSS3">JSS3</SelectItem>
                            <SelectItem value="SS1">SS1</SelectItem>
                            <SelectItem value="SS2">SS2</SelectItem>
                            <SelectItem value="SS3">SS3</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label htmlFor="section" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Section
                        </label>
                        <Select value={formData.section} onValueChange={(v) => handleSelectChange('section', v)} disabled={loading}>
                          <SelectTrigger id="section" className="rounded-lg">
                            <SelectValue placeholder="Select section" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium mb-1.5 text-gray-700">
                        Address
                      </label>
                      <Input
                        id="address"
                        name="address"
                        placeholder="Your residential address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={loading}
                        className="rounded-lg"
                      />
                    </div>

                    <div>
                      <label htmlFor="guardianName" className="block text-sm font-medium mb-1.5 text-gray-700">
                        Guardian Name
                      </label>
                      <Input
                        id="guardianName"
                        name="guardianName"
                        placeholder="Parent or guardian full name"
                        value={formData.guardianName}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="rounded-lg"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="guardianPhone" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Guardian Phone
                        </label>
                        <Input
                          id="guardianPhone"
                          name="guardianPhone"
                          placeholder="08012345678"
                          value={formData.guardianPhone}
                          onChange={handleChange}
                          disabled={loading}
                          className="rounded-lg"
                        />
                      </div>
                      <div>
                        <label htmlFor="guardianEmail" className="block text-sm font-medium mb-1.5 text-gray-700">
                          Guardian Email
                        </label>
                        <Input
                          id="guardianEmail"
                          name="guardianEmail"
                          type="email"
                          placeholder="guardian@example.com"
                          value={formData.guardianEmail}
                          onChange={handleChange}
                          disabled={loading}
                          className="rounded-lg"
                        />
                      </div>
                    </div>
                  </>
                )}

                {role !== 'student' && (
                  <>
                    <div>
                      <label htmlFor="first_name" className="block text-sm font-medium mb-1.5 text-gray-700">
                        Full Name
                      </label>
                      <Input
                        id="first_name"
                        name="first_name"
                        placeholder="Enter your full name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="rounded-lg"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-gray-700">
                        Email Address
                      </label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="you@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="rounded-lg"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-gray-700">
                    Password
                  </label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="rounded-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5 text-gray-700">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className="rounded-lg"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 mt-6"
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
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-xs text-gray-600">
          <p>Powered by Next.js 15 • Cloud Technology</p>
          <p className="mt-1">© 2025 El Bethel Academy. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}
