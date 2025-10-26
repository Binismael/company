import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-client'
import { getClassCode, DEPT_CODES } from '@/lib/student-registration-schema'

interface GenerateAdmissionRequest {
  classLevel: string
  department: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAdmissionRequest = await request.json()

    const { classLevel, department } = body

    if (!classLevel || !department) {
      return NextResponse.json(
        { error: 'classLevel and department are required' },
        { status: 400 }
      )
    }

    // Get current year (last 2 digits)
    const currentYear = new Date().getFullYear().toString().slice(-2)

    // Get class code (e.g., JSS1 -> J1, SSS2 -> S2)
    const classCode = getClassCode(classLevel)

    // Get department code (S, A, or C)
    const deptCode = DEPT_CODES[department as keyof typeof DEPT_CODES] || 'X'

    // Build the base admission number: ELBA/YY/CLSDEPT/
    const admissionBase = `ELBA/${currentYear}/${classCode}${deptCode}`

    // Count existing admissions with this base to generate sequence
    const { data: existingAdmissions, error: queryError } = await supabase
      .from('students')
      .select('admission_number', { count: 'exact' })
      .ilike('admission_number', `${admissionBase}/%`)

    if (queryError) {
      console.error('Error querying existing admissions:', queryError)
      return NextResponse.json(
        { error: 'Failed to generate admission number' },
        { status: 500 }
      )
    }

    // Generate sequence number (001, 002, etc.)
    const count = existingAdmissions?.length || 0
    const sequenceNum = String(count + 1).padStart(3, '0')

    // Final admission number
    const admissionNumber = `${admissionBase}/${sequenceNum}`

    // Verify it's unique (extra safety check)
    const { data: checkUnique, error: checkError } = await supabase
      .from('students')
      .select('id', { count: 'exact' })
      .eq('admission_number', admissionNumber)

    if (checkError) {
      console.error('Error checking uniqueness:', checkError)
      return NextResponse.json(
        { error: 'Failed to validate admission number' },
        { status: 500 }
      )
    }

    if ((checkUnique?.length || 0) > 0) {
      // Rare case - retry with incremented number
      return NextResponse.json({
        success: true,
        admissionNumber: `${admissionBase}/${String(count + 2).padStart(3, '0')}`,
      })
    }

    return NextResponse.json({
      success: true,
      admissionNumber,
      details: {
        schoolCode: 'ELBA',
        year: currentYear,
        classCode,
        departmentCode: deptCode,
        sequenceNumber: sequenceNum,
      },
    })
  } catch (error: any) {
    console.error('Error generating admission number:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred while generating admission number' },
      { status: 500 }
    )
  }
}
