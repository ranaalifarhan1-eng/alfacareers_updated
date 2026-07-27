'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, PlusCircle, Users, CheckCircle2, Clock, Sparkles, Building2, MapPin } from 'lucide-react';

interface EmployerJob {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_range?: string;
  status: string;
  authenticity_score: number;
  applicant_count: number;
  created_at: string;
}

export default function EmployerJobsPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<EmployerJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchJobs = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/employer/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setJobs(data);
        }
      } catch (err) {
        console.warn('Fetch employer jobs notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJobs();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-orange-600 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Active Jobs Directory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl w-full mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold mb-2 border border-orange-200">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Active Job Postings Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Published Job Opportunities ({jobs.length})
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your company's active openings indexed in candidate vector matching feeds
          </p>
        </div>

        <Link
          href="/employer/jobs/new"
          className="px-5 py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 font-bold text-xs text-white rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Opportunity</span>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-semibold">No direct job postings created yet.</p>
          <p className="text-xs text-slate-400 mt-1">Click Post New Opportunity above to create your first vector-indexed job.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="glass-card p-6 rounded-2xl bg-white border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-orange-600 text-white font-black flex items-center justify-center text-lg shrink-0 shadow-md">
                  {job.company_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-lg font-bold text-slate-900">{job.title}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{job.status.toUpperCase()}</span>
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-orange-50 text-orange-700 border border-orange-200 rounded-full">
                      Vector Indexed
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-1">
                    {job.company_name} • {job.location} ({job.job_type}) • <span className="text-emerald-700 font-bold">{job.salary_range}</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Posted on: {job.created_at}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4 justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-500 block">Total Applicants</span>
                  <span className="text-xl font-black text-orange-600">{job.applicant_count}</span>
                </div>
                <Link
                  href="/employer/applicants"
                  className="px-4 py-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-xs rounded-xl border border-orange-200 transition flex items-center space-x-1.5"
                >
                  <Users className="w-3.5 h-3.5 text-orange-600" />
                  <span>View Pipeline</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
