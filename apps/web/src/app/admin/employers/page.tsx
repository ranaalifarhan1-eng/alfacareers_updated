'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ShieldCheck, CheckCircle2, XCircle, Globe, Users, Search } from 'lucide-react';

interface EmployerCompany {
  id: number;
  user_id: number;
  company_name: string;
  website?: string;
  industry?: string;
  company_size?: string;
  is_verified: boolean;
  email: string;
}

export default function AdminEmployerVerificationPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<EmployerCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEmployers = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
      return;
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/admin/employers`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setCompanies(data);
      }
    } catch (err) {
      console.warn('Fetch admin employers notice:', err);
    } finally {
      setLoading(false);
    }
  };

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
        const resp = await fetch(`${backendUrl}/api/v1/admin/employers`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setCompanies(data);
        }
      } catch (err) {
        console.warn('Fetch admin employers notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleToggleVerification = async (companyId: number, currentStatus: boolean) => {
    setUpdatingId(companyId);
    const token = localStorage.getItem('access_token');
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/admin/employers/${companyId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ is_verified: !currentStatus })
      });

      if (resp.ok) {
        setCompanies((prev) =>
          prev.map((c) => (c.id === companyId ? { ...c, is_verified: !currentStatus } : c))
        );
      }
    } catch (err) {
      console.warn('Toggle verification notice:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = companies.filter((c) =>
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-white">
        <div className="flex items-center space-x-3 text-orange-400 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Employer Verification Queue...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-orange-950 text-orange-400 text-xs font-semibold mb-2 border border-orange-800">
            <Building2 className="w-3.5 h-3.5" />
            <span>Employer Account Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Employer Verification Queue ({companies.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review corporate domain emails, grant publishing rights, and govern employer access
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Employers Data Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">Company Name</th>
                <th className="p-4">Corporate Email</th>
                <th className="p-4">Industry / Size</th>
                <th className="p-4">Official Website</th>
                <th className="p-4">Verification Status</th>
                <th className="p-4 text-right">Moderation Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((comp) => (
                <tr key={comp.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-950 text-orange-400 border border-orange-800 font-black flex items-center justify-center text-xs">
                      {comp.company_name[0].toUpperCase()}
                    </div>
                    <span>{comp.company_name}</span>
                  </td>
                  <td className="p-4 text-slate-300">{comp.email}</td>
                  <td className="p-4 text-slate-400">
                    {comp.industry || 'Technology'} • {comp.company_size || '50-200'}
                  </td>
                  <td className="p-4">
                    {comp.website ? (
                      <a href={comp.website} target="_blank" rel="noreferrer" className="text-orange-400 hover:underline flex items-center space-x-1">
                        <Globe className="w-3 h-3" />
                        <span>Website</span>
                      </a>
                    ) : (
                      <span className="text-slate-500">N/A</span>
                    )}
                  </td>
                  <td className="p-4">
                    {comp.is_verified ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[10px] inline-flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Partner</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-bold text-[10px] inline-flex items-center space-x-1">
                        <XCircle className="w-3 h-3" />
                        <span>Pending Verification</span>
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      disabled={updatingId === comp.id}
                      onClick={() => handleToggleVerification(comp.id, comp.is_verified)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition shadow-xs ${
                        comp.is_verified
                          ? 'bg-red-950/60 hover:bg-red-900 text-red-400 border border-red-800'
                          : 'bg-emerald-950 hover:bg-emerald-900 text-emerald-400 border border-emerald-800'
                      }`}
                    >
                      {comp.is_verified ? 'Revoke Access' : 'Approve & Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
