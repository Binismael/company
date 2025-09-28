import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function GET() {
  const now = new Date().toISOString()

  const [{ count: studentCount }, { count: teacherCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "student"),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
  ])

  const [{ data: revRows }, { count: pendingPayments }, { count: activeExams }, { data: annRows }] = await Promise.all([
    supabase.from("payments").select("amount, status").eq("status", "approved"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("exams").select("id", { count: "exact", head: true }).gte("scheduled_at", now),
    supabase.from("announcements").select("id,title,created_at").order("created_at", { ascending: false }).limit(5),
  ])

  const totalRevenue = (revRows || []).reduce((s, r) => s + Number(r.amount || 0), 0)
  const systemAlerts = annRows?.length || 0

  return NextResponse.json({
    stats: {
      totalStudents: studentCount || 0,
      totalTeachers: teacherCount || 0,
      totalRevenue,
      pendingPayments: pendingPayments || 0,
      activeExams: activeExams || 0,
      systemAlerts,
    },
    recentAnnouncements: annRows || [],
    pendingApprovals: pendingPayments || 0,
  })
}
