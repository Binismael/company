'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { createStudent, getAllClasses } from '@/lib/admin-service'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface Class {
  id: string
  name: string
  form_level: string
}

export default function CreateStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [classesLoading, setClassesLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [generatedRegNumber, setGeneratedRegNumber] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    gender: 'Male',
    dateOfBirth: '',
    classId: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    address: '',
    session: '2024/2025',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const classesData = await getAllClasses()
        setClasses(classesData || [])
      } catch (error: any) {
        toast.error('Failed to load classes')
      } finally {
        setClassesLoading(false)
      }
    }

    loadClasses()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required'
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Valid email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required'
    if (!formData.classId) newErrors.classId = 'Class selection is required'
    if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required'
    if (!formData.guardianPhone.trim()) newErrors.guardianPhone = 'Guardian phone is required'

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const generateRegNumber = async (): Promise<string> => {
    try {
      const selectedClass = classes.find((c) => c.id === formData.classId)
      if (!selectedClass) throw new Error('Class not found')

      const year = new Date().getFullYear().toString().slice(-2)
      const formLevel = selectedClass.form_level

      // Fetch existing students in this class
      const { data: existingStudents } = await supabase
        .from('students')
        .select('reg_number')
        .like('reg_number', `ELBA/${year}/${formLevel}/%`)

      const count = (existingStudents?.length || 0) + 1
      const sequence = count.toString().padStart(3, '0')

      return `ELBA/${year}/${formLevel}/${sequence}`
    } catch (error) {
      console.error('Error generating reg number:', error)
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      // Generate registration number
      const regNum = await generateRegNumber()
      setGeneratedRegNumber(regNum)

      // Create student
      const result = await createStudent(
        formData.email,
        formData.password,
        formData.firstName,
        formData.lastName,
        formData.gender,
        formData.dateOfBirth,
        formData.classId,
        formData.guardianName,
        formData.guardianPhone,
        formData.guardianEmail || '',
        formData.address || '',
        formData.session
      )

      setSuccessData({
        ...result.data,
        regNumber: regNum,
        fullName: `${formData.firstName} ${formData.lastName}`,
      })

      setShowSuccess(true)
      toast.success('Student created successfully!')

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        gender: 'Male',
        dateOfBirth: '',
        classId: '',
        guardianName: '',
        guardianPhone: '',
        guardianEmail: '',
        address: '',
        session: '2024/2025',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to create student')
      setShowSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess && successData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Created Successfully</h1>
          <p className="text-gray-600 mt-2">Student registration is complete</p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="font-semibold text-gray-900">Registration Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Share these details with the student for login
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Full Name</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{successData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Reg Number</p>
                      <p className="text-sm font-medium text-blue-600 mt-1 font-mono">{successData.regNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Email</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{successData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Password</p>
                      <p className="text-xs text-gray-600 italic mt-1">(As entered during registration)</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      <strong>Login Instructions:</strong> Students can login using their registration number
                      and password.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={() => {
                      setShowSuccess(false)
                      setSuccessData(null)
                    }}
                    className="flex-1"
                  >
                    Create Another Student
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/registrations')}
                    className="flex-1"
                  >
                    View All Students
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Student</h1>
        <p className="text-gray-600 mt-2">Register a new student in the system</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Registration number will be auto-generated based on the class selected. Format: ELBA/YY/CLASS/###
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
          <CardDescription>Enter complete student details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <Input
                    type="text"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className={`mt-1 ${errors.firstName ? 'border-red-500' : ''}`}
                  />
                  {errors.firstName && (
                    <p className="text-xs text-red-600 mt-1">{errors.firstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <Input
                    type="text"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className={`mt-1 ${errors.lastName ? 'border-red-500' : ''}`}
                  />
                  {errors.lastName && (
                    <p className="text-xs text-red-600 mt-1">{errors.lastName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                    className={`mt-1 ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Class & Session */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Class Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class *</label>
                  <select
                    value={formData.classId}
                    onChange={(e) =>
                      setFormData({ ...formData, classId: e.target.value })
                    }
                    className={`w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1 ${
                      errors.classId ? 'border-red-500' : ''
                    }`}
                    disabled={classesLoading}
                  >
                    <option value="">Select a class</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.form_level})
                      </option>
                    ))}
                  </select>
                  {errors.classId && (
                    <p className="text-xs text-red-600 mt-1">{errors.classId}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Session *</label>
                  <select
                    value={formData.session}
                    onChange={(e) =>
                      setFormData({ ...formData, session: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm mt-1"
                  >
                    <option value="2024/2025">2024/2025</option>
                    <option value="2025/2026">2025/2026</option>
                    <option value="2026/2027">2026/2027</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Name *</label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={formData.guardianName}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianName: e.target.value })
                    }
                    className={`mt-1 ${errors.guardianName ? 'border-red-500' : ''}`}
                  />
                  {errors.guardianName && (
                    <p className="text-xs text-red-600 mt-1">{errors.guardianName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Guardian Phone *</label>
                  <Input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={formData.guardianPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianPhone: e.target.value })
                    }
                    className={`mt-1 ${errors.guardianPhone ? 'border-red-500' : ''}`}
                  />
                  {errors.guardianPhone && (
                    <p className="text-xs text-red-600 mt-1">{errors.guardianPhone}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Guardian Email</label>
                  <Input
                    type="email"
                    placeholder="guardian@example.com"
                    value={formData.guardianEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, guardianEmail: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <Input
                    type="text"
                    placeholder="Full residential address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Login Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className={`mt-1 ${errors.email ? 'border-red-500' : ''}`}
                  />
                  {errors.email && (
                    <p className="text-xs text-red-600 mt-1">{errors.email}</p>
                  )}
                </div>

                <div />

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className={`mt-1 ${errors.password ? 'border-red-500' : ''}`}
                  />
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <Input
                    type="password"
                    placeholder="••••••"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, confirmPassword: e.target.value })
                    }
                    className={`mt-1 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Student...
                  </>
                ) : (
                  'Create Student'
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
