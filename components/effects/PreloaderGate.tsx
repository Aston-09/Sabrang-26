"use client";

import "@/lib/suppress-three-logs";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const SabrangPreloader = dynamic(
  () => import("@/components/effects/SabrangPreloader"),
  { ssr: false }
);

export default function PreloaderGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // If we're coming back from a Cashfree payment (has order_id in URL), skip the loader
  // Or if we are navigating to admin, scanner, or login pages.
  const [done, setDone] = useState(() => {
    const skipRoutes = pathname === "/login" || pathname?.startsWith("/admin") || pathname?.startsWith("/scanner");
    if (skipRoutes) return true;
    
    if (typeof window !== "undefined") {
      return window.location.search.includes("order_id=");
    }
    return false;
  });

  useEffect(() => {
    const skipRoutes = pathname === "/login" || pathname?.startsWith("/admin") || pathname?.startsWith("/scanner");
    if (!done && (skipRoutes || window.location.search.includes("order_id="))) {
      setDone(true);
    }
  }, [done, pathname]);

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
