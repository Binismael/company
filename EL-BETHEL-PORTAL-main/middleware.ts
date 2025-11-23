import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function isPublicPath(pathname: string) {
  const publicPaths = ['/', '/auth/login', '/auth/register', '/landing', '/about', '/contact']
  return publicPaths.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public pages
  if (isPublicPath(pathname)) return NextResponse.next()

  const isAdminUI = pathname.startsWith('/admin')
  const isAdminAPI = pathname.startsWith('/api/admin')
  if (!isAdminUI && !isAdminAPI) return NextResponse.next()

  // Get access token from cookie/header
  const cookieToken = req.cookies.get('sb-access-token')?.value
  const headerAuth = req.headers.get('authorization')
  const bearerToken = headerAuth?.startsWith('Bearer ') ? headerAuth.slice(7) : undefined
  const accessToken = cookieToken || bearerToken

  if (!accessToken) {
    if (isAdminAPI) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Verify session
  const { data: userData, error: userError } = await supabase.auth.getUser(accessToken)
  const user = userData?.user
  if (userError || !user) {
    if (isAdminAPI) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      })
    }
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/auth/login'
    return NextResponse.redirect(redirectUrl)
  }

  // Super admin bypass
  const MAIN_ADMIN_EMAIL = (process.env.NEXT_PUBLIC_MAIN_ADMIN_EMAIL || 'abdulmuizismael@gmail.com').toLowerCase()
  if (user.email?.toLowerCase() === MAIN_ADMIN_EMAIL) return NextResponse.next()

  // Role check (users table), accept id/auth_id/email linkage
  const { data: roleRow } = await supabase
    .from('users')
    .select('role')
    .or(`id.eq.${user.id},auth_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle()

  if (roleRow?.role !== 'admin') {
    if (isAdminAPI) {
      return new NextResponse(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { 'content-type': 'application/json' },
      })
    }
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/unauthorized'
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
