import React from "react";

export default function CyberDivider() {
  return (
    <div className="h-full w-12 flex flex-col items-center pointer-events-none drop-shadow-[0_0_6px_rgba(242,209,112,0.6)]">
      
      {/* Top vertical line segment */}
      <div className="w-[2px] flex-grow bg-[#f2d170] relative">
        <div className="absolute top-10 left-1 w-[8px] h-[8px] bg-transparent border border-[#f2d170] rounded-full"></div>
      </div>
      
      {/* First complex zig-zag pattern (left shift) */}
      <svg width="48" height="120" viewBox="0 0 48 120" fill="none" stroke="#f2d170" strokeWidth="2" className="flex-shrink-0">
        <path d="M 24 0 V 20 L 8 36 V 84 L 24 100 V 120" strokeLinecap="square" />
        
        {/* Nodes */}
        <circle cx="24" cy="20" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        <circle cx="8" cy="36" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        <circle cx="8" cy="84" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        <circle cx="24" cy="100" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        
        {/* Techy parallel lines & accents */}
        <path d="M 30 10 V 22 L 14 38 V 82 L 30 98 V 110" strokeWidth="1" opacity="0.4" />
        <path d="M 8 60 H 0" strokeWidth="1.5" />
        <circle cx="0" cy="60" r="1.5" fill="#f2d170" />
      </svg>

      {/* Middle vertical line segment */}
      <div className="w-[2px] flex-grow-[1.5] bg-[#f2d170] relative">
        <div className="absolute top-1/2 right-2 w-[4px] h-[20px] bg-[#f2d170] opacity-50"></div>
        <div className="absolute top-1/2 right-4 w-[2px] h-[10px] bg-[#f2d170] opacity-30 mt-1"></div>
      </div>

      {/* Second complex zig-zag pattern (right shift) */}
      <svg width="48" height="160" viewBox="0 0 48 160" fill="none" stroke="#f2d170" strokeWidth="2" className="flex-shrink-0">
        <path d="M 24 0 V 30 L 40 46 V 114 L 24 130 V 160" strokeLinecap="square" />
        
        {/* Nodes */}
        <circle cx="24" cy="30" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        <circle cx="40" cy="46" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        <circle cx="40" cy="114" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        <circle cx="24" cy="130" r="3" fill="#000" stroke="#f2d170" strokeWidth="1.5"/>
        
        {/* Techy accents */}
        <path d="M 18 20 V 32 L 34 48 V 112 L 18 128 V 140" strokeWidth="1" opacity="0.4" />
        <path d="M 40 80 H 48" strokeWidth="1.5" />
        <circle cx="48" cy="80" r="1.5" fill="#f2d170" />
        
        {/* Extra branch */}
        <path d="M 24 140 L 12 152 V 160" strokeWidth="1.5" opacity="0.6"/>
      </svg>

      {/* Bottom vertical line segment */}
      <div className="w-[2px] flex-grow bg-[#f2d170] relative">
        {/* Small detail branching down */}
        <div className="absolute top-0 left-[-11px] w-[2px] h-[40px] bg-[#f2d170] opacity-60"></div>
        <div className="absolute bottom-20 left-2 w-[6px] h-[6px] bg-transparent border border-[#f2d170] rounded-sm transform rotate-45"></div>
      </div>

    </div>
  );
}
