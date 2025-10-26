'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface Class {
  id: string
  name: string
  form_level: string
}

interface Subject {
  id: string
  name: string
  code: string
}

export default function CreateTeacherPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [classes, setClasses] = useState<Class[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successData, setSuccessData] = useState<any>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    qualification: '',
    assignedClasses: [] as string[],
    assignedSubjects: [] as string[],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const response = await fetch('/api/teachers/dropdown-data')
        const data = await response.json()

        if (data.success) {
          setClasses(data.classes || [])
          setSubjects(data.subjects || [])
        } else {
          toast.error('Failed to load classes and subjects')
        }
      } catch (error: any) {
        console.error('Error loading dropdown data:', error)
        toast.error('Failed to load dropdown data: ' + error.message)
      } finally {
        setDataLoading(false)
      }
    }

    loadDropdownData()
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleClassToggle = (classId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter((id) => id !== classId)
        : [...prev.assignedClasses, classId],
    }))
  }

  const handleSubjectToggle = (subjectId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedSubjects: prev.assignedSubjects.includes(subjectId)
        ? prev.assignedSubjects.filter((id) => id !== subjectId)
        : [...prev.assignedSubjects, subjectId],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)
    try {
      const response = await fetch('/api/teachers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone || undefined,
          qualification: formData.qualification || undefined,
          assignedClasses: formData.assignedClasses,
          assignedSubjects: formData.assignedSubjects,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed')
      }

      setSuccessData({
        fullName: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        classesAssigned: formData.assignedClasses.length,
        subjectsAssigned: formData.assignedSubjects.length,
      })

      toast.success('Teacher registered successfully!')
      setShowSuccess(true)

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        qualification: '',
        assignedClasses: [],
        assignedSubjects: [],
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to register teacher')
      setShowSuccess(false)
    } finally {
      setLoading(false)
    }
  }

  if (showSuccess && successData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Created Successfully</h1>
          <p className="text-gray-600 mt-2">Teacher account has been created and assigned to classes and subjects</p>
        </div>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
              <div className="space-y-4 flex-1">
                <div>
                  <h3 className="font-semibold text-gray-900">Registration Details</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Share these details with the teacher for login
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Full Name</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{successData.fullName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Email</p>
                      <p className="text-sm font-medium text-gray-900 mt-1">{successData.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Classes Assigned</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">{successData.classesAssigned}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Subjects Assigned</p>
                      <p className="text-sm font-medium text-blue-600 mt-1">{successData.subjectsAssigned}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-600">
                      <strong>Login Instructions:</strong> Teachers can login using their email and password.
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
                    Create Another Teacher
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/admin/registrations')}
                    className="flex-1"
                  >
                    Back to Registrations
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
        <h1 className="text-3xl font-bold text-gray-900">Create Teacher Account</h1>
        <p className="text-gray-600 mt-2">Register a new teacher and assign them to classes and subjects</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Teachers can be assigned to multiple classes and subjects. Select at least one class and subject combination to enable teaching assignments.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
          <CardDescription>
            Enter complete teacher details including personal and login information
          </CardDescription>
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
                  <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                  <Input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Qualification</label>
                  <Input
                    type="text"
                    placeholder="e.g., B.Ed, M.Sc, PGDE"
                    value={formData.qualification}
                    onChange={(e) =>
                      setFormData({ ...formData, qualification: e.target.value })
                    }
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Class & Subject Assignment */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900">Class & Subject Assignment</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Classes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Assign Classes</label>
                  {dataLoading ? (
                    <p className="text-sm text-gray-500">Loading classes...</p>
                  ) : classes.length > 0 ? (
                    <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                      {classes.map((cls) => (
                        <label key={cls.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignedClasses.includes(cls.id)}
                            onChange={() => handleClassToggle(cls.id)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {cls.name} ({cls.form_level})
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No classes available</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {formData.assignedClasses.length} class(es)
                  </p>
                </div>

                {/* Subjects */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Assign Subjects</label>
                  {dataLoading ? (
                    <p className="text-sm text-gray-500">Loading subjects...</p>
                  ) : subjects.length > 0 ? (
                    <div className="space-y-2 border border-gray-200 rounded-lg p-3 max-h-64 overflow-y-auto">
                      {subjects.map((subject) => (
                        <label key={subject.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.assignedSubjects.includes(subject.id)}
                            onChange={() => handleSubjectToggle(subject.id)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm text-gray-700">
                            {subject.name} ({subject.code})
                          </span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No subjects available</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Selected: {formData.assignedSubjects.length} subject(s)
                  </p>
                </div>
              </div>
            </div>

            {/* Login Credentials */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Login Credentials</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <Input
                    type="email"
                    placeholder="teacher@example.com"
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">Password *</label>
                  <div className="relative mt-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={`pr-10 ${errors.password ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
                  <div className="relative mt-1">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className={`pr-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
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
                disabled={loading || dataLoading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Teacher...
                  </>
                ) : (
                  'Create Teacher'
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
