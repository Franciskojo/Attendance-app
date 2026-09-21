"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/ui/Navbar";
import { Sidebar } from "@/components/ui/Sidebar";
import { CreateSessionModal } from "@/components/sessions/CreateSessionModal";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [createSessionOpen, setCreateSessionOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#090d16] flex flex-col">
      <Navbar onMobileMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div className="flex-1 flex w-full max-w-[1600px] mx-auto">
        <Sidebar
          isOpen={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          onOpenCreateSession={() => setCreateSessionOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>

      <CreateSessionModal
        isOpen={createSessionOpen}
        onClose={() => setCreateSessionOpen(false)}
        onSessionCreated={() => {
          // Trigger a window custom event so listening pages can re-fetch
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("session-created"));
          }
        }}
      />
    </div>
  );
}
