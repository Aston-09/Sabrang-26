"use client";

import React, { useEffect, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { ShaderBackground } from "@/components/ui/neuro-noise";
import CheckoutForm from "@/components/auth/CheckoutForm";
import { RegistrationScene } from "@/components/3d/RegistrationScene";
import CyberDivider from "@/components/ui/CyberDivider";
import UnlockExperience from "@/components/register/UnlockExperience";

export default function RegisterClient() {
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    // Lock body scroll only on desktop to allow native scrolling on mobile forms
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }
    };
    
    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  if (!showForm) {
    return <UnlockExperience onBagIt={() => setShowForm(true)} />;
  }

  return (
    <div className="relative z-[35] min-h-screen lg:fixed lg:inset-0 lg:w-screen lg:h-screen lg:overflow-hidden bg-[#020202] text-white font-sans selection:bg-violet-500/30 flex flex-col lg:flex-row">
      
      {/* Background layer */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-50">
        <ShaderBackground className="absolute inset-0" />
      </div>

      {/* 🚀 LEFT COLUMN (40% Desktop / Bottom Section Mobile): 3D Model & Title 🚀 */}
      <div className="relative z-10 w-full lg:w-[40%] h-[50vh] lg:h-full lg:border-r border-white/10 overflow-hidden shrink-0 order-2 lg:order-1">
        
        {/* Gradients to blend 3D canvas with the background */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020202] via-transparent to-[#020202] lg:bg-gradient-to-r lg:to-[#020202]/50 pointer-events-none z-10" />

        {/* The 3D Canvas */}
        <div className="absolute inset-0 z-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
            <Suspense fallback={null}>
              <RegistrationScene />
            </Suspense>
          </Canvas>
        </div>
      </div>

      {/* 🚀 DIVIDER (Cyberpunk Circuit - Desktop Only) 🚀 */}
      <div className="absolute top-0 bottom-0 left-[40%] z-[60] hidden lg:block -translate-x-1/2 pointer-events-none">
        <CyberDivider />
      </div>

      {/* 🚀 RIGHT COLUMN (60% Desktop / Top Content Mobile): Registration Form 🚀 */}
      <div className="relative z-50 w-full lg:w-[60%] lg:h-full lg:overflow-y-auto lg:overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] bg-[#020202]/80 backdrop-blur-md lg:backdrop-blur-sm order-1 lg:order-2">
        <CheckoutForm />
      </div>

    </div>
  );
}
