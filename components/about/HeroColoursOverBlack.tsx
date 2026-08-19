"use client";

/**
 * HeroColoursOverBlack — High-Performance Volumetric Fluid & Cloud Background
 * Optimized for minimal GPU consumption, silky 60 FPS, and low power usage.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const FRAGMENT_SHADER = /* glsl */ `
precision mediump float;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2  uMouse;
uniform float uIsPurple;

// Fast analytical 2D hash & smooth noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Lightweight 2-octave FBM for fast fluid domain warping
float fbm2(vec2 p) {
  return 0.65 * noise(p) + 0.35 * noise(p * 2.02 + 100.0);
}

// Violet, Purple, Blue, Indigo, Cyan & Fuchsia Spectrum Sequence
vec3 getSabrangColor(float phase) {
  float p = fract(phase);
  
  // 7 Spectrum stops focused on Violet, Purple, Indigo, Sapphire Blue & Cyber Cyan:
  // 0: Deep Royal Violet      (#7C3AED)
  // 1: Electric Orchid Purple (#9D4EDD)
  // 2: Neon Fuchsia Violet    (#D946EF)
  // 3: Deep Midnight Indigo   (#4338CA)
  // 4: Electric Sapphire Blue (#2563EB)
  // 5: Vivid Cyber Cyan       (#06B6D4)
  // 6: Luminous Ice Blue      (#38BDF8)
  vec3 c0 = vec3(0.486, 0.227, 0.929); // #7C3AED (Royal Violet)
  vec3 c1 = vec3(0.616, 0.306, 0.867); // #9D4EDD (Electric Orchid Purple)
  vec3 c2 = vec3(0.851, 0.275, 0.937); // #D946EF (Neon Fuchsia Violet)
  vec3 c3 = vec3(0.263, 0.220, 0.792); // #4338CA (Deep Midnight Indigo)
  vec3 c4 = vec3(0.145, 0.388, 0.922); // #2563EB (Electric Sapphire Blue)
  vec3 c5 = vec3(0.024, 0.714, 0.831); // #06B6D4 (Vivid Cyber Cyan)
  vec3 c6 = vec3(0.220, 0.741, 0.973); // #38BDF8 (Luminous Ice Blue)

  float idx = p * 7.0;
  float fIdx = floor(idx);
  float blend = smoothstep(0.0, 1.0, fract(idx));

  if (fIdx < 1.0) return mix(c0, c1, blend);
  if (fIdx < 2.0) return mix(c1, c2, blend);
  if (fIdx < 3.0) return mix(c2, c3, blend);
  if (fIdx < 4.0) return mix(c3, c4, blend);
  if (fIdx < 5.0) return mix(c4, c5, blend);
  if (fIdx < 6.0) return mix(c5, c6, blend);
  return mix(c6, c0, blend);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / min(uResolution.x, uResolution.y);

  // Smooth mouse interaction
  vec2 mouseOffset = (uMouse - 0.5) * 0.22;
  uv += mouseOffset * (1.0 - clamp(length(uv), 0.0, 1.0));

  // Fluid domain warping
  float t = uTime * 0.05;
  vec2 q = vec2(
    fbm2(uv * 1.15 + vec2(0.0, t)),
    fbm2(uv * 1.15 + vec2(5.2, t * 0.8))
  );

  vec2 r = vec2(
    fbm2(uv * 1.35 + 2.4 * q + vec2(1.7, t * 1.1 + 9.2)),
    fbm2(uv * 1.35 + 2.4 * q + vec2(8.3, t * 0.9 + 2.8))
  );

  float f = fbm2(uv * 1.2 + 2.2 * r);

  // ── Smooth Temporal Color Progression (One by One across Sabrang Spectrum) ──
  // Cycles through: Violet ➔ Blue ➔ Cyan ➔ Green ➔ Yellow ➔ Orange ➔ Crimson
  float timeCycle = uTime * 0.07;

  // Primary dominant color across current phase
  vec3 colorDominant = getSabrangColor(timeCycle);
  // Next arriving color transitioning in through fluid streams
  vec3 colorNext     = getSabrangColor(timeCycle + 0.14);
  // Deep harmonizing undertone
  vec3 colorUnder    = getSabrangColor(timeCycle - 0.10);
  // Vibrant crest highlights & luminous sparks
  vec3 colorSparks   = getSabrangColor(timeCycle + 0.28);

  // Rich base ambient glow (ensures background is luminous and not very dark)
  vec3 ambientBase = colorDominant * 0.22 + colorUnder * 0.12;

  // Interweave fluid currents: Dominant morphs into Next along turbulence streams
  float flowMix = clamp(q.x * 1.3 + r.y * 0.8 + 0.35, 0.0, 1.0);
  vec3 fluidBody = mix(colorDominant, colorNext, flowMix);

  // Secondary dynamic wave ribbons
  float wave = smoothstep(0.25, 0.75, sin(f * 4.2 + q.y * 2.0 + t * 0.8) * 0.5 + 0.5);
  vec3 col = mix(ambientBase, fluidBody, wave * 0.85 + 0.15);

  // Radiant ripple crests & luminous surface sparks
  float crest = smoothstep(0.35, 0.72, sin(f * 5.8 + uTime * 0.20 + r.x * 2.6));
  col = mix(col, colorSparks, crest * 0.55);

  // Subtle center radial brilliance so center is luminous
  float centerDist = length(uv * vec2(0.9, 1.1));
  float centerGlow = smoothstep(1.2, 0.0, centerDist);
  col += colorDominant * (centerGlow * 0.18);

  // Fluid density mask with generous brightness floor (never pitch-black)
  float cloudDensity = smoothstep(0.06, 0.65, f);
  vec3 finalColor = mix(ambientBase * 0.7, col, clamp(cloudDensity * 1.25 + 0.20, 0.0, 1.0));

  // Soft atmospheric edge vignette
  float vignette = smoothstep(1.35, 0.25, centerDist);
  finalColor *= mix(0.72, 1.0, vignette);

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const VERTEX_SHADER = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

function FluidScreenQuad({
  palette = "blue",
}: {
  scrollProgress?: { current: number };
  palette?: "blue" | "purple";
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { size } = useThree();

  const mouse = useRef({ x: 0.5, y: 0.5, targetX: 0.5, targetY: 0.5 });
  const isVisible = useRef(true);

  useEffect(() => {
    const handleVisibility = () => {
      isVisible.current = !document.hidden;
    };
    document.addEventListener("visibilitychange", handleVisibility);

    let ticking = false;
    const handleMouseMove = (e: MouseEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          mouse.current.targetX = e.clientX / window.innerWidth;
          mouse.current.targetY = 1.0 - e.clientY / window.innerHeight;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new THREE.Vector2(Math.max(size.width, 1), Math.max(size.height, 1)) },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uIsPurple: { value: palette === "purple" ? 1.0 : 0.0 },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (!matRef.current || !isVisible.current) return;

    if (state.size.width > 0 && state.size.height > 0) {
      matRef.current.uniforms.uResolution.value.set(state.size.width, state.size.height);
    }

    mouse.current.x += (mouse.current.targetX - mouse.current.x) * 0.06;
    mouse.current.y += (mouse.current.targetY - mouse.current.y) * 0.06;

    matRef.current.uniforms.uTime.value += Math.min(delta, 0.033);
    matRef.current.uniforms.uMouse.value.set(mouse.current.x, mouse.current.y);
    matRef.current.uniforms.uIsPurple.value = palette === "purple" ? 1.0 : 0.0;
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={VERTEX_SHADER}
        fragmentShader={FRAGMENT_SHADER}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export interface HeroColoursOverBlackProps {
  scrollProgress?: { current: number };
  palette?: "blue" | "purple";
}

export default function HeroColoursOverBlack({
  scrollProgress,
  palette = "blue",
}: HeroColoursOverBlackProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        background: "#000000",
        willChange: "transform",
        transform: "translateZ(0)",
      }}
    >
      {mounted && (
        <Canvas
          dpr={1}
          performance={{ min: 0.8 }}
          camera={{ position: [0, 0, 1] }}
          gl={{
            antialias: false,
            alpha: false,
            stencil: false,
            depth: false,
            powerPreference: "high-performance",
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(new THREE.Color("#000000"), 1);
            gl.domElement?.addEventListener("webglcontextlost", (e) =>
              e.preventDefault(),
            );
          }}
          style={{ width: "100%", height: "100%" }}
        >
          <FluidScreenQuad scrollProgress={scrollProgress} palette={palette} />
        </Canvas>
      )}
    </div>
  );
}
