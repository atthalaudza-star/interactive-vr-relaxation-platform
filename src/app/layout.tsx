import type { Metadata } from "next";
import type { ReactNode } from "react";
import DashboardShell from "@/components/DashboardShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tenang VR · Dashboard Relaksasi",
  description:
    "Aplikasi VR relaksasi interaktif: form stres, kotak pikiran (cognitive shutdown), panduan napas, dan visual senja ke malam berbintang.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#05060f] text-slate-100 antialiased">
        <div
          className="pointer-events-none fixed inset-0 -z-10"
          style={{
            background:
              "radial-gradient(circle at 15% 10%, rgba(99,102,241,0.16), transparent 45%), radial-gradient(circle at 85% 0%, rgba(168,85,247,0.14), transparent 40%), radial-gradient(circle at 50% 100%, rgba(56,189,248,0.10), transparent 45%)",
          }}
        />
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
