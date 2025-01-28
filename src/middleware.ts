import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "es"];
const defaultLocale = "en";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
});

export default function middleware(req: NextRequest) {
  if (req.nextUrl.pathname === "/") {
    const url = new URL(`/${defaultLocale}`, req.url);
    return NextResponse.redirect(url);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
