'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { CreditCard, Upload, AlertCircle, CheckCircle, Clock, Download, TrendingDown } from 'lucide-react'
import { toast } from 'sonner'
import StudentPortalLayout from '@/components/student-portal-layout'

interface PaymentRecord {
  id: string
  term: string
  session: string
  amount_due: number
  amount_paid: number
  balance: number
  payment_status: string
  payment_method: string
  paystack_reference?: string
  receipt_url?: string
  payment_completed_at?: string
  verified_at?: string
  remarks?: string
}

export default function StudentPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [uploadDialog, setUploadDialog] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const initializePage = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        const { data: studentData } = await supabase
          .from('students')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (!studentData) {
          toast.error('Student profile not found')
          return
        }

        setStudentId(studentData.id)

        const response = await fetch(`/api/payments/records?studentId=${studentData.id}`)
        const paymentsData = await response.json()
        setPayments(paymentsData.data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [router])

  const handlePayOnline = async (payment: PaymentRecord) => {
    if (!studentId) {
      toast.error('Student profile not found')
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user?.email) {
        toast.error('Email not found')
        return
      }

      const response = await fetch('/api/payments/paystack/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          amount: payment.balance || payment.amount_due,
          email: userData.user.email,
          term: payment.term,
          session: payment.session,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to initialize payment')
        return
      }

      window.location.href = data.data.authorization_url
    } catch (error: any) {
      toast.error(error.message || 'Failed to process payment')
    }
  }

  const handleUploadProof = async () => {
    if (!uploadFile || !selectedPayment) {
      toast.error('Please select a file')
      return
    }

    setUploading(true)
    try {
      const fileName = `proof_${selectedPayment.id}_${Date.now()}`
      const { data, error } = await supabase.storage
        .from('payment-proofs')
        .upload(fileName, uploadFile)

      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('payment-proofs')
        .getPublicUrl(fileName)

      const updateResponse = await fetch('/api/payments/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedPayment.id,
          paymentStatus: 'pending',
          remarks: uploadFile.name,
        }),
      })

      if (!updateResponse.ok) {
        toast.error('Failed to save proof')
        return
      }

      setPayments(
        payments.map((p) =>
          p.id === selectedPayment.id
            ? { ...p, receipt_url: urlData.publicUrl, payment_status: 'pending' }
            : p
        )
      )

      toast.success('Proof uploaded successfully! Waiting for admin verification.')
      setUploadDialog(false)
      setUploadFile(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload proof')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'pending':
        return <Clock className="w-4 h-4" />
      default:
        return <AlertCircle className="w-4 h-4" />
    }
  }

  const totalBalance = payments.reduce((sum, p) => sum + (p.balance || 0), 0)
  const totalPaid = payments.reduce((sum, p) => sum + p.amount_paid, 0)
  const totalDue = payments.reduce((sum, p) => sum + p.amount_due, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">Loading payment information...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">School Fees</h1>
        <p className="text-gray-600 mt-2">View and manage your school fee payments</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">₦{totalDue.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">₦{totalPaid.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">₦{totalBalance.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No payment records found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {payment.term} - {payment.session}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Payment Method: {payment.payment_method === 'online' ? 'Online (Paystack)' : 'Bank Transfer / Proof Upload'}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(payment.payment_status)} flex items-center gap-1`}>
                    {getStatusIcon(payment.payment_status)}
                    {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Amount Due</p>
                      <p className="text-lg font-semibold">₦{payment.amount_due.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="text-lg font-semibold text-green-600">₦{payment.amount_paid.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Balance</p>
                      <p className="text-lg font-semibold text-orange-600">₦{(payment.balance || 0).toLocaleString()}</p>
                    </div>
                  </div>

                  {payment.payment_status === 'verified' && (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        Payment verified on {new Date(payment.verified_at!).toLocaleDateString()}
                      </AlertDescription>
                    </Alert>
                  )}

                  {payment.payment_status === 'pending' && payment.receipt_url && (
                    <Alert>
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        Proof of payment uploaded. Awaiting admin verification.
                        {payment.remarks && ` (${payment.remarks})`}
                      </AlertDescription>
                    </Alert>
                  )}

                  {payment.balance && payment.balance > 0 && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handlePayOnline(payment)}
                        className="flex-1"
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Online
                      </Button>

                      <Dialog open={uploadDialog && selectedPayment?.id === payment.id} onOpenChange={setUploadDialog}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            onClick={() => setSelectedPayment(payment)}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Proof
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Upload Payment Proof</DialogTitle>
                            <DialogDescription>
                              Upload a screenshot or receipt of your bank transfer
                            </DialogDescription>
                          </DialogHeader>

                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium">Select File</label>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                className="w-full px-3 py-2 border rounded-lg"
                              />
                            </div>

                            <Button
                              onClick={handleUploadProof}
                              disabled={!uploadFile || uploading}
                              className="w-full"
                            >
                              {uploading ? 'Uploading...' : 'Upload Proof'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
