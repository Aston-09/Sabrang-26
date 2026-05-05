'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthProvider';

export default function CursorFollower() {
  const { role, loading } = useAuth();
  const cursorRef = useRef<HTMLDivElement>(null);
  const followerRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);

  const isEnabled = !loading && role !== 'admin' && role !== 'scanner';

  useEffect(() => {
    if (isEnabled) {
      document.body.classList.add('custom-cursor-active');
    } else {
      document.body.classList.remove('custom-cursor-active');
    }
    
    return () => {
      document.body.classList.remove('custom-cursor-active');
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!isEnabled) return;

    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current && followerRef.current) {
        const { clientX: x, clientY: y } = e;
        cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        followerRef.current.animate(
          { transform: `translate3d(${x}px, ${y}px, 0)` },
          { duration: 500, fill: 'forwards' }
        );

        const target = e.target as HTMLElement;
        const isInteractive = target.closest('button, a, input, select, textarea');
        setIsHovering(!!isInteractive);
      }
    };

    window.addEventListener('mousemove', moveCursor);
    return () => window.removeEventListener('mousemove', moveCursor);
  }, [isEnabled]);

  if (!isEnabled) return null;

  return (
    <>
      <div 
        ref={cursorRef}
        id="cursor"
        className={`fixed top-0 left-0 w-2 h-2 bg-slate-900 pointer-events-none z-[9999] -ml-1 -mt-1 transition-transform duration-300 ease-out ${isHovering ? 'scale-[3]' : 'scale-100'}`}
      />
      <div 
        ref={followerRef}
        id="follower"
        className={`fixed top-0 left-0 w-8 h-8 border border-slate-200 pointer-events-none z-[9998] -ml-4 -mt-4 transition-all duration-500 ease-out flex items-center justify-center overflow-hidden ${isHovering ? 'scale-[1.5] border-slate-900 bg-slate-50' : 'scale-100'}`}
      >
        <div className={`w-full h-full bg-slate-200 opacity-20 transition-transform duration-500 ${isHovering ? 'scale-150' : 'scale-100'}`} />
      </div>
    </>
  );
}
