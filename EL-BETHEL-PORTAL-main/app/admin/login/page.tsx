import { redirect } from 'next/navigation'

export default function AdminLogin() {
  redirect('/auth/login?admin=1')
}
