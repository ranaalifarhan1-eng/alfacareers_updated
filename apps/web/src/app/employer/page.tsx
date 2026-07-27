'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Briefcase, 
  Users, 
  TrendingUp, 
  PlusCircle, 
  CheckCircle2, 
  Sparkles, 
  Bot, 
  ArrowRight,
  FileText
} from 'lucide-react';

export default function EmployerDashboardPage() {
  const [stats, setStats] = useState({
    totalJobs: 12,
    totalApplicants: 148,
    aiShortlisted: 42,
    activeCandidates: 19
  });

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      {/* Welcome Hero Banner */}
      <div className="glass-card p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-600/20 text-orange-400 text-xs font-semibold mb-3 border border-orange-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Employer Co-Pilot</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight mb-2">
              Employer Control Center
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Manage your direct job posts, review AI vector-ranked candidates, and streamline your recruitment pipeline.
            </p>
          </div>

          <Link
            href="/employer/jobs/new"
            className="px-6 py-3.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 font-bold text-xs text-white rounded-xl shadow-lg shadow-orange-600/25 transition flex items-center justify-center space-x-2 shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Post New Job Opportunity</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Jobs Posted</span>
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.totalJobs}</p>
          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
            <TrendingUp className="w-3 h-3 text-emerald-600" />
            <span>3 Active this week</span>
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Applicants</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.totalApplicants}</p>
          <p className="text-xs text-blue-600 font-semibold mt-1">Direct & Syndicated Ingest</p>
        </div>

        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Shortlisted</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Bot className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.aiShortlisted}</p>
          <p className="text-xs text-purple-600 font-semibold mt-1">&gt; 90% Vector Similarity</p>
        </div>

        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Candidates</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{stats.activeCandidates}</p>
          <p className="text-xs text-emerald-600 font-semibold mt-1">In Interview Round</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-orange-600" />
            <span>Create Direct Job Post</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Publish open opportunities directly to candidate vector feeds and deep web search indexes.
          </p>
          <Link
            href="/employer/jobs/new"
            className="inline-flex items-center space-x-2 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            <span>Post a Job Position</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-orange-600" />
            <span>Company Branding</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Update corporate profile details, logo, website, and industry verification status.
          </p>
          <Link
            href="/employer/company"
            className="inline-flex items-center space-x-2 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            <span>Edit Company Profile</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="glass-card p-6 rounded-2xl bg-white border border-slate-200">
          <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
            <Users className="w-4 h-4 text-orange-600" />
            <span>Applicant Pipeline</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Review incoming candidate applications ranked by ChromaDB vector similarity scores.
          </p>
          <Link
            href="/employer/applicants"
            className="inline-flex items-center space-x-2 text-xs font-bold text-orange-600 hover:text-orange-700"
          >
            <span>Review Applicants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
