import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "AttendFlow | Production Attendance Management",
  description: "Enterprise QR code attendance management system for cohorts, courses, and workshops.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#090d16] dark:text-slate-100 antialiased selection:bg-blue-500 selection:text-white transition-colors duration-150">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
