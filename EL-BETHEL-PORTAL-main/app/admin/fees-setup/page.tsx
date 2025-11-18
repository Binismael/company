'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  AlertCircle,
  Plus,
  Trash2,
  DollarSign,
  Edit,
  Users,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function FeesSetupPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [fees, setFees] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)

  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: '',
    term: 'First Term',
    session: '2024/2025',
    amount: '',
    description: '',
    applicableClasses: [] as string[],
  })

  const [assignForm, setAssignForm] = useState({
    studentId: '',
    term: 'First Term',
    session: '2024/2025',
    amount: '',
    dueDate: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Verify admin/bursar role
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', authUser.id)
          .single()

        if (!['admin', 'bursar'].includes(userData?.role)) {
          throw new Error('Unauthorized access')
        }

        // Fetch classes
        const { data: classesData } = await supabase
          .from('classes')
          .select('*')
          .order('name')

        setClasses(classesData || [])
        if (classesData && classesData.length > 0) {
          setSelectedClass(classesData[0].id)
          await fetchStudents(classesData[0].id)
        }

        // Fetch fee templates
        const { data: templatesData } = await supabase
          .from('school_fees_template')
          .select('*')
          .order('created_at', { ascending: false })

        setTemplates(templatesData || [])

        // Fetch fees
        const { data: feesData } = await supabase
          .from('fees')
          .select('*, student:students(admission_number, user:users(full_name))')
          .order('created_at', { ascending: false })

        setFees(feesData || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const fetchStudents = async (classId: string) => {
    try {
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, admission_number, user:users(full_name)')
        .eq('class_id', classId)
        .order('created_at', { ascending: false })

      setStudents(studentsData || [])
    } catch (err: any) {
      toast.error('Failed to load students')
    }
  }

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!templateForm.name.trim() || !templateForm.amount) {
        toast.error('Please fill all required fields')
        return
      }

      const { data, error: insertError } = await supabase
        .from('school_fees_template')
        .insert([
          {
            name: templateForm.name,
            term: templateForm.term,
            session: templateForm.session,
            amount: parseFloat(templateForm.amount),
            description: templateForm.description || null,
            applicable_classes: templateForm.applicableClasses,
          },
        ])
        .select()

      if (insertError) throw insertError

      setTemplates([data[0], ...templates])
      setShowTemplateDialog(false)
      setTemplateForm({
        name: '',
        term: 'First Term',
        session: '2024/2025',
        amount: '',
        description: '',
        applicableClasses: [],
      })
      toast.success('Fee template created successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to create template')
    }
  }

  const handleAssignFees = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (!assignForm.studentId || !assignForm.amount) {
        toast.error('Please fill all required fields')
        return
      }

      const { data, error: insertError } = await supabase
        .from('fees')
        .insert([
          {
            student_id: assignForm.studentId,
            term: assignForm.term,
            session: assignForm.session,
            amount: parseFloat(assignForm.amount),
            due_date: assignForm.dueDate || null,
          },
        ])
        .select('*, student:students(admission_number, user:users(full_name))')

      if (insertError) throw insertError

      setFees([data[0], ...fees])
      setShowAssignDialog(false)
      setAssignForm({
        studentId: '',
        term: 'First Term',
        session: '2024/2025',
        amount: '',
        dueDate: '',
      })
      toast.success('Fees assigned successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign fees')
    }
  }

  const handleDeleteFees = async (feeId: string) => {
    if (!confirm('Are you sure you want to delete this fee?')) return

    try {
      const { error: deleteError } = await supabase
        .from('fees')
        .delete()
        .eq('id', feeId)

      if (deleteError) throw deleteError

      setFees(fees.filter((f) => f.id !== feeId))
      toast.success('Fee deleted successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete fee')
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error: deleteError } = await supabase
        .from('school_fees_template')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError

      setTemplates(templates.filter((t) => t.id !== templateId))
      toast.success('Template deleted successfully')
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fees setup...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>
              <p className="text-sm text-gray-600">Create fee templates and assign to students</p>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="px-4 sm:px-6 lg:px-8 pt-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      <main className="px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="templates" className="bg-white rounded-lg">
          <TabsList className="grid w-full grid-cols-2 p-4 bg-gray-50 border-b">
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Fee Templates
            </TabsTrigger>
            <TabsTrigger value="assigned" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Assigned Fees
            </TabsTrigger>
          </TabsList>

          {/* Fee Templates Tab */}
          <TabsContent value="templates" className="p-6 space-y-6">
            <Button onClick={() => setShowTemplateDialog(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Create Template
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => (
                <Card key={template.id} className="border border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>
                          {template.term} • {template.session}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-2xl font-bold text-gray-900">
                      ₦{template.amount.toLocaleString()}
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-600">{template.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Applied to {template.applicable_classes?.length || 0} classes
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {templates.length === 0 && (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No fee templates yet</p>
              </div>
            )}
          </TabsContent>

          {/* Assigned Fees Tab */}
          <TabsContent value="assigned" className="p-6 space-y-6">
            <div className="flex gap-4 flex-col sm:flex-row">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={() => setShowAssignDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Assign Fees
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Student
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Term
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-900">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((fee) => (
                    <tr
                      key={fee.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-gray-900">
                          {fee.student?.user.full_name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {fee.student?.admission_number}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{fee.term}</td>
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        ₦{fee.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            fee.status === 'Paid'
                              ? 'bg-green-100 text-green-800'
                              : fee.status === 'Partial'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {fee.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteFees(fee.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {fees.length === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No fees assigned yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Fee Template</DialogTitle>
            <DialogDescription>
              Create a reusable fee template
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTemplate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Template Name
              </label>
              <Input
                placeholder="e.g., Tuition Fee"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Term
                </label>
                <Select
                  value={templateForm.term}
                  onValueChange={(value) =>
                    setTemplateForm({ ...templateForm, term: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Session
                </label>
                <Input
                  placeholder="2024/2025"
                  value={templateForm.session}
                  onChange={(e) =>
                    setTemplateForm({ ...templateForm, session: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount (₦)
              </label>
              <Input
                type="number"
                placeholder="50000"
                value={templateForm.amount}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, amount: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <Input
                placeholder="Optional description"
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm({ ...templateForm, description: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowTemplateDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Template</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Fees Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Fees to Student</DialogTitle>
            <DialogDescription>
              Assign fees to a specific student
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignFees} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Student
              </label>
              <Select
                value={assignForm.studentId}
                onValueChange={(value) =>
                  setAssignForm({ ...assignForm, studentId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.user.full_name} ({student.admission_number})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Term
                </label>
                <Select
                  value={assignForm.term}
                  onValueChange={(value) =>
                    setAssignForm({ ...assignForm, term: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="First Term">First Term</SelectItem>
                    <SelectItem value="Second Term">Second Term</SelectItem>
                    <SelectItem value="Third Term">Third Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Session
                </label>
                <Input
                  placeholder="2024/2025"
                  value={assignForm.session}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, session: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Amount (₦)
              </label>
              <Input
                type="number"
                placeholder="50000"
                value={assignForm.amount}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, amount: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Due Date
              </label>
              <Input
                type="date"
                value={assignForm.dueDate}
                onChange={(e) =>
                  setAssignForm({ ...assignForm, dueDate: e.target.value })
                }
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAssignDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Assign Fees</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
