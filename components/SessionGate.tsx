"use client";

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { switchUser } from "@/lib/store";

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      const id = session?.user?.email ?? session?.user?.id ?? null;
      switchUser(id);
    } else if (status === "unauthenticated") {
      switchUser(null);
    }
  }, [status, session?.user?.email, session?.user?.id]);

  return <>{children}</>;
}
