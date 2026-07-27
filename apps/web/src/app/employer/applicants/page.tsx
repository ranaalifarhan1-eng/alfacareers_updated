'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Target, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  ChevronRight, 
  UserCheck, 
  UserX, 
  Calendar,
  Download
} from 'lucide-react';

interface Applicant {
  application_id: number;
  job_id: number;
  job_title: string;
  candidate_id: number;
  full_name: string;
  email: string;
  headline: string;
  location: string;
  total_experience: string;
  skills: string[];
  match_score: number;
  stage: string;  // new, shortlisted, interview, hired, rejected
  applied_at: string;
}

const STAGES = [
  { id: 'new', label: 'New Applicants', color: 'border-t-blue-500 bg-blue-50/40 text-blue-700' },
  { id: 'shortlisted', label: 'AI Shortlisted', color: 'border-t-indigo-500 bg-indigo-50/40 text-indigo-700' },
  { id: 'interview', label: 'Interview Scheduled', color: 'border-t-amber-500 bg-amber-50/40 text-amber-700' },
  { id: 'hired', label: 'Hired', color: 'border-t-emerald-500 bg-emerald-50/40 text-emerald-700' },
  { id: 'rejected', label: 'Rejected', color: 'border-t-slate-400 bg-slate-100/60 text-slate-600' },
];

export default function EmployerApplicantsKanbanPage() {
  const router = useRouter();
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/employer/applicants`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setApplicants(data);
        }
      } catch (err) {
        console.warn('Fetch applicants notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleStageChange = async (applicationId: number, newStage: string) => {
    setUpdatingId(applicationId);
    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/employer/applicants/${applicationId}/stage`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stage: newStage })
      });

      if (resp.ok) {
        setApplicants((prev) =>
          prev.map((a) => (a.application_id === applicationId ? { ...a, stage: newStage } : a))
        );
      }
    } catch (err) {
      console.warn('Update stage error:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Download ATS Resume PDF
  const handleDownloadResume = async (jobId: number, candidateName: string) => {
    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/jobs/${jobId}/compile-resume`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ATS_Resume_${candidateName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
    } catch (err) {
      console.warn('Download ATS resume notice:', err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-orange-600 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading AI Applicant Kanban Pipeline...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold mb-2 border border-indigo-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Vector Similarity Screening Kanban</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Applicant Screening Pipeline ({applicants.length})
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review candidates ranked by ChromaDB vector match scores and drag/move between recruitment stages
        </p>
      </div>

      {/* Visual Kanban Board 5 Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
        {STAGES.map((stg) => {
          const colApplicants = applicants.filter((a) => a.stage === stg.id);

          return (
            <div key={stg.id} className="glass-card rounded-2xl bg-white border border-slate-200 p-4 min-h-[500px] flex flex-col">
              {/* Column Header */}
              <div className={`p-3 rounded-xl border-t-4 mb-4 flex items-center justify-between ${stg.color}`}>
                <span className="text-xs font-extrabold">{stg.label}</span>
                <span className="px-2 py-0.5 bg-white text-slate-900 text-[11px] font-black rounded-full border border-slate-200 shadow-xs">
                  {colApplicants.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1">
                {colApplicants.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs font-medium border border-dashed border-slate-200 rounded-xl">
                    No candidates in stage
                  </div>
                ) : (
                  colApplicants.map((app) => (
                    <div
                      key={app.application_id}
                      className="p-4 bg-slate-50 hover:bg-white rounded-xl border border-slate-200 shadow-xs hover:shadow-md transition space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{app.full_name}</h4>
                          <p className="text-[11px] font-semibold text-slate-600">{app.headline}</p>
                        </div>
                        
                        {/* Match Score Badge */}
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-[10px] font-black shrink-0 flex items-center space-x-0.5">
                          <Target className="w-3 h-3 text-indigo-600" />
                          <span>{app.match_score}%</span>
                        </span>
                      </div>

                      <p className="text-[10px] text-slate-500">
                        {app.location} • <strong className="text-slate-700">{app.total_experience}</strong>
                      </p>
                      <p className="text-[10px] text-blue-600 font-semibold truncate">
                        Applied for: {app.job_title}
                      </p>

                      {/* Stage Selector Dropdown */}
                      <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between gap-1">
                        <button
                          onClick={() => handleDownloadResume(app.job_id, app.full_name)}
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-semibold flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3 text-slate-600" />
                          <span>PDF</span>
                        </button>

                        <select
                          value={app.stage}
                          disabled={updatingId === app.application_id}
                          onChange={(e) => handleStageChange(app.application_id, e.target.value)}
                          className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-orange-500"
                        >
                          <option value="new">New</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview">Interview</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
