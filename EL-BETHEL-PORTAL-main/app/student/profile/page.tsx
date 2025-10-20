'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Loader2, Upload, Save, AlertCircle, CheckCircle, Camera, Mail, Phone, MapPin, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'

interface StudentProfile {
  id: string
  user_id: string
  admission_number: string
  reg_number?: string
  date_of_birth?: string
  gender?: string
  phone?: string
  address?: string
  parent_name?: string
  parent_phone?: string
  parent_email?: string
  class_id?: string
  profile_picture_url?: string
  class?: { name: string; form_level: string }
  user?: { full_name: string; email: string }
}

export default function StudentProfilePage() {
  const router = useRouter()
  const [student, setStudent] = useState<StudentProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    parent_name: '',
    parent_phone: '',
    parent_email: '',
  })

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData, error } = await supabase
          .from('students')
          .select(`
            *,
            class:classes(name, form_level),
            user:users(full_name, email)
          `)
          .eq('user_id', user.id)
          .single()

        if (error) throw error

        setStudent(studentData)
        setFormData({
          phone: studentData.phone || '',
          address: studentData.address || '',
          parent_name: studentData.parent_name || '',
          parent_phone: studentData.parent_phone || '',
          parent_email: studentData.parent_email || '',
        })
      } catch (error: any) {
        toast.error('Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [router])

  const handleSave = async () => {
    if (!student) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('students')
        .update(formData)
        .eq('id', student.id)

      if (error) throw error

      setStudent({ ...student, ...formData })
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !student) return

    setUploading(true)
    try {
      const fileName = `profile_${student.id}_${Date.now()}`
      const { data, error } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName)

      const { error: updateError } = await supabase
        .from('students')
        .update({ profile_picture_url: urlData.publicUrl })
        .eq('id', student.id)

      if (updateError) throw updateError

      setStudent({ ...student, profile_picture_url: urlData.publicUrl })
      toast.success('Profile picture updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!student) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load student profile</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-gray-600 mt-2">View and manage your personal information</p>
      </div>

      {/* Profile Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-4 border-white shadow-md">
                  {student.profile_picture_url ? (
                    <img 
                      src={student.profile_picture_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                </div>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 cursor-pointer">
                  <div className="bg-blue-600 p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                </label>
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{student.user?.full_name}</h2>
                <p className="text-sm text-gray-600">ID: {student.admission_number}</p>
                <p className="text-sm text-gray-600">Class: {student.class?.name}</p>
              </div>
            </div>
            {!editing && (
              <Button onClick={() => setEditing(true)} className="gap-2">
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal Information</CardTitle>
          <CardDescription>Your basic details and academic information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Full Name</p>
                  <p className="text-lg font-medium text-gray-900">{student.user?.full_name}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Email</p>
                  <p className="text-lg font-medium text-gray-900">{student.user?.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Date of Birth</p>
                  <p className="text-lg font-medium text-gray-900">
                    {student.date_of_birth 
                      ? new Date(student.date_of_birth).toLocaleDateString() 
                      : 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Gender</p>
                  <p className="text-lg font-medium text-gray-900">{student.gender || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Registration Number</p>
                  <p className="text-lg font-medium text-gray-900">{student.reg_number || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Admission Number</p>
                  <p className="text-lg font-medium text-gray-900">{student.admission_number}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
          <CardDescription>Phone and address details</CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="Enter phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  placeholder="Enter address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Phone</p>
                  <p className="text-lg font-medium text-gray-900">{student.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <MapPin className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Address</p>
                  <p className="text-lg font-medium text-gray-900">{student.address || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parent/Guardian Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parent/Guardian Information</CardTitle>
          <CardDescription>Emergency contact and guardian details</CardDescription>
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="parent_name">Parent/Guardian Name</Label>
                <Input
                  id="parent_name"
                  placeholder="Enter parent/guardian name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="parent_phone">Parent/Guardian Phone</Label>
                <Input
                  id="parent_phone"
                  placeholder="Enter phone number"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="parent_email">Parent/Guardian Email</Label>
                <Input
                  id="parent_email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.parent_email}
                  onChange={(e) => setFormData({ ...formData, parent_email: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Name</p>
                  <p className="text-lg font-medium text-gray-900">{student.parent_name || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Phone</p>
                  <p className="text-lg font-medium text-gray-900">{student.parent_phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Email</p>
                  <p className="text-lg font-medium text-gray-900">{student.parent_email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {editing && (
        <div className="flex gap-3 sticky bottom-0 bg-white p-4 rounded-lg shadow-lg border">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </Button>
          <Button
            onClick={() => setEditing(false)}
            variant="outline"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}
