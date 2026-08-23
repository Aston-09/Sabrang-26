"use client";

import "@/lib/suppress-three-logs";
import dynamic from "next/dynamic";
import { useState } from "react";

const SabrangPreloader = dynamic(
  () => import("@/components/effects/SabrangPreloader"),
  { ssr: false }
);

export default function PreloaderGate({ children }: { children: React.ReactNode }) {
  const [done, setDone] = useState(false);

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
