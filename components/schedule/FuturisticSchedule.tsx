"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { Clock, MapPin, ArrowRight, Menu } from "lucide-react";
import { ShaderBackground } from "@/components/ui/neuro-noise";

/* ─────────────────────────────────────────────────────────────
   TYPES & CONSTANTS
────────────────────────────────────────────────────────────── */

export type ScheduleEvent = {
  time: string;
  event: string;
  venue: string;
  category: "Mandatory" | "Fun" | "Competition" | "Mentoring" | "Session";
  description?: string;
};

export type ScheduleData = {
  date: string;
  label: string;
  events: ScheduleEvent[];
}[];

const CATEGORIES = ["ALL", "MANDATORY", "FUN", "COMPETITION", "MENTORING", "SESSION"];

/* ─────────────────────────────────────────────────────────────
   3D BACKGROUND SYSTEM (Three.js)
────────────────────────────────────────────────────────────── */

function ParticleSystem({ count = 1000 }) {
  const points = useRef<THREE.Points>(null);
  
  // Generate random positions
  const positions = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 30;     // x
      p[i * 3 + 1] = (Math.random() - 0.5) * 30; // y
      p[i * 3 + 2] = (Math.random() - 0.5) * 20; // z
    }
    return p;
  }, [count]);

  useFrame((state, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.05;
      points.current.rotation.x -= delta * 0.02;
    }
  });

  return (
    <Points ref={points} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.03} sizeAttenuation={true} depthWrite={false} opacity={0.3} />
    </Points>
  );
}

function GlassPrism() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.2;
      meshRef.current.rotation.x += delta * 0.1;
      // Gentle floating
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.5;
    }
  });

  return (
    <mesh ref={meshRef} position={[8, 4, -10]} scale={1.5}>
      <octahedronGeometry args={[1, 0]} />
      <meshPhysicalMaterial 
        transparent={true}
        opacity={0.4} 
        metalness={0} 
        roughness={0} 
        color="#a855f7"
        emissive="#3b82f6"
        emissiveIntensity={0.2}
      />
    </mesh>
  );
}

function WebGLBackground() {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    // Only render 3D on client to avoid hydration mismatch
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none hidden md:block">
      <Canvas dpr={[1, 1]} camera={{ position: [0, 0, 15], fov: 45 }} gl={{ antialias: false, alpha: true }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        <ParticleSystem count={800} />
        <GlassPrism />
      </Canvas>
      
      {/* 2D Atmospheric Overlays */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_0%,#000_60%,transparent_100%)]" />
      <div className="absolute top-0 right-[10%] w-[1px] h-[80%] bg-gradient-to-b from-transparent via-violet-400 to-transparent opacity-20 blur-[2px] transform rotate-[15deg]" />
      <div className="absolute bottom-[20%] left-[5%] w-[1px] h-[60%] bg-gradient-to-b from-transparent via-blue-400 to-transparent opacity-10 blur-[1px] transform -rotate-[25deg]" />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3D UI PHYSICS (Framer Motion)
────────────────────────────────────────────────────────────── */

function EventCard3D({ evt, index }: { evt: ScheduleEvent, index: number }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse values
  const mouseX = useSpring(x, { stiffness: 150, damping: 20 });
  const mouseY = useSpring(y, { stiffness: 150, damping: 20 });

  // Map mouse coordinates to rotation (max 4 degrees)
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [4, -4]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-4, 4]);
  
  // Map mouse coordinates to gradient highlight position
  const glareX = useTransform(mouseX, [-0.5, 0.5], [0, 100]);
  const glareY = useTransform(mouseY, [-0.5, 0.5], [0, 100]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;
    x.set((mouseXPos / width) - 0.5);
    y.set((mouseYPos / height) - 0.5);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toUpperCase()) {
      case "MANDATORY": return "text-rose-400 border-rose-500/30";
      case "FUN": return "text-emerald-400 border-emerald-500/30";
      case "COMPETITION": return "text-fuchsia-400 border-fuchsia-500/30";
      case "MENTORING": return "text-blue-400 border-blue-500/30";
      case "SESSION": return "text-amber-400 border-amber-500/30";
      default: return "text-gray-400 border-gray-500/30";
    }
  };

  return (
    <motion.div
      style={{ perspective: 1000 }}
      className="relative z-20 group"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.5 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className="relative bg-[#08090d] border border-white/[0.08] rounded-[4px] p-7 cursor-pointer transition-colors duration-500 group-hover:bg-[#0c0d14] group-hover:border-white/[0.15]"
        whileHover={{ translateZ: 12 }}
      >
        {/* Dynamic Glare Effect */}
        <motion.div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[4px]"
          style={{
            background: useTransform(
              () => `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(139, 92, 246, 0.15) 0%, transparent 60%)`
            )
          }}
        />

        {/* Diagonal Light Streak (CSS animated on hover) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[4px]">
          <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent skew-x-[-20deg] group-hover:animate-[streak_1s_ease-in-out_forward]" />
        </div>

        <div className="relative z-10" style={{ transform: "translateZ(10px)" }}>
          <div className="flex justify-between items-start mb-3">
            <span className="text-[11px] font-mono tracking-widest text-white/50">{evt.time}</span>
            <span className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-[2px] border ${getCategoryColor(evt.category)}`}>
              {evt.category}
            </span>
          </div>
          
          <h3 className="text-lg font-bold text-white/90 leading-tight mb-2 group-hover:text-white transition-colors">
            {evt.event}
          </h3>
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-widest font-medium">
              <MapPin size={10} />
              {evt.venue}
            </div>
            <div className="text-[9px] font-bold tracking-widest text-white/0 group-hover:text-white/40 transition-colors flex items-center">
              VIEW <ArrowRight size={10} className="ml-1" />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function DayColumn({ 
  day, 
  filteredEvents, 
  isHovered, 
  onHover, 
  onLeave, 
  mouseX, 
  mouseY,
  colIndex
}: { 
  day: ScheduleData[0], 
  filteredEvents: ScheduleEvent[], 
  isHovered: boolean, 
  onHover: () => void, 
  onLeave: () => void,
  mouseX: any,
  mouseY: any,
  colIndex: number
}) {
  
  // Parallax the column based on mouse position
  // The center of screen is 0,0. 
  // colIndex: 0 = left, 1 = center, 2 = right
  const offsetX = (colIndex - 1) * 2; // slight base offset
  
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [1, -1]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-1.5, 1.5]);
  const translateX = useTransform(mouseX, [-0.5, 0.5], [-10 + offsetX, 10 + offsetX]);
  const translateY = useTransform(mouseY, [-0.5, 0.5], [-10, 10]);

  return (
    <motion.div
      style={{ rotateX, rotateY, x: translateX, y: translateY, transformStyle: "preserve-3d" }}
      className={`relative flex flex-col transition-all duration-700 ease-out ${isHovered ? 'z-30 opacity-100' : 'z-10 opacity-80'}`}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      animate={{ 
        translateZ: isHovered ? 20 : 0,
        scale: isHovered ? 1.02 : 1
      }}
    >
      {/* Premium Glass Background Slab */}
      <div className="absolute inset-0 bg-[#050508] border border-white/[0.03] rounded-lg -z-10" />

      {/* Day Header */}
      <div className="px-6 py-6 border-b border-white/[0.05] relative overflow-hidden rounded-t-lg">
        {/* Subtle Extrusion Number */}
        <div className="absolute -right-4 -top-8 text-[120px] font-black text-white/[0.02] select-none pointer-events-none" style={{ fontFamily: 'var(--font-space-grotesk)' }}>
          0{colIndex + 1}
        </div>
        
        <h2 className="text-xl font-bold tracking-[0.2em] text-white mb-1 relative z-10">{day.label}</h2>
        <span className="text-[10px] font-mono tracking-widest text-violet-400 relative z-10">{day.date}</span>
      </div>

      {/* Timeline Container */}
      <div className="flex-1 p-6 relative">
        {filteredEvents.length === 0 ? (
          <div className="text-xs tracking-widest text-white/30 italic text-center py-20">NO EVENTS</div>
        ) : (
          <div className="relative">
            {/* Main Vertical Timeline Line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-[1px] bg-white/[0.1]" />
            
            {/* Animated Traveling Light */}
            <motion.div 
              className="absolute left-[11px] w-[1px] h-32 bg-gradient-to-b from-transparent via-violet-500 to-transparent"
              animate={{ top: ["0%", "100%"], opacity: [0, 1, 0] }}
              transition={{ duration: 4, ease: "linear", repeat: Infinity, delay: colIndex * 1.5 }}
            />

            <div className="flex flex-col gap-12">
              {filteredEvents.map((evt, idx) => (
                <div key={idx} className="relative pl-10 group">
                  {/* Timeline Node */}
                  <div className="absolute left-[8px] top-[32px] w-2 h-2 rounded-full bg-[#050508] border border-white/30 z-10 transition-all duration-300 group-hover:scale-150 group-hover:border-violet-500 group-hover:bg-violet-500/20 shadow-[0_0_0_rgba(139,92,246,0)] group-hover:shadow-[0_0_10px_rgba(139,92,246,0.5)]" />
                  
                  {/* The Card */}
                  <EventCard3D evt={evt} index={idx} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}


/* ─────────────────────────────────────────────────────────────
   MAIN COMPONENT
────────────────────────────────────────────────────────────── */

export default function FuturisticSchedule({ schedule }: { schedule?: ScheduleData }) {
  // Parallax Mouse tracking for subtle background movement
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
    const x = (e.clientX / window.innerWidth) - 0.5;
    const y = (e.clientY / window.innerHeight) - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <div 
      className="fixed inset-0 w-screen h-screen overflow-hidden text-white font-sans selection:bg-violet-500/30 flex items-center justify-center p-4 sm:p-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
    >
      <div className="fixed inset-0 z-0 bg-[#020202]">
        <ShaderBackground className="absolute inset-0" />
      </div>


      {/* ── MAIN CONTENT ── */}
      <main className="relative z-10 w-full max-w-[1200px] mx-auto flex flex-col items-center justify-center text-center">
        
        {/* Editorial Title */}
        <div className="text-center mb-8 relative z-20 mt-24 sm:mt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 
              className="text-4xl sm:text-6xl md:text-7xl lg:text-[84px] font-black tracking-tight text-white mb-3 uppercase leading-none" 
              style={{ fontFamily: 'var(--font-space-grotesk), "Syne", sans-serif' }}
            >
              SCHEDULE
            </h1>
            <p className="text-violet-400/80 font-mono text-xs sm:text-sm tracking-[0.3em] uppercase">
              23 - 25 OCTOBER 2026
            </p>
          </motion.div>
        </div>

        {/* Revealing Soon Presentation Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full max-w-xl text-center p-10 sm:p-16"
        >
          {/* Main Statement */}
          <h2
            className="relative z-10 text-3xl sm:text-5xl md:text-6xl font-black uppercase text-white tracking-tight leading-none"
            style={{
              fontFamily: '"Syne", var(--font-space-grotesk), sans-serif',
              textShadow: "0 0 30px rgba(255,255,255,0.7), 0 0 50px rgba(168,85,247,0.4)",
            }}
          >
            REVEALING SOON
          </h2>
        </motion.div>

      </main>


      <style>{`
        @keyframes streak {
          0% { left: -100%; opacity: 0; }
          50% { opacity: 1; }
          100% { left: 200%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
