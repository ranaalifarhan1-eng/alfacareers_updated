'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Sparkles, 
  User, 
  Briefcase, 
  Target, 
  FileText, 
  LogOut, 
  CheckCircle2, 
  Search, 
  ArrowRight, 
  Zap, 
  Clock,
  ShieldCheck,
  Building2,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  role: string;
  full_name?: string;
  company_name?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
        const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Session expired');
        }

        const data = await response.json();
        setUser(data);
      } catch (err) {
        console.warn('Dashboard auth check error:', err);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
    }
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-blue-50/40 via-white to-slate-50 selection:bg-blue-600 selection:text-white">
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-blue-500/20 text-lg">
              AC
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">
                AlfaCareers
              </span>
              <span className="text-[10px] font-semibold tracking-wider text-blue-600 uppercase mt-0.5">
                Career Co-Pilot Dashboard
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-3.5 h-3.5 text-blue-600" />
              <span className="font-semibold text-slate-900">{user?.full_name || user?.email}</span>
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase font-bold rounded">
                {user?.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition flex items-center space-x-1.5 border border-red-200/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {/* Welcome Banner */}
        <div className="glass-card p-8 rounded-3xl mb-8 relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 text-white shadow-xl shadow-blue-600/15">
          <div className="relative z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold mb-3 border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Autonomous Career Co-Pilot Active</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Welcome back, {user?.full_name || user?.email.split('@')[0]}!
            </h1>
            <p className="text-blue-100 text-sm max-w-2xl leading-relaxed">
              Deep Web Hunter is continuously scanning corporate career pages for un-syndicated roles matching your profile.
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Matched Jobs</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">14</p>
            <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>90%+ Vector Match Score</span>
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications Sent</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">3</p>
            <p className="text-xs text-slate-500 mt-1">Dual-Track Auto Pilot</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan & Applies</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">5 / 5</p>
            <p className="text-xs font-emerald-600 font-semibold text-emerald-600 mt-1">Starter Free Tier Active</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ATS Resume Version</span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">v2.1</p>
            <p className="text-xs text-slate-500 mt-1">Custom PDF Compiler Ready</p>
          </div>
        </div>

        {/* Feed & Applications Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Recommended Hidden Opportunities
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Updated 10 mins ago via Deep Web Hunter
            </span>
          </div>

          {/* Job Item 1 */}
          <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                PK
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Senior Finance Manager</h3>
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
                  Discovered on `engro.com/careers` • Unlisted on standard job boards
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 block">Vector Match</span>
                <span className="text-xl font-black text-blue-600">96%</span>
              </div>
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition">
                Auto-Apply Now
              </button>
            </div>
          </div>

          {/* Job Item 2 */}
          <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                AE
              </div>
              <div>
                <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                  <h3 className="text-lg font-bold text-slate-900">Lead Operations Manager</h3>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Authentic Verified</span>
                  </span>
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 rounded-full">
                    Greenhouse Form Auto-Fill
                  </span>
                </div>
                <p className="text-sm font-medium text-slate-600 mt-1">
                  Careem Technologies • Dubai, UAE (Hybrid)
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Discovered on `careem.com/jobs` • Crawled 1 hour ago
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-500 block">Vector Match</span>
                <span className="text-xl font-black text-indigo-600">92%</span>
              </div>
              <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition">
                Auto-Apply Now
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500">
        <p>© 2026 AlfaCareers. All rights reserved. Registered under Master Blueprint v2.0.</p>
      </footer>
    </div>
  );
}
