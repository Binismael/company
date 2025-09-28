import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase-client"

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const id = params.id
  const body = await _req.json().catch(()=> ({}))
  const patch: any = {}
  if (typeof body.role === 'string') patch.role = body.role
  if (typeof body.is_approved === 'boolean') patch.is_approved = body.is_approved
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  const { error, data } = await supabase.from('profiles').update(patch).eq('id', id).select('id,role,is_approved').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
