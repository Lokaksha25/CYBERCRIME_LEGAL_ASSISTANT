import { useState, useEffect } from "react";

export default function RagFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [particles, setParticles] = useState([]);

  const steps = [
    {
      title: "User Query",
      desc: "Natural language question",
      detail: "User asks about cybercrime precedents",
      icon: "💬",
      gradient: "from-cyan-400 via-blue-500 to-indigo-600",
      shadow: "shadow-blue-500/50"
    },
    {
      title: "Vector Search",
      desc: "Semantic embedding match",
      detail: "10,000+ case embeddings scanned in milliseconds",
      icon: "🧠",
      gradient: "from-indigo-500 via-purple-500 to-pink-500",
      shadow: "shadow-purple-500/50"
    },
    {
      title: "LLM Synthesis",
      desc: "Context-aware generation",
      detail: "GPT-4 generates answer from retrieved context only",
      icon: "⚡",
      gradient: "from-pink-500 via-rose-500 to-orange-500",
      shadow: "shadow-pink-500/50"
    },
    {
      title: "Verified Output",
      desc: "Citation or refusal",
      detail: "Every claim linked to source document",
      icon: "✅",
      gradient: "from-green-400 via-emerald-500 to-teal-600",
      shadow: "shadow-green-500/50"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Generate flowing particles
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: i * 0.15,
      duration: 3
    }));
    setParticles(newParticles);
  }, []);

  return (
    <div className="relative py-8">
      {/* Animated flowing line */}
      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-30 hidden md:block" />
      
      {/* Flowing particles */}
      <div className="absolute top-1/2 left-0 right-0 hidden md:block pointer-events-none">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute w-2 h-2 rounded-full bg-indigo-400 shadow-lg shadow-indigo-400/50"
            style={{
              left: '-20px',
              animation: `flowParticle ${p.duration}s ease-in-out ${p.delay}s infinite`,
              top: '-4px'
            }}
          />
        ))}
      </div>

      <div className="grid md:grid-cols-4 gap-8 relative z-10">
        {steps.map((step, i) => {
          const isActive = activeStep === i;
          
          return (
            <div 
              key={i}
              className="relative"
              onMouseEnter={() => setActiveStep(i)}
            >
              {/* Connecting arrow */}
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-4 z-20">
                  <svg width="32" height="32" viewBox="0 0 32 32" className="text-indigo-400">
                    <path
                      d="M4 16 L24 16 M20 12 L24 16 L20 20"
                      stroke="currentColor"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={isActive ? "animate-pulse" : "opacity-30"}
                    />
                  </svg>
                </div>
              )}

              {/* Card */}
              <div
                className={`
                  relative overflow-hidden rounded-3xl transition-all duration-500 cursor-pointer
                  ${isActive 
                    ? `bg-gradient-to-br ${step.gradient} p-[2px] scale-105 ${step.shadow} shadow-2xl` 
                    : 'bg-white/10 p-[1px] hover:scale-[1.02]'
                  }
                `}
              >
                <div className={`
                  relative bg-gray-900 rounded-3xl p-6 h-full transition-all duration-500
                  ${isActive ? 'bg-opacity-90' : 'bg-opacity-100'}
                `}>
                  {/* Step number */}
                  <div className={`
                    absolute -top-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center
                    font-black text-lg transition-all duration-500
                    ${isActive 
                      ? `bg-gradient-to-br ${step.gradient} text-white scale-110 shadow-xl` 
                      : 'bg-gray-800 text-gray-500'
                    }
                  `}>
                    {i + 1}
                  </div>

                  {/* Icon */}
                  <div className={`
                    text-6xl mb-4 transition-all duration-500
                    ${isActive ? 'scale-110 filter drop-shadow-2xl' : 'scale-100 opacity-70'}
                  `}>
                    {step.icon}
                  </div>

                  {/* Title */}
                  <h3 className={`
                    font-bold text-xl mb-2 transition-colors duration-500
                    ${isActive ? 'text-white' : 'text-gray-300'}
                  `}>
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm mb-3 leading-relaxed">
                    {step.desc}
                  </p>

                  {/* Expandable detail */}
                  <div className={`
                    overflow-hidden transition-all duration-500
                    ${isActive ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}
                  `}>
                    <div className={`
                      text-xs p-3 rounded-xl mt-2
                      bg-gradient-to-r ${step.gradient} bg-opacity-10
                      border border-white/10
                    `}>
                      <p className="text-gray-300">{step.detail}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${step.gradient}`}
                        style={{
                          animation: 'progress 3s ease-in-out'
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Timeline dots */}
      <div className="flex justify-center gap-3 mt-8">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveStep(i)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${activeStep === i 
                ? 'bg-indigo-500 scale-125 shadow-lg shadow-indigo-500/50' 
                : 'bg-gray-600 hover:bg-gray-500'
              }
            `}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes flowParticle {
          0% { left: -20px; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { left: calc(100% + 20px); opacity: 0; }
        }
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}