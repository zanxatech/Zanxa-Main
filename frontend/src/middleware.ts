import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Basic pass-through for now as we transition to Firebase
  // Server-side auth verification requires session cookies
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
