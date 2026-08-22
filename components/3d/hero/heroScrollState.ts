// A mutable singleton store for the hero WebGL scroll progress.
// This allows GSAP to write scroll progress continuously without triggering
// expensive React re-renders every frame. The R3F useFrame loop simply reads this value.

export const heroScrollState = {
  progress: 0
}
