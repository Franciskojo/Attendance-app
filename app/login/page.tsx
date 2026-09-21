"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, Mail, Sparkles, ShieldCheck, Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("admin@cohort.edu");
  const [password, setPassword] = useState("Admin123!");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.trim(),
        password: password,
      });

      if (res?.error) {
        setErrorMsg("Invalid credentials. Try seeding the database if first time.");
        toast("Invalid email or password", "error");
      } else {
        toast("Welcome back, Course Rep!", "success");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || "An unexpected error occurred");
      toast("Login failed", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast("Database successfully seeded with demo cohort & sessions!", "success");
        setEmail("admin@cohort.edu");
        setPassword("Admin123!");
      } else {
        toast(data.error || "Failed to seed database", "error");
      }
    } catch {
      toast("Error seeding database. Make sure MongoDB is running.", "error");
    } finally {
      setIsSeeding(false);
    }
  };

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

      {/* Main card */}
      <div className="w-full max-w-md mx-auto my-auto animate-fade-in">
        <div className="glass-card rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 dark:border-slate-800">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-100/80 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mb-4 border border-blue-200 dark:border-blue-900/60">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Course Rep Portal
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5">
              Sign in to manage attendance sessions, QR codes & analytics
            </p>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@cohort.edu"
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
                  placeholder="••••••••"
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
              className="w-full mt-2"
            >
              Sign In to Dashboard
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Demo & Seeder Helpers */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-slate-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-3.5 h-3.5" />
                Demo Credentials:
              </span>
              <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                admin@cohort.edu / Admin123!
              </span>
            </div>

            <button
              type="button"
              onClick={handleSeedDatabase}
              disabled={isSeeding}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium transition-colors disabled:opacity-50"
            >
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              {isSeeding ? "Seeding Database..." : "Seed Demo Database (20 Students, 3 Sessions)"}
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-400 py-3">
        ZOBI • Production-Ready SaaS Attendance System • Next.js 15 & React 19
      </footer>
    </div>
  );
}
