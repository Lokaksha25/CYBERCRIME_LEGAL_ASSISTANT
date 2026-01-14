import { BookOpen, Calendar } from "lucide-react";

export default function SourceCard({ source }) {
  return (
    <div className="bg-zinc-900/40 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition-all group shadow-sm">
      <div className="flex items-start gap-3">
        {/* Icon Accent */}
        <div className="mt-1 bg-zinc-800 p-2 rounded-lg group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-colors">
          <BookOpen size={14} className="text-zinc-500 group-hover:text-blue-400" />
        </div>

        <div className="flex-1">
          {/* Header & Year */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
            <h4 className="font-medium text-zinc-100 text-sm leading-tight">
              {source.title}
            </h4>
            {source.year && (
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded">
                <Calendar size={10} />
                {source.year}
              </div>
            )}
          </div>

          {/* Summary */}
          <p className="text-zinc-400 text-xs leading-relaxed italic border-l border-zinc-800 pl-3">
            {source.summary}
          </p>
        </div>
      </div>
    </div>
  );
}