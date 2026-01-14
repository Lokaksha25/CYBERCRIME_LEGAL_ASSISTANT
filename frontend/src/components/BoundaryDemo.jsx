import React from 'react';
import { ShieldCheck, ShieldAlert, Terminal } from 'lucide-react'; // Optional: npm install lucide-react

export default function BoundaryDemo() {
  return (
    <div className="grid md:grid-cols-2 gap-8 p-4 md:p-8">
      {/* ALLOWED QUERY CARD */}
      <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl transition-opacity group-hover:opacity-100" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-emerald-400">
              In-Scope Request
            </span>
          </div>

          <div className="rounded-lg bg-black/40 p-4 font-mono text-sm text-gray-300 border border-white/5 mb-4">
            <span className="text-emerald-500 mr-2">&gt;</span>
            Explain IPC sections used in a cyber fraud case
          </div>

          <div className="flex items-center gap-2 text-sm text-emerald-400/80 font-medium">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Verified: Answer generated from legal corpus
          </div>
        </div>
      </div>

      {/* REJECTED QUERY CARD */}
      <div className="group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-500/5 p-6 transition-all hover:border-rose-500/40 hover:bg-rose-500/10">
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-rose-500/10 blur-3xl transition-opacity group-hover:opacity-100" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
              <ShieldAlert size={24} />
            </div>
            <span className="text-sm font-bold uppercase tracking-wider text-rose-400">
              Out-of-Scope Request
            </span>
          </div>

          <div className="rounded-lg bg-black/40 p-4 font-mono text-sm text-gray-300 border border-white/5 mb-4">
            <span className="text-rose-500 mr-2">&gt;</span>
            What is the weather today?
          </div>

          <div className="flex items-center gap-2 text-sm text-rose-400/80 font-medium">
            <div className="h-2 w-2 rounded-full bg-rose-500" />
            Blocked: Query outside legal jurisdiction
          </div>
        </div>
      </div>
    </div>
  );
}