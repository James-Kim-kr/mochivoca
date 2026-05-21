"use client";

import { SessionProvider } from "next-auth/react";
import SessionGate from "@/components/SessionGate";
import ThemeProvider from "@/components/ThemeProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SessionProvider>
        <SessionGate>{children}</SessionGate>
      </SessionProvider>
    </ThemeProvider>
  );
}
