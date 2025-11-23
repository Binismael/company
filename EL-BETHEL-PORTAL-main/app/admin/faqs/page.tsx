'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Loader2, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  order_index: number
  created_by_name: string
  created_at: string
}

export default function FAQPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
  })

  useEffect(() => {
    checkAuthorization()
  }, [])

  const checkAuthorization = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        router.push('/student-dashboard')
        return
      }

      loadFAQs()
    } catch (error) {
      console.error('Authorization error:', error)
      toast.error('Failed to verify access')
    }
  }

  const loadFAQs = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('faqs')
        .select(`
          id,
          question,
          answer,
          category,
          order_index,
          created_at,
          users:created_by(full_name)
        `)
        .eq('is_active', true)
        .order('order_index', { ascending: true })

      if (error) throw error

      const mapped = (data || []).map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        order_index: faq.order_index,
        created_by_name: faq.users?.full_name || 'Admin',
        created_at: faq.created_at,
      }))

      setFaqs(mapped)
    } catch (error: any) {
      console.error('Error loading FAQs:', error)
      toast.error('Failed to load FAQs')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.question || !formData.answer || !formData.category) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      setSubmitting(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Not authenticated')
        return
      }

      if (editingId) {
        const { error } = await supabase
          .from('faqs')
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('FAQ updated successfully')
      } else {
        const { error } = await supabase
          .from('faqs')
          .insert({
            question: formData.question,
            answer: formData.answer,
            category: formData.category,
            created_by: user.id,
            order_index: faqs.length,
          })

        if (error) throw error
        toast.success('FAQ created successfully')
      }

      setFormData({ question: '', answer: '', category: '' })
      setEditingId(null)
      loadFAQs()
    } catch (error: any) {
      console.error('Error saving FAQ:', error)
      toast.error(error.message || 'Failed to save FAQ')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = (faq: FAQ) => {
    setFormData({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
    })
    setEditingId(faq.id)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return

    try {
      const { error } = await supabase
        .from('faqs')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error
      toast.success('FAQ deleted successfully')
      loadFAQs()
    } catch (error: any) {
      console.error('Error deleting FAQ:', error)
      toast.error('Failed to delete FAQ')
    }
  }

  const handleCancel = () => {
    setFormData({ question: '', answer: '', category: '' })
    setEditingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">FAQ Manager</h1>
            <p className="text-gray-600 mt-1">Manage frequently asked questions</p>
          </div>
        </div>

        {/* Form Card */}
        <Card className="rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle>{editingId ? 'Edit FAQ' : 'Create New FAQ'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Question *</label>
              <Input
                placeholder="Enter FAQ question"
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                className="rounded-lg border border-gray-300"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Answer *</label>
              <Textarea
                placeholder="Enter detailed answer"
                value={formData.answer}
                onChange={(e) => setFormData({...formData, answer: e.target.value})}
                className="rounded-lg border border-gray-300"
                rows={6}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Category *</label>
              <Input
                placeholder="e.g., Academic, Technical, Fees"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="rounded-lg border border-gray-300"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    {editingId ? 'Update FAQ' : 'Create FAQ'}
                  </>
                )}
              </Button>
              {editingId && (
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="rounded-lg"
                >
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* FAQs List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">FAQs ({faqs.length})</h2>
          {faqs.length === 0 ? (
            <Card className="rounded-2xl shadow-lg border-0">
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-gray-600">No FAQs yet. Create your first FAQ above.</p>
              </CardContent>
            </Card>
          ) : (
            faqs.map(faq => (
              <Card key={faq.id} className="rounded-2xl shadow-lg border-0">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg mb-2">{faq.question}</h3>
                      <p className="text-gray-700 mb-3">{faq.answer}</p>
                      <div className="flex gap-2 items-center text-sm text-gray-600">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">{faq.category}</span>
                        <span>By {faq.created_by_name}</span>
                        <span>{new Date(faq.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleEdit(faq)}
                        size="sm"
                        variant="outline"
                        className="rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDelete(faq.id)}
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
