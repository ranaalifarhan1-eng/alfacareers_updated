'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Target, 
  User, 
  Briefcase, 
  Settings, 
  LogOut, 
  Sparkles, 
  ChevronRight, 
  Menu, 
  X
} from 'lucide-react';

interface UserData {
  id: number;
  email: string;
  role: string;
  full_name?: string;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuthAndFetchUser = async () => {
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
          // Token is invalid or expired
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
          setUser(data);
        }
      } catch (err) {
        // Do NOT clear localStorage or redirect on network errors
        console.warn('[Dashboard Guard] Network check notice:', err);
      } finally {
        if (isMounted) setIsCheckingAuth(false);
      }
    };

    checkAuthAndFetchUser();

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
    { label: 'Matched Hidden Jobs', href: '/dashboard', icon: Target },
    { label: 'My Profile & CV', href: '/dashboard/profile', icon: User },
    { label: 'Application History', href: '/dashboard/applications', icon: Briefcase },
    { label: 'Account Settings', href: '/dashboard/settings', icon: Settings },
  ];

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold text-xs">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Verifying Session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Mobile Sidebar Overlay Toggle */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-md text-slate-700 hover:text-blue-600"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Corporate Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 border-b border-slate-100 flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-blue-500/20 text-base">
                AC
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                  AlfaCareers
                </span>
                <span className="text-[9px] font-semibold tracking-wider text-blue-600 uppercase mt-0.5">
                  Co-Pilot Dashboard
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
                      ? 'bg-blue-50 text-blue-700 border border-blue-200/60 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-600" />}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 mb-3 flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
              {user?.full_name ? user.full_name[0].toUpperCase() : 'C'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {user?.full_name || 'Candidate User'}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{user?.email || 'Logged In'}</p>
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
      <div className="flex-1 min-w-0 flex flex-col">
        {children}
      </div>
    </div>
  );
}
