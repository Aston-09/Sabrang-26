"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { GalleryItem } from "@/lib/highlights-data";
import "@/components/ui/StaggeredMenu.css";

const DROPDOWN_VARIANTS = {
  hidden: { opacity: 0, y: -8, scale: 0.97, transformOrigin: "top right" },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: {
      type: "spring" as const, stiffness: 340, damping: 28, mass: 0.7,
      staggerChildren: 0.028, delayChildren: 0.04,
    },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const } },
};

const ITEM_VARIANTS = {
  hidden: { opacity: 0, x: 8 },
  visible: { opacity: 1, x: 0, transition: { type: "spring" as const, stiffness: 380, damping: 28 } },
};

const CATEGORY_COLORS: Record<string, string> = {
  Fashion: "#f967fb",
  "Live Music": "#ff8a00",
  "Group Dance": "#53bc28",
  "Solo Dance": "#00b3ff",
  Classical: "#ffd400",
  Literary: "#ff2d55",
  "Fine Arts": "#f967fb",
  "E-Sports": "#4b3bff",
  Photography: "#53bc28",
  Business: "#ff8a00",
  Debate: "#ff2d55",
  Speaking: "#00b3ff",
  Fun: "#ffd400",
  Sports: "#53bc28",
};

function categoryColor(cat: string) {
  return CATEGORY_COLORS[cat] ?? "#ffffff";
}

function TriggerButton({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <button
      id="events-filter-trigger"
      onClick={onClick}
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      aria-label="Filter or jump to an event"
      className="sm-toggle-btn efd-trigger-btn"
    >
      {/* Text matches the Events h1 font & glitch style, shrunk by 2 sizes */}
      <span className="efd-trigger-label">
        FILTER
      </span>
      {/* Downward pointing arrow indicating a dropdown */}
      <svg
        className={`efd-chevron ${isOpen ? "efd-chevron-open" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function DropdownItem({
  item, index, isFocused, onSelect,
}: {
  item: GalleryItem; index: number; isFocused: boolean; onSelect: (index: number) => void;
}) {
  return (
    <motion.li variants={ITEM_VARIANTS} role="option" aria-selected={isFocused} id={`events-filter-option-${item.id}`}>
      <button
        onClick={() => onSelect(index)}
        style={{ width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
      >
        <div
          className="efd-row"
          data-active={isFocused || undefined}
        >
          <span className="efd-index">{String(index + 1).padStart(2, "0")}</span>
          <span className="efd-label-group">
            <span className="efd-title">{item.title}</span>
          </span>
          {isFocused && (
            <svg className="efd-active-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </button>
    </motion.li>
  );
}

interface EventsFilterDropdownProps {
  items: GalleryItem[];
  focusedIndex: number;
  onSelect: (index: number) => void;
}

export default function EventsFilterDropdown({ items, focusedIndex, onSelect }: EventsFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") setIsOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    const active = listRef.current.querySelector(
      `#events-filter-option-${items[focusedIndex]?.id}`
    ) as HTMLElement | null;
    active?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [isOpen, focusedIndex, items]);

  const handleSelect = useCallback((index: number) => { onSelect(index); setIsOpen(false); }, [onSelect]);

  const groupedItems = useMemo(() => {
    const groups: { category: string; items: { item: GalleryItem; originalIndex: number }[] }[] = [];
    items.forEach((item, index) => {
      let group = groups.find((g) => g.category === item.category);
      if (!group) {
        group = { category: item.category, items: [] };
        groups.push(group);
      }
      group.items.push({ item, originalIndex: index });
    });
    return groups;
  }, [items]);

  const css = `
    /* ── Trigger button ── */
    .efd-trigger-btn {
      position: relative;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: transparent;
      border: none;
      color: #ffffff;
      cursor: pointer;
      padding: 0.2rem 0;
      line-height: 1;
    }

    /* Title-matching label: Clean sans-serif, medium weight */
    .efd-trigger-label {
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-size: 1rem;
      transition: opacity 0.2s ease;
    }
    @media (min-width: 640px)  { .efd-trigger-label { font-size: 1.125rem; } }
    @media (min-width: 768px)  { .efd-trigger-label { font-size: 1.25rem; } }

    .efd-trigger-btn:hover .efd-trigger-label {
      opacity: 0.8;
    }

    /* Chevron arrow */
    .efd-chevron {
      width: 1rem;
      height: 1rem;
      color: #ffffff;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease;
    }
    @media (min-width: 640px) { .efd-chevron { width: 1.15rem; height: 1.15rem; } }

    .efd-chevron-open {
      transform: rotate(180deg);
    }

    .efd-trigger-btn:hover .efd-chevron {
      opacity: 0.8;
    }

    /* ── Wrapper + dropdown shell ── */
    .efd-wrapper { position: relative; z-index: 30; pointer-events: auto; font-family: var(--font-sans, system-ui, sans-serif); }

    /* Outer shell: clean glassy background with subtle radius */
    .efd-shell {
      position: absolute; top: calc(100% + 12px); right: 0; width: 280px;
      background: rgba(10, 10, 10, 0.85);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      backdrop-filter: blur(16px);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
      overflow: hidden;
    }

    /* Scrollable list */
    .efd-panel {
      max-height: min(400px, 55vh);
      overflow-y: scroll;
      overscroll-behavior: contain;
      list-style: none; margin: 0; padding: 6px;
    }
    .efd-panel::-webkit-scrollbar { display: none; }

    /* ── Groups & Rows ── */
    .efd-group-header {
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.4);
      padding: 12px 12px 4px 12px;
      margin-top: 4px;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }
    .efd-group:first-child .efd-group-header {
      margin-top: 0;
      border-top: none;
      padding-top: 4px;
    }

    .efd-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 12px;
      transition: all 0.2s ease;
      border-radius: 6px; cursor: pointer; width: 100%; text-align: left;
    }
    .efd-row:hover { background: rgba(255, 255, 255, 0.08); }
    .efd-row[data-active] { background: rgba(255, 255, 255, 0.12); }

    .efd-index {
      font-size: 0.75rem; font-weight: 500;
      color: rgba(255, 255, 255, 0.3); flex-shrink: 0; width: 20px; text-align: right;
    }
    .efd-label-group { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; justify-content: center; }
    
    .efd-title {
      font-size: 0.875rem; font-weight: 500;
      color: #ffffff; white-space: nowrap; overflow: hidden;
      text-overflow: ellipsis; line-height: 1.2;
    }
    
    .efd-active-icon {
      width: 14px;
      height: 14px;
      color: #ffffff;
      opacity: 0.9;
      flex-shrink: 0;
    }

    @media (max-width: 400px) { .efd-shell { width: calc(100vw - 32px); right: -8px; } }
  `;

  return (
    <>
      <style>{css}</style>
      <div ref={containerRef} className="efd-wrapper">
        <TriggerButton isOpen={isOpen} onClick={() => setIsOpen((v) => !v)} />
        <AnimatePresence>
          {isOpen && (
            <motion.div
              key="efd-shell"
              className="efd-shell"
              variants={DROPDOWN_VARIANTS}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Scrollable list — wheel events stopped here so gallery doesn't react */}
              <motion.ul
                ref={listRef}
                role="listbox"
                aria-label="Jump to event"
                aria-activedescendant={`events-filter-option-${items[focusedIndex]?.id}`}
                className="efd-panel"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                {groupedItems.map((group) => (
                  <div key={group.category} className="efd-group">
                    <div className="efd-group-header">{group.category}</div>
                    {group.items.map(({ item, originalIndex }) => (
                      <DropdownItem
                        key={item.id}
                        item={item}
                        index={originalIndex}
                        isFocused={originalIndex === focusedIndex}
                        onSelect={handleSelect}
                      />
                    ))}
                  </div>
                ))}
              </motion.ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
