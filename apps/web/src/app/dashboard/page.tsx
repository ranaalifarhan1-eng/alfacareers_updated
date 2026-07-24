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
  LayoutDashboard,
  Download,
  AlertCircle,
  RefreshCw,
  Send,
  MapPin
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  role: string;
  full_name?: string;
  company_name?: string;
}

interface JobPost {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type?: string;
  salary_range?: string;
  description: string;
  apply_url?: string;
  apply_email?: string;
  authenticity_score: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [jobs, setJobs] = useState<JobPost[]>([]);
  const [applicationsCount, setApplicationsCount] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [hunting, setHunting] = useState(false);
  const [applyingJobId, setApplyingJobId] = useState<number | null>(null);

  // Intuitive 3-Column Search Inputs
  const [keyword, setKeyword] = useState('Finance Manager');
  const [location, setLocation] = useState('Lahore');
  const [company, setCompany] = useState('');
  
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initDashboard = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      if (!token) {
        router.push('/login');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      // 1. Fetch User Data
      try {
        const userResp = await fetch(`${backendUrl}/api/v1/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });
        if (userResp.ok) {
          const userData = await userResp.json();
          setUser(userData);
        } else {
          router.push('/login');
          return;
        }
      } catch (err) {
        router.push('/login');
        return;
      }

      // 2. Fetch Live Jobs Feed
      try {
        const jobsResp = await fetch(`${backendUrl}/api/v1/jobs`);
        if (jobsResp.ok) {
          const jobsData = await jobsResp.json();
          setJobs(jobsData);
        }
      } catch (err) {
        console.warn('Live jobs fetch warning:', err);
      }

      // 3. Fetch Candidate Applications Count
      try {
        const appsResp = await fetch(`${backendUrl}/api/v1/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (appsResp.ok) {
          const appsData = await appsResp.json();
          setApplicationsCount(appsData.length);
        }
      } catch (err) {
        console.warn('Applications count fetch warning:', err);
      }

      setLoading(false);
    };

    initDashboard();
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
    }
    router.push('/login');
  };

  // Trigger Deep Web Hunt live
  const handleTriggerHunt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setHunting(true);

    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/jobs/hunt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword,
          location: location || null,
          company: company || null
        })
      });

      if (!resp.ok) {
        throw new Error('Failed to trigger Deep Web Hunt.');
      }

      const newJobs = await resp.json();
      setMessage(`Deep Web Hunter discovered & indexed ${newJobs.length} new hidden job opportunities!`);
      
      // Refresh jobs list
      const jobsResp = await fetch(`${backendUrl}/api/v1/jobs`);
      if (jobsResp.ok) {
        const jobsData = await jobsResp.json();
        setJobs(jobsData);
      }
    } catch (err: any) {
      setError(err.message || 'Error triggering hunt.');
    } finally {
      setHunting(false);
    }
  };

  // Auto-Apply to job
  const handleAutoApply = async (jobId: number) => {
    setError(null);
    setMessage(null);
    setApplyingJobId(jobId);

    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/applications/apply`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ job_id: jobId, track_type: 'email' })
      });

      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.detail || 'Failed to submit application.');
      }

      setMessage(`Application successfully submitted! Application email dispatched to HR.`);
      setApplicationsCount(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to apply.');
    } finally {
      setApplyingJobId(null);
    }
  };

  // Download Tailored ATS Resume PDF
  const handleDownloadATSResume = async (jobId: number, companyName: string) => {
    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/jobs/${jobId}/compile-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!resp.ok) {
        throw new Error('Failed to generate ATS PDF.');
      }

      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ATS_Resume_Tailored_${companyName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err: any) {
      setError(err.message || 'Failed to download ATS resume.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Live Co-Pilot Dashboard...</span>
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

        {/* Intuitive 3-Column Light Corporate Search Container */}
        <div className="glass-card p-6 rounded-3xl mb-8 border border-slate-200/80 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                <Search className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-none">
                  Deep Web Hunter Engine
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Discover un-syndicated roles directly from official corporate career portals
                </p>
              </div>
            </div>
            <span className="hidden md:inline-flex px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200">
              v2.0 Active
            </span>
          </div>

          <form onSubmit={handleTriggerHunt} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Input 1: Job Title or Skill */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                required
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job Title or Skill (e.g. Finance Manager)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Input 2: City or Country */}
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City or Country (e.g. Lahore, Dubai)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Input 3: Target Company (Optional) */}
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (e.g. Engro, or leave blank)"
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>

            {/* Action Button */}
            <button
              type="submit"
              disabled={hunting}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs font-semibold text-white rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${hunting ? 'animate-spin' : ''}`} />
              <span>{hunting ? 'Hunting Hidden Roles...' : 'Hunt Hidden Jobs'}</span>
            </button>
          </form>
        </div>

        {/* Notifications */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Discovered Hidden Roles</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{jobs.length}</p>
            <p className="text-xs text-blue-600 font-semibold mt-1 flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>Un-syndicated Ingest</span>
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Applications Sent</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <Briefcase className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-slate-900">{applicationsCount}</p>
            <p className="text-xs text-slate-500 mt-1">Auto-Pilot HR Dispatch</p>
          </div>

          <div className="glass-card p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Plan & Balance</span>
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
            <p className="text-xs text-slate-500 mt-1">Tailored PDF Compiler Ready</p>
          </div>
        </div>

        {/* Live Jobs Feed Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div className="flex items-center space-x-3">
              <LayoutDashboard className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Recommended Hidden Opportunities ({jobs.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Fetched via Deep Web Hunter & ChromaDB
            </span>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <p className="text-slate-500 text-sm">No hidden jobs discovered yet.</p>
              <p className="text-xs text-slate-400 mt-1">Use the Deep Web Hunter bar above to hunt corporate career pages.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="glass-card p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                    {job.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                      <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Auth Score: {job.authenticity_score}%</span>
                      </span>
                      {job.apply_email && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                          HR Email: {job.apply_email}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      {job.company_name} • {job.location} ({job.job_type || 'Full-time'})
                    </p>
                    <p className="text-xs text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 shrink-0">
                  <button
                    onClick={() => handleDownloadATSResume(job.id, job.company_name)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 border border-slate-200"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    <span>ATS Resume PDF</span>
                  </button>

                  <button
                    onClick={() => handleAutoApply(job.id)}
                    disabled={applyingJobId === job.id}
                    className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${applyingJobId === job.id ? 'animate-spin' : ''}`} />
                    <span>{applyingJobId === job.id ? 'Applying...' : 'Auto-Apply Now'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-6 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 AlfaCareers. All rights reserved. Powered by Deep Web Hunter v2.0.</p>
      </footer>
    </div>
  );
}
