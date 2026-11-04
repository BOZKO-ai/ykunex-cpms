import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

// First line of defence: no valid signed cookie => /login. Pages and actions re-check via requireUser().
export async function middleware(req: NextRequest) {
  const token = req.cookies.get("yakunex_session")?.value;
  let valid = false;
  if (token && process.env.AUTH_SECRET) {
    try {
      await jwtVerify(token, new TextEncoder().encode(process.env.AUTH_SECRET));
      valid = true;
    } catch {
      valid = false;
    }
  }
  if (!valid) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/((?!login|_next/static|_next/image|favicon.ico|icon.svg|logo.svg|logo.png).*)"] };
