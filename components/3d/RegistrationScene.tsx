"use client";

import React from "react";
import { Text, Float } from "@react-three/drei";

export function RegistrationScene() {
  return (
    <>
      {/* Lighting setup for dramatic golden glow */}
      <ambientLight intensity={1.2} />
      <directionalLight position={[10, 10, 10]} intensity={1.5} color="#f2d170" />
      <directionalLight position={[-10, -10, -10]} intensity={0.8} color="#a855f7" />
      
      {/* 3D Floating Text */}
      <Float speed={2} rotationIntensity={0.15} floatIntensity={0.5}>
        <Text
          position={[0, 0, 0]}
          fontSize={0.75}
          lineHeight={0.92}
          font="/fonts/FlorasDisplay.ttf"
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          color="#f2d170"
          outlineWidth={0.02}
          outlineColor="#000000"
          fillOpacity={0.95}
        >
          {"SABRANG\n2026"}
          <meshBasicMaterial color="#f2d170" toneMapped={false} />
        </Text>
      </Float>
    </>
  );
}

// Preload the default model
