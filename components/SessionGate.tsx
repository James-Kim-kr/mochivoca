"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { switchUser } from "@/lib/store";

const StoreReadyContext = createContext(false);

/**
 * True once the session has resolved AND per-user persisted store
 * (level, cards, league…) has finished rehydrating into the zustand
 * store. Use this to gate any logic that depends on `level`,
 * `cards`, etc. — otherwise a freshly-mounted page sees default
 * (empty) state and may redirect to /onboarding before the real
 * data lands.
 */
export function useStoreReady(): boolean {
  return useContext(StoreReadyContext);
}

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);

    if (status === "loading") return;

    (async () => {
      const id =
        status === "authenticated"
          ? session?.user?.email ?? session?.user?.id ?? null
          : null;
      try {
        await switchUser(id);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status, session?.user?.email, session?.user?.id]);

  return <StoreReadyContext.Provider value={ready}>{children}</StoreReadyContext.Provider>;
}
