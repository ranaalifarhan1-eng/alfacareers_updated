'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Building2, 
  Briefcase, 
  LogOut, 
  ChevronRight, 
  Menu, 
  X,
  LayoutDashboard,
  Lock,
  Activity
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAdminAuth = async () => {
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
          // Route guard: Only allow super_admin or admin
          if (data.role !== 'super_admin' && data.role !== 'admin') {
            router.push('/dashboard');
            return;
          }
          setUser(data);
        }
      } catch (err) {
        console.warn('[Admin Guard] Network notice:', err);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    checkAdminAuth();

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
    { label: 'Platform Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'User Governance', href: '/admin/users', icon: Users },
    { label: 'Employer Approvals', href: '/admin/employers', icon: Building2 },
    { label: 'Job Moderation Queue', href: '/admin/jobs', icon: Briefcase },
    { label: 'System Health & Diagnostics', href: '/admin/system', icon: Activity },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center space-x-3 text-orange-400 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Platform Super Admin Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Dark Navy Top Information Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-6 border-b border-slate-800 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2 py-0.5 rounded bg-red-600 text-white font-bold text-[10px] uppercase">
              Super Admin Console
            </span>
            <span className="hidden sm:inline text-slate-300">
              Platform Governance, Job Moderation & Vector Index Control
            </span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="text-slate-400 font-medium">Administrator: <strong className="text-white">{user?.email}</strong></span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 min-w-0">
        {/* Mobile Sidebar Overlay Toggle */}
        <div className="lg:hidden fixed top-12 left-4 z-50">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl shadow-md text-slate-300 hover:text-white"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Left Enterprise Governance Sidebar */}
        <aside
          className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <div>
            {/* Brand Header */}
            <div className="h-16 px-6 border-b border-slate-800 flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-orange-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-red-500/20 text-base">
                  AC
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-extrabold text-white tracking-tight leading-none">
                    AlfaCareers
                  </span>
                  <span className="text-[9px] font-semibold tracking-wider text-red-500 uppercase mt-0.5">
                    Admin Control Center
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
                        ? 'bg-slate-800 text-orange-400 border border-slate-700 shadow-sm'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-orange-400" />}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Admin Footer Card */}
          <div className="p-4 border-t border-slate-800">
            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 mb-3 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-bold flex items-center justify-center text-xs">
                A
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Super Admin</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full py-2 px-3 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-xl transition flex items-center justify-center space-x-2 border border-red-900/40"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col bg-slate-950">
          {children}
        </div>
      </div>
    </div>
  );
}
