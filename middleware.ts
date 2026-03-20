import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Client-side auth is preferred for this simple implementation
  // But we can add basic path checks here if needed.
  // Full security is handled via Firebase Rules and API token verification.
  
  const path = request.nextUrl.pathname;
  
  if (path.startsWith('/admin')) {
    // We can't easily check Firebase Auth tokens in Next.js Middleware without 
    // using cookies, which adds complexity to the Firebase Client SDK setup.
    // Instead, we rely on the client-side role check and the server-side 
    // API verification already implemented.
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*'],
};
