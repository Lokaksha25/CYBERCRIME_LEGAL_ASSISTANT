import React from 'react';
import { XCircle, CheckCircle2 } from 'lucide-react'; // Suggested: npm install lucide-react

export default function ComparisonTable() {
  const comparisonData = [
    {
      risk: "May hallucinate laws",
      solution: "Answers strictly from verified documents",
    },
    {
      risk: "Answers everything (Unsafe)",
      solution: "Strictly rejects out-of-scope queries",
    },
    {
      risk: "No source traceability",
      solution: "Every claim backed by legal citations",
    },
    {
      risk: "Uncontrolled generic model",
      solution: "Domain-restricted & safety-controlled",
    },
  ];

  return (
    <div className="w-full space-y-4">
      {/* Header Labels */}
      <div className="grid grid-cols-2 gap-4 mb-6 px-4">
        <div className="text-xs font-bold uppercase tracking-widest text-gray-500">Generic LLM</div>
        <div className="text-xs font-bold uppercase tracking-widest text-indigo-400">Legal RAG Chatbot</div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {comparisonData.map((item, i) => (
          <div 
            key={i} 
            className="grid grid-cols-2 gap-4 group"
          >
            {/* Generic LLM Column */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5 transition-colors group-hover:bg-white/[0.04]">
              <XCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
              <span className="text-sm text-gray-400 leading-tight">
                {item.risk}
              </span>
            </div>

            {/* Legal RAG Column */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20 shadow-lg shadow-indigo-500/5 transition-all group-hover:bg-indigo-500/10 group-hover:border-indigo-500/40">
              <CheckCircle2 className="text-indigo-400 shrink-0 mt-0.5" size={18} />
              <span className="text-sm text-gray-100 font-medium leading-tight">
                {item.solution}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Visual Indicator of System Integrity */}
      <div className="mt-8 p-3 rounded-lg bg-black/40 border border-white/5 text-center">
        <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em]">
          Data Integrity Level: <span className="text-emerald-500">Maximum</span>
        </p>
      </div>
    </div>
  );
}