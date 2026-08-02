'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Sparkles, 
  AlertCircle, 
  Bot, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  Building2,
  MapPin,
  Check
} from 'lucide-react';

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

interface PaginatedJobsResponse {
  total_items: number;
  total_pages: number;
  current_page: number;
  limit: number;
  items: AdminJob[];
}

export default function AdminJobModerationPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'pending_approval' | 'published' | 'all'>('pending_approval');
  const [currentPage, setCurrentPage] = useState(1);
  const [paginatedData, setPaginatedData] = useState<PaginatedJobsResponse>({
    total_items: 0,
    total_pages: 1,
    current_page: 1,
    limit: 10,
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchJobs = async (statusTab: string, pageNum: number) => {
    setLoading(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/admin/jobs?status=${statusTab}&page=${pageNum}&limit=6`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setPaginatedData(data);
      }
    } catch (err) {
      console.warn('Fetch admin jobs notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs(activeTab, currentPage);
  }, [activeTab, currentPage, router]);

  const handleTabChange = (tab: 'pending_approval' | 'published' | 'all') => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

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
        fetchJobs(activeTab, currentPage);
      }
    } catch (err) {
      console.warn('Moderate job notice:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-8 max-w-6xl w-full mx-auto space-y-8 bg-[#F8FAFC] min-h-screen text-slate-900">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold mb-2 border border-orange-200">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Enterprise Moderation & Vector Control</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Job Moderation Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review submitted & scraped openings, verify authenticity scores, and trigger ChromaDB vector indexing
          </p>
        </div>
      </div>

      {/* Top Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => handleTabChange('pending_approval')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
            activeTab === 'pending_approval'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Approval</span>
        </button>

        <button
          onClick={() => handleTabChange('published')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
            activeTab === 'published'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Published Jobs</span>
        </button>

        <button
          onClick={() => handleTabChange('all')}
          className={`px-4 py-2 rounded-xl text-xs font-extrabold transition flex items-center space-x-2 ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>All Listings</span>
        </button>
      </div>

      {/* Jobs Queue */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-6 h-6 border-2 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs font-semibold text-slate-500">Loading Job Moderation Queue...</p>
        </div>
      ) : paginatedData.items.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 text-sm font-bold">No jobs found in this queue tab.</p>
          <p className="text-xs text-slate-400 mt-1">Switch filter tabs above to view other job listings.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedData.items.map((job) => (
            <div key={job.id} className="p-6 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start space-x-4">
                  <div className="w-11 h-11 rounded-xl bg-orange-50 text-orange-700 border border-orange-200 font-extrabold flex items-center justify-center text-sm shrink-0">
                    {job.company_name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                      <h3 className="text-base font-extrabold text-slate-900">{job.title}</h3>

                      {job.status === 'published' && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Published & Vectorized</span>
                        </span>
                      )}

                      {job.status === 'pending_approval' && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-full flex items-center space-x-1">
                          <Clock className="w-3 h-3 animate-pulse" />
                          <span>Pending Moderation</span>
                        </span>
                      )}

                      {job.status === 'rejected' && (
                        <span className="px-2.5 py-0.5 text-xs font-bold bg-red-50 text-red-700 border border-red-200 rounded-full flex items-center space-x-1">
                          <XCircle className="w-3 h-3" />
                          <span>Rejected</span>
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 mt-1 font-semibold">
                      {job.company_name} • {job.location} • <strong className="text-emerald-700 font-bold">{job.salary_range}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    disabled={updatingId === job.id}
                    onClick={() => handleModerate(job.id, 'published')}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 font-bold text-xs text-white rounded-xl shadow-md transition flex items-center space-x-1.5"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    <span>Approve & Vector-Index</span>
                  </button>

                  <button
                    disabled={updatingId === job.id}
                    onClick={() => handleModerate(job.id, 'rejected')}
                    className="px-3 py-2 bg-slate-100 hover:bg-red-50 text-red-600 border border-slate-200 hover:border-red-200 font-bold text-xs rounded-xl transition"
                  >
                    Reject
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                {job.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {paginatedData.total_pages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Showing <strong className="text-slate-900">{paginatedData.items.length}</strong> of <strong className="text-slate-900">{paginatedData.total_items}</strong> total jobs
          </p>

          <div className="flex items-center space-x-2">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-slate-800 px-3">
              Page {paginatedData.current_page} of {paginatedData.total_pages}
            </span>

            <button
              disabled={currentPage >= paginatedData.total_pages}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, paginatedData.total_pages))}
              className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
