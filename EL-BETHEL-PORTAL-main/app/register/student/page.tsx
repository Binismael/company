'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { Upload, AlertTriangle, CheckCircle2, Loader2, Eye, EyeOff } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  phone: string
  address: string
  state: string
  lga: string
  classId: string
  guardianName: string
  guardianPhone: string
  guardianEmail: string
  guardianRelationship: string
  previousSchool: string
}

interface FileUploads {
  photo: File | null
  birthCertificate: File | null
  idProof: File | null
}

interface UploadProgress {
  photo: number
  birthCertificate: number
  idProof: number
}

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa',
  'Benue', 'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti',
  'Enugu', 'Federal Capital Territory', 'Gombe', 'Imo', 'Jigawa', 'Kaduna',
  'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger',
  'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba',
  'Yobe', 'Zamfara'
]

const RELATIONSHIPS = ['Father', 'Mother', 'Guardian', 'Sister', 'Brother', 'Aunt', 'Uncle', 'Other']

export default function StudentRegistration() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentStep, setCurrentStep] = useState('account')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({
    photo: 0,
    birthCertificate: 0,
    idProof: 0,
  })

  const [files, setFiles] = useState<FileUploads>({
    photo: null,
    birthCertificate: null,
    idProof: null,
  })

  const [form, setForm] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    gender: '',
    dateOfBirth: '',
    phone: '',
    address: '',
    state: '',
    lga: '',
    classId: '',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelationship: '',
    previousSchool: '',
  })

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, fieldName: keyof FileUploads) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${fieldName} file must be less than 5MB`)
        return
      }
      setFiles((prev) => ({
        ...prev,
        [fieldName]: file,
      }))
      toast.success(`${fieldName} selected`)
    }
  }, [])

  const uploadFileToStorage = async (file: File, bucket: string, path: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: true })

      if (error) throw error

      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)

      return publicUrlData?.publicUrl || null
    } catch (error: any) {
      console.error(`Error uploading ${path}:`, error)
      return null
    }
  }

  const validateForm = (): boolean => {
    if (!form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all account fields')
      return false
    }

    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return false
    }

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match')
      return false
    }

    if (!form.firstName || !form.lastName) {
      toast.error('Please fill in your full name')
      return false
    }

    if (!form.gender || !form.dateOfBirth) {
      toast.error('Please fill in all personal information')
      return false
    }

    if (!form.phone || !form.address) {
      toast.error('Please fill in your contact information')
      return false
    }

    if (!form.guardianName || !form.guardianPhone) {
      toast.error('Please fill in guardian information')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setLoading(true)

    try {
      // 1. Sign up user with Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            first_name: form.firstName,
            last_name: form.lastName,
          },
        },
      })

      if (signUpError) throw new Error(signUpError.message)

      const userId = authData?.user?.id
      if (!userId) throw new Error('Failed to create user account')

      // 2. Create user record in public.users table
      const { error: userError } = await supabase.from('users').insert([
        {
          id: userId,
          email: form.email,
          full_name: `${form.firstName} ${form.lastName}`,
          role: 'student',
        },
      ])

      if (userError) throw userError

      // 3. Upload files if provided
      let photoUrl = null
      let birthCertUrl = null
      let idProofUrl = null

      setUploading(true)

      if (files.photo) {
        const photoPath = `student-documents/${userId}/passport_photo_${Date.now()}`
        photoUrl = await uploadFileToStorage(files.photo, 'student-documents', photoPath)
        setUploadProgress((prev) => ({ ...prev, photo: 100 }))
      }

      if (files.birthCertificate) {
        const certPath = `student-documents/${userId}/birth_certificate_${Date.now()}`
        birthCertUrl = await uploadFileToStorage(files.birthCertificate, 'student-documents', certPath)
        setUploadProgress((prev) => ({ ...prev, birthCertificate: 100 }))
      }

      if (files.idProof) {
        const idPath = `student-documents/${userId}/id_proof_${Date.now()}`
        idProofUrl = await uploadFileToStorage(files.idProof, 'student-documents', idPath)
        setUploadProgress((prev) => ({ ...prev, idProof: 100 }))
      }

      setUploading(false)

      // 4. Insert student record
      const { error: studentError } = await supabase.from('students').insert([
        {
          user_id: userId,
          first_name: form.firstName,
          last_name: form.lastName,
          gender: form.gender,
          date_of_birth: form.dateOfBirth,
          phone: form.phone,
          address: form.address,
          state: form.state,
          lga: form.lga,
          class_id: form.classId || null,
          guardian_name: form.guardianName,
          guardian_phone: form.guardianPhone,
          guardian_email: form.guardianEmail,
          guardian_relationship: form.guardianRelationship,
          previous_school: form.previousSchool || null,
          photo_url: photoUrl,
          birth_certificate_url: birthCertUrl,
          id_proof_url: idProofUrl,
          approved: false,
        },
      ])

      if (studentError) throw studentError

      toast.success('Registration successful! Awaiting admin approval.')

      // Redirect after success
      setTimeout(() => {
        router.push('/auth/login?message=registration-pending')
      }, 2000)
    } catch (error: any) {
      console.error('Registration error:', error)
      toast.error(error.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        {['account', 'personal', 'contact', 'guardian', 'academic', 'documents'].map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-colors ${
                currentStep === step
                  ? 'bg-blue-600 text-white'
                  : ['account', 'personal', 'contact', 'guardian', 'academic'].indexOf(step) <
                    ['account', 'personal', 'contact', 'guardian', 'academic'].indexOf(currentStep)
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {['account', 'personal', 'contact', 'guardian', 'academic'].indexOf(step) <
              ['account', 'personal', 'contact', 'guardian', 'academic'].indexOf(currentStep) ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                index + 1
              )}
            </div>
            {index < 5 && <div className="flex-1 h-1 bg-gray-200 mx-2" />}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Step {['account', 'personal', 'contact', 'guardian', 'academic', 'documents'].indexOf(currentStep) + 1} of 6</span>
        <span className="font-medium">{currentStep.charAt(0).toUpperCase() + currentStep.slice(1)}</span>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Student Registration</h1>
          <p className="text-gray-600">Complete your registration to access the school portal</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
            <CardTitle className="text-white">Registration Form</CardTitle>
            <CardDescription className="text-blue-100">Fill out all sections to complete your registration</CardDescription>
          </CardHeader>

          <CardContent className="pt-8">
            {renderStepIndicator()}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Account Information */}
              {currentStep === 'account' && (
                <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <Input
                      type="email"
                      name="email"
                      placeholder="student@example.com"
                      value={form.email}
                      onChange={handleInputChange}
                      required
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="At least 8 characters"
                        value={form.password}
                        onChange={handleInputChange}
                        required
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-gray-500"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        placeholder="Re-enter password"
                        value={form.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-3 text-gray-500"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Password must be at least 8 characters long</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Personal Information */}
              {currentStep === 'personal' && (
                <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                      <Input
                        type="text"
                        name="firstName"
                        placeholder="John"
                        value={form.firstName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <Input
                        type="text"
                        name="lastName"
                        placeholder="Doe"
                        value={form.lastName}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        name="gender"
                        value={form.gender}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <Input
                        type="date"
                        name="dateOfBirth"
                        value={form.dateOfBirth}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Information */}
              {currentStep === 'contact' && (
                <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <Input
                      type="tel"
                      name="phone"
                      placeholder="+234 800 000 0000"
                      value={form.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <Input
                      type="text"
                      name="address"
                      placeholder="Street address and city"
                      value={form.address}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                      <select
                        name="state"
                        value={form.state}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                      >
                        <option value="">Select State</option>
                        {NIGERIAN_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">LGA</label>
                      <Input
                        type="text"
                        name="lga"
                        placeholder="Local Government Area"
                        value={form.lga}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Guardian Information */}
              {currentStep === 'guardian' && (
                <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Guardian Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Guardian Full Name</label>
                    <Input
                      type="text"
                      name="guardianName"
                      placeholder="Guardian's full name"
                      value={form.guardianName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <Input
                        type="tel"
                        name="guardianPhone"
                        placeholder="+234 800 000 0000"
                        value={form.guardianPhone}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                      <Input
                        type="email"
                        name="guardianEmail"
                        placeholder="guardian@example.com"
                        value={form.guardianEmail}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <select
                      name="guardianRelationship"
                      value={form.guardianRelationship}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Select Relationship</option>
                      {RELATIONSHIPS.map((rel) => (
                        <option key={rel} value={rel}>
                          {rel}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Academic Information */}
              {currentStep === 'academic' && (
                <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Class (Optional)</label>
                    <select
                      name="classId"
                      value={form.classId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500"
                    >
                      <option value="">Select Class</option>
                      <option value="">JSS 1A</option>
                      <option value="">JSS 1B</option>
                      <option value="">SSS 1A</option>
                      <option value="">SSS 2A</option>
                      <option value="">SSS 3A</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous School (Optional)</label>
                    <Input
                      type="text"
                      name="previousSchool"
                      placeholder="Name of previous school"
                      value={form.previousSchool}
                      onChange={handleInputChange}
                    />
                  </div>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>Admission number will be auto-generated upon approval</AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Document Upload */}
              {currentStep === 'documents' && (
                <div className="space-y-4 animate-fadeIn">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Upload</h2>
                  <p className="text-sm text-gray-600 mb-4">Upload supporting documents (optional but recommended)</p>

                  {/* Passport Photo */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'photo')}
                      className="hidden"
                      id="photo-upload"
                    />
                    <label htmlFor="photo-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-blue-600 mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          {files.photo ? files.photo.name : 'Upload Passport Photo'}
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                    </label>
                  </div>

                  {/* Birth Certificate */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'birthCertificate')}
                      className="hidden"
                      id="birth-cert-upload"
                    />
                    <label htmlFor="birth-cert-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-blue-600 mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          {files.birthCertificate ? files.birthCertificate.name : 'Upload Birth Certificate'}
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                      </div>
                    </label>
                  </div>

                  {/* ID Proof */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => handleFileChange(e, 'idProof')}
                      className="hidden"
                      id="id-proof-upload"
                    />
                    <label htmlFor="id-proof-upload" className="cursor-pointer block">
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-blue-600 mb-2" />
                        <p className="text-sm font-medium text-gray-900">
                          {files.idProof ? files.idProof.name : 'Upload ID Proof (Optional)'}
                        </p>
                        <p className="text-xs text-gray-500">PDF, PNG, JPG up to 5MB</p>
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between gap-4 pt-8">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const steps = ['account', 'personal', 'contact', 'guardian', 'academic', 'documents']
                    const currentIndex = steps.indexOf(currentStep)
                    if (currentIndex > 0) setCurrentStep(steps[currentIndex - 1])
                  }}
                  disabled={currentStep === 'account'}
                >
                  Previous
                </Button>

                {currentStep === 'documents' ? (
                  <Button
                    type="submit"
                    disabled={loading || uploading}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading || uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {uploading ? 'Uploading...' : 'Submitting...'}
                      </>
                    ) : (
                      'Complete Registration'
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={() => {
                      const steps = ['account', 'personal', 'contact', 'guardian', 'academic', 'documents']
                      const currentIndex = steps.indexOf(currentStep)
                      if (currentIndex < steps.length - 1) setCurrentStep(steps[currentIndex + 1])
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Next
                  </Button>
                )}
              </div>

              {/* Login Link */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-600">
                  Already registered?{' '}
                  <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                    Login here
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
