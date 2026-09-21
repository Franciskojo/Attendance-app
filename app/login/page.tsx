"use client";

import React, { useState, useEffect, Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldCheck, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { toast } = useToast();

  const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Automatically navigate if user already has an active session
  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      window.location.href = callbackUrl;
    }
  }, [status, session, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password,
        callbackUrl,
      });

      if (!res || res.error) {
        setErrorMsg("Invalid credentials. Please verify your email and password.");
        toast("Invalid email or password", "error");
        setIsLoading(false);
      } else {
        toast("Welcome back, Course Rep!", "success");
        // Perform a hard redirect to ensure session cookies are immediately committed across middleware and server components
        window.location.href = res.url || callbackUrl;
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An unexpected error occurred");
      toast("Login failed", "error");
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm">Checking session...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto my-auto animate-fade-in">
      <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4 border border-blue-200 dark:border-blue-900/60">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Course Rep Portal
          </h1>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                autoFocus
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full mt-2 font-bold shadow-md shadow-blue-500/20"
          >
            Sign In to Dashboard
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-br from-slate-50 via-blue-50/40 to-slate-100 dark:from-[#090d16] dark:via-[#0c1220] dark:to-[#090d16] p-4 sm:p-6 transition-colors">
      {/* Top bar */}
      <div className="flex items-center justify-between max-w-6xl w-full mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-blue-500/30">
            Z
          </div>
          <span className="font-extrabold text-xl text-slate-900 dark:text-white tracking-tight">
            ZOBI
          </span>
        </div>
        <ThemeToggle />
      </div>

      {/* Main card wrapped in Suspense */}
      <Suspense
        fallback={
          <div className="w-full max-w-md mx-auto my-auto p-8 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-2" />
            Loading...
          </div>
        }
      >
        <LoginForm />
      </Suspense>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        ZOBI • Cohort Attendance Management System
      </footer>
    </div>
  );
}
