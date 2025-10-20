"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

interface FeeRow { id: string; term: string; session: string; amount: number; paid_amount: number; status: string; due_date: string | null }
interface PaymentRow { id: string; amount: number; payment_date?: string; verified?: boolean }

export default function FeesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [fees, setFees] = useState<FeeRow[]>([])
  const [payments, setPayments] = useState<PaymentRow[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        const { data: student } = await supabase.from("students").select("id").eq("user_id", user.id).maybeSingle()
        if (!student) throw new Error("Student profile not found")

        const { data: feesData } = await supabase.from("fees").select("id, term, session, amount, paid_amount, status, due_date").eq("student_id", student.id)
        setFees(feesData || [])
        const { data: payData } = await supabase.from("payments").select("id, amount, payment_date, verified").eq("student_id", student.id).order("payment_date", { ascending: false })
        setPayments(payData || [])
      } catch (e:any) { setError(e.message || "Failed to load fees") } finally { setLoading(false) }
    }
    load()
  }, [router])

  const totals = useMemo(() => {
    const total = fees.reduce((s,f)=> s + Number(f.amount||0), 0)
    const paid = fees.reduce((s,f)=> s + Number(f.paid_amount||0), 0)
    return { total, paid, balance: Math.max(0, total - paid) }
  }, [fees])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Fees & Payments</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        <Card className="border-0 shadow-sm mb-6">
          <CardHeader><CardTitle>Overview</CardTitle><CardDescription>Current session totals</CardDescription></CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg border"><div className="text-xs text-gray-600 mb-1">Total Fees</div><div className="text-2xl font-bold">₦{totals.total.toLocaleString()}</div></div>
            <div className="p-4 rounded-lg border"><div className="text-xs text-gray-600 mb-1">Paid</div><div className="text-2xl font-bold text-green-600">₦{totals.paid.toLocaleString()}</div></div>
            <div className="p-4 rounded-lg border"><div className="text-xs text-gray-600 mb-1">Balance</div><div className="text-2xl font-bold text-red-600">₦{totals.balance.toLocaleString()}</div></div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm mb-6">
          <CardHeader><CardTitle>Fee Items</CardTitle></CardHeader>
          <CardContent>
            {fees.length === 0 ? <p className="text-sm text-gray-600">No fee items yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4">Term</th><th className="text-left py-3 px-4">Session</th><th className="text-left py-3 px-4">Amount</th><th className="text-left py-3 px-4">Paid</th><th className="text-left py-3 px-4">Status</th></tr></thead>
                  <tbody>
                    {fees.map(f => (
                      <tr key={f.id} className="border-b">
                        <td className="py-3 px-4">{f.term}</td>
                        <td className="py-3 px-4">{f.session}</td>
                        <td className="py-3 px-4">₦{Number(f.amount||0).toLocaleString()}</td>
                        <td className="py-3 px-4">₦{Number(f.paid_amount||0).toLocaleString()}</td>
                        <td className="py-3 px-4"><Badge variant={f.status==='Paid' ? 'default' : f.status==='Overdue' ? 'destructive' : 'secondary'}>{f.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
          <CardContent>
            {payments.length === 0 ? <p className="text-sm text-gray-600">No payments yet.</p> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b"><tr><th className="text-left py-3 px-4">Date</th><th className="text-left py-3 px-4">Amount</th><th className="text-left py-3 px-4">Verified</th></tr></thead>
                  <tbody>
                    {payments.map(p => (
                      <tr key={p.id} className="border-b">
                        <td className="py-3 px-4">{p.payment_date ? new Date(p.payment_date).toLocaleDateString() : '-'}</td>
                        <td className="py-3 px-4">₦{Number(p.amount||0).toLocaleString()}</td>
                        <td className="py-3 px-4">{p.verified ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
