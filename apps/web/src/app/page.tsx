import React from 'react';
import { Search, Sparkles, ShieldCheck, Cpu, ArrowRight, Zap, Target, Bot } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-brand-500 selection:text-white">
      {/* Header */}
      <header className="border-b border-dark-border bg-dark-bg/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-blue-400 flex items-center justify-center font-bold text-white shadow-lg shadow-brand-500/20">
              AC
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              AlfaCareers
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <a href="#features" className="text-sm text-slate-400 hover:text-white transition">Features</a>
            <a href="#ecosystem" className="text-sm text-slate-400 hover:text-white transition">Portals</a>
            <button className="px-4 py-2 text-sm font-medium text-white bg-brand-600 hover:bg-brand-500 rounded-lg shadow-md shadow-brand-500/20 transition">
              Launch Platform
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-20 pb-16 px-6 max-w-7xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-500 text-xs font-semibold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Deep Web Hunter v2.0 Live</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-6">
            Find Jobs <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-brand-500 to-purple-400">Before</span> They Hit Job Boards
          </h1>
          
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            The AI-powered hidden job market engine. Crawling corporate career pages, compiling customized ATS resumes, and matching you with transparent vector accuracy scores.
          </p>

          {/* Quick Search Bar Concept */}
          <div className="max-w-2xl mx-auto glass-panel p-2 rounded-2xl flex items-center space-x-2 shadow-2xl mb-12">
            <div className="pl-3 text-slate-500">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="e.g. Finance Manager in Dubai or Senior Dev in Lahore"
              className="bg-transparent flex-1 px-3 py-2 text-slate-100 placeholder-slate-500 focus:outline-none text-sm"
              readOnly
            />
            <button className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 font-semibold text-sm text-white rounded-xl shadow-lg transition flex items-center space-x-2">
              <span>Hunt Hidden Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left mt-16">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Deep Web Hunter</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Direct crawling of corporate career pages & compliant search APIs targeting un-syndicated roles.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Vector Similarity Match</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Local Llama 3.1 & ChromaDB embeddings calculate a transparent Match Score % for your exact experience.
              </p>
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
                <Bot className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold mb-2">Dual-Track Auto Pilot</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Automated ATS form submissions and direct HR email outreach with tailored single-page PDF resumes.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-dark-border bg-dark-bg/60 py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 AlfaCareers. All rights reserved. Operating under Master Blueprint v2.0.</p>
      </footer>
    </div>
  );
}
