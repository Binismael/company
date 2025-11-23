'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import {
  DollarSign,
  Download,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Clock,
  FileText,
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function ParentFeesPage() {
  const router = useRouter()
  const [fees, setFees] = useState<any[]>([])
  const [payments, setPayments] = useState<any[]>([])
  const [children, setChildren] = useState<any[]>([])
  const [selectedChild, setSelectedChild] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { user: authUser },
        } = await supabase.auth.getUser()

        if (!authUser) {
          router.push('/auth/parent-login')
          return
        }

        // Get parent's children
        const { data: parentData, error: parentError } = await supabase
          .from('parents')
          .select(
            `
            *,
            children:parent_student(
              student:students(
                id,
                admission_number,
                user:users(full_name)
              )
            )
          `
          )
          .eq('user_id', authUser.id)
          .single()

        if (parentError || !parentData?.children) {
          throw new Error('Failed to load children')
        }

        const mappedChildren = parentData.children.map((c: any) => c.student)
        setChildren(mappedChildren)

        if (mappedChildren.length > 0) {
          setSelectedChild(mappedChildren[0].id)
          await fetchFeesData(mappedChildren[0].id)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load fees')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const fetchFeesData = async (studentId: string) => {
    try {
      // Fetch fees
      const { data: feesData } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false })

      setFees(feesData || [])

      // Fetch payments
      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false })

      setPayments(paymentsData || [])
    } catch (err: any) {
      toast.error('Failed to load fees data')
    }
  }

  const calculateTotalDue = () => {
    return fees.reduce((sum, fee) => sum + (fee.balance || 0), 0)
  }

  const calculateTotalPaid = () => {
    return payments.reduce((sum, p) => sum + p.amount, 0)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800'
      case 'Partial':
        return 'bg-yellow-100 text-yellow-800'
      case 'Pending':
        return 'bg-red-100 text-red-800'
      case 'Overdue':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading fees information...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/parent-dashboard">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">School Fees</h1>
                <p className="text-sm text-gray-600">Manage and track payments</p>
              </div>
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
        {/* Child Selection */}
        {children.length > 1 && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Select Child
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setSelectedChild(child.id)
                    fetchFeesData(child.id)
                  }}
                  className={`text-left p-4 rounded-lg border-2 transition-all ${
                    selectedChild === child.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">{child.user.full_name}</div>
                  <div className="text-sm text-gray-600">{child.admission_number}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Due</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ₦{calculateTotalDue().toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₦{calculateTotalPaid().toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">
                {fees.filter((f) => f.status === 'Pending').length}
              </div>
              <p className="text-xs text-gray-600 mt-1">terms</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Paid Up</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {fees.filter((f) => f.status === 'Paid').length}
              </div>
              <p className="text-xs text-gray-600 mt-1">terms</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="fees" className="bg-white rounded-lg shadow-sm">
          <TabsList className="grid w-full grid-cols-2 p-4 bg-gray-50 border-b">
            <TabsTrigger value="fees">Fee Statements</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
          </TabsList>

          {/* Fees Tab */}
          <TabsContent value="fees" className="p-6">
            {fees.length > 0 ? (
              <div className="space-y-4">
                {fees.map((fee) => (
                  <Card key={fee.id} className="border border-gray-200">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {fee.term} - {fee.session}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Due: {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'Not set'}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                            fee.status
                          )}`}
                        >
                          {fee.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Amount Due</p>
                          <p className="text-lg font-semibold text-gray-900">
                            ₦{fee.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Amount Paid</p>
                          <p className="text-lg font-semibold text-green-600">
                            ₦{fee.paid_amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600 mb-1">Balance</p>
                          <p className="text-lg font-semibold text-red-600">
                            ₦{fee.balance.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${(fee.paid_amount / fee.amount) * 100}%`,
                          }}
                        ></div>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1 gap-2" size="sm">
                          <DollarSign className="w-4 h-4" />
                          Make Payment
                        </Button>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Download className="w-4 h-4" />
                          Download Receipt
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No fees assigned yet</p>
              </div>
            )}
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="p-6">
            {payments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 font-semibold text-gray-900">Date</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Method</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Reference</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Status</th>
                      <th className="text-left py-3 font-semibold text-gray-900">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr
                        key={payment.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-3">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="py-3 font-semibold">
                          ₦{payment.amount.toLocaleString()}
                        </td>
                        <td className="py-3">{payment.payment_method}</td>
                        <td className="py-3 text-gray-600 text-xs">
                          {payment.reference_number}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              payment.verified
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {payment.verified ? 'Verified' : 'Pending Verification'}
                          </span>
                        </td>
                        <td className="py-3">
                          <Button variant="ghost" size="sm" className="gap-2">
                            <Download className="w-3 h-3" />
                            Receipt
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No payment records yet</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Help Section */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700">
            <p>• Contact the bursar's office for payment inquiries</p>
            <p>• Keep your payment receipts for reference</p>
            <p>• Ensure payment references match the fee statement</p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
