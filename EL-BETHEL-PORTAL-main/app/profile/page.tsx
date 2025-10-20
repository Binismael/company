"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { Loader2, ArrowLeft } from "lucide-react"

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const { data: auth } = await supabase.auth.getUser()
        const user = auth.user
        if (!user) { router.push("/auth/login"); return }
        const { data: student } = await supabase
          .from("students")
          .select("*, class:classes(name, form_level), user:users(full_name, email)")
          .eq("user_id", user.id)
          .maybeSingle()
        setProfile(student)
      } catch (e:any) { setError(e.message || "Failed to load profile") }
      finally { setLoading(false) }
    }
    load()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/student-dashboard" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Link>
          <h1 className="text-lg sm:text-xl font-semibold">Profile</h1>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && <Alert className="mb-4" variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}

        {!profile ? (
          <Card className="border-0 shadow-sm"><CardHeader><CardTitle>No profile</CardTitle><CardDescription>Please contact admin to set up your profile.</CardDescription></CardHeader></Card>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle>{profile.user?.full_name}</CardTitle><CardDescription>{profile.user?.email}</CardDescription></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><div className="text-xs text-gray-600">Reg Number</div><div className="font-medium">{profile.reg_number || profile.admission_number}</div></div>
              <div><div className="text-xs text-gray-600">Class</div><div className="font-medium">{profile.class?.name}</div></div>
              <div><div className="text-xs text-gray-600">Gender</div><div className="font-medium">{profile.gender || '-'}</div></div>
              <div><div className="text-xs text-gray-600">Guardian</div><div className="font-medium">{profile.guardian_name || '-'}</div></div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
