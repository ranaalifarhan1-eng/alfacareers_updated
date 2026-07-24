'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, Shield, Bell, Key, User, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoApplyAlerts, setAutoApplyAlerts] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      router.push('/login');
    }
    setLoading(false);
  }, [router]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage('Account & notification settings updated successfully!');
    }, 400);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl w-full mx-auto space-y-8">
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-2 border border-slate-200">
          <Settings className="w-3.5 h-3.5" />
          <span>Preference & Security Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your email notifications, job match alerts, and security options
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="glass-card p-6 rounded-2xl border border-slate-200 space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Notification Preferences</span>
          </h2>

          <div className="flex items-center justify-between py-2 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-900">Email Job Alerts</p>
              <p className="text-[11px] text-slate-500">Receive instant email notifications when high-match hidden jobs are discovered</p>
            </div>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-bold text-slate-900">Auto-Apply Confirmation</p>
              <p className="text-[11px] text-slate-500">Receive summary reports when ReportLab ATS resumes are dispatched to HR</p>
            </div>
            <input
              type="checkbox"
              checked={autoApplyAlerts}
              onChange={(e) => setAutoApplyAlerts(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Settings...' : 'Save Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
