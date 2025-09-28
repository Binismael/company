import { supabase } from "./supabase-client"

export async function getAnnouncements(limit = 10) {
  const { data, error } = await supabase
    .from("announcements")
    .select("id,title,body,created_at")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function getClassPaymentSummary() {
  const { data, error } = await supabase.rpc("class_payment_summary")
  if (error) return []
  return data as any[]
}

export async function getRecentPayments(limit = 20) {
  const { data, error } = await supabase
    .from("payments")
    .select("id,amount,status,receipt,paid_at,student:profiles(full_name),class:classes(name)")
    .order("paid_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}
