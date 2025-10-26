'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Loader2, CreditCard, Download, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'
import { useStudentFees } from '@/hooks/use-student-data'

declare global {
  interface Window {
    PaystackPop: any
  }
}

interface FeeItem {
  id: string
  description: string
  amount: number
  due_date: string
  status: 'pending' | 'paid' | 'overdue'
  reference?: string
  payment_date?: string
}

export default function StudentPaymentsPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState<any>(null)
  const { fees, totalFees, paidFees, balance, loading: feesLoading } = useStudentFees(userId)
  const [selectedFeeId, setSelectedFeeId] = useState<string | null>(null)
  const [processingPayment, setProcessingPayment] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/login')
          return
        }
        setUserId(user.id)

        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', user.id)
          .single()

        setUserInfo(userData)

        // Load Paystack script
        const script = document.createElement('script')
        script.src = 'https://js.paystack.co/v1/inline.js'
        document.body.appendChild(script)
      } catch (err: any) {
        setError(err.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router])

  const handlePayFee = async (feeId: string, amount: number) => {
    try {
      setProcessingPayment(true)

      if (!window.PaystackPop) {
        throw new Error('Paystack is not loaded. Please try again.')
      }

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: userInfo?.email || '',
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        ref: `FEE-${feeId}-${Date.now()}`,
        onClose: () => {
          setProcessingPayment(false)
        },
        callback: async (response: any) => {
          try {
            // Verify payment with backend
            const res = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                reference: response.reference,
                feeId: feeId,
              }),
            })

            if (!res.ok) {
              throw new Error('Payment verification failed')
            }

            // Update fee status
            await supabase
              .from('fees')
              .update({
                status: 'paid',
                payment_date: new Date().toISOString(),
                reference: response.reference,
              })
              .eq('id', feeId)

            alert('Payment successful! Your transaction has been recorded.')
            setSelectedFeeId(null)
            // Refresh fees
            router.refresh()
          } catch (err: any) {
            alert('Payment verification failed. Please contact support.')
          } finally {
            setProcessingPayment(false)
          }
        },
      })

      handler.openIframe()
    } catch (err: any) {
      alert(err.message || 'Payment failed')
      setProcessingPayment(false)
    }
  }

  const handlePayMultiple = async (feeIds: string[]) => {
    try {
      setProcessingPayment(true)

      const selectedFees = fees.filter((f: any) => feeIds.includes(f.id))
      const totalAmount = selectedFees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0)

      if (!window.PaystackPop) {
        throw new Error('Paystack is not loaded. Please try again.')
      }

      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
        email: userInfo?.email || '',
        amount: totalAmount * 100,
        currency: 'NGN',
        ref: `BULK-${Date.now()}`,
        onClose: () => {
          setProcessingPayment(false)
        },
        callback: async (response: any) => {
          try {
            // Update all fees
            for (const feeId of feeIds) {
              await supabase
                .from('fees')
                .update({
                  status: 'paid',
                  payment_date: new Date().toISOString(),
                  reference: response.reference,
                })
                .eq('id', feeId)
            }

            alert('All payments successful!')
            setSelectedFeeId(null)
            router.refresh()
          } catch (err: any) {
            alert('Payment processing failed. Please contact support.')
          } finally {
            setProcessingPayment(false)
          }
        },
      })

      handler.openIframe()
    } catch (err: any) {
      alert(err.message || 'Payment failed')
      setProcessingPayment(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4" />
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />
      case 'pending':
        return <Clock className="h-4 w-4" />
      default:
        return null
    }
  }

  const pendingFees = fees.filter((f: any) => f.status === 'pending' || f.status === 'overdue')
  const paidFeesData = fees.filter((f: any) => f.status === 'paid')

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Fee Payments</h1>
              <p className="text-gray-600 mt-2">Manage your school fees and payments</p>
            </div>
            <Link href="/student/dashboard">
              <Button variant="outline">← Back to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Fees</CardTitle>
            </CardHeader>
            <CardContent>
              {feesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-gray-900">₦{totalFees.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">For this session</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-green-600">Paid</CardTitle>
            </CardHeader>
            <CardContent>
              {feesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">₦{paidFees.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">Amount paid</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-red-600">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              {feesLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-red-600">₦{balance.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">Amount due</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Payment Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="mb-6 bg-white border border-gray-200">
            <TabsTrigger value="pending">
              Pending
              {pendingFees.length > 0 && (
                <Badge className="ml-2 bg-orange-600">{pendingFees.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="paid">
              Paid
              {paidFeesData.length > 0 && (
                <Badge className="ml-2 bg-green-600">{paidFeesData.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Fees */}
          <TabsContent value="pending" className="space-y-4">
            {feesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : pendingFees.length > 0 ? (
              <>
                {pendingFees.map((fee: any) => (
                  <Card key={fee.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-lg">{fee.description}</CardTitle>
                            <Badge className={getStatusColor(fee.status)}>
                              {getStatusIcon(fee.status)}
                              <span className="ml-1">{fee.status.toUpperCase()}</span>
                            </Badge>
                          </div>
                          <CardDescription>
                            Due: {new Date(fee.due_date).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-gray-900">₦{(fee.amount || 0).toLocaleString()}</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <Button
                        onClick={() => handlePayFee(fee.id, fee.amount)}
                        disabled={processingPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay Now
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                ))}

                {/* Bulk Payment */}
                {pendingFees.length > 1 && (
                  <Card className="bg-blue-50 border-blue-200 mt-6">
                    <CardHeader>
                      <CardTitle className="text-lg">Pay All Outstanding Fees</CardTitle>
                      <CardDescription>
                        Pay all pending fees at once
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-white p-4 rounded-lg mb-4 border border-blue-200">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-gray-900">Total Outstanding</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ₦{pendingFees.reduce((sum: number, f: any) => sum + (f.amount || 0), 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handlePayMultiple(pendingFees.map((f: any) => f.id))}
                        disabled={processingPayment}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        {processingPayment ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Pay All Fees
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">All fees paid!</p>
                  <p className="text-gray-500 mt-1">You have no outstanding fees</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Paid Fees */}
          <TabsContent value="paid" className="space-y-4">
            {feesLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : paidFeesData.length > 0 ? (
              paidFeesData.map((fee: any) => (
                <Card key={fee.id} className="border-green-200">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-lg">{fee.description}</CardTitle>
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-4 w-4" />
                            <span className="ml-1">PAID</span>
                          </Badge>
                        </div>
                        <CardDescription>
                          Paid: {new Date(fee.payment_date).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">₦{(fee.amount || 0).toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-1">Ref: {fee.reference?.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">No payments yet</p>
                  <p className="text-gray-500 mt-1">Your paid fees will appear here</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Info */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-lg">Payment Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <span className="font-semibold">Payment Method:</span> We accept payments via Paystack (Debit card, Transfer, USSD)
              </p>
              <p>
                <span className="font-semibold">Payment Status:</span> Your payment will be confirmed immediately after successful processing
              </p>
              <p>
                <span className="font-semibold">Receipt:</span> Digital receipts are available for download after payment
              </p>
              <p>
                <span className="font-semibold">Support:</span> For payment issues, contact the school's bursar office
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
