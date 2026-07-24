import React from 'react';
import { 
  Search, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  ArrowRight, 
  Zap, 
  Target, 
  Bot, 
  Building2, 
  CheckCircle2, 
  Briefcase, 
  FileCheck, 
  MapPin, 
  TrendingUp,
  UserCheck,
  Lock
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col justify-between bg-gradient-to-b from-blue-50/40 via-white to-slate-50 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-blue-500/20 text-lg">
              AC
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                AlfaCareers
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase mt-0.5">
                The Hidden Job Engine
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8">
            <a href="#deep-web-hunter" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Deep Web Hunter
            </a>
            <a href="#ecosystem" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              3-Portal Ecosystem
            </a>
            <a href="#ai-engine" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              AI Engines
            </a>
            <a href="#live-feed" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition">
              Live Job Feed
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-slate-100/80 rounded-lg transition">
              Sign In
            </button>
            <button className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-lg shadow-md shadow-blue-500/20 transition transform hover:-translate-y-0.5">
              Get Started Free
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
          {/* High Trust Pill */}
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full border border-blue-200/90 bg-blue-50 text-blue-700 text-xs font-semibold tracking-wide mb-6 shadow-sm">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Deep Web Hunter v2.0 Live & Ingesting</span>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15] mb-6">
            Find High-Impact Jobs <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800">
              Before They Hit Job Boards
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Surface un-syndicated roles directly from corporate career pages. Auto-match with vector precision and apply with customized ATS resumes.
          </p>

          {/* Premium Light Search Container */}
          <div className="max-w-3xl mx-auto glass-search p-3 rounded-2xl flex flex-col md:flex-row items-center gap-3 mb-12">
            <div className="flex-1 flex items-center space-x-3 px-3 py-1 w-full border-b md:border-b-0 md:border-r border-slate-200">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Job title or skill (e.g. Finance Manager, Lead Engineer)"
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
                readOnly
              />
            </div>

            <div className="flex items-center space-x-3 px-3 py-1 w-full md:w-56 border-b md:border-b-0 md:border-r border-slate-200">
              <MapPin className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Location (Lahore, Dubai)"
                className="w-full bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none text-sm font-medium"
                readOnly
              />
            </div>

            <button className="w-full md:w-auto px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm text-white rounded-xl shadow-lg shadow-blue-600/25 transition flex items-center justify-center space-x-2 shrink-0">
              <span>Hunt Hidden Jobs</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Metrics Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4 border-t border-slate-200/60">
            <div className="p-3 text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-slate-900">12,400+</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Hidden Corporate Roles</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-blue-600">94.8%</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Vector Match Accuracy</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-indigo-600">&lt; 24h</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Discovery Speed</p>
            </div>
            <div className="p-3 text-center">
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-600">100%</p>
              <p className="text-xs font-medium text-slate-500 mt-0.5">Compliant API Ingest</p>
            </div>
          </div>
        </section>

        {/* Deep Web Hunter Section */}
        <section id="deep-web-hunter" className="py-16 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              The Hidden Job Market Moat — "Deep Web Hunter"
            </h2>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm">
              Over 60% of mid-to-senior roles are posted directly on corporate career pages without syndication to LinkedIn or Indeed.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 font-bold shadow-inner">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. Compliant Querying</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Uses official search APIs (SerpAPI / Bing) to scan corporate domains safely without raw scraping or TOS risk.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6 font-bold shadow-inner">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. Ollama Llama 3.1 LLM</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Converts unstructured career page HTML into clean structured JSON: title, requirements, salary, and direct HR contacts.
              </p>
            </div>

            <div className="glass-card p-8 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 font-bold shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. Verification Pipeline</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Automated authenticity scoring flags scam postings before jobs hit candidate feeds or super admin review queues.
              </p>
            </div>
          </div>
        </section>

        {/* Live Scraped Job Feed Demonstration */}
        <section id="live-feed" className="py-16 px-6 max-w-7xl mx-auto bg-slate-100/60 rounded-3xl border border-slate-200/80 my-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
            <div>
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                <Briefcase className="w-4 h-4" />
                <span>Live Demonstration</span>
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                Recently Discovered Hidden Opportunities
              </h2>
            </div>
            <p className="text-slate-500 text-sm mt-2 md:mt-0">
              Fetched via Deep Web Hunter • Verified 10 mins ago
            </p>
          </div>

          <div className="space-y-4">
            {/* Job Card 1 */}
            <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                  PK
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Finance Manager</h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authentic Verified</span>
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                      Direct HR Email Found
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    Engro Corporation • Lahore, Pakistan (On-site)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Discovered on `engro.com/careers` • Not listed on LinkedIn
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Match Score</span>
                  <span className="text-xl font-black text-blue-600">96%</span>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition">
                  Auto-Apply Now
                </button>
              </div>
            </div>

            {/* Job Card 2 */}
            <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                  AE
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-lg font-bold text-slate-900">Senior Operations Lead</h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Authentic Verified</span>
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                      Greenhouse ATS Form
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-600 mt-1">
                    Careem Technologies • Dubai, UAE (Hybrid)
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Discovered on `careem.com/jobs` • Priority Ingest
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Match Score</span>
                  <span className="text-xl font-black text-indigo-600">91%</span>
                </div>
                <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition">
                  Auto-Apply Now
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 3-Portal Ecosystem Section */}
        <section id="ecosystem" className="py-16 px-6 max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Integrated 3-Portal Architecture
            </h2>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto text-sm">
              Purpose-built experiences for Candidates, Employers, and Platform Super Admins.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 rounded-2xl text-left border-t-4 border-t-blue-600">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4 font-bold">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Candidate Co-Pilot</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Master CV auto-parsing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Custom ATS PDF compiler</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>WhatsApp Interview Coach</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-8 rounded-2xl text-left border-t-4 border-t-indigo-600">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Employer Portal</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Direct job posting & boosting</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>AI vector-ranked candidates</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Recruiter ATS resume viewer</span>
                </li>
              </ul>
            </div>

            <div className="glass-card p-8 rounded-2xl text-left border-t-4 border-t-slate-800">
              <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center mb-4 font-bold">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Super Admin Console</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>Scraped job review queue</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>Ingest runs & diagnostics</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-slate-800 shrink-0" />
                  <span>Revenue & user governance</span>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Corporate Light Footer */}
      <footer className="border-t border-slate-200 bg-white py-10 px-6 mt-16 text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              AC
            </div>
            <span className="text-slate-900 font-bold text-sm">AlfaCareers</span>
            <span className="text-slate-400">|</span>
            <span>The Hidden Job Market Engine v2.0</span>
          </div>

          <div className="flex space-x-6 text-slate-500">
            <a href="#deep-web-hunter" className="hover:text-blue-600 transition">Deep Web Hunter</a>
            <a href="#ecosystem" className="hover:text-blue-600 transition">Ecosystem</a>
            <a href="#live-feed" className="hover:text-blue-600 transition">Live Feed</a>
            <a href="/docs" target="_blank" className="hover:text-blue-600 transition">API Docs</a>
          </div>

          <p className="text-slate-400">
            © 2026 AlfaCareers. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
