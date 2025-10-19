import { supabase } from './supabase-client'

/**
 * Generate a student registration number in the format: ELBA/YY/CLASSCODE/SEQUENCE
 * Example: ELBA/25/SS3B/011
 */
export function generateRegistrationNumber(
  schoolCode: string = 'ELBA',
  year: number = new Date().getFullYear() % 100,
  classCode: string,
  sequence: number
): string {
  const formattedSequence = String(sequence).padStart(3, '0')
  return `${schoolCode}/${year}/${classCode}/${formattedSequence}`
}

/**
 * Parse a registration number to extract components
 */
export function parseRegistrationNumber(regNumber: string): {
  schoolCode: string
  year: number
  classCode: string
  sequence: number
} | null {
  const parts = regNumber.split('/')
  if (parts.length !== 4) return null

  return {
    schoolCode: parts[0],
    year: parseInt(parts[1], 10),
    classCode: parts[2],
    sequence: parseInt(parts[3], 10),
  }
}

/**
 * Get the next sequence number for a class
 */
export async function getNextSequenceForClass(classId: string): Promise<number> {
  const { data, error } = await supabase
    .from('students')
    .select('reg_number')
    .eq('class_id', classId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error || !data || data.length === 0) {
    return 1
  }

  const lastReg = data[0].reg_number
  const parsed = parseRegistrationNumber(lastReg)
  return parsed ? parsed.sequence + 1 : 1
}

/**
 * Auto-assign registration number when creating a student
 */
export async function autoAssignRegNumber(
  studentId: string,
  classId: string,
  schoolCode: string = 'ELBA'
): Promise<string | null> {
  try {
    // Get class info
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('form_level')
      .eq('id', classId)
      .single()

    if (classError || !classData) return null

    const year = new Date().getFullYear() % 100
    const classCode = classData.form_level
    const sequence = await getNextSequenceForClass(classId)
    const regNumber = generateRegistrationNumber(schoolCode, year, classCode, sequence)

    // Update student with registration number
    const { error: updateError } = await supabase
      .from('students')
      .update({
        reg_number: regNumber,
        admission_year: new Date().getFullYear(),
        session_admitted: `${new Date().getFullYear()}/${new Date().getFullYear() + 1}`,
      })
      .eq('id', studentId)

    if (updateError) return null
    return regNumber
  } catch {
    return null
  }
}

/**
 * Find student by registration number
 */
export async function findStudentByRegNumber(regNumber: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      id,
      user_id,
      reg_number,
      class_id,
      full_name,
      email,
      class:classes(name, form_level)
    `)
    .eq('reg_number', regNumber)
    .single()

  if (error) {
    console.error('Error finding student:', error)
    return null
  }

  return data
}

/**
 * Validate registration number format
 */
export function isValidRegNumberFormat(regNumber: string): boolean {
  const pattern = /^[A-Z]{4}\/\d{2}\/[A-Z0-9]{4,5}\/\d{3}$/
  return pattern.test(regNumber)
}

/**
 * Get students by class for bulk reg number assignment
 */
export async function getStudentsWithoutRegNumber(classId?: string) {
  let query = supabase
    .from('students')
    .select('id, class_id, class:classes(form_level)')
    .is('reg_number', null)

  if (classId) {
    query = query.eq('class_id', classId)
  }

  const { data, error } = await query.order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching students:', error)
    return []
  }

  return data || []
}
