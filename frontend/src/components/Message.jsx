import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import SourceCard from "./SourceCard";
import { User, ChevronDown, ChevronUp, Scale } from "lucide-react";

export default function Message({ message }) {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} group animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex gap-3 ${isUser ? "max-w-[85%] md:max-w-[75%]" : "max-w-[95%] md:max-w-[90%]"} ${isUser ? "flex-row-reverse" : "flex-row"}`}>

        {/* Adaptive Avatar Icon */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border mt-1 shadow-sm transition-colors
          ${isUser
            ? "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400"
            : "bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400"}`}>
          {isUser ? <User size={14} /> : <Scale size={14} />}
        </div>

        <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
          {/* Label with adaptive color */}
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1 px-1">
            {isUser ? "You" : "Legal Assistant"}
          </span>

          {/* Adaptive Message Bubble */}
          <div
            className={`px-4 py-3 rounded-2xl shadow-sm border transition-all duration-300 ${isUser
              ? "bg-blue-600 border-blue-500 text-white rounded-tr-none shadow-blue-500/10"
              : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 rounded-tl-none"
              }`}
          >
            {/* Prose class handles typography scaling; prose-invert is triggered only in dark mode */}
            <div className={`prose prose-sm max-w-none leading-relaxed transition-colors legal-content
              ${isUser
                ? "prose-invert text-white"
                : "prose-zinc dark:prose-invert text-zinc-800 dark:text-zinc-200"}`}>
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
              >
                {message.text || ""}
              </ReactMarkdown>
            </div>
          </div>

          {/* Adaptive Sources Accordion */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-2 w-full">
              <button
                onClick={() => setShowSources((prev) => !prev)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-500/10 transition-colors"
              >
                {showSources ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span className="uppercase tracking-tighter">
                  {showSources ? "Hide References" : `View ${message.sources.length} Legal References`}
                </span>
              </button>

              {showSources && (
                <div className="mt-3 space-y-3 animate-in zoom-in-95 duration-200 origin-top">
                  <div className="pl-3 border-l-2 border-zinc-200 dark:border-zinc-800 space-y-3">
                    {message.sources.map((s, i) => (
                      <SourceCard key={i} source={s} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}