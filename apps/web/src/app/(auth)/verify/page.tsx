'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MailCheck, ArrowRight, Sparkles, CheckCircle2, AlertCircle, RefreshCw, Terminal } from 'lucide-react';

export default function VerifyNoticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);

  useEffect(() => {
    // Focus first input box on load
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, []);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    if (value.length > 1) {
      // Handle paste of full 6-digit string
      const pasted = value.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        newOtp[i] = pasted[i] || '';
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pasted.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance focus to next digit box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const fullCode = otp.join('');
    
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const apiEndpoints = [
      process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify-code` : null,
      'http://127.0.0.1:8000/api/v1/auth/verify-code',
      'http://localhost:8000/api/v1/auth/verify-code',
    ].filter(Boolean) as string[];

    let successData: any = null;
    let lastError = '';

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email, code: fullCode }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Invalid verification code');
        }

        successData = data;
        break;
      } catch (err: any) {
        lastError = err.message || 'Failed to verify code';
      }
    }

    setLoading(false);

    if (successData) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', successData.access_token);
        localStorage.setItem('user_id', successData.user_id);
        localStorage.setItem('user_role', successData.role);
      }
      setSuccessMessage('Account verified! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } else {
      setError(lastError);
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setError('Missing email address. Please return to signup.');
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setResending(true);

    const apiEndpoints = [
      process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/resend-code` : null,
      'http://127.0.0.1:8000/api/v1/auth/resend-code',
      'http://localhost:8000/api/v1/auth/resend-code',
    ].filter(Boolean) as string[];

    let success = false;
    let lastError = '';

    for (const endpoint of apiEndpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Failed to resend code');
        }

        setSuccessMessage(data.message || 'A new 6-digit code has been dispatched.');
        if (data.dev_otp) {
          setDevOtp(data.dev_otp);
        }
        success = true;
        break;
      } catch (err: any) {
        lastError = err.message || 'Failed to resend code';
      }
    }

    setResending(false);

    if (!success) {
      setError(lastError);
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

      {/* Confirmation Glassmorphism Card */}
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 p-8 shadow-xl shadow-slate-200/50 text-center">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-200/60 shadow-inner">
          <MailCheck className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-2">
          Verify Email Address
        </h1>

        <p className="text-xs text-slate-600 leading-relaxed mb-6">
          Enter the 6-digit verification code sent to <br />
          <strong className="text-slate-900 font-semibold">{email || 'your email'}</strong>
        </p>

        {/* Local Dev Helper Notification */}
        <div className="mb-4 p-2.5 bg-blue-50/80 border border-blue-200 text-blue-800 rounded-xl text-left text-xs flex items-start space-x-2">
          <Terminal className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Local Dev Note:</span> Check your backend terminal log to view the generated 6-digit OTP code in real-time.
            {devOtp && (
              <p className="mt-1 font-mono font-bold text-blue-900 bg-blue-100/80 px-2 py-1 rounded inline-block">
                Resent Code: {devOtp}
              </p>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2 text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* 6-Digit OTP Boxes */}
        <form onSubmit={handleVerifySubmit} className="space-y-6">
          <div className="flex items-center justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 text-center text-xl font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-sm text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <span>{loading ? 'Verifying Code...' : 'Verify & Continue'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleResendCode}
            disabled={resending}
            className="font-semibold text-blue-600 hover:underline flex items-center space-x-1 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
            <span>{resending ? 'Sending...' : 'Resend 6-Digit Code'}</span>
          </button>

          <Link href="/login" className="hover:text-slate-900">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
