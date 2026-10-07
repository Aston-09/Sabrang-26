"use client";

import "@/lib/suppress-three-logs";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";

const SabrangPreloader = dynamic(
  () => import("@/components/effects/SabrangPreloader"),
  { ssr: false }
);

export default function PreloaderGate({ children }: { children: React.ReactNode }) {
  // If we're coming back from a Cashfree payment (has order_id in URL), skip the loader
  const [done, setDone] = useState(() => {
    if (typeof window !== "undefined") {
      return window.location.search.includes("order_id=");
    }
    return false;
  });

  useEffect(() => {
    if (!done && window.location.search.includes("order_id=")) {
      setDone(true);
    }
  }, [done]);

  return (
    <>
      {!done && (
        <SabrangPreloader
          onComplete={() => {
            setDone(true);
            setTimeout(() => {
              window.dispatchEvent(new Event("resize"));
            }, 80);
          }}
        />
      )}
      <div
        suppressHydrationWarning
        style={{
          opacity: done ? 1 : 0,
          transition: done ? "opacity 0.4s ease 0.05s" : "none",
          pointerEvents: done ? "auto" : "none",
        }}
      >
        {children}
      </div>
    </>
  );
}
