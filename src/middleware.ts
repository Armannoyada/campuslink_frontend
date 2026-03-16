import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PORTAL_CONFIG = {
  admin: {
    cookieName: 'admin_token',
    loginPath: '/admin/login',
    protectedPrefix: '/admin',
  },
  operations: {
    cookieName: 'ops_token',
    loginPath: '/operations/login',
    protectedPrefix: '/operations',
  },
  user: {
    cookieName: 'user_token',
    loginPath: '/login',
    protectedPrefix: '/feed',
  },
} as const;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin portal guard
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get(PORTAL_CONFIG.admin.cookieName);
    if (!token?.value) {
      return NextResponse.redirect(new URL(PORTAL_CONFIG.admin.loginPath, request.url));
    }
  }

  // Operations portal guard
  if (pathname.startsWith('/operations') && !pathname.startsWith('/operations/login')) {
    const token = request.cookies.get(PORTAL_CONFIG.operations.cookieName);
    if (!token?.value) {
      return NextResponse.redirect(new URL(PORTAL_CONFIG.operations.loginPath, request.url));
    }
  }

  // User portal guard — protect /feed and /onboarding
  if (pathname.startsWith('/feed') || pathname.startsWith('/onboarding')) {
    const token = request.cookies.get(PORTAL_CONFIG.user.cookieName);
    if (!token?.value) {
      return NextResponse.redirect(new URL(PORTAL_CONFIG.user.loginPath, request.url));
    }
  }

  // Redirect logged-in users away from login pages
  if (pathname === '/admin/login') {
    const token = request.cookies.get(PORTAL_CONFIG.admin.cookieName);
    if (token?.value) {
      return NextResponse.redirect(new URL('/admin/dashboard', request.url));
    }
  }

  if (pathname === '/operations/login') {
    const token = request.cookies.get(PORTAL_CONFIG.operations.cookieName);
    if (token?.value) {
      return NextResponse.redirect(new URL('/operations/dashboard', request.url));
    }
  }

  if (pathname === '/login' || pathname === '/signup') {
    const token = request.cookies.get(PORTAL_CONFIG.user.cookieName);
    if (token?.value) {
      return NextResponse.redirect(new URL('/feed', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/operations/:path*',
    '/feed/:path*',
    '/onboarding/:path*',
    '/login',
    '/signup',
  ],
};
