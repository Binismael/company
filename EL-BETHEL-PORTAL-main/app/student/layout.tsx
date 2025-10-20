import StudentPortalLayout from '@/components/student-portal-layout'

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <StudentPortalLayout>{children}</StudentPortalLayout>
}
