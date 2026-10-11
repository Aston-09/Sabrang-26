"use client";

import React, { useState, useMemo } from "react";
import { ChevronDown, Phone, Search, Copy, Check, Users, Sparkles } from "lucide-react";
import { galleryItems } from "@/lib/highlights-data";

export default function RegistrationCoordinatorsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPhone, setCopiedPhone] = useState<string | null>(null);

  const copyPhone = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(phone);
      setTimeout(() => setCopiedPhone(null), 2000);
    }
  };

  const filteredEvents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return galleryItems.filter((item) => {
      if (!item.coordinators || item.coordinators.length === 0) return false;
      if (!q) return true;
      const matchTitle = item.title.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchCoord = item.coordinators.some(
        (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
      );
      return matchTitle || matchCategory || matchCoord;
    });
  }, [searchQuery]);

  return (
    <div className="bg-[#0c0c0e] border border-white/10 rounded-2xl p-4 sm:p-5 shadow-2xl transition-all">
      {/* Dropdown Menu Button Header */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between text-left group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shrink-0">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-bold text-white uppercase tracking-wider font-[family-name:var(--font-space-grotesk)] group-hover:text-cyan-300 transition-colors">
              Event Coordinators
            </span>
            <p className="text-[11px] text-white/40 mt-0.5">
              Contact details for rules & event queries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-white/50 group-hover:text-cyan-300 transition-colors shrink-0">
          <span className="text-[11px] font-medium hidden sm:inline">
            {isOpen ? "Hide" : "Show"}
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${
              isOpen ? "rotate-180 text-cyan-400" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded Menu Body */}
      {isOpen && (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search event or coordinator..."
              className="w-full bg-white/[0.04] border border-white/10 focus:border-cyan-400/50 rounded-xl pl-8.5 pr-7 py-1.5 text-xs text-white placeholder-white/30 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Coordinators List */}
          <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-white/20">
            {filteredEvents.length === 0 ? (
              <div className="text-white/40 text-xs italic py-6 text-center">
                No coordinators found matching &ldquo;{searchQuery}&rdquo;
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-cyan-400/20 transition-all"
                >
                  {/* Event Title & Category */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-bold text-xs text-white uppercase tracking-wider font-[family-name:var(--font-space-grotesk)]">
                      {event.title}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/5 shrink-0">
                      {event.category.split(" - ")[0]}
                    </span>
                  </div>

                  {/* Coordinators */}
                  <div className="space-y-1.5">
                    {event.coordinators?.map((coord, idx) => {
                      const isPlaceholder =
                        !coord.phone ||
                        /[a-zA-Z]/.test(coord.phone) ||
                        coord.phone.toLowerCase().includes("tba") ||
                        coord.phone.toLowerCase().includes("announced");

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-slate-300 font-medium truncate">
                              {coord.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-2">
                            {isPlaceholder ? (
                              <span className="text-white/35 text-[10px] italic">
                                {coord.phone || "TBA"}
                              </span>
                            ) : (
                              <>
                                <a
                                  href={`tel:${coord.phone}`}
                                  className="text-cyan-400 hover:text-cyan-300 font-mono text-[11px] font-semibold flex items-center gap-1 hover:underline transition-colors"
                                  title={`Call ${coord.name}`}
                                >
                                  <Phone className="w-2.5 h-2.5 shrink-0" />
                                  <span>{coord.phone}</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={(e) => copyPhone(coord.phone, e)}
                                  className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Copy phone number"
                                >
                                  {copiedPhone === coord.phone ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
