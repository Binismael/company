'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Eye, Download, Filter } from 'lucide-react'
import { toast } from 'sonner'

interface PaymentRecord {
  id: string
  student: {
    admission_number: string
  }
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
  proof_uploaded_at?: string
  remarks?: string
  verified_by_user?: { full_name: string }
}

export default function AdminPaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [verificationDialog, setVerificationDialog] = useState(false)
  const [verificationRemarks, setVerificationRemarks] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }

        setUserId(user.id)

        const response = await fetch('/api/payments/records')
        const paymentsData = await response.json()
        setPayments(paymentsData.data || [])
      } catch (error: any) {
        toast.error(error.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [router])

  const handleVerifyPayment = async () => {
    if (!selectedPayment || !userId) return

    setVerifying(true)
    try {
      const response = await fetch('/api/payments/records', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recordId: selectedPayment.id,
          paymentStatus: 'verified',
          verifiedBy: userId,
          remarks: verificationRemarks,
        }),
      })

      if (!response.ok) {
        toast.error('Failed to verify payment')
        return
      }

      const data = await response.json()

      setPayments(
        payments.map((p) =>
          p.id === selectedPayment.id ? data.data : p
        )
      )

      toast.success('Payment verified successfully')
      setVerificationDialog(false)
      setSelectedPayment(null)
      setVerificationRemarks('')
    } catch (error: any) {
      toast.error('Failed to verify payment')
    } finally {
      setVerifying(false)
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

  const filteredPayments = payments.filter((p) => {
    if (filterStatus === 'all') return true
    return p.payment_status === filterStatus
  })

  const stats = {
    total: payments.length,
    verified: payments.filter((p) => p.payment_status === 'verified').length,
    pending: payments.filter((p) => p.payment_status === 'pending').length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount_paid, 0),
    totalDue: payments.reduce((sum, p) => sum + p.amount_due, 0),
  }

  if (loading) {
    return <div className="text-center py-12">Loading payment records...</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Payments Management</h1>
        <p className="text-gray-600 mt-2">Monitor and verify school fee payments</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{stats.verified}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Amount Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">₦{stats.totalAmount.toLocaleString()}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">₦{stats.totalDue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-3">
        {['all', 'verified', 'pending'].map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'outline'}
            onClick={() => setFilterStatus(status)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {status === 'all' ? 'All Records' : status.charAt(0).toUpperCase() + status.slice(1)}
          </Button>
        ))}
      </div>

      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600">No payment records found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Payment Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Admission No.</th>
                    <th className="text-left py-3 px-4 font-medium">Term</th>
                    <th className="text-right py-3 px-4 font-medium">Amount Due</th>
                    <th className="text-right py-3 px-4 font-medium">Paid</th>
                    <th className="text-right py-3 px-4 font-medium">Balance</th>
                    <th className="text-center py-3 px-4 font-medium">Status</th>
                    <th className="text-left py-3 px-4 font-medium">Method</th>
                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">{payment.student.admission_number}</td>
                      <td className="py-3 px-4">
                        <span className="text-xs text-gray-600">
                          {payment.term}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">₦{payment.amount_due.toLocaleString()}</td>
                      <td className="text-right py-3 px-4 text-green-600 font-medium">
                        ₦{payment.amount_paid.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-orange-600 font-medium">
                        ₦{(payment.balance || 0).toLocaleString()}
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge className={getStatusColor(payment.payment_status)}>
                          {payment.payment_status.charAt(0).toUpperCase() +
                            payment.payment_status.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-xs">
                        {payment.payment_method === 'online' ? 'Paystack' : 'Manual'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          {payment.receipt_url && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(payment.receipt_url, '_blank')}
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                          )}
                          {payment.payment_status === 'pending' && (
                            <Dialog
                              open={verificationDialog && selectedPayment?.id === payment.id}
                              onOpenChange={setVerificationDialog}
                            >
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedPayment(payment)}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Verify Payment</DialogTitle>
                                  <DialogDescription>
                                    Verify this payment for{' '}
                                    {payment.student.admission_number}
                                  </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4">
                                  <Alert>
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>
                                      Amount: ₦{payment.amount_paid.toLocaleString()}
                                    </AlertDescription>
                                  </Alert>

                                  <div>
                                    <label className="text-sm font-medium">
                                      Verification Remarks (Optional)
                                    </label>
                                    <Textarea
                                      value={verificationRemarks}
                                      onChange={(e) =>
                                        setVerificationRemarks(e.target.value)
                                      }
                                      placeholder="Add any remarks about this payment"
                                      rows={3}
                                    />
                                  </div>

                                  <Button
                                    onClick={handleVerifyPayment}
                                    disabled={verifying}
                                    className="w-full"
                                  >
                                    {verifying ? 'Verifying...' : 'Verify Payment'}
                                  </Button>
                                </div>
                              </DialogContent>
                            </Dialog>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
