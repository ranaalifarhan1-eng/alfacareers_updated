'use client';

import React, { useEffect, useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  FileText, 
  Plus, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Sparkles,
  Award
} from 'lucide-react';

export default function ProfilePage() {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  
  const [masterCvText, setMasterCvText] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
        });

        if (resp.ok) {
          const data = await resp.json();
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setLocation(data.location || 'Lahore, Pakistan');
          setHeadline(data.headline || 'Senior Corporate Specialist');
          setBio(data.bio || '');
          setSkills(data.skills || []);
          setMasterCvText(data.master_cv_url || '');
        }
      } catch (err) {
        console.warn('Fetch profile error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSaving(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/profile`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          location,
          headline,
          bio,
          skills,
          master_cv_text: masterCvText
        })
      });

      if (!resp.ok) {
        throw new Error('Failed to update candidate profile.');
      }

      const updated = await resp.json();
      setMessage('Candidate Profile & Master CV successfully updated and indexed!');
    } catch (err: any) {
      setError(err.message || 'Error saving profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="flex items-center space-x-3 text-blue-600 font-semibold">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading Profile Editor...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl w-full mx-auto">
      {/* Header Title */}
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Master Candidate Co-Pilot Profile</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          My Profile & Master CV
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your skills, headline, and CV content for vector matching & ATS compiler engines
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* Section 1: Basic Information */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
            <User className="w-4 h-4 text-blue-600" />
            <span>1. Basic Personal Information</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Farhan Rana"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +92 300 1234567"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Current Location (City, Country)
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lahore, Pakistan"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="e.g. Senior Finance Manager | Corporate Strategy"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Professional Bio Summary
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief executive summary highlighting key career achievements..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Interactive Skills Tag Box */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
            <Award className="w-4 h-4 text-blue-600" />
            <span>2. Core Competencies & Skills</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Add key skills used by vector matching engines to calculate job match scores
          </p>

          <div className="flex items-center space-x-2 mb-4">
            <input
              type="text"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              placeholder="Add skill (e.g. Financial Modeling, Python, SAP)"
              className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
            />
            <button
              type="button"
              onClick={handleAddSkill}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Add Skill</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200/60 flex items-center space-x-1.5"
              >
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  className="hover:text-red-600 transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Section 3: Master CV Text Container */}
        <div className="glass-card p-6 rounded-2xl border border-slate-200">
          <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>3. Master CV / Experience Text Container</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Paste your raw resume text or career history. ReportLab ATS Compiler uses this text to generate tailored single-page PDF resumes.
          </p>

          <textarea
            rows={8}
            value={masterCvText}
            onChange={(e) => setMasterCvText(e.target.value)}
            placeholder="Paste raw CV text or detailed experience summary here..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 leading-relaxed"
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-semibold text-xs text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile & Index CV'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
