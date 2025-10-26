import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

export async function GET() {
  try {
    // Fetch all classes
    const { data: classes, error: classError } = await supabase
      .from('classes')
      .select('id, name, form_level')
      .order('name')

    if (classError) {
      console.error('Error fetching classes:', classError)
      return NextResponse.json(
        { error: 'Failed to fetch classes' },
        { status: 500 }
      )
    }

    // Fetch all subjects
    const { data: subjects, error: subjectError } = await supabase
      .from('subjects')
      .select('id, name, code')
      .order('name')

    if (subjectError) {
      console.error('Error fetching subjects:', subjectError)
      return NextResponse.json(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      classes: classes || [],
      subjects: subjects || [],
    })
  } catch (error: any) {
    console.error('Error in dropdown data endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
