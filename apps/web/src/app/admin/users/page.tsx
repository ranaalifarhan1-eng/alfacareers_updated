'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, ShieldCheck, CheckCircle2, UserCheck, Shield } from 'lucide-react';

interface AdminUser {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  full_name_or_company: string;
  created_at: string;
}

export default function AdminUserManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) {
        router.push('/login');
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/admin/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok && isMounted) {
          const data = await resp.json();
          setUsers(data);
        }
      } catch (err) {
        console.warn('Fetch admin users notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const filtered = users.filter((u) =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.full_name_or_company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px] text-white">
        <div className="flex items-center space-x-3 text-orange-400 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading User Governance Directory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl w-full mx-auto space-y-8 text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950 text-blue-400 text-xs font-semibold mb-2 border border-blue-800">
            <Users className="w-3.5 h-3.5" />
            <span>Platform User Directory</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            User Governance Directory ({users.length})
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Govern candidate and employer credentials, active sessions, and multi-tenant portal permissions
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, name, or role..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* User Data Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
              <tr>
                <th className="p-4">User Display Name</th>
                <th className="p-4">Account Email</th>
                <th className="p-4">Platform Role</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Account Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-bold text-white flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 text-slate-300 font-bold flex items-center justify-center text-xs">
                      {u.full_name_or_company[0].toUpperCase()}
                    </div>
                    <span>{u.full_name_or_company}</span>
                  </td>
                  <td className="p-4 text-slate-300">{u.email}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      u.role === 'super_admin' || u.role === 'admin'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : u.role === 'employer'
                        ? 'bg-orange-950 text-orange-400 border border-orange-800'
                        : 'bg-blue-950 text-blue-400 border border-blue-800'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4 text-slate-400">{u.created_at}</td>
                  <td className="p-4">
                    {u.is_verified ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-semibold text-[10px]">
                        Verified Active
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800 font-semibold text-[10px]">
                        Unverified
                      </span>
                    )}
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
