import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

const getBaseUrl = (): URL => {
  const envUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (envUrl && (envUrl.startsWith("http://") || envUrl.startsWith("https://"))) {
    try {
      return new URL(envUrl);
    } catch {}
  }
  return new URL("http://localhost:3000");
};

export const metadata: Metadata = {
  metadataBase: getBaseUrl(),
  title: "ZOBI | Production Attendance Management",
  description: "Enterprise QR code attendance management system for cohorts, courses, and workshops.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white transition-colors duration-150"
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
