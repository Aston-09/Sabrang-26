"use client";

import React from "react";

export default function ContactPatternBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#1e1e1e]">
      {/* Geometric Hex/Cube Conic Pattern */}
      <div className="contact-geo-pattern absolute inset-0 w-full h-full" />

      {/* Atmospheric Vignette & Contrast Overlay */}
      <div className="contact-vignette absolute inset-0 w-full h-full" />

      <style>{`
        .contact-geo-pattern {
          width: 100%;
          height: 100%;
          --s: 37px;

          --c: #0000, #282828 0.5deg 119.5deg, #0000 120deg;
          --g1: conic-gradient(from 60deg at 56.25% calc(425% / 6), var(--c));
          --g2: conic-gradient(from 180deg at 43.75% calc(425% / 6), var(--c));
          --g3: conic-gradient(from -60deg at 50% calc(175% / 12), var(--c));
          background: var(--g1), var(--g1) var(--s) calc(1.73 * var(--s)), var(--g2),
            var(--g2) var(--s) calc(1.73 * var(--s)), var(--g3) var(--s) 0,
            var(--g3) 0 calc(1.73 * var(--s)) #1e1e1e;
          background-size: calc(2 * var(--s)) calc(3.46 * var(--s));
        }

        .contact-vignette {
          background: radial-gradient(
            circle at 50% 30%,
            rgba(0, 0, 0, 0.35) 0%,
            rgba(0, 0, 0, 0.7) 60%,
            rgba(10, 10, 12, 0.9) 100%
          );
        }
      `}</style>
    </div>
  );
}
