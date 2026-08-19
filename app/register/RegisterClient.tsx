"use client";

import React, { useEffect } from "react";
import { motion, useMotionValue } from "framer-motion";
import { ShaderBackground } from "@/components/ui/neuro-noise";

export default function RegisterClient() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div
      className="fixed inset-0 w-screen h-screen overflow-hidden text-white font-sans selection:bg-violet-500/30 flex items-center justify-center p-4 sm:p-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      <div className="fixed inset-0 z-0 bg-[#020202]">
        <ShaderBackground className="absolute inset-0" />
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 w-full max-w-[1200px] mx-auto flex flex-col items-center justify-center text-center">
        {/* Editorial Title */}
        <div className="text-center mb-8 relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-black tracking-tight text-white mb-3 uppercase leading-none"
              style={{ fontFamily: 'var(--font-space-grotesk), "Space Grotesk", sans-serif' }}
            >
              REGISTRATIONS
            </h1>
            <p className="text-violet-400/80 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase">
              23 – 25 OCTOBER 2026
            </p>
          </motion.div>
        </div>

        {/* Revealing Soon Presentation Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full max-w-xl bg-[#08090d]/80 border border-white/10 rounded-2xl p-10 sm:p-16 text-center backdrop-blur-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(139,92,246,0.1)]"
        >
          {/* Ambient Glows */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-violet-600/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-cyan-600/15 blur-3xl"
          />

          {/* Main Statement */}
          <h2
            className="relative z-10 text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white tracking-tight leading-none"
            style={{
              fontFamily: '"Syne", var(--font-space-grotesk), sans-serif',
              textShadow: "0 0 30px rgba(255,255,255,0.7), 0 0 50px rgba(168,85,247,0.4)",
            }}
          >
            OPENING SOON
          </h2>
        </motion.div>
      </main>
    </div>
  );
}
