'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, CheckCircle2, XCircle, Clock, Sparkles, AlertCircle, Bot } from 'lucide-react';

interface AdminJob {
  id: number;
  title: string;
  company_name: string;
  location: string;
  job_type: string;
  salary_range?: string;
  description: string;
  status: string;  // published, pending_approval, rejected
  authenticity_score: number;
  created_at: string;
}

export default function AdminJobModerationPage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<AdminJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadJobs = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/admin/jobs`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setJobs(data);
        }
      } catch (err) {
        console.warn('Fetch admin jobs notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleModerate = async (jobId: number, newStatus: string) => {
    setUpdatingId(jobId);
    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/admin/jobs/${jobId}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (resp.ok) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
        );
      }
    } catch (err) {
      console.warn('Moderate job notice:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-white">
        <div className="flex items-center space-x-3 text-orange-400 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Job Moderation Queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl w-full mx-auto space-y-8 text-slate-100">
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-950 text-purple-400 text-xs font-semibold mb-2 border border-purple-800">
          <Briefcase className="w-3.5 h-3.5" />
          <span>Moderation & Vector Index Control</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Job Moderation Queue ({jobs.length})
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Review scraped deep web jobs, verify authenticity scores, and trigger ChromaDB vector indexing
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="p-12 text-center bg-slate-900 rounded-2xl border border-slate-800">
          <Briefcase className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-slate-300 text-xs font-semibold">No job posts currently in moderation queue.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-lg font-bold text-white">{job.title}</h3>

                    {job.status === 'published' && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Published & Vectorized</span>
                      </span>
                    )}

                    {job.status === 'pending_approval' && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-950 text-amber-400 border border-amber-800 rounded-full flex items-center space-x-1">
                        <Clock className="w-3 h-3 animate-pulse" />
                        <span>Pending Moderation</span>
                      </span>
                    )}

                    {job.status === 'rejected' && (
                      <span className="px-2.5 py-0.5 text-xs font-bold bg-red-950 text-red-400 border border-red-800 rounded-full flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>Rejected Listing</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 mt-1 font-semibold">
                    {job.company_name} • {job.location} • <strong className="text-emerald-400">{job.salary_range}</strong>
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={updatingId === job.id}
                    onClick={() => handleModerate(job.id, 'published')}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 font-bold text-xs text-white rounded-xl shadow-md transition flex items-center space-x-1.5"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Approve & Vector-Index</span>
                  </button>

                  <button
                    disabled={updatingId === job.id}
                    onClick={() => handleModerate(job.id, 'rejected')}
                    className="px-3 py-2 bg-slate-800 hover:bg-red-950 text-red-400 border border-slate-700 hover:border-red-800 font-bold text-xs rounded-xl transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
                {job.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
