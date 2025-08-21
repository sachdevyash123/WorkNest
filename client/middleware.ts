import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Get token from cookies
    const token = request.cookies.get('token')?.value;

    // Treat empty/placeholder tokens as unauthenticated
    const isValidToken = Boolean(token && token !== 'none' && token !== 'null' && token !== 'undefined');

    // Public routes that don't require authentication
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/reset-password'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // Allow invite routes to proceed without authentication
    if (pathname.startsWith("/invite")) {
        return NextResponse.next();
    }
    
    // If user is not authenticated and trying to access protected route
    if (!isValidToken && !isPublicRoute && pathname !== '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is authenticated and trying to access auth pages
    if (isValidToken && isPublicRoute) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }
   

    return NextResponse.next();
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
