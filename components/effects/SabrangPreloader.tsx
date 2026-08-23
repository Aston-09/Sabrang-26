"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const WORD = "SABRANG";

interface SabrangPreloaderProps {
  onComplete?: () => void;
}

export default function SabrangPreloader({ onComplete }: SabrangPreloaderProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const letterRefs = useRef<(SVGTextElement | null)[]>([]);
  const globalGuidesRef = useRef<(SVGElement | null)[]>([]);
  const letterGuidesRef = useRef<{ [key: number]: (SVGElement | null)[] }>({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: []
  });
  const sGroupRef = useRef<SVGGElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const exitTlRef = useRef<gsap.core.Timeline | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleSkip = () => {
    if (tlRef.current) tlRef.current.kill();
    if (exitTlRef.current) exitTlRef.current.kill();
    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.35,
      ease: "power2.inOut",
      onComplete: () => {
        document.body.classList.remove("loader-active");
        document.body.style.overflow = "";
        onComplete?.();
      },
    });
  };

  // ── Blueprint Canvas Background Grid (Monochrome) ─────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const canvas = gridCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;

      // Major Cartesian grid (80px)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 80) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 80) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();

      // Minor Cartesian grid (20px)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.012)";
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 20) { ctx.moveTo(x, 0); ctx.lineTo(x, h); }
      for (let y = 0; y <= h; y += 20) { ctx.moveTo(0, y); ctx.lineTo(w, y); }
      ctx.stroke();
    };

    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [mounted]);

  // ── Main GSAP Construction Timeline ─────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;

    document.body.classList.add("loader-active");
    document.body.style.overflow = "hidden";

    const globalGuides = globalGuidesRef.current.filter(Boolean) as SVGGeometryElement[];
    const letters = letterRefs.current.filter(Boolean) as SVGTextElement[];

    // Helper to calculate & set strokeDash
    const initStroke = (el: SVGGeometryElement, initialOpacity = 0) => {
      try {
        const len = el.getTotalLength?.() ?? 1400;
        gsap.set(el, {
          strokeDasharray: len,
          strokeDashoffset: len,
          opacity: initialOpacity,
        });
        return len;
      } catch {
        gsap.set(el, { opacity: initialOpacity });
        return 1400;
      }
    };

    // 1. Initialize Global Blueprint Guides
    globalGuides.forEach((el) => initStroke(el, 0));

    // 2. Initialize Letterforms:
    // IMPORTANT: Letters 1..6 (A, B, R, A, N, G) are COMPLETELY INVISIBLE at start!
    // They will only appear when their specific construction lines arrive.
    letters.forEach((el, i) => {
      gsap.set(el, {
        opacity: i === 0 ? 1 : 0,
        fill: "#ffffff",
      });
    });

    // 3. Initialize per-letter guide elements
    for (let i = 0; i < 7; i++) {
      const gElements = (letterGuidesRef.current[i] || []).filter(Boolean) as SVGGeometryElement[];
      gElements.forEach((el) => initStroke(el, 0));
    }

    // Position S-Group at dead center (offset +680px from X=280 anchor to X=960 center)
    if (sGroupRef.current) {
      gsap.set(sGroupRef.current, { x: 680 });
    }

    // ── Build Main Animation Timeline ──
    const tl = gsap.timeline({
      onComplete: () => exitTl.play(),
    });
    tlRef.current = tl;

    // Ambient glow
    tl.to(glowRef.current, { opacity: 1, duration: 1.4, ease: "power2.out" }, 0);

    // ── STAGE 1: S Appears in the Center (t = 0.2s → 1.5s) ──
    const sGuides = (letterGuidesRef.current[0] || []).filter(Boolean) as SVGGeometryElement[];
    sGuides.forEach((el, idx) => {
      tl.to(
        el,
        {
          opacity: 0.75,
          strokeDashoffset: 0,
          duration: 0.9,
          ease: "expo.out",
        },
        0.2 + idx * 0.05
      );
    });

    // ── STAGE 2: Slide S to the Left & Project Typographic Axes (t = 1.5s → 2.6s) ──
    if (sGroupRef.current) {
      tl.to(
        sGroupRef.current,
        {
          x: 0,
          duration: 1.1,
          ease: "power2.inOut",
        },
        1.5
      );
    }

    // Global cap-height, midline, baseline axes shoot across the screen
    globalGuides.forEach((el, idx) => {
      tl.to(
        el,
        {
          opacity: 0.25,
          strokeDashoffset: 0,
          duration: 1.1,
          ease: "expo.out",
        },
        1.6 + idx * 0.04
      );
    });

    // S guides settle to delicate grid
    sGuides.forEach((el) => {
      tl.to(el, { opacity: 0.18, duration: 0.7, ease: "power1.out" }, 2.1);
    });

    // ── STAGE 3: Sequential Architectural Construction & Letter Reveal (A B R A N G) ──
    const letterStep = 0.48;
    const stage3Start = 2.4;

    for (let i = 1; i < 7; i++) {
      const start = stage3Start + (i - 1) * letterStep;
      const letterEl = letters[i];
      const gElements = (letterGuidesRef.current[i] || []).filter(Boolean) as SVGGeometryElement[];

      // Phase A: Architectural crossing rays & guide lines shoot in at high speed
      gElements.forEach((el, elIdx) => {
        tl.to(
          el,
          {
            opacity: 0.9,
            strokeDashoffset: 0,
            duration: 0.65,
            ease: "expo.out",
          },
          start + elIdx * 0.03
        );
      });

      // Phase B: The letter appears directly inside the intersecting lines and illuminates into solid white
      if (letterEl) {
        tl.to(
          letterEl,
          {
            opacity: 1,
            duration: 0.25,
            ease: "power2.out",
          },
          start + 0.22
        );
      }

      // Phase C: Guide lines settle down into the background blueprint
      gElements.forEach((el) => {
        tl.to(
          el,
          {
            opacity: 0.18,
            duration: 0.5,
            ease: "power1.out",
          },
          start + 0.5
        );
      });
    }

    // Final letter completes at:
    const finalCompleteTime = stage3Start + 5 * letterStep + 0.25;

    // ── Progress Counter (000 → 100) Synced Exactly with Final Letter Completion ──
    const counterObj = { val: 0 };
    tl.to(
      counterObj,
      {
        val: 100,
        duration: finalCompleteTime,
        ease: "none",
        onUpdate: () => {
          if (counterRef.current) {
            counterRef.current.textContent = `${Math.round(counterObj.val).toString().padStart(3, "0")}/100`;
          }
        },
      },
      0
    );

    // Subtle glow flash upon word completion
    tl.to(glowRef.current, { opacity: 1.4, duration: 0.2, yoyo: true, repeat: 1, ease: "sine.inOut" }, finalCompleteTime);

    // ── STAGE 4: Crisp 0.25s Hold then Immediate Exit to Home ──
    tl.to({}, { duration: 0.25 });

    // Exit transition (Swift, punchy dissolve into homepage)
    const exitTl = gsap.timeline({ paused: true, onComplete: handleExit });
    exitTlRef.current = exitTl;

    exitTl
      .to(".preloader-guide-line", { opacity: 0, duration: 0.35, stagger: 0.015, ease: "power2.in" }, 0)
      .to(gridCanvasRef.current, { opacity: 0, duration: 0.4, ease: "power2.in" }, 0)
      .to(glowRef.current, { opacity: 0, scale: 1.05, duration: 0.45, ease: "power2.in" }, 0.03)
      .to(letters, { y: -30, opacity: 0, stagger: 0.02, duration: 0.4, ease: "power3.in" }, 0.05)
      .to(overlayRef.current, { opacity: 0, duration: 0.45, ease: "power2.inOut" }, 0.15);

    function handleExit() {
      document.body.classList.remove("loader-active");
      document.body.style.overflow = "";
      onComplete?.();
    }

    return () => {
      tl.kill();
      exitTl.kill();
      document.body.classList.remove("loader-active");
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  if (!mounted) return null;

  // ── Blueprint Coordinate System (1920 × 1080) ────────────────────────────────
  const vpW = 1920;
  const vpH = 1080;
  const cx = vpW / 2;
  const cy = 540;

  // Typographic bounds (Cap: 410px, Baseline: 670px, Midline: 540px)
  const capY = 410;
  const midY = 540;
  const bslnY = 670;

  // 7 letter centers, tightened for serif font proportions
  const letterPositions = [280, 500, 720, 960, 1180, 1420, 1640];

  // Helper to record per-letter guides
  const addLetterGuide = (letterIdx: number, el: SVGElement | null) => {
    if (el) letterGuidesRef.current[letterIdx].push(el);
  };
  const addGlobalGuide = (el: SVGElement | null) => {
    if (el) globalGuidesRef.current.push(el);
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "#000000",
        fontFamily: "'Syne', 'Unbounded', sans-serif",
      }}
      aria-label="Loading Sabrang"
      role="status"
    >
      {/* ── Blueprint Canvas Grid (Monochrome) ── */}
      <canvas
        ref={gridCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── Ambient Radial Atmosphere ── */}
      <div
        ref={glowRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.01) 50%, transparent 80%)",
        }}
      />

      {/* ── SVG Blueprint Construction Overlay ── */}
      <svg
        viewBox={`0 0 ${vpW} ${vpH}`}
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 w-full h-full pointer-events-none"
        aria-hidden="true"
        style={{ overflow: "visible" }}
      >
        {/* ── 1. GLOBAL OPTICAL GUIDES ── */}
        <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1">
          {/* Cap-Height Line */}
          <line ref={addGlobalGuide} x1="0" y1={capY} x2={vpW} y2={capY} strokeDasharray="12 8" />
          {/* Midline */}
          <line ref={addGlobalGuide} x1="0" y1={midY} x2={vpW} y2={midY} strokeDasharray="6 6" opacity="0.5" />
          {/* Baseline */}
          <line ref={addGlobalGuide} x1="0" y1={bslnY} x2={vpW} y2={bslnY} strokeDasharray="12 8" />
          {/* Center Vertical Axis */}
          <line ref={addGlobalGuide} x1={cx} y1="0" x2={cx} y2={vpH} strokeDasharray="8 8" />
        </g>

        {/* ── 2. ARCHITECTURAL INTERSECTING RAYS & LETTERFORMS ── */}
        {['S', 'A', 'B', 'R', 'A', 'N', 'G'].map((char, i) => {
          const posX = letterPositions[i];

          return (
            <g key={i} ref={i === 0 ? sGroupRef : undefined}>
              {/* Complex Architectural Construction Guides */}
              <g className="preloader-guide-line" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1">
                {i === 0 && ( // S
                  <>
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 90} y1="0" x2={posX - 90} y2={vpH} strokeDasharray="6 6" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 90} y1="0" x2={posX + 90} y2={vpH} strokeDasharray="6 6" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX} y1="0" x2={posX} y2={vpH} strokeDasharray="4 6" opacity="0.5" />
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX} cy={capY + 65} r="65" fill="none" strokeDasharray="4 4" />
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX} cy={bslnY - 65} r="65" fill="none" strokeDasharray="4 4" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 240} y1={capY} x2={posX + 160} y2={capY} />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={bslnY} x2={posX + 200} y2={bslnY} />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 140} y1={midY} x2={posX + 140} y2={midY} strokeDasharray="4 4" />
                    <path ref={(el) => addLetterGuide(i, el)} d={`M ${posX - 15} ${midY} H ${posX + 15} M ${posX} ${midY - 15} V ${midY + 15}`} strokeWidth="1.2" />
                  </>
                )}
                {(i === 1 || i === 4) && ( // A
                  <>
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 270} y1="0" x2={posX + 440} y2={vpH} strokeWidth="1.2" stroke="rgba(255, 255, 255, 0.55)" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 270} y1="0" x2={posX - 440} y2={vpH} strokeWidth="1.2" stroke="rgba(255, 255, 255, 0.55)" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX} y1="0" x2={posX} y2={vpH} strokeDasharray="6 6" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 90} y1="0" x2={posX - 90} y2={vpH} strokeDasharray="4 6" opacity="0.6" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 90} y1="0" x2={posX + 90} y2={vpH} strokeDasharray="4 6" opacity="0.6" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 180} y1="570" x2={posX + 180} y2="570" strokeDasharray="4 4" />
                    <path ref={(el) => addLetterGuide(i, el)} d={`M ${posX - 15} 410 H ${posX + 15} M ${posX} 395 V 425`} strokeWidth="1.4" />
                  </>
                )}
                {i === 2 && ( // B
                  <>
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 85} y1="0" x2={posX - 85} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 85} y1="0" x2={posX + 85} y2={vpH} strokeDasharray="6 6" />
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX} cy={capY + 65} r="65" fill="none" strokeDasharray="4 4" />
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX + 5} cy={bslnY - 65} r="65" fill="none" strokeDasharray="4 4" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={midY} x2={posX + 160} y2={midY} strokeDasharray="6 6" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={capY} x2={posX + 160} y2={capY} />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={bslnY} x2={posX + 160} y2={bslnY} />
                    <path ref={(el) => addLetterGuide(i, el)} d={`M ${posX - 100} 410 H ${posX - 70} M ${posX - 85} 395 V 425 M ${posX - 100} 670 H ${posX - 70} M ${posX - 85} 655 V 685`} strokeWidth="1.2" />
                  </>
                )}
                {i === 3 && ( // R
                  <>
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 85} y1="0" x2={posX - 85} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 85} y1="0" x2={posX + 85} y2={vpH} strokeDasharray="6 6" />
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX} cy={capY + 65} r="65" fill="none" strokeDasharray="4 4" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 280} y1="0" x2={posX + 180} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={midY} x2={posX + 160} y2={midY} strokeDasharray="4 4" />
                    <path ref={(el) => addLetterGuide(i, el)} d={`M ${posX - 100} 540 H ${posX - 70} M ${posX - 85} 525 V 555`} strokeWidth="1.2" />
                  </>
                )}
                {i === 5 && ( // N
                  <>
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 85} y1="0" x2={posX - 85} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 85} y1="0" x2={posX + 85} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX} y1="0" x2={posX} y2={vpH} strokeDasharray="4 6" opacity="0.5" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 270} y1="0" x2={posX + 270} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={capY} x2={posX + 160} y2={capY} />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 160} y1={bslnY} x2={posX + 160} y2={bslnY} />
                    <path ref={(el) => addLetterGuide(i, el)} d={`M ${posX - 100} 410 H ${posX - 70} M ${posX - 85} 395 V 425 M ${posX + 70} 670 H ${posX + 100} M ${posX + 85} 655 V 685`} strokeWidth="1.2" />
                  </>
                )}
                {i === 6 && ( // G
                  <>
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX} cy={midY} r="130" fill="none" strokeDasharray="6 6" />
                    <circle ref={(el) => addLetterGuide(i, el)} cx={posX} cy={midY} r="85" fill="none" strokeDasharray="4 4" opacity="0.5" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 170} y1={midY} x2={posX + 240} y2={midY} />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX + 120} y1="0" x2={posX + 120} y2={vpH} strokeWidth="1.2" />
                    <line ref={(el) => addLetterGuide(i, el)} x1={posX - 130} y1="0" x2={posX - 130} y2={vpH} strokeDasharray="4 6" opacity="0.6" />
                    <path ref={(el) => addLetterGuide(i, el)} d={`M ${posX - 15} 540 H ${posX + 15} M ${posX} 525 V 555`} strokeWidth="1.2" />
                  </>
                )}
              </g>

              {/* Letterform */}
              <text
                ref={(el) => { letterRefs.current[i] = el; }}
                x={posX}
                y={cy}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize="280"
                fontWeight="normal"
                fill="#ffffff"
                style={{
                  fontFamily: "'FlorasDisplay', 'Syne', serif",
                  opacity: i === 0 ? 1 : 0
                }}
              >
                {char}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Top-Left Minimal Progress Indicator ── */}
      <div className="absolute top-6 left-6 pointer-events-none select-none z-10">
        <span
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "12px",
            letterSpacing: "0.18em",
            color: "rgba(255, 255, 255, 0.7)",
          }}
        >
          <span ref={counterRef}>000/100</span>
        </span>
      </div>

      {/* ── Top-Right Text-Only Skip Button ── */}
      <button
        onClick={handleSkip}
        type="button"
        className="absolute top-6 right-6 z-20 bg-transparent border-0 outline-none p-0 cursor-pointer text-white/50 hover:text-white transition-opacity duration-200"
        style={{
          fontFamily: "'Courier New', monospace",
          fontSize: "12px",
          letterSpacing: "0.18em",
        }}
        aria-label="Skip introduction"
      >
        SKIP
      </button>
    </div>
  );
}
