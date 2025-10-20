'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Plus, Download, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

interface Payment {
  id: string
  student: { full_name: string; admission_number: string }
  amount_due: number
  amount_paid: number
  balance: number
  payment_status: string
  term: string
  session: string
}

export default function PaymentsManagementPage() {
  const [loading, setLoading] = useState(true)
  const [payments, setPayments] = useState<Payment[]>([])
  const [totalDue, setTotalDue] = useState(0)
  const [totalPaid, setTotalPaid] = useState(0)
  const [totalOutstanding, setTotalOutstanding] = useState(0)
  const [showFeeStructureDialog, setShowFeeStructureDialog] = useState(false)
  const [newFee, setNewFee] = useState({ term: '', amount: 0, description: '' })

  useEffect(() => {
    const loadPayments = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select(`
            *,
            student:students(full_name, admission_number)
          `)
          .order('created_at', { ascending: false })

        if (error) throw error

        setPayments(data || [])

        const total_due = data?.reduce((sum: number, p: any) => sum + (p.amount_due || 0), 0) || 0
        const total_paid = data?.reduce((sum: number, p: any) => sum + (p.amount_paid || 0), 0) || 0
        const total_outstanding = data?.reduce((sum: number, p: any) => sum + (p.balance || 0), 0) || 0

        setTotalDue(total_due)
        setTotalPaid(total_paid)
        setTotalOutstanding(total_outstanding)
      } catch (error: any) {
        toast.error(error.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    loadPayments()
  }, [])

  const handleCreateFeeStructure = async () => {
    if (!newFee.term || !newFee.amount) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const { error } = await supabase.from('fee_structures').insert({
        term: newFee.term,
        amount: newFee.amount,
        description: newFee.description,
      })

      if (error) throw error

      toast.success('Fee structure created')
      setShowFeeStructureDialog(false)
      setNewFee({ term: '', amount: 0, description: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to create fee structure')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fees & Payments</h1>
          <p className="text-gray-600 mt-2">Track and manage school fee payments</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={showFeeStructureDialog} onOpenChange={setShowFeeStructureDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Set Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Fee Structure</DialogTitle>
                <DialogDescription>Define fees for a term or session</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Term</label>
                  <select
                    value={newFee.term}
                    onChange={(e) => setNewFee({ ...newFee, term: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select term</option>
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Amount (₦)</label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={newFee.amount}
                    onChange={(e) => setNewFee({ ...newFee, amount: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="e.g., JSS Class fees"
                    value={newFee.description}
                    onChange={(e) => setNewFee({ ...newFee, description: e.target.value })}
                  />
                </div>
                <Button onClick={handleCreateFeeStructure} className="w-full">
                  Create Structure
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Due</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">₦{(totalDue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">All students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">₦{(totalPaid / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">Collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-orange-600">₦{(totalOutstanding / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-gray-500 mt-1">Pending</p>
          </CardContent>
        </Card>
      </div>

      {totalOutstanding > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ₦{(totalOutstanding / 1000000).toFixed(1)}M outstanding from {payments.filter(p => p.balance > 0).length} students
          </AlertDescription>
        </Alert>
      )}

      {/* Payment Records */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Student</th>
                  <th className="text-left py-2 px-3">Amount Due</th>
                  <th className="text-left py-2 px-3">Paid</th>
                  <th className="text-left py-2 px-3">Balance</th>
                  <th className="text-left py-2 px-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-3">
                      <p className="font-medium">{payment.student.full_name}</p>
                      <p className="text-xs text-gray-500">{payment.student.admission_number}</p>
                    </td>
                    <td className="py-2 px-3">₦{payment.amount_due.toLocaleString()}</td>
                    <td className="py-2 px-3 text-green-600 font-medium">₦{payment.amount_paid.toLocaleString()}</td>
                    <td className="py-2 px-3 font-medium">₦{payment.balance.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <Badge
                        className={
                          payment.payment_status === 'verified'
                            ? 'bg-green-100 text-green-800'
                            : payment.payment_status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {payment.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
