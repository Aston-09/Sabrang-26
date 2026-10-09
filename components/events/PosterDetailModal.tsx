"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, FileText, Trophy, Users, ChevronRight } from "lucide-react";
import { GalleryItem } from "@/lib/highlights-data";

/**
 * Full-screen event detail overlay - poster on the left, info on the right.
 * Shared across Events page archive and About page Pillars of Sabrang showcase.
 */
export default function PosterDetailModal({
  item,
  onClose,
}: {
  item: GalleryItem;
  onClose: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation on next frame
    requestAnimationFrame(() => setVisible(true));

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-500 overflow-y-auto ${
        visible
          ? "bg-black/90 backdrop-blur-md opacity-100"
          : "bg-transparent opacity-0 pointer-events-none"
      }`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${item.title} event details`}
    >
      <div
        className={`relative my-auto flex max-h-[92vh] max-w-5xl flex-col md:flex-row gap-6 md:gap-8 transition-all duration-500 overflow-y-auto p-5 sm:p-7 bg-neutral-950/95 border border-white/10 rounded-2xl shadow-2xl ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-white/20 bg-black/70 backdrop-blur-md text-white/80 hover:text-white hover:border-white/40 hover:bg-white/15 active:scale-90 transition-all shadow-lg cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
          aria-label="Close modal"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Poster image */}
        <div className="relative flex-shrink-0 w-full md:w-[320px] lg:w-[380px] overflow-hidden rounded-xl shadow-2xl shadow-indigo-500/10 ring-1 ring-white/10 mt-0">
          <Image
            src={item.image}
            alt={item.alt || item.title}
            width={380}
            height={540}
            sizes="(max-width: 768px) 100vw, 380px"
            className="w-full object-cover"
            style={{ width: "100%", height: "auto" }}
            loading="eager"
            fetchPriority="high"
          />
        </div>

        {/* Info panel */}
        <div className="flex flex-col justify-between py-1 md:py-2 flex-1">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 mb-2">
              <span>{item.category}</span>
            </div>

            <h3 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white md:text-5xl font-[family-name:var(--font-space-grotesk)] text-neon-rgb">
              {item.title}
            </h3>
            <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-slate-300">
              {item.description}
            </p>

            {/* Prize Pool Breakdown Card */}
            <div className="mt-4 p-4 rounded-xl bg-white/5 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Prize Money Pool
                  </span>
                </div>
                <span className="font-sans font-black text-lg text-amber-400">
                  {typeof item.totalCash === "number"
                    ? `₹${item.totalCash.toLocaleString("en-IN")}`
                    : item.totalCash || (item.prizesRemarks ? item.prizesRemarks : "Competitive")}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                {item.winnerCash !== undefined && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Winner (1st)</div>
                    <div className="font-sans font-bold text-sm text-emerald-400 mt-0.5">
                      {typeof item.winnerCash === "number" ? `₹${item.winnerCash.toLocaleString("en-IN")}` : item.winnerCash}
                    </div>
                  </div>
                )}

                {item.runnerUpCash !== undefined && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/5">
                    <div className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Runner-Up (2nd)</div>
                    <div className="font-sans font-bold text-sm text-slate-200 mt-0.5">
                      ₹{Number(item.runnerUpCash).toLocaleString("en-IN")}
                    </div>
                  </div>
                )}

                {item.prizesRemarks && (
                  <div className="col-span-2 p-2 rounded-lg bg-purple-950/30 border border-purple-500/20 text-purple-200 text-[11px]">
                    {item.prizesRemarks}
                  </div>
                )}
              </div>

              {/* Team Size specifications */}
              <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                <span className="text-[11px] text-white/50 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  Team Size
                </span>
                <span className="font-semibold text-white">
                  {item.minTeam === 1 && item.maxTeam === 1
                    ? "Solo (1 Member)"
                    : item.minTeam === item.maxTeam
                    ? `${item.minTeam} Members`
                    : `${item.minTeam} - ${item.maxTeam} Members`}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-3 text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              <span>{item.venue}</span>
              <span className="h-1 w-1 rounded-full bg-slate-600" />
              <span>Sabrang {item.year}</span>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-white/10 flex flex-wrap items-center gap-2.5">
            {item.category === "Activities - Gifts & Hampers" ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/10 text-white/50 text-xs font-bold uppercase tracking-wider cursor-not-allowed">
                <span>Opening Soon</span>
              </span>
            ) : (
              <Link
                href={`/register?event=${item.eventId || ""}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-black text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.35)] active:scale-95"
              >
                <span>Register Now</span>
                <ChevronRight className="w-3.5 h-3.5 stroke-[3]" />
              </Link>
            )}
            <a
              href="/docs/Sabrang_2026_Event_Rulebook.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="Sabrang_2026_Event_Rulebook.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/60 text-cyan-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <FileText className="w-3.5 h-3.5 text-cyan-400" />
              <span>Rulebook (PDF)</span>
            </a>
            <a
              href="/docs/Sabrang_2026_Brochure.pdf"
              target="_blank"
              rel="noopener noreferrer"
              download="Sabrang_2026_Brochure.pdf"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-purple-500/30 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-purple-400" />
              <span>Brochure (PDF)</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
