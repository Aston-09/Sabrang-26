'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { Scan, ShieldCheck } from 'lucide-react';

export default function CheckIn() {
  return (
    <div className="min-h-screen py-28 px-8 flex flex-col items-center relative">
      <div className="hero-glow w-96 h-96 bg-brand-blue/15 top-0 left-0" />

      <header className="mb-12 text-center relative z-10">
        <span className="page-eyebrow">Entry System</span>
        <h1 className="page-title text-4xl md:text-5xl mb-2">Digital Check-in</h1>
        <p className="page-subtitle mx-auto">Scan participant QR codes for rapid entry</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-6xl relative z-10">
        <div className="flex flex-col gap-6">
          <div className="glass-card aspect-square flex flex-col items-center justify-center border-dashed border-2 border-brand-orange/40 relative overflow-hidden">
            <div className="absolute inset-0 bg-brand-orange/5 animate-pulse" />
            <Scan size={64} className="text-brand-orange mb-4 relative z-10" />
            <p className="text-brand-cloud/50 relative z-10">Camera initialization required...</p>
            <button className="btn-primary mt-6 relative z-10">Start Scanner</button>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-display font-bold mb-4 flex items-center gap-2 text-brand-cloud">
              <ShieldCheck className="text-brand-orange" /> Recent Scans
            </h3>
            <div className="space-y-4">
              <ScanItem name="John Doe" status="Valid" time="2 mins ago" />
              <ScanItem name="Jane Smith" status="Invalid" time="5 mins ago" color="text-brand-orange" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          <div className="glass-card p-8 bg-gradient-to-br from-brand-blue/20 to-brand-orange/10 border-brand-blue/20">
            <h2 className="text-5xl font-display font-extrabold mb-2 text-brand-cloud">1,248</h2>
            <p className="text-brand-cloud/50 uppercase tracking-widest text-sm">Total Check-ins</p>
          </div>

          <div className="glass-card p-6">
            <h3 className="text-xl font-display font-bold mb-6 text-brand-cloud">Live Attendance</h3>
            <div className="space-y-6">
              <StatRow label="Main Auditorium" current={450} total={500} color="bg-brand-orange" />
              <StatRow label="Workshop Area B" current={120} total={150} color="bg-brand-orange" />
              <StatRow label="Food Court" current={890} total={1000} color="bg-brand-blue" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ScanItemProps {
  name: string;
  status: string;
  time: string;
  color?: string;
}

function ScanItem({ name, status, time, color = 'text-brand-orange' }: ScanItemProps) {
  return (
    <div className="flex justify-between items-center p-3 rounded-xl bg-brand-cloud/5 border border-brand-cloud/10">
      <div>
        <p className="font-semibold text-brand-cloud">{name}</p>
        <p className="text-xs text-brand-cloud/50">{time}</p>
      </div>
      <span className={`text-sm font-bold ${color}`}>{status}</span>
    </div>
  );
}

interface StatRowProps {
  label: string;
  current: number;
  total: number;
  color: string;
}

function StatRow({ label, current, total, color }: StatRowProps) {
  const percent = (current / total) * 100;
  return (
    <div>
      <div className="flex justify-between mb-2 text-sm text-brand-cloud">
        <span>{label}</span>
        <span className="text-brand-cloud/50">{current} / {total}</span>
      </div>
      <div className="h-2 w-full bg-brand-cloud/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
