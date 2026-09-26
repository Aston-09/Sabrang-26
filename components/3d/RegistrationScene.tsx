"use client";

import React from "react";
import { Text, Float, Environment } from "@react-three/drei";

export function RegistrationScene() {
  return (
    <>
      {/* Lighting setup for a dark, dramatic scene */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={1} color="#a855f7" />
      <directionalLight position={[-10, -10, -10]} intensity={0.5} color="#ffffff" />
      
      {/* Environment maps for reflections if the model has shiny/metallic materials */}
      <Environment preset="city" />

      {/* 3D Text */}
      <Float speed={2} rotationIntensity={0.1} floatIntensity={0.5}>
        <Text
          position={[0, 0, 0]} // Centered since model is gone
          fontSize={0.65} // Reduced size to fit the 40% column perfectly
          lineHeight={0.9}
          font="/fonts/FlorasDisplay.ttf" // Landing page font style
          anchorX="center"
          anchorY="middle"
          textAlign="center"
          outlineWidth={0.02}
          outlineColor="#000000"
          fillOpacity={0.9}
        >
          SABRANG{"\n"}2026
          <meshBasicMaterial color="#f2d170" toneMapped={false} /> {/* Light Golden */}
        </Text>
      </Float>
    </>
  );
}

// Preload the default model
