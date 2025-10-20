'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, HelpCircle, MessageSquare, Mail, Phone, Clock, Send } from 'lucide-react'
import { toast } from 'sonner'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqs: FAQItem[] = [
  {
    id: '1',
    category: 'Exams',
    question: 'How do I access my exam results?',
    answer: 'You can view your exam results in the Results section of your dashboard once your teacher has released them. Results are typically released within 48 hours of exam completion.',
  },
  {
    id: '2',
    category: 'Exams',
    question: 'What should I do if I encounter technical issues during an exam?',
    answer: 'If you experience technical difficulties during an exam, immediately contact your teacher or the support team. Your attempt can be extended if the issue is verified.',
  },
  {
    id: '3',
    category: 'Payments',
    question: 'What payment methods are accepted?',
    answer: 'We accept payments through Paystack, which supports credit/debit cards, bank transfers, and mobile money. Your payment is secure and encrypted.',
  },
  {
    id: '4',
    category: 'Payments',
    question: 'Can I get a receipt after payment?',
    answer: 'Yes, receipts are automatically generated after successful payment. You can download them from the Payments section of your dashboard.',
  },
  {
    id: '5',
    category: 'Assignments',
    question: 'Can I submit an assignment after the due date?',
    answer: 'Late submissions are allowed up to 24 hours after the due date, but may incur a penalty as set by your teacher. Check your assignment for specific policies.',
  },
  {
    id: '6',
    category: 'Attendance',
    question: 'How is attendance recorded?',
    answer: 'Attendance is recorded daily during class sessions. If you believe there is an error in your attendance, contact your class teacher immediately.',
  },
  {
    id: '7',
    category: 'Account',
    question: 'How do I reset my password?',
    answer: 'Click on "Forgot Password" on the login page and follow the instructions. A password reset link will be sent to your email.',
  },
  {
    id: '8',
    category: 'Account',
    question: 'Can I change my email address?',
    answer: 'To change your email, go to Settings > Account and click "Edit Profile". However, you may need verification from the admin.',
  },
]

export default function StudentSupportPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All')
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null)
  const [sendingTicket, setSendingTicket] = useState(false)
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    category: '',
    description: '',
    attachment: '',
  })

  const categories = ['All', ...new Set(faqs.map((faq) => faq.category))]

  const filteredFAQs =
    selectedCategory === 'All'
      ? faqs
      : faqs.filter((faq) => faq.category === selectedCategory)

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject || !ticketForm.category || !ticketForm.description) {
      toast.error('Please fill in all required fields')
      return
    }

    setSendingTicket(true)
    try {
      // In a real application, this would send to a support system
      toast.success('Support ticket submitted. We will respond within 24 hours.')
      setTicketForm({ subject: '', category: '', description: '', attachment: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit ticket')
    } finally {
      setSendingTicket(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
        <p className="text-gray-600 mt-2">Get answers and submit support requests</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="faq" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="faq" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">FAQs</span>
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Support Ticket</span>
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Mail className="w-4 h-4" />
            <span className="hidden sm:inline">Contact</span>
          </TabsTrigger>
        </TabsList>

        {/* FAQ Tab */}
        <TabsContent value="faq" className="space-y-6">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Items */}
          <div className="space-y-3">
            {filteredFAQs.map((faq) => (
              <Card
                key={faq.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() =>
                  setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)
                }
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{faq.question}</CardTitle>
                        <Badge variant="outline">{faq.category}</Badge>
                      </div>
                    </div>
                    <span
                      className={`text-2xl transition-transform ${
                        expandedFAQ === faq.id ? 'rotate-180' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </div>
                </CardHeader>

                {expandedFAQ === faq.id && (
                  <CardContent className="pt-0">
                    <p className="text-sm text-gray-700">{faq.answer}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Support Ticket Tab */}
        <TabsContent value="support" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Describe your issue and we'll get back to you as soon as possible
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  placeholder="Brief subject of your issue"
                  value={ticketForm.subject}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, subject: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Category *</label>
                <select
                  value={ticketForm.category}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select a category</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Academic">Academic</option>
                  <option value="Payment">Payment</option>
                  <option value="Exam">Exam</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-medium">Description *</label>
                <Textarea
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  value={ticketForm.description}
                  onChange={(e) =>
                    setTicketForm({ ...ticketForm, description: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Attachment (Optional)</label>
                <input
                  type="file"
                  onChange={(e) =>
                    setTicketForm({
                      ...ticketForm,
                      attachment: e.target.files?.[0]?.name || '',
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can upload screenshots or documents to help us understand your issue
                </p>
              </div>

              <Button
                onClick={handleSubmitTicket}
                disabled={sendingTicket}
                className="w-full gap-2"
              >
                {sendingTicket ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Tab */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>
                Reach out to us through multiple channels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">Email Support</p>
                  </div>
                  <p className="text-sm text-blue-800 mb-2">support@elbetheacademy.edu.ng</p>
                  <p className="text-xs text-blue-700">Response time: Within 24 hours</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Phone className="w-5 h-5 text-green-600" />
                    <p className="font-semibold text-green-900">Phone Support</p>
                  </div>
                  <p className="text-sm text-green-800 mb-2">+234 (0) 701 234 5678</p>
                  <p className="text-xs text-green-700">Mon-Fri, 8:00 AM - 5:00 PM</p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <p className="font-semibold text-purple-900">Live Chat</p>
                  </div>
                  <p className="text-sm text-purple-800 mb-2">Available on the portal</p>
                  <p className="text-xs text-purple-700">Mon-Fri, 8:00 AM - 5:00 PM</p>
                </div>

                <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center gap-3 mb-2">
                    <MessageSquare className="w-5 h-5 text-orange-600" />
                    <p className="font-semibold text-orange-900">Message Center</p>
                  </div>
                  <p className="text-sm text-orange-800 mb-2">Send message from dashboard</p>
                  <p className="text-xs text-orange-700">Response time: Within 24 hours</p>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-gray-900 mb-2">Support Hours</h3>
                <ul className="space-y-1 text-sm text-gray-700">
                  <li>Monday - Friday: 8:00 AM - 5:00 PM (WAT)</li>
                  <li>Saturday: 9:00 AM - 1:00 PM (WAT)</li>
                  <li>Sunday: Closed</li>
                  <li className="mt-2 pt-2 border-t border-gray-200">
                    Emergency support: Available 24/7 for critical issues
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
