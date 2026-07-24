'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const bodyParams = new URLSearchParams();
    bodyParams.append('username', email);
    bodyParams.append('password', password);

    const apiEndpoints = [
      process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login` : null,
      'http://127.0.0.1:8000/api/v1/auth/login',
      'http://localhost:8000/api/v1/auth/login',
    ].filter(Boolean) as string[];

    let successData: any = null;
    let lastErrorMessage = '';

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`[AlfaCareers Auth] Attempting login at: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json'
          },
          body: bodyParams.toString(),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Invalid email or password.');
        }

        successData = data;
        break;
      } catch (err: any) {
        console.warn(`[AlfaCareers Auth] Connection to ${endpoint} failed:`, err);
        lastErrorMessage = err.message || 'Failed to fetch';
      }
    }

    setLoading(false);

    if (successData) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', successData.access_token);
        localStorage.setItem('user_id', successData.user_id);
        localStorage.setItem('user_role', successData.role);
      }
      router.push('/');
    } else {
      if (lastErrorMessage.includes('Failed to fetch') || lastErrorMessage.includes('NetworkError')) {
        setError('Cannot connect to AlfaCareers backend API (http://127.0.0.1:8000). Please ensure the FastAPI server is running.');
      } else {
        setError(lastErrorMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center py-12 px-6 bg-gradient-to-b from-blue-50/50 via-white to-slate-50">
      {/* Header Brand Link */}
      <Link href="/" className="flex items-center space-x-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-md shadow-blue-500/20 text-lg">
          AC
        </div>
        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
          AlfaCareers
        </span>
      </Link>

      {/* Main Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/50">
        <div className="text-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-3 border border-blue-200/60">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Welcome Back</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign In to AlfaCareers
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your co-pilot dashboard & application tracker
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <a href="#" className="text-[11px] font-semibold text-blue-600 hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50 mt-6"
          >
            <span>{loading ? 'Signing In...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}
