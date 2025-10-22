'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Loader2, Clock, Mail, CheckCircle, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface StudentInfo {
  first_name: string
  last_name: string
  email: string
  reg_number: string
  class: string
  section: string
  created_at: string
}

export default function PendingApprovalPage() {
  const router = useRouter()
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        setLoading(true)

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          router.push('/auth/login')
          return
        }

        // Get student info
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('first_name, last_name, email, reg_number, class, section, created_at')
          .eq('user_id', user.id)
          .single()

        if (studentError) {
          setError('Could not load student information')
          console.error(studentError)
          return
        }

        if (student) {
          // Get email from users table
          const { data: userData } = await supabase
            .from('users')
            .select('email')
            .eq('id', user.id)
            .single()

          setStudentInfo({
            ...student,
            email: userData?.email || student.email || 'N/A',
          })
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchStudentInfo()
  }, [router])

  const handleCheckStatus = async () => {
    try {
      setChecking(true)
      setError('')

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      // Check approval status
      const { data: student } = await supabase
        .from('students')
        .select('approved')
        .eq('user_id', user.id)
        .single()

      if (student?.approved) {
        // Student has been approved, redirect to dashboard
        router.push('/student-dashboard')
      } else {
        setError('Your account is still pending admin approval. Please check back later.')
      }
    } catch (err: any) {
      setError(err.message || 'Failed to check status')
    } finally {
      setChecking(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const registrationDays = studentInfo
    ? Math.floor((Date.now() - new Date(studentInfo.created_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 rounded-2xl">
        <CardHeader className="text-center pb-6">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 to-orange-300 rounded-full flex items-center justify-center">
                <Clock className="w-8 h-8 text-orange-700 animate-pulse" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl">Account Pending Review</CardTitle>
          <CardDescription>
            Your registration is being reviewed by our admin team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Status Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 mb-2">
                  ✅ Your account has been successfully created and is now being reviewed by our admin team. This typically takes 1-2 business days.
                </p>
                <p className="text-xs text-gray-600">
                  You'll receive an email notification once your account has been approved.
                </p>
              </div>

              {/* Student Info Card */}
              {studentInfo && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-xs text-gray-600">Student Name</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {studentInfo.first_name} {studentInfo.last_name}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Registration Number</p>
                      <p className="text-sm font-semibold text-gray-900">{studentInfo.reg_number || 'Generating...'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Class</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {studentInfo.class}{studentInfo.section}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Email</p>
                    <p className="text-sm font-semibold text-gray-900 break-all">{studentInfo.email}</p>
                  </div>
                  {registrationDays > 0 && (
                    <div>
                      <p className="text-xs text-gray-600">Submitted</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {registrationDays} day{registrationDays !== 1 ? 's' : ''} ago
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* What to expect */}
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900">What happens next?</h4>
                <div className="space-y-2">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-semibold">
                        1
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Admin Review:</span> Our team will review your information
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-semibold">
                        2
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Email Notification:</span> We'll send you an email once approved
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-100 text-primary-600 text-sm font-semibold">
                        3
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Portal Access:</span> You can then log in and access your dashboard
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-4 border-t">
                <Button
                  onClick={handleCheckStatus}
                  disabled={checking}
                  className="w-full h-10 text-white font-semibold rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600"
                >
                  {checking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Checking Status...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Check Approval Status
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full h-10 rounded-lg"
                >
                  Log Out
                </Button>
              </div>

              {/* Support Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center text-sm">
                <p className="text-gray-700 mb-1">
                  <strong>Need Help?</strong>
                </p>
                <p className="text-gray-600 text-xs">
                  Contact your school administrator if you have questions about your registration status.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="fixed bottom-4 text-center text-xs text-gray-600 w-full px-4">
        <p>© 2025 El Bethel Academy. All rights reserved.</p>
      </div>
    </div>
  )
}
