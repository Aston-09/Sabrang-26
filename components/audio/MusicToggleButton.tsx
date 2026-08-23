"use client";

import { useAudioPlayer } from "./AudioPlayerProvider";

interface MusicToggleButtonProps {
  className?: string;
}

export default function MusicToggleButton({ className = "" }: MusicToggleButtonProps) {
  const { isPlaying, toggleMusic } = useAudioPlayer();

  return (
    <button
      onClick={toggleMusic}
      type="button"
      className={`group relative flex items-center justify-center p-2 rounded-md bg-transparent hover:bg-white/[0.1] border-0 outline-none transition-all duration-300 cursor-pointer select-none ${className}`}
      aria-label={isPlaying ? "Mute background anthem" : "Play background anthem"}
      title={isPlaying ? "Mute Anthem" : "Play Anthem"}
    >
      {/* 3 Animated Visualizer Equalizer Lines */}
      <div className="flex items-end gap-1 h-5 w-4 justify-center pointer-events-none" aria-hidden="true">
        <span
          className={`w-[2.5px] bg-white rounded-full transition-all duration-300 ${
            isPlaying ? "animate-[musicBar_0.75s_ease-in-out_infinite_alternate]" : "h-1.5 opacity-40"
          }`}
          style={{ animationDelay: "0ms" }}
        />
        <span
          className={`w-[2.5px] bg-white rounded-full transition-all duration-300 ${
            isPlaying ? "animate-[musicBar_0.55s_ease-in-out_infinite_alternate]" : "h-1.5 opacity-40"
          }`}
          style={{ animationDelay: "220ms" }}
        />
        <span
          className={`w-[2.5px] bg-white rounded-full transition-all duration-300 ${
            isPlaying ? "animate-[musicBar_0.85s_ease-in-out_infinite_alternate]" : "h-1.5 opacity-40"
          }`}
          style={{ animationDelay: "110ms" }}
        />
      </div>
    </button>
  );
}
