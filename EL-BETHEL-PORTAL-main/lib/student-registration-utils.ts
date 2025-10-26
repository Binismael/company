import { DEPT_CODES, getClassCode } from '@/lib/student-registration-schema'

/**
 * Generate admission number in format: ELBA/YY/CLSDEPT/XXX
 * Example: ELBA/25/J1S/001
 * 
 * @param classLevel Class level (JSS1, SSS2, etc.)
 * @param department Department (Science, Arts, Commercial)
 * @returns Promise<string> Generated admission number
 */
export async function generateAdmissionNumber(
  classLevel: string,
  department: string
): Promise<string> {
  try {
    const response = await fetch('/api/students/generate-admission', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ classLevel, department }),
    })

    if (!response.ok) {
      throw new Error('Failed to generate admission number')
    }

    const data = await response.json()
    return data.admissionNumber
  } catch (error) {
    console.error('Error generating admission number:', error)
    throw error
  }
}

/**
 * Fetch subjects based on class level, department, and term
 * 
 * @param classLevel Class level (JSS1, SSS2, etc.)
 * @param department Department (Science, Arts, Commercial)
 * @param term Term (1st Term, 2nd Term, 3rd Term)
 * @returns Promise<Array> Array of subjects with id, name, code
 */
export async function fetchSubjectsByFilter(
  classLevel: string,
  department: string,
  term: string
): Promise<any[]> {
  try {
    const params = new URLSearchParams()
    if (classLevel) params.append('classLevel', classLevel)
    if (department) params.append('department', department)
    if (term) params.append('term', term)

    const response = await fetch(`/api/students/subjects?${params.toString()}`)

    if (!response.ok) {
      throw new Error('Failed to fetch subjects')
    }

    const data = await response.json()
    return data.subjects || []
  } catch (error) {
    console.error('Error fetching subjects:', error)
    return []
  }
}

/**
 * Get department code for admission number
 * Science -> S, Arts -> A, Commercial -> C
 * 
 * @param department Department name
 * @returns string Department code
 */
export function getDepartmentCode(department: string): string {
  return DEPT_CODES[department as keyof typeof DEPT_CODES] || 'X'
}

/**
 * Format class code for admission number
 * JSS1 -> J1, SSS2 -> S2
 * 
 * @param classLevel Class level
 * @returns string Formatted class code
 */
export function formatClassCode(classLevel: string): string {
  return getClassCode(classLevel)
}

/**
 * Parse admission number to extract details
 * Example: ELBA/25/J1S/001 -> { school: ELBA, year: 25, class: J1, dept: S, seq: 001 }
 * 
 * @param admissionNumber Admission number string
 * @returns object Parsed admission number details
 */
export function parseAdmissionNumber(admissionNumber: string): {
  school?: string
  year?: string
  classCode?: string
  departmentCode?: string
  sequenceNumber?: string
} {
  const pattern = /^([A-Z]+)\/(\d{2})\/([A-Z]\d)([A-Z])\/(\d{3})$/
  const match = admissionNumber.match(pattern)

  if (!match) {
    return {}
  }

  return {
    school: match[1],
    year: match[2],
    classCode: match[3],
    departmentCode: match[4],
    sequenceNumber: match[5],
  }
}

/**
 * Get readable class name from class code
 * J1 -> JSS1, S2 -> SSS2
 * 
 * @param classCode Class code from admission number
 * @returns string Full class name
 */
export function getClassNameFromCode(classCode: string): string {
  const levelMap: Record<string, string> = {
    J1: 'JSS1',
    J2: 'JSS2',
    J3: 'JSS3',
    S1: 'SSS1',
    S2: 'SSS2',
    S3: 'SSS3',
  }

  return levelMap[classCode] || 'Unknown'
}

/**
 * Get readable department name from department code
 * S -> Science, A -> Arts, C -> Commercial
 * 
 * @param deptCode Department code
 * @returns string Department name
 */
export function getDepartmentNameFromCode(deptCode: string): string {
  const deptMap: Record<string, string> = {
    S: 'Science',
    A: 'Arts',
    C: 'Commercial',
  }

  return deptMap[deptCode] || 'Unknown'
}

/**
 * Format admission number for display
 * ELBA/25/J1S/001 -> ELBA/2025/JSS1 Science/001
 * 
 * @param admissionNumber Raw admission number
 * @returns string Formatted admission number for display
 */
export function formatAdmissionNumberForDisplay(admissionNumber: string): string {
  const parsed = parseAdmissionNumber(admissionNumber)

  if (!parsed.school) {
    return admissionNumber
  }

  const fullYear = '20' + (parsed.year || '')
  const className = getClassNameFromCode(parsed.classCode || '')
  const deptName = getDepartmentNameFromCode(parsed.departmentCode || '')

  return `${parsed.school}/${fullYear}/${className} ${deptName}/${parsed.sequenceNumber}`
}

/**
 * Subject defaults for each department/class combo
 * Returns recommended subjects based on department
 */
export const getDefaultSubjectsForDepartment = (department: string): string[] => {
  const defaults: Record<string, string[]> = {
    Science: ['Physics', 'Chemistry', 'Biology', 'Mathematics', 'English Language'],
    Arts: ['History', 'Government', 'Literature in English', 'Mathematics', 'English Language'],
    Commercial: ['Accounting', 'Economics', 'Commerce', 'Mathematics', 'English Language'],
  }

  return defaults[department] || []
}
