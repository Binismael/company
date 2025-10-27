'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase-client'

export default function PendingStudentsPage() {
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPendingStudents() {
      try {
        const { data, error } = await supabase
          .from('students')
          .select('*')
          .eq('is_approved', false)

        if (error) {
          console.error('Supabase error details:', {
            message: error.message,
            details: (error as any)?.details,
            hint: (error as any)?.hint,
          })
          toast.error('Supabase error while loading students')
          return
        }

        if (!data || data.length === 0) {
          console.warn('No pending student registrations found.')
          toast.info('No pending registrations found')
          setStudents([])
          return
        }

        console.log('✅ Pending students:', data)
        setStudents(data)
      } catch (err) {
        console.error('Fetch error:', err)
        toast.error('Unexpected error loading pending students')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingStudents()
  }, [])

  if (loading) return <div className="p-6 text-center">Loading pending students...</div>

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Pending Student Registrations</h1>
      {students.length === 0 ? (
        <p>No pending student registrations found.</p>
      ) : (
        <ul className="space-y-4">
          {students.map((s) => (
            <li key={s.id} className="p-4 bg-gray-100 rounded-lg">
              <p><strong>Admission No:</strong> {s.admission_number}</p>
              <p><strong>Gender:</strong> {s.gender}</p>
              <p><strong>Guardian:</strong> {s.guardian_name} ({s.guardian_phone})</p>
              <p><strong>Created At:</strong> {new Date(s.created_at).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
