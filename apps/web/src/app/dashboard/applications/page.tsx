'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, CheckCircle2, Clock, Send, Sparkles, Building2 } from 'lucide-react';

interface ApplicationItem {
  id: number;
  candidate_id: number;
  job_id: number;
  status: string;
  match_score: number;
  track_type: string;
  applied_at: string;
  job_title?: string;
  company_name?: string;
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const failsafe = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    const fetchApplications = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        if (isMounted) {
          setLoading(false);
          router.push('/login');
        }
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/applications`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('user_id');
            localStorage.removeItem('user_role');
          }
          if (isMounted) router.push('/login');
          return;
        }
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setApplications(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.warn('Fetch applications notice:', err);
      } finally {
        if (isMounted) {
          clearTimeout(failsafe);
          setLoading(false);
        }
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
    };
  }, [router]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Application History...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Auto-Pilot Application Tracker</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Application History ({applications.length})
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Track roles auto-applied via HR email dispatch and career portals
        </p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Briefcase className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-600 text-sm font-semibold">No applications submitted yet.</p>
          <p className="text-xs text-slate-400 mt-1">Browse hidden jobs on your dashboard and click Auto-Apply Now.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="glass-card p-6 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start space-x-4">
                <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-base shrink-0 shadow-md">
                  {app.company_name ? app.company_name.slice(0, 2).toUpperCase() : 'AP'}
                </div>
                <div>
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <h3 className="text-base font-bold text-slate-900">{app.job_title || 'Corporate Role'}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{app.status.toUpperCase()}</span>
                    </span>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-full">
                      Track: {app.track_type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-600 mt-1">
                    {app.company_name || 'Enterprise Employer'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>Applied on: {new Date(app.applied_at).toLocaleDateString()}</span>
                  </p>
                </div>
              </div>

              <div className="text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className="text-[11px] font-semibold text-slate-500 block">Match Score</span>
                <span className="text-xl font-black text-blue-600">{app.match_score}%</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
