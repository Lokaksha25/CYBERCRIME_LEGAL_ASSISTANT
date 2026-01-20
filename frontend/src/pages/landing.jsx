import { Link } from "react-router-dom";
import Background from "../components/Background";
import StatsCard from "../components/StatsCard";
import BoundaryDemo from "../components/BoundaryDemo";
import ComparisonTable from "../components/ComparisonTable";
import RagFlow from "../components/RagFlow";
import SourcePreview from "../components/SourcePreview";
import ExampleQueries from "../components/ExampleQueries";
import ScrollReveal from "../components/ScrollReveal";

export default function Landing() {
  return (
    <Background>
      {/* 1. HERO SECTION */}
      <section className="relative px-6 pt-32 pb-20 text-center overflow-hidden">
        {/* Subtle Live Status Indicator */}
        <ScrollReveal delay={50}>
          <div className="flex items-center gap-4 px-4 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-lg w-fit mx-auto mb-10">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
              Verified Legal Index Active: 10,242 nodes
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={200}>
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.1]">
              A Legal AI That <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-white to-indigo-400 bg-[length:200%_auto] animate-gradient">
                Knows Its Limits.
              </span>
            </h1>

            <p className="mt-8 max-w-2xl mx-auto text-lg md:text-xl text-gray-400 leading-relaxed">
              A domain-restricted engine that answers cybercrime queries strictly from
              <span className="text-gray-200 font-medium"> verified public case documents.</span>
              No hallucinations. No generic advice. Just citations.
            </p>

            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 flex-wrap">
              {/* Launch Chatbot */}
              <Link
                to="/chat"
                className="group relative w-full sm:w-auto px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/25 overflow-hidden"
              >
                <span className="relative z-10">Launch Chatbot</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500" />
              </Link>

              {/* RTI Form Drafter */}
              <Link
                to="/rti"
                className="group relative w-full sm:w-auto px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25 overflow-hidden"
              >
                <span className="relative z-10">📄 RTI Form Drafter</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500" />
              </Link>

              {/* Documentation → GitHub */}
              <a
                href="https://github.com/nandannb-is24/cybercrime-rag-system"
                target="_blank"
                rel="noopener noreferrer"
                className="
                w-full sm:w-auto px-10 py-4
                bg-white/5 hover:bg-white/10
                text-white font-semibold
                rounded-xl border border-white/10
                transition-all text-center
              "
              >
                Documentation
              </a>
            </div>
          </div>
        </ScrollReveal>
      </section>


      {/* 2. STATS GRID (Staggered Entry) */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ScrollReveal delay={100}><StatsCard title="Cybercrime Cases" value="900+" icon="⚖️" /></ScrollReveal>
          <ScrollReveal delay={200}><StatsCard title="Vector Embeddings" value="10K+" icon="🔢" /></ScrollReveal>
          <ScrollReveal delay={300}><StatsCard title="Response Time" value="< 2s" icon="⚡" /></ScrollReveal>
          <ScrollReveal delay={400}><StatsCard title="Policy" value="Strict" icon="🛡️" /></ScrollReveal>
        </div>
      </section>

      <Divider />

      {/* 3. JURISDICTION SECTION */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <ScrollReveal>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 italic">Guardrails by Design</h2>
            <p className="text-gray-400 max-w-xl mx-auto text-lg">
              Our AI is hard-coded to refuse queries outside of its specific legal jurisdiction to ensure reliability.
            </p>
          </div>
          <div className="bg-black/20 border border-white/5 rounded-3xl p-4 shadow-2xl backdrop-blur-md">
            <BoundaryDemo />
          </div>
        </ScrollReveal>
      </section>

      <Divider />

      {/* 4. RAG FLOW (Architecture Visualization) */}
      <section className="px-6 py-24 bg-indigo-600/5">
        <ScrollReveal>
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-16">
              The Verified Knowledge Loop
            </h2>

            <RagFlow />
          </div>
        </ScrollReveal>
      </section>

      <Divider />

      {/* 5. COMPARISON SECTION (Problem vs Solution) */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <ScrollReveal delay={100}>
            <div>
              <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Why Not a <br /><span className="text-indigo-400">Generic LLM?</span></h2>
              <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                Generic AI models are probabilistic—they guess the next word. In law, guessing leads to <strong>hallucinations</strong>. Our RAG architecture ensures every response is anchored in verifiable fact.
              </p>
              <div className="space-y-4">
                {['Zero Hallucination Policy', 'Source-Linked Citations', 'Domain-Restricted Focus'].map(check => (
                  <div key={check} className="flex items-center gap-3 text-indigo-300 font-medium">
                    <div className="h-6 w-6 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">✓</div>
                    {check}
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={300}>
            <div className="bg-indigo-500/[0.02] border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
              <ComparisonTable />
            </div>
          </ScrollReveal>
        </div>
      </section>

      <Divider />

      {/* 6. SOURCE PREVIEW (Trust/Social Proof) */}
      <ScrollReveal>
        <section className="px-6 py-24 max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4 italic opacity-80">"Trust, but verify."</h2>
          <p className="text-gray-500 mb-12 uppercase tracking-widest text-xs">Transparent Document Retrieval</p>
          <SourcePreview />
        </section>
      </ScrollReveal>

      <Divider />

      {/* 7. EXAMPLE QUERIES (Onboarding) */}
      <ScrollReveal>
        <section className="px-6 py-32 text-gray-200">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Ready to test the boundaries?</h2>
            <p className="text-gray-400">Click a sample query below to see how the system handles legal complexity.</p>
          </div>
          <ExampleQueries />
        </section>
      </ScrollReveal>

      {/* 8. FINAL CTA & FOOTER */}
      <footer className="border-t border-white/5 bg-black/40 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="text-3xl font-bold text-white mb-8">Secure your legal intelligence.</h2>
            <Link to="/chat" className="inline-block px-12 py-5 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-all mb-20">
              Get Started Now
            </Link>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12 text-left pt-12 border-t border-white/5">
            <div>
              <p className="text-white font-bold mb-4">System</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                A specialized RAG implementation for Cybercrime Case Law.
              </p>
            </div>
            <div>
              <p className="text-white font-bold mb-4">Compliance</p>
              <p className="text-sm text-gray-500 leading-relaxed">
                All data sourced from verified public legal repositories.
              </p>
            </div>
            <div className="md:text-right">
              <p className="text-gray-500 text-xs uppercase tracking-widest mb-4">Legal Disclaimer</p>
              <p className="text-[10px] text-gray-600 leading-relaxed">
                This system is for informational purposes. It does not constitute formal legal advice or an attorney-client relationship.
              </p>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs tracking-widest uppercase">
              &copy; 2026 Strict Intelligence &bull; Verified Law
            </p>
            <div className="flex gap-6 text-xs text-gray-500 uppercase tracking-widest">
              <a href="#" className="hover:text-white transition-colors">Privacy</a>
              <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </Background>
  );
}

function Divider() {
  return (
    <div className="h-px w-full max-w-6xl mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}