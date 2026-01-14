import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Sun,
  Moon,
  Gavel,
  Send,
  Loader2,
  Plus,
  MessageSquare,
  ShieldCheck,
  Menu,
  ChevronRight,
  Trash2,
  Eraser,
  Home
} from "lucide-react";
import { api } from "../api/Client";
import Message from "../components/Message";



export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // REAL-TIME PERSISTENT HISTORY
  const [chatHistory, setChatHistory] = useState(() => {
    const saved = localStorage.getItem("legal_ai_history");
    return saved ? JSON.parse(saved) : [];
  });

  const bottomRef = useRef(null);

  const exampleQuestions = [
    { label: "Phishing & OTP", text: "I received a phishing SMS asking for my OTP", tint: "hover:border-blue-500/50" },
    { label: "Social Media Hack", text: "Someone hacked my Instagram account", tint: "hover:border-purple-500/50" },
    { label: "Financial Fraud", text: "I lost money due to UPI fraud", tint: "hover:border-emerald-500/50" },
    { label: "Identity Theft", text: "A fake profile is using my photos online", tint: "hover:border-orange-500/50" },
  ];

  // Sync Theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  // Sync History to Local Storage
  useEffect(() => {
    localStorage.setItem("legal_ai_history", JSON.stringify(chatHistory));
  }, [chatHistory]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([]);
    setInput("");
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to delete all chat history? This cannot be undone.")) {
      setChatHistory([]);
      handleNewChat();
      localStorage.removeItem("legal_ai_history");
    }
  };

  const loadChatFromHistory = (historyItem) => {
    setMessages(historyItem.messages);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const deleteHistoryItem = (e, id) => {
    e.stopPropagation();
    const updated = chatHistory.filter(item => item.id !== id);
    setChatHistory(updated);
    // If the currently viewed chat is the one being deleted, clear the screen
    handleNewChat();
  };

  const sendMessage = async (overrideInput) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: "user", text: textToSend };
    const newMessages = [...messages, userMsg];
    
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await api.post("/ask", {
        question: userMsg.text,
        top_k: 5,
      });

      const botMsg = {
        role: "bot",
        text: res.data?.answer || "No response received.",
        sources: res.data?.sources || [],
      };

      const finalMessages = [...newMessages, botMsg];
      setMessages(finalMessages);

      // HISTORY LOGIC
      setChatHistory(prev => {
        // If this is a brand new session, create a new entry
        if (messages.length === 0) {
          return [{
            id: Date.now(),
            title: textToSend.substring(0, 35) + "...",
            messages: finalMessages,
            date: new Date().toLocaleDateString()
          }, ...prev];
        } 
        // Update the current active session in history
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], messages: finalMessages };
        }
        return updated;
      });

    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "⚠️ Error processing request. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-slate-100 transition-colors duration-500">
      
      {/* SIDEBAR */}
      <aside className={`
        ${isSidebarOpen ? "w-72" : "w-0"} 
        fixed lg:relative z-40 h-full transition-all duration-300 ease-in-out overflow-hidden
        border-r border-slate-200 dark:border-slate-800/60 
        bg-white dark:bg-[#0f172a] flex flex-col shadow-xl
      `}>
        <div className="p-4 space-y-2">
          <button 
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all duration-200 shadow-lg shadow-indigo-500/20 bg-indigo-600 text-white hover:bg-indigo-500 dark:bg-indigo-600/90 dark:hover:bg-indigo-500 active:scale-95"
          >
            <Plus size={18} />
            <span>New Consultation</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 space-y-1 custom-scrollbar">
          <div className="flex items-center justify-between px-3 py-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
              Recent Inquiries
            </span>
            {chatHistory.length > 0 && (
              <button 
                onClick={clearAllHistory}
                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                title="Clear all history"
              >
                <Eraser size={14} />
              </button>
            )}
          </div>
          
          {chatHistory.length === 0 ? (
            <div className="px-4 py-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl mx-2">
              <p className="text-xs text-slate-400 italic font-medium leading-relaxed">Your consultation history will appear here</p>
            </div>
          ) : (
            chatHistory.map((item) => (
              <div 
                key={item.id}
                onClick={() => loadChatFromHistory(item)}
                className="group w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 transition relative overflow-hidden active:bg-slate-200 dark:active:bg-slate-800"
              >
                <div className="flex items-center gap-3 truncate">
                  <MessageSquare size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  <span className="truncate text-slate-600 dark:text-slate-300 font-medium">{item.title}</span>
                </div>
                <button 
                  onClick={(e) => deleteHistoryItem(e, item.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-md transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/20">
           <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
              JD
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Guest User</p>
              <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider">Pro Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative min-w-0">
        
        {/* TOP NAV */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-800/60 flex items-center justify-between px-6 bg-white/70 dark:bg-[#020617]/70 backdrop-blur-xl sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
              <Menu size={20} className="text-slate-500" />
            </button>
            
            {/* LOGO / BACK TO LANDING */}
            <Link
                to="/"
                className="flex items-center gap-2 group active:scale-95 transition-transform"
                title="Return to Home"
              >
                <div className="p-1.5 bg-indigo-600 rounded-lg shadow-md group-hover:bg-indigo-500 transition-colors">
                  <Gavel size={18} className="text-white" />
                </div>
                <h1 className="font-bold tracking-tight text-slate-800 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  LegalCore AI
                </h1>
              </Link>

          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all hover:ring-4 ring-indigo-500/10"
          >
            {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} className="text-slate-600" />}
          </button>
        </header>

        {/* CHAT AREA */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-12">
            {messages.length === 0 && !loading ? (
              <div className="mt-8 space-y-12">
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <h2 className="text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Where should we <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-400">start today?</span>
                  </h2>
                  <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl font-medium">
                    Briefly describe your situation to receive specialized legal guidance and action steps.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  {exampleQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q.text)}
                      className={`group text-left p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${q.tint}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <p className="text-sm font-bold text-indigo-500 tracking-wide uppercase">{q.label}</p>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{q.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in duration-500">
                {messages.map((m, i) => <Message key={i} message={m} />)}
                {loading && (
                  <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 w-fit animate-pulse">
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">Consulting Legal Database...</span>
                  </div>
                )}
              </div>
            )}
            <div ref={bottomRef} className="h-24" />
          </div>
        </div>

        {/* INPUT AREA */}
        <div className="p-8 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-[#020617] dark:via-[#020617] dark:to-transparent">
          <div className="max-w-4xl mx-auto">
            <div className="relative group flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl focus-within:ring-2 ring-indigo-500/20 transition-all p-2">
              <input
                className="flex-1 bg-transparent outline-none px-4 py-3 text-base placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="Describe your situation (e.g., 'I lost money to a UPI scam')..."
                value={input}
                disabled={loading}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                className="p-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-lg shadow-indigo-500/30 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
            <p className="mt-4 text-[11px] text-center text-slate-400 font-medium tracking-wide uppercase">
              Secure Consultation • Data Encrypted • AI Assistant
            </p>
          </div>
        </div>
      </main>

      {/* CUSTOM SCROLLBAR CSS */}
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? '#1e293b' : '#cbd5e1'};
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366f1; }
      `}</style>
    </div>
  );
}