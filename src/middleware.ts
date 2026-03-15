import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Server-side cookie checks don't work for cross-origin deployments
  // (e.g. vercel.app frontend + onrender.com backend) because the backend
  // sets cookies on its own domain. Auth is enforced client-side in the
  // admin layout via useAuth → GET /auth/me.
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
