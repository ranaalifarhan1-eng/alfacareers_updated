'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MailCheck, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';

export default function VerifyNoticePage() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email address';

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

      {/* Confirmation Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/50 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200/60 shadow-inner">
          <MailCheck className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Check Your Inbox
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          We've sent a welcome email to <strong className="text-slate-900 font-semibold">{email}</strong> via Brevo SMTP.
        </p>

        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-left text-xs text-slate-600 mb-6 space-y-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Account created successfully</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Role-specific profile initialized</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>Deep Web Hunter access granted</span>
          </div>
        </div>

        <Link
          href="/login"
          className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2"
        >
          <span>Proceed to Sign In</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
