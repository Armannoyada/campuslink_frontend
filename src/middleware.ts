import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedPaths = ['/dashboard', '/users', '/roles', '/content', '/analytics'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token');

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));
  const isLoginPage = pathname === '/login';

  if (isProtected && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isLoginPage && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/users/:path*', '/roles/:path*', '/content/:path*', '/analytics/:path*', '/login'],
};
