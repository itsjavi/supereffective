import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export function proxy(req: NextRequest) {
  const underMaintenance =
    process.env.POKEPC_MAINTENANCE_MODE_ENABLED === 'true' || process.env.POKEPC_MAINTENANCE_MODE_ENABLED === '1'
  if (underMaintenance && !req.nextUrl.pathname.startsWith('/maintenance')) {
    console.log('Redirecting to maintenance mode', req.nextUrl.pathname)
    const url = req.nextUrl.clone()
    url.pathname = '/maintenance'
    return NextResponse.redirect(url, { status: 302 })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images|fonts).*)'],
}
