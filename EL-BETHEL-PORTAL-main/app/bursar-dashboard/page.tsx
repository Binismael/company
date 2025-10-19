'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Loader2, LogOut, DollarSign, CreditCard, TrendingUp, AlertCircle, CheckCircle, Download, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase-client'

interface Fee {
  id: string
  student_id: string
  term: string
  session: string
  amount: number
  paid_amount: number
  balance: number
  status: string
  due_date: string
  student: { user: { full_name: string } }
}

interface Payment {
  id: string
  student_id: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number: string
  verified: boolean
  verified_by?: string
  student: { user: { full_name: string } }
}

interface FinanceStats {
  totalExpected: number
  totalCollected: number
  totalPending: number
  totalOverdue: number
  collectionRate: number
}

export default function BursarDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [fees, setFees] = useState<Fee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<FinanceStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/login')
          return
        }

        // Get user info
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()

        if (userError || userData.role !== 'bursar') {
          router.push('/auth/login')
          return
        }

        setUser(userData)

        // Get all fees with student info
        const { data: feesData, error: feesError } = await supabase
          .from('fees')
          .select(`
            *,
            student:students(user:users(full_name))
          `)
          .order('due_date', { ascending: true })

        if (feesError) throw feesError
        setFees(feesData)

        // Get all payments with student info
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select(`
            *,
            student:students(user:users(full_name))
          `)
          .order('payment_date', { ascending: false })

        if (paymentsError) throw paymentsError
        setPayments(paymentsData)

        // Calculate stats
        calculateStats(feesData, paymentsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    const calculateStats = (feesData: any[], paymentsData: any[]) => {
      const totalExpected = feesData.reduce((sum, f) => sum + parseFloat(f.amount), 0)
      const totalCollected = paymentsData.reduce((sum, p) => sum + parseFloat(p.amount), 0)
      const totalPending = feesData
        .filter(f => f.status === 'Pending' || f.status === 'Partial')
        .reduce((sum, f) => sum + parseFloat(f.balance), 0)
      const totalOverdue = feesData
        .filter(f => f.status === 'Overdue')
        .reduce((sum, f) => sum + parseFloat(f.balance), 0)
      const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0

      setStats({
        totalExpected,
        totalCollected,
        totalPending,
        totalOverdue,
        collectionRate: parseFloat(collectionRate.toFixed(2)),
      })
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const verifyPayment = async (paymentId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('payments')
        .update({ verified: true })
        .eq('id', paymentId)

      if (updateError) throw updateError

      // Refresh payments
      const { data: updatedPayments } = await supabase
        .from('payments')
        .select(`
          *,
          student:students(user:users(full_name))
        `)
        .order('payment_date', { ascending: false })

      if (updatedPayments) setPayments(updatedPayments)
    } catch (err: any) {
      setError(err.message)
    }
  }

  const filteredFees = fees.filter(fee => {
    const matchesSearch = fee.student.user.full_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || fee.status === filterStatus

    return matchesSearch && matchesStatus
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">
                Bursar's Office
              </h1>
              <p className="mt-2 text-primary-100">
                Financial management and payment tracking
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2 text-white border-white hover:bg-primary-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
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

        {/* Finance Stats */}
        {stats && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Financial Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="border-l-4 border-l-blue-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Expected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ₦{(stats.totalExpected / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Collected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ₦{(stats.totalCollected / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-yellow-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Pending
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-yellow-600">
                      ₦{(stats.totalPending / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-red-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Overdue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      ₦{(stats.totalOverdue / 1000000).toFixed(2)}M
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-600">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Rate
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-600">
                      {stats.collectionRate}%
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}

        {/* Tabs */}
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Fees</span>
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Payments</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Reports</span>
            </TabsTrigger>
          </TabsList>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Management</CardTitle>
                <CardDescription>
                  Manage student fees and payment status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Input
                    placeholder="Search student name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="Paid">Paid</option>
                    <option value="Partial">Partial</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>

                {filteredFees.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No fees found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Student</th>
                          <th className="text-left py-3 px-4 font-medium">Term</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Paid</th>
                          <th className="text-left py-3 px-4 font-medium">Balance</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Due Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredFees.map((fee) => (
                          <tr key={fee.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">
                              {fee.student.user.full_name}
                            </td>
                            <td className="py-3 px-4">{fee.term}</td>
                            <td className="py-3 px-4">₦{parseFloat(fee.amount).toLocaleString()}</td>
                            <td className="py-3 px-4 text-green-600 font-medium">
                              ₦{parseFloat(fee.paid_amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-red-600 font-medium">
                              ₦{parseFloat(fee.balance).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  fee.status === 'Paid'
                                    ? 'default'
                                    : fee.status === 'Partial'
                                    ? 'secondary'
                                    : fee.status === 'Overdue'
                                    ? 'destructive'
                                    : 'outline'
                                }
                              >
                                {fee.status}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-gray-600 text-xs">
                              {new Date(fee.due_date).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>Payment Records</CardTitle>
                    <CardDescription>
                      Total payments: {payments.length}
                    </CardDescription>
                  </div>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Record Payment
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No payments recorded
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left py-3 px-4 font-medium">Student</th>
                          <th className="text-left py-3 px-4 font-medium">Amount</th>
                          <th className="text-left py-3 px-4 font-medium">Method</th>
                          <th className="text-left py-3 px-4 font-medium">Reference</th>
                          <th className="text-left py-3 px-4 font-medium">Date</th>
                          <th className="text-left py-3 px-4 font-medium">Status</th>
                          <th className="text-left py-3 px-4 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium">
                              {payment.student.user.full_name}
                            </td>
                            <td className="py-3 px-4 font-semibold text-green-600">
                              ₦{parseFloat(payment.amount).toLocaleString()}
                            </td>
                            <td className="py-3 px-4">{payment.payment_method}</td>
                            <td className="py-3 px-4 font-mono text-xs">
                              {payment.reference_number}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  payment.verified ? 'default' : 'outline'
                                }
                              >
                                {payment.verified ? 'Verified' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4">
                              {!payment.verified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => verifyPayment(payment.id)}
                                >
                                  Verify
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Reports</CardTitle>
                <CardDescription>
                  Generate and download reports
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Download className="h-5 w-5" />
                    <span className="text-sm">Fee Summary Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Download className="h-5 w-5" />
                    <span className="text-sm">Payment History</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Download className="h-5 w-5" />
                    <span className="text-sm">Overdue Report</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                    <Download className="h-5 w-5" />
                    <span className="text-sm">Monthly Statement</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Collection Summary</CardTitle>
                <CardDescription>
                  By payment method and status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Cash</p>
                    <p className="text-xl font-bold text-blue-600">
                      ₦{(payments.filter(p => p.payment_method === 'Cash').reduce((sum, p) => sum + parseFloat(p.amount), 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Bank Transfer</p>
                    <p className="text-xl font-bold text-green-600">
                      ₦{(payments.filter(p => p.payment_method === 'Bank Transfer').reduce((sum, p) => sum + parseFloat(p.amount), 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">Verified</p>
                    <p className="text-xl font-bold text-purple-600">
                      ₦{(payments.filter(p => p.verified).reduce((sum, p) => sum + parseFloat(p.amount), 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <p className="text-sm text-gray-600">Pending Verification</p>
                    <p className="text-xl font-bold text-orange-600">
                      ₦{(payments.filter(p => !p.verified).reduce((sum, p) => sum + parseFloat(p.amount), 0) / 1000000).toFixed(2)}M
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
