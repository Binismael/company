'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, LogOut, DollarSign, CreditCard } from 'lucide-react'
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
}

interface Payment {
  id: string
  student_id: string
  amount: number
  payment_method: string
  payment_date: string
  reference_number: string
  verified: boolean
}

export default function BursarDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [fees, setFees] = useState<Fee[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

        if (userError) throw userError
        setUser(userData)

        // Get all fees
        const { data: feesData, error: feesError } = await supabase
          .from('fees')
          .select('*')
          .order('due_date', { ascending: true })

        if (feesError) throw feesError
        setFees(feesData)

        // Get all payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('payments')
          .select('*')
          .order('payment_date', { ascending: false })

        if (paymentsError) throw paymentsError
        setPayments(paymentsData)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const totalExpected = fees.reduce((sum, f) => sum + f.amount, 0)
  const totalCollected = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalOutstanding = fees.reduce((sum, f) => sum + f.balance, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Bursar Dashboard
              </h1>
              <p className="text-gray-600 mt-1">Manage fees and payments</p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="gap-2"
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Expected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary-600">
                ₦{totalExpected.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {fees.length} fee records
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Collected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₦{totalCollected.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {payments.length} payments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Outstanding
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ₦{totalOutstanding.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Balance due
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fees" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="fees" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Fees
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-2">
              <CreditCard className="h-4 w-4" />
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Fees Tab */}
          <TabsContent value="fees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Fee Records</CardTitle>
                <CardDescription>
                  All student fees
                </CardDescription>
              </CardHeader>
              <CardContent>
                {fees.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No fee records
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium">
                            Student ID
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Term
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Amount
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Paid
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Balance
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {fees.map((fee) => (
                          <tr key={fee.id} className="border-b hover:bg-gray-50">
                            <td className="py-2 px-4 text-sm">
                              {fee.student_id.substring(0, 8)}...
                            </td>
                            <td className="py-2 px-4">{fee.term}</td>
                            <td className="py-2 px-4">
                              ₦{fee.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">
                              ₦{fee.paid_amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">
                              ₦{fee.balance.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">
                              <Badge
                                variant={
                                  fee.status === 'Paid'
                                    ? 'default'
                                    : fee.status === 'Overdue'
                                    ? 'destructive'
                                    : 'secondary'
                                }
                              >
                                {fee.status}
                              </Badge>
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
                <CardTitle>Payment Records</CardTitle>
                <CardDescription>
                  All fee payments received
                </CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No payments recorded
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b">
                        <tr>
                          <th className="text-left py-2 px-4 font-medium">
                            Reference
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Amount
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Method
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Date
                          </th>
                          <th className="text-left py-2 px-4 font-medium">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((payment) => (
                          <tr
                            key={payment.id}
                            className="border-b hover:bg-gray-50"
                          >
                            <td className="py-2 px-4 font-mono text-sm">
                              {payment.reference_number}
                            </td>
                            <td className="py-2 px-4">
                              ₦{payment.amount.toLocaleString()}
                            </td>
                            <td className="py-2 px-4">
                              {payment.payment_method}
                            </td>
                            <td className="py-2 px-4">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </td>
                            <td className="py-2 px-4">
                              <Badge
                                variant={
                                  payment.verified ? 'default' : 'outline'
                                }
                              >
                                {payment.verified ? 'Verified' : 'Pending'}
                              </Badge>
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
        </Tabs>
      </div>
    </div>
  )
}
