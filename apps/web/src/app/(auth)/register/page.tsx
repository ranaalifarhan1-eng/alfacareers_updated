'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, UserCheck, Building2, Lock, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<'candidate' | 'employer'>('candidate');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const payload = {
      email,
      password,
      role,
      full_name: role === 'candidate' ? fullName : undefined,
      company_name: role === 'employer' ? companyName : undefined,
    };

    // Support both 127.0.0.1 and localhost for Windows DNS compatibility
    const apiEndpoints = [
      process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register` : null,
      'http://127.0.0.1:8000/api/v1/auth/register',
      'http://localhost:8000/api/v1/auth/register',
    ].filter(Boolean) as string[];

    let success = false;
    let lastErrorMessage = '';

    for (const endpoint of apiEndpoints) {
      try {
        console.log(`[AlfaCareers Auth] Attempting registration at: ${endpoint}`);
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Registration failed. Please check your inputs.');
        }

        success = true;
        break;
      } catch (err: any) {
        console.warn(`[AlfaCareers Auth] Connection to ${endpoint} failed:`, err);
        lastErrorMessage = err.message || 'Failed to fetch';
      }
    }

    setLoading(false);

    if (success) {
      router.push(`/verify?email=${encodeURIComponent(email)}`);
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
            <span>Join The Hidden Job Engine</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Your Account
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access un-syndicated corporate roles & AI vector matching
          </p>
        </div>

        {/* Account Role Selector */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100/80 rounded-xl mb-6 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setRole('candidate')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold rounded-lg transition ${
              role === 'candidate'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Job Seeker</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('employer')}
            className={`flex items-center justify-center space-x-2 py-2 px-3 text-xs font-semibold rounded-lg transition ${
              role === 'employer'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Employer</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Role specific input */}
          {role === 'candidate' ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Farhan Rana"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. TechCorp Enterprise"
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                />
              </div>
            </div>
          )}

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
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
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
            <span>{loading ? 'Creating Account...' : 'Get Started Free'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
