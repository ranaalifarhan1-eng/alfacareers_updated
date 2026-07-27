'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Building2, 
  PlusCircle, 
  Briefcase, 
  Users, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  LayoutDashboard,
  ShieldCheck
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  role: string;
  company_name?: string;
}

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkEmployerAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      if (!token) {
        if (isMounted) {
          setIsCheckingAuth(false);
          router.push('/login');
        }
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/auth/me`, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Accept': 'application/json' 
          }
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
          // Route guard: Only allow employer or super_admin/admin
          if (data.role !== 'employer' && data.role !== 'super_admin' && data.role !== 'admin') {
            router.push('/dashboard');
            return;
          }
          setUser(data);
        }
      } catch (err) {
        console.warn('[Employer Guard] Network notice:', err);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    checkEmployerAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_role');
    }
    router.push('/login');
  };

  const navItems = [
    { label: 'Employer Dashboard', href: '/employer', icon: LayoutDashboard },
    { label: 'Company Profile', href: '/employer/company', icon: Building2 },
    { label: 'Post New Job', href: '/employer/jobs/new', icon: PlusCircle },
    { label: 'Active Job Posts', href: '/employer/jobs', icon: Briefcase },
    { label: 'Applicant Pipeline', href: '/employer/applicants', icon: Users },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex items-center space-x-3 text-orange-600 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Employer Portal Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* Dark Navy Top Information Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-6 border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-orange-600 text-white font-bold text-[10px] uppercase">
              Employer Enterprise Portal
            </span>
            <span className="hidden sm:inline text-slate-300">
              AI Candidate Ranking & Vector Resume Viewer Active
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-slate-400 font-medium">Enterprise Account: <strong className="text-white">{user?.company_name || user?.email}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-w-0">
        {/* Mobile Sidebar Overlay Toggle */}
        <div className="lg:hidden fixed top-12 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-md text-slate-700 hover:text-orange-600"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Left Corporate Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div>
            {/* Brand Header */}
            <div className="h-16 px-6 border-b border-slate-100 flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center font-extrabold text-white shadow-md shadow-orange-500/20 text-base">
                  AC
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                    AlfaCareers
                  </span>
                  <span className="text-[9px] font-semibold tracking-wider text-orange-600 uppercase mt-0.5">
                    Employer Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                      isActive
                        ? 'bg-orange-50 text-orange-700 border border-orange-200 shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-600' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-600" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User Footer Card */}
          <div className="p-4 border-t border-slate-100">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 mb-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                {user?.company_name ? user.company_name[0].toUpperCase() : 'E'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {user?.company_name || 'Enterprise Employer'}
                </p>
                <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition flex items-center justify-center space-x-2 border border-red-200/60"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-[#F8FAFC]">
          {children}
        </div>
      </div>
    </div>
  );
}
