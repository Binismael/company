import AdminPortalLayout from '@/components/admin-portal-layout'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminPortalLayout>{children}</AdminPortalLayout>
}
