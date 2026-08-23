// Mutable singletons for the hero WebGL scene.
// GSAP / DOM listeners write here every frame; the single R3F useFrame loop reads.
// Kept outside React so nothing re-renders per frame.

export const heroScrollState = {
  progress: 0
}

/** Normalised pointer, -1..1, written by a window listener (canvas is pointer-events:none). */
export const heroInput = {
  x: 0,
  y: 0
}

/** Attaches the pointer listeners. Returns the cleanup fn. */
export function startHeroInput() {
  const onMove = (e: PointerEvent) => {
    heroInput.x = (e.clientX / window.innerWidth) * 2 - 1
    heroInput.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onMove, { passive: true })
  return () => window.removeEventListener('pointermove', onMove)
}
