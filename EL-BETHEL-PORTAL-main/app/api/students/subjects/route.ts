import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'

interface SubjectsQuery {
  classLevel?: string
  department?: string
  term?: string
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const classLevel = searchParams.get('classLevel')
    const department = searchParams.get('department')
    const term = searchParams.get('term')

    let query = supabase
      .from('subjects')
      .select('id, name, code, class_level, department, term')

    // Filter by class level if provided
    if (classLevel) {
      query = query.eq('class_level', classLevel)
    }

    // Filter by department if provided
    if (department) {
      query = query.eq('department', department)
    }

    // Filter by term if provided
    if (term) {
      query = query.eq('term', term)
    }

    // Order by name
    query = query.order('name', { ascending: true })

    const { data: subjects, error } = await query

    if (error) {
      console.error('Error fetching subjects:', error)
      return NextResponse.json(
        { error: 'Failed to fetch subjects' },
        { status: 500 }
      )
    }

    // If no subjects found with filters, return available options
    if (!subjects || subjects.length === 0) {
      // Return all unique subjects for selection if filters don't match
      const { data: allSubjects, error: allError } = await supabase
        .from('subjects')
        .select('id, name, code, class_level, department, term')
        .eq('class_level', classLevel || '')
        .eq('department', department || '')
        .order('name', { ascending: true })

      if (allError) {
        console.error('Error fetching all subjects:', allError)
        return NextResponse.json(
          { error: 'Failed to fetch subjects' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        subjects: allSubjects || [],
        filtered: !!classLevel || !!department || !!term,
      })
    }

    return NextResponse.json({
      success: true,
      subjects,
      filtered: !!classLevel || !!department || !!term,
    })
  } catch (error: any) {
    console.error('Error in subjects endpoint:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
