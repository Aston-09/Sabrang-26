import React from 'react';

export function SkeletonRow({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-md ${className}`}></div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs flex flex-col gap-4">
      <SkeletonRow className="h-4 w-1/3" />
      <SkeletonRow className="h-8 w-1/2" />
      <SkeletonRow className="h-3 w-1/4" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-200">
        <SkeletonRow className="h-5 w-1/4" />
      </div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <SkeletonRow className="h-4 flex-1" />
            <SkeletonRow className="h-4 flex-1 hidden md:block" />
            <SkeletonRow className="h-4 flex-1 hidden lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
