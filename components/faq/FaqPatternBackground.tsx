"use client";

import React from "react";

export default function FaqPatternBackground() {
  return (
    <div className="faq-pattern-container fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Primary 135deg Repeating Linear Gradient with Deep Dark Purple Aesthetic */}
      <div className="faq-pattern-bg absolute inset-0 w-full h-full" />

      {/* Deep Dark Purple Atmospheric Glow Layers */}
      <div className="faq-pattern-glow-top absolute inset-0 w-full h-full" />
      <div className="faq-pattern-glow-bottom absolute inset-0 w-full h-full" />

      {/* Dark Overlay Layer & Edge Vignette */}
      <div className="faq-dark-overlay absolute inset-0 w-full h-full" />

      <style>{`
        .faq-pattern-container {
          background: #08020e;
          width: 100vw;
          height: 100vh;
        }

        .faq-pattern-bg {
          width: 200%;
          height: 200%;
          left: -50%;
          top: -50%;
          overflow: hidden;
          background: repeating-linear-gradient(
            135deg,
            #15072b 0px,
            #15072b 60px,
            #2f0e54cc 70px,
            #501784cc 130px
          );
          animation: patternMove 20s linear infinite alternate;
        }

        .faq-pattern-glow-top {
          background: radial-gradient(
            ellipse 85% 60% at 50% 20%,
            rgba(147, 51, 234, 0.28) 0%,
            rgba(88, 28, 135, 0.18) 45%,
            transparent 75%
          );
        }

        .faq-pattern-glow-bottom {
          background: radial-gradient(
            circle at 80% 85%,
            rgba(126, 34, 206, 0.22) 0%,
            rgba(59, 7, 100, 0.12) 40%,
            transparent 70%
          );
        }

        .faq-dark-overlay {
          background: radial-gradient(
            circle at 50% 50%,
            rgba(0, 0, 0, 0.2) 0%,
            rgba(4, 1, 8, 0.45) 65%,
            rgba(0, 0, 0, 0.7) 100%
          );
        }

        @keyframes patternMove {
          from {
            transform: translateY(0) scale(1);
          }
          to {
            transform: translateY(-8%) scale(1.03) rotate(0.5deg);
          }
        }
      `}</style>
    </div>
  );
}
