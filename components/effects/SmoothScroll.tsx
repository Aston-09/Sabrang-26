"use client";

import React, { useEffect } from "react";

/**
 * Checks whether an element or any of its ancestors (up to <body>) has
 * genuine horizontal scroll capacity — i.e. content wider than the box
 * and an overflow setting that would make it scrollable.
 */
function isInsideHorizontalScroller(el: Element | null): boolean {
  while (el && el !== document.body) {
    const style = window.getComputedStyle(el);
    const overflowX = style.overflowX;
    if (
      (overflowX === "auto" || overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth
    ) {
      return true;
    }
    el = el.parentElement;
  }
  return false;
}

export default function SmoothScroll({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Only run on devices that have a fine pointer (mouse / trackpad).
    // Touch devices handle back/forward through their own native gesture layer.
    const isFinePointer = window.matchMedia("(pointer: fine)").matches;
    if (!isFinePointer) return;

    const handleWheel = (e: WheelEvent) => {
      const absX = Math.abs(e.deltaX);
      const absY = Math.abs(e.deltaY);

      // Only act when the gesture is predominantly horizontal
      // and has enough magnitude to be intentional (> 3px).
      if (absX <= 3 || absY >= absX) return;

      // Allow horizontal wheel inside elements that actually scroll sideways
      // (e.g. data tables, carousels with overflow-x: scroll).
      if (isInsideHorizontalScroller(e.target as Element)) return;

      // Block the event — prevents browser back/forward navigation swipe.
      e.preventDefault();
    };

    // { passive: false } is required so that preventDefault() is honoured.
    window.addEventListener("wheel", handleWheel, { passive: false });

    // Prevent dragging and right-click download helpers on media
    const handleDragStart = (e: DragEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "IMG" || target?.tagName === "VIDEO") {
        e.preventDefault();
      }
    };
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.tagName === "IMG" || target?.tagName === "VIDEO" || target?.closest("video, img")) {
        e.preventDefault();
      }
    };

    window.addEventListener("dragstart", handleDragStart);
    window.addEventListener("contextmenu", handleContextMenu);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("dragstart", handleDragStart);
      window.removeEventListener("contextmenu", handleContextMenu);
    };
  }, []);

  return <>{children}</>;
}
