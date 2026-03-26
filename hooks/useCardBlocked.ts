"use client";

import { useCallback, useEffect, useState } from "react";
import { readCardBlocked, writeCardBlocked } from "@/lib/card-blocked-storage";

export function useCardBlocked(userId: string) {
  const [blocked, setBlockedState] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const sync = () => setBlockedState(readCardBlocked(userId));
    sync();
    setHydrated(true);
    const onExternal = () => sync();
    window.addEventListener("storage", onExternal);
    window.addEventListener("csob-card-blocked", onExternal);
    return () => {
      window.removeEventListener("storage", onExternal);
      window.removeEventListener("csob-card-blocked", onExternal);
    };
  }, [userId]);

  const setBlocked = useCallback(
    (value: boolean) => {
      if (!userId) return;
      writeCardBlocked(userId, value);
      setBlockedState(value);
    },
    [userId]
  );

  return { blocked, setBlocked, hydrated };
}
