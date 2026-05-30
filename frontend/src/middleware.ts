import { NextRequest, NextResponse } from 'next/server';

// HTTP Basic Auth middleware. Credentials are read from env so they can be
// rotated from the Vercel dashboard without touching code.
//   BASIC_AUTH_USER (default: digisap)
//   BASIC_AUTH_PASS (default: paidmedia)
export function middleware(req: NextRequest) {
  const expectedUser = process.env.BASIC_AUTH_USER;
  const expectedPass = process.env.BASIC_AUTH_PASS;

  // If credentials aren't configured (e.g. local dev), skip auth entirely.
  if (!expectedUser || !expectedPass) {
    return NextResponse.next();
  }

  const header = req.headers.get('authorization');
  if (header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const idx = decoded.indexOf(':');
      const user = decoded.slice(0, idx);
      const pass = decoded.slice(idx + 1);
      if (user === expectedUser && pass === expectedPass) {
        return NextResponse.next();
      }
    } catch {
      // fallthrough to 401
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Paid Media Ops", charset="UTF-8"',
    },
  });
}

// Protect everything except Next.js internals and static assets.
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
