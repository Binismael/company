import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const documentType = searchParams.get('type')
    const userId = searchParams.get('userId')
    const studentId = searchParams.get('studentId')

    let query = supabaseAdmin
      .from('documents')
      .select(`
        *,
        user:users(id, full_name, email),
        student:students(id, admission_number, user:users(full_name)),
        uploaded_by_user:users!uploaded_by(id, full_name)
      `)
      .order('created_at', { ascending: false })

    if (documentType) {
      query = query.eq('document_type', documentType)
    }

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const {
      userId,
      studentId,
      assignmentId,
      documentType,
      fileName,
      filePath,
      fileSize,
      mimeType,
      description,
      uploadedBy,
    } = body

    if (!documentType || !fileName || !filePath) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['profile_picture', 'student_document', 'assignment_submission', 'receipt'].includes(documentType)) {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('documents')
      .insert([
        {
          user_id: userId || null,
          student_id: studentId || null,
          assignment_id: assignmentId || null,
          document_type: documentType,
          file_name: fileName,
          file_path: filePath,
          file_size: fileSize || null,
          mime_type: mimeType || null,
          description: description || null,
          uploaded_by: uploadedBy || null,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Service not available' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { documentId } = body

    if (!documentId) {
      return NextResponse.json(
        { error: 'documentId is required' },
        { status: 400 }
      )
    }

    const { error } = await supabaseAdmin
      .from('documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
