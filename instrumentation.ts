/**
 * Next.js Instrumentation Hook
 * This runs before any other module is loaded, ensuring environment variables
 * are set before next-auth reads NEXTAUTH_URL. This prevents ERR_INVALID_URL
 * during Vercel static prerendering when the env var isn't available at build time.
 */
export async function register() {
  // Ensure NEXTAUTH_URL is always set to a valid URL before next-auth loads it.
  // next-auth calls `new URL(process.env.NEXTAUTH_URL)` at module init time.
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.VERCEL_URL) {
      process.env.NEXTAUTH_URL = `https://${process.env.VERCEL_URL}`;
    } else {
      process.env.NEXTAUTH_URL = "http://localhost:3000";
    }
  }

  if (!process.env.NEXTAUTH_URL_INTERNAL) {
    process.env.NEXTAUTH_URL_INTERNAL = process.env.NEXTAUTH_URL;
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    process.env.NEXT_PUBLIC_APP_URL = process.env.NEXTAUTH_URL;
  }
}
