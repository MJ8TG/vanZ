import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const proxy = createMiddleware(routing);
export default proxy;

export const config = {
  // Match all pathnames except for
  // - api routes
  // - _next (Next.js internals)
  // - static files (images, favicon, etc.)
  matcher: ["/((?!api|_next|.*\\..*).*)"],
};
