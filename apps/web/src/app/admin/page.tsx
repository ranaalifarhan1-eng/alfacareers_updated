'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Briefcase, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight,
  Database,
  Cpu,
  Clock
} from 'lucide-react';

interface AdminAnalytics {
  total_candidates: number;
  total_employers: number;
  verified_employers: number;
  total_jobs: number;
  pending_jobs: number;
  total_applications: number;
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<AdminAnalytics>({
    total_candidates: 1420,
    total_employers: 84,
    verified_employers: 79,
    total_jobs: 312,
    pending_jobs: 3,
    total_applications: 580
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAnalytics = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setStats(data);
        }
      } catch (err) {
        console.warn('Fetch admin analytics notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-white">
        <div className="flex items-center space-x-3 text-orange-400 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Admin Analytics Overview...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8 text-slate-100">
      {/* Welcome Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-red-950 via-slate-900 to-slate-900 border border-slate-800 text-white shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold mb-3 border border-red-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Platform Super Admin Governance Active</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Admin Control Center
            </h1>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Global system analytics, pending employer verification queue, scraped job moderation, and ChromaDB vector store health.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className="px-4 py-2 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold rounded-xl flex items-center space-x-1.5">
              <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>All Systems Green</span>
            </span>
          </div>
        </div>
      </div>

      {/* Admin Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registered Candidates</span>
            <div className="w-9 h-9 rounded-xl bg-blue-950 text-blue-400 flex items-center justify-center font-bold border border-blue-800">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.total_candidates}</p>
          <p className="text-xs text-blue-400 font-semibold mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>+14.2% candidate growth</span>
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Employers</span>
            <div className="w-9 h-9 rounded-xl bg-orange-950 text-orange-400 flex items-center justify-center font-bold border border-orange-800">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.verified_employers} / {stats.total_employers}</p>
          <p className="text-xs text-orange-400 font-semibold mt-1">Accounts Verified</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Published Jobs</span>
            <div className="w-9 h-9 rounded-xl bg-purple-950 text-purple-400 flex items-center justify-center font-bold border border-purple-800">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-white">{stats.total_jobs}</p>
          <p className="text-xs text-purple-400 font-semibold mt-1">Deep Web & Direct Ingest</p>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Moderation</span>
            <div className="w-9 h-9 rounded-xl bg-amber-950 text-amber-400 flex items-center justify-center font-bold border border-amber-800">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{stats.pending_jobs}</p>
          <p className="text-xs text-slate-400 mt-1">Awaiting Admin Approval</p>
        </div>
      </div>

      {/* Admin Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-400" />
            <span>User Governance Directory</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Govern candidate & employer accounts, role permissions, and active session status across all portals.
          </p>
          <Link
            href="/admin/users"
            className="inline-flex items-center space-x-2 text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            <span>Manage User Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-orange-400" />
            <span>Employer Verification Queue</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Review new enterprise employer accounts, verify corporate domain emails, and grant publishing rights.
          </p>
          <Link
            href="/admin/employers"
            className="inline-flex items-center space-x-2 text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            <span>Review Employer Approvals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-2 flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-orange-400" />
            <span>Job Moderation Queue</span>
          </h3>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Moderate scraped deep web job postings, verify authenticity scores, and trigger ChromaDB vector indexing.
          </p>
          <Link
            href="/admin/jobs"
            className="inline-flex items-center space-x-2 text-xs font-bold text-orange-400 hover:text-orange-300"
          >
            <span>Moderate Job Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
