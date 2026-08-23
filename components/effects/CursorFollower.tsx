"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function CursorFollower() {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin") || pathname === "/login";

  // Only one piece of state — set once on mount, never again.
  // Keeps the SSR render null (touch = true) → avoids hydration mismatch.
  const [isTouch, setIsTouch] = useState(true);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isAdmin) return;
    const hoverMatch = window.matchMedia("(hover: hover) and (pointer: fine)");
    setIsTouch(!hoverMatch.matches);
    if (!hoverMatch.matches) return;

    let mouseX = -100;
    let mouseY = -100;
    let currentX = -100;
    let currentY = -100;
    let animId: number;

    const onMouseMove = (e: MouseEvent) => {
      if (!e.isTrusted) return;
      mouseX = e.clientX;
      mouseY = e.clientY;

      // Hover detection — mutate dot scale directly, no setState
      const target = e.target as HTMLElement | null;
      const interactive = !!(
        target?.closest?.('a, button, input, select, textarea, [role="button"]')
      );
      if (dotRef.current) {
        dotRef.current.style.transform = interactive ? "scale(1.5)" : "scale(1)";
        dotRef.current.style.opacity = interactive ? "0.9" : "1";
      }
    };

    const update = () => {
      currentX += (mouseX - currentX) * 0.22;
      currentY += (mouseY - currentY) * 0.22;
      // Direct DOM mutation — zero React involvement per frame
      if (wrapRef.current) {
        wrapRef.current.style.transform = `translate3d(${currentX - 8}px, ${currentY - 8}px, 0)`;
      }
      animId = requestAnimationFrame(update);
    };

    window.addEventListener("mousemove", onMouseMove);
    animId = requestAnimationFrame(update);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animId);
    };
  }, [isAdmin]);

  if (isTouch || isAdmin) return null;

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      className="fixed top-0 left-0 z-[9990] pointer-events-none"
      style={{ transform: "translate3d(-100px, -100px, 0)" }}
    >
      <div
        ref={dotRef}
        className="w-4 h-4 rounded-full custom-cursor-circle bg-white shadow-[0_0_12px_rgba(255,255,255,0.8)]"
        style={{ transform: "scale(1)", opacity: "1", transition: "transform 0.2s, opacity 0.2s" }}
      />
    </div>
  );
}
