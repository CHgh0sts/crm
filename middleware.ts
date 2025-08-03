import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

// Routes qui nécessitent une authentification
const protectedRoutes = [
  '/dashboard',
  '/projects',
  '/tasks',
  '/clients',
  '/invoices',
  '/templates',
  '/quotes',
  '/time-tracking',
  '/notes',
  '/settings',
  '/api/projects',
  '/api/tasks',
  '/api/clients',
  '/api/invoices',
  '/api/quotes',
  '/api/time-logs',
  '/api/notes',
  '/api/user',
]

// Routes publiques (qui redirigent vers le dashboard si connecté)
const publicRoutes = ['/login', '/register', '/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('auth-token')?.value

  // Vérifier si la route nécessite une authentification
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  )

  // Vérifier si c'est une route publique
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  )

  // Si c'est une route protégée
  if (isProtectedRoute) {
    // Pas de token, rediriger vers login
    if (!token) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Vérifier la validité du token
    const user = verifyToken(token)
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Token valide, continuer
    return NextResponse.next()
  }

  // Si c'est une route publique et que l'utilisateur est connecté
  if (isPublicRoute && token) {
    const user = verifyToken(token)
    if (user && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Pour toutes les autres routes, continuer
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
} 