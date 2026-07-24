'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  Award,
  Upload,
  Building2,
  Calendar,
  Trash2,
  RefreshCw,
  GraduationCap,
  FolderOpen,
  ArrowRight,
  Check,
  Target,
  Clock,
  DollarSign
} from 'lucide-react';

interface WorkExperience {
  company: string;
  job_title: string;
  location?: string;
  start_month?: string;
  start_year?: string;
  end_month?: string;
  end_year?: string;
  is_current?: boolean;
  description?: string;
  start_date?: string;
  end_date?: string;
}

interface EducationItem {
  degree: string;
  institution: string;
  graduation_year?: string;
}

interface UploadedCV {
  id: number;
  filename: string;
  file_url?: string;
  parsed_json: any;
  is_primary: boolean;
  created_at: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 25 }, (_, i) => String(2026 - i));

type TabType = 'gallery' | 'personal' | 'experience' | 'skills_edu' | 'preferences';

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Tab State
  const [activeTab, setActiveTab] = useState<TabType>('gallery');

  // Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  const [experiences, setExperiences] = useState<WorkExperience[]>([]);
  const [educations, setEducations] = useState<EducationItem[]>([]);
  const [uploadedCvs, setUploadedCvs] = useState<UploadedCV[]>([]);

  // Section 5: Job Preferences & Career Goals States
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [targetRoleInput, setTargetRoleInput] = useState('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [prefLocationInput, setPrefLocationInput] = useState('');
  const [jobType, setJobType] = useState('Full-Time');
  const [noticePeriod, setNoticePeriod] = useState('Immediate');
  const [expectedSalary, setExpectedSalary] = useState('Negotiable');
  
  const [masterCvText, setMasterCvText] = useState('');

  // Status States
  const [loading, setLoading] = useState(true);
  const [parsingCv, setParsingCv] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Upload Confirmation Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingUploadData, setPendingUploadData] = useState<{
    cv_id: number;
    filename: string;
    parsed_data: any;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    // Failsafe timer: Force unhide spinner after 2.5 seconds no matter what
    const failsafeTimer = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 2500);

    const initProfile = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
      
      if (!token) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
        }
        router.push('/login');
        if (isMounted) setLoading(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

      try {
        const resp = await fetch(`${backendUrl}/api/v1/auth/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Accept': 'application/json' 
          }
        });

        if (resp.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
          }
          router.push('/login');
          return;
        }

        if (resp.ok && isMounted) {
          const data = await resp.json();
          setFullName(data.full_name || '');
          setPhone(data.phone || '');
          setLocation(data.location || 'Lahore, Pakistan');
          setHeadline(data.headline || 'Senior Corporate Specialist');
          setBio(data.bio || '');
          setSkills(Array.isArray(data.skills) ? data.skills : []);
          setExperiences(Array.isArray(data.experience) ? data.experience : []);
          setEducations(Array.isArray(data.education) ? data.education : []);
          setTargetRoles(Array.isArray(data.target_roles) ? data.target_roles : ['Performance Marketing Manager', 'Digital Marketer']);
          setPreferredLocations(Array.isArray(data.preferred_locations) ? data.preferred_locations : ['Dubai, UAE', 'Lahore, Pakistan', 'Remote']);
          setJobType(data.job_type || 'Full-Time');
          setNoticePeriod(data.notice_period || 'Immediate');
          setExpectedSalary(data.expected_salary || 'Negotiable');
          setMasterCvText(data.master_cv_url || '');
          setUploadedCvs(Array.isArray(data.uploaded_cvs) ? data.uploaded_cvs : []);
        }
      } catch (err) {
        console.warn('Fetch profile error:', err);
      } finally {
        if (isMounted) {
          clearTimeout(failsafeTimer);
          setLoading(false);
        }
      }
    };

    initProfile();

    return () => {
      isMounted = false;
      clearTimeout(failsafeTimer);
    };
  }, [router]);

  const fetchProfileSilent = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' }
      });
      if (resp.ok) {
        const data = await resp.json();
        setUploadedCvs(Array.isArray(data.uploaded_cvs) ? data.uploaded_cvs : []);
      }
    } catch (err) {
      console.warn('Silent refresh profile error:', err);
    }
  };

  // Handle CV Upload
  const handleCvFileUpload = async (file: File) => {
    if (!file) return;

    setError(null);
    setMessage(null);
    setParsingCv(true);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/profile/upload-cv`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (!resp.ok) {
        throw new Error('Failed to parse uploaded CV file.');
      }

      const uploadResult = await resp.json();
      
      // Open Upload Confirmation Modal
      setPendingUploadData(uploadResult);
      setModalOpen(true);

      // Refresh list of saved CVs
      fetchProfileSilent();
    } catch (err: any) {
      setError(err.message || 'Error uploading CV.');
    } finally {
      setParsingCv(false);
    }
  };

  // Confirm Auto-Fill Profile from Modal
  const handleApplyCvParsed = async (cvId: number) => {
    setModalOpen(false);
    setError(null);
    setMessage(null);

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/profile/apply-cv-parsed`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ cv_id: cvId })
      });

      if (!resp.ok) {
        throw new Error('Failed to apply CV data to profile.');
      }

      const updated = await resp.json();
      setFullName(updated.full_name || '');
      setPhone(updated.phone || '');
      setLocation(updated.location || '');
      setHeadline(updated.headline || '');
      setBio(updated.bio || '');
      setSkills(Array.isArray(updated.skills) ? updated.skills : []);
      setExperiences(Array.isArray(updated.experience) ? updated.experience : []);
      setEducations(Array.isArray(updated.education) ? updated.education : []);
      setTargetRoles(Array.isArray(updated.target_roles) ? updated.target_roles : []);
      setPreferredLocations(Array.isArray(updated.preferred_locations) ? updated.preferred_locations : []);
      setJobType(updated.job_type || 'Full-Time');
      setNoticePeriod(updated.notice_period || 'Immediate');
      setExpectedSalary(updated.expected_salary || 'Negotiable');
      setMasterCvText(updated.master_cv_url || '');

      setMessage('Profile fields successfully auto-filled from uploaded CV!');
    } catch (err: any) {
      setError(err.message || 'Error applying CV data.');
    }
  };

  // Delete Saved CV
  const handleDeleteCv = async (cvId: number) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

    try {
      const resp = await fetch(`${backendUrl}/api/v1/auth/profile/cvs/${cvId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (resp.ok) {
        setUploadedCvs(uploadedCvs.filter(c => c.id !== cvId));
        setMessage('CV file successfully removed from gallery.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete CV.');
    }
  };

  // Skills Manager Handlers
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

  // Target Roles Handlers
  const handleAddTargetRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRoleInput.trim() && !targetRoles.includes(targetRoleInput.trim())) {
      setTargetRoles([...targetRoles, targetRoleInput.trim()]);
      setTargetRoleInput('');
    }
  };

  const handleRemoveTargetRole = (roleToRemove: string) => {
    setTargetRoles(targetRoles.filter(r => r !== roleToRemove));
  };

  // Preferred Locations Handlers
  const handleAddPrefLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (prefLocationInput.trim() && !preferredLocations.includes(prefLocationInput.trim())) {
      setPreferredLocations([...preferredLocations, prefLocationInput.trim()]);
      setPrefLocationInput('');
    }
  };

  const handleRemovePrefLocation = (locToRemove: string) => {
    setPreferredLocations(preferredLocations.filter(l => l !== locToRemove));
  };

  // Work Experience Handlers
  const handleAddExperience = () => {
    setExperiences([
      ...experiences,
      {
        company: 'Enterprise Company',
        job_title: 'Senior Specialist',
        location: 'Lahore, Pakistan',
        start_month: 'Jan',
        start_year: '2023',
        end_month: '',
        end_year: '',
        is_current: true,
        description: 'Key deliverables and performance operations...'
      }
    ]);
  };

  const handleUpdateExperience = (index: number, field: keyof WorkExperience, value: any) => {
    const updated = [...experiences];
    updated[index] = { ...updated[index], [field]: value };
    setExperiences(updated);
  };

  const handleRemoveExperience = (index: number) => {
    setExperiences(experiences.filter((_, i) => i !== index));
  };

  // Education Handlers
  const handleAddEducation = () => {
    setEducations([
      ...educations,
      { degree: 'Bachelor of Science', institution: 'University', graduation_year: '2020' }
    ]);
  };

  const handleUpdateEducation = (index: number, field: keyof EducationItem, value: any) => {
    const updated = [...educations];
    updated[index] = { ...updated[index], [field]: value };
    setEducations(updated);
  };

  const handleRemoveEducation = (index: number) => {
    setEducations(educations.filter((_, i) => i !== index));
  };

  // Save Profile Handler
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
          experience: experiences,
          education: educations,
          target_roles: targetRoles,
          preferred_locations: preferredLocations,
          job_type: jobType,
          notice_period: noticePeriod,
          expected_salary: expectedSalary,
          master_cv_text: masterCvText
        })
      });

      if (!resp.ok) {
        throw new Error('Failed to update candidate profile.');
      }

      await resp.json();
      setMessage('Candidate Profile & Job Preferences successfully updated and indexed!');
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
    <div className="p-8 max-w-5xl w-full mx-auto space-y-6">
      {/* Header Title */}
      <div>
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2 border border-blue-200">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multi-CV Manager & Precision AI Job Matching Engine</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          My Profile & Career Hub
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage layout-parsed CVs, career history, core competencies, and job preferences in compact tabs
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center space-x-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Sticky Horizontal Tab Bar Navigation */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md py-2 border-b border-slate-200">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTab('gallery')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'gallery'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FolderOpen className="w-4 h-4" />
            <span>CV Gallery & Upload ({uploadedCvs.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('personal')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'personal'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Personal Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('experience')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'experience'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Work Experience ({experiences.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('skills_edu')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'skills_edu'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Skills & Education ({skills.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 shrink-0 ${
              activeTab === 'preferences'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Job Preferences</span>
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSaveProfile} className="space-y-6">

        {/* TAB 1: CV Gallery & Upload */}
        {activeTab === 'gallery' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Drag & Drop CV Upload Box */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="glass-card p-8 rounded-3xl border-2 border-dashed border-blue-300 bg-gradient-to-r from-blue-50/50 via-white to-slate-50 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition relative overflow-hidden shadow-sm"
            >
              <input 
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleCvFileUpload(e.target.files[0]);
                  }
                }}
              />

              {parsingCv ? (
                <div className="flex flex-col items-center justify-center py-4">
                  <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mb-3" />
                  <p className="text-sm font-bold text-slate-900">AI is reading layout & structuring your CV...</p>
                  <p className="text-xs text-slate-500 mt-1">Using pdfplumber layout-aware parser & Ollama Llama 3.1</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-3 shadow-inner">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900">
                    Drag & Drop multi-column CV or <span className="text-blue-600 underline">Browse File</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports PDF (pdfplumber 2-column layout), DOCX, or TXT • Choose to auto-fill or save
                  </p>
                </div>
              )}
            </div>

            {/* Saved CVs Gallery Cards */}
            {uploadedCvs.length > 0 ? (
              <div className="glass-card p-6 rounded-2xl border border-slate-200">
                <div className="flex items-center space-x-2 mb-4">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Saved CVs Gallery ({uploadedCvs.length})
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {uploadedCvs.map((cv) => (
                    <div key={cv.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between hover:border-blue-300 transition">
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <h4 className="text-xs font-bold text-slate-900 truncate" title={cv.filename}>
                            {cv.filename}
                          </h4>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          Uploaded: {new Date(cv.created_at).toLocaleDateString()}
                        </p>

                        {cv.parsed_json && (
                          <div className="mt-2 text-[10px] text-slate-600 space-y-0.5">
                            <p><strong>Parsed Name:</strong> {cv.parsed_json.full_name || 'Candidate'}</p>
                            <p><strong>Skills:</strong> {cv.parsed_json.skills?.length || 0} skills</p>
                            <p><strong>Jobs:</strong> {cv.parsed_json.experience?.length || 0} positions</p>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplyCvParsed(cv.id)}
                          className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] rounded-lg transition flex items-center justify-center space-x-1"
                        >
                          <Check className="w-3 h-3" />
                          <span>Apply to Profile</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCv(cv.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="glass-card p-8 rounded-2xl border border-slate-200 text-center">
                <p className="text-xs text-slate-400">No saved CV files in gallery yet. Upload your CV above!</p>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Personal Details */}
        {activeTab === 'personal' && (
          <div className="glass-card p-6 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
              <User className="w-4 h-4 text-blue-600" />
              <span>Personal & Contact Information</span>
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
                  placeholder="e.g. Google Ads ROI Specialist | Performance Marketing Expert"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Professional Bio Summary
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Brief executive summary highlighting key career achievements..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Work Experience */}
        {activeTab === 'experience' && (
          <div className="glass-card p-6 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Work Experience History ({experiences.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Structured career history with Month/Year selectors used by ReportLab ATS Resume Compiler
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddExperience}
                className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Position</span>
              </button>
            </div>

            {experiences.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                No work experience added yet. Click "Add Position" or upload your CV in the CV Gallery tab.
              </p>
            ) : (
              <div className="space-y-4">
                {experiences.map((exp, idx) => (
                  <div key={idx} className="p-5 bg-slate-50/80 rounded-xl border border-slate-200 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveExperience(idx)}
                      className="absolute top-4 right-4 text-slate-400 hover:text-red-600 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pr-8">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Job Title
                        </label>
                        <input
                          type="text"
                          value={exp.job_title}
                          onChange={(e) => handleUpdateExperience(idx, 'job_title', e.target.value)}
                          placeholder="e.g. Performance Marketing Manager"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Company Name
                        </label>
                        <input
                          type="text"
                          value={exp.company}
                          onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                          placeholder="e.g. Seven States Global Visa Services - Dubai"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Location
                        </label>
                        <input
                          type="text"
                          value={exp.location || ''}
                          onChange={(e) => handleUpdateExperience(idx, 'location', e.target.value)}
                          placeholder="e.g. Dubai, UAE or Lahore, Pakistan"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                        />
                      </div>
                    </div>

                    {/* Standardized Month/Year Date Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200/60">
                      {/* Start Date */}
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          Start Date (Month & Year)
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={exp.start_month || 'Jan'}
                            onChange={(e) => handleUpdateExperience(idx, 'start_month', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                          >
                            {MONTHS.map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                          <select
                            value={exp.start_year || '2023'}
                            onChange={(e) => handleUpdateExperience(idx, 'start_year', e.target.value)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                          >
                            {YEARS.map(y => (
                              <option key={y} value={y}>{y}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* End Date or Current Checkbox */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-[11px] font-semibold text-slate-600">
                            End Date
                          </label>
                          <label className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-blue-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!exp.is_current}
                              onChange={(e) => handleUpdateExperience(idx, 'is_current', e.target.checked)}
                              className="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span>I currently work here</span>
                          </label>
                        </div>

                        {exp.is_current ? (
                          <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 font-semibold text-xs rounded-lg border border-emerald-200/80 flex items-center space-x-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Present Position (Active)</span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={exp.end_month || 'Dec'}
                              onChange={(e) => handleUpdateExperience(idx, 'end_month', e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                            >
                              {MONTHS.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                            <select
                              value={exp.end_year || '2026'}
                              onChange={(e) => handleUpdateExperience(idx, 'end_year', e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                            >
                              {YEARS.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Key Deliverables & Responsibilities
                      </label>
                      <textarea
                        rows={2}
                        value={exp.description || ''}
                        onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                        placeholder="Bullet points or summary of accomplishments..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Skills & Education */}
        {activeTab === 'skills_edu' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Skills Tag Box */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center space-x-2">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Core Competencies & Industry Skills ({skills.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Clean 1-3 word skill tags used by vector engines to calculate job match scores
              </p>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  placeholder="Add skill (e.g. Google Ads, Meta Ads, GA4, GTM)"
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

            {/* Education History Manager */}
            <div className="glass-card p-6 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <span>Education History ({educations.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Academic degrees and certifications</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddEducation}
                  className="px-3.5 py-2 bg-blue-50 text-blue-700 border border-blue-200/80 hover:bg-blue-100 rounded-xl text-xs font-semibold transition flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Degree</span>
                </button>
              </div>

              {educations.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center border border-dashed border-slate-200 rounded-xl">
                  No education history added yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {educations.map((edu, idx) => (
                    <div key={idx} className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
                        <input
                          type="text"
                          value={edu.degree}
                          onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                          placeholder="Degree (e.g. ADP (CS))"
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                        />
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdateEducation(idx, 'institution', e.target.value)}
                          placeholder="University / Board Name"
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                        />
                        <input
                          type="text"
                          value={edu.graduation_year || ''}
                          onChange={(e) => handleUpdateEducation(idx, 'graduation_year', e.target.value)}
                          placeholder="Year (e.g. 2022)"
                          className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-900"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(idx)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: Job Preferences & Career Goals */}
        {activeTab === 'preferences' && (
          <div className="glass-card p-6 rounded-2xl border border-slate-200 animate-in fade-in duration-200">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-blue-600" />
                <span>Job Preferences & Career Goals</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Precision AI job matching criteria used to rank hidden jobs and automated applications
              </p>
            </div>

            <div className="space-y-6">
              {/* Target Job Titles Tag Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Job Titles ({targetRoles.length})
                </label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    placeholder="Add target role (e.g. Performance Marketing Manager, Google Ads Specialist)"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddTargetRole}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Role</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {targetRoles.map((role) => (
                    <span
                      key={role}
                      className="px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-200/60 flex items-center space-x-1.5"
                    >
                      <span>{role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTargetRole(role)}
                        className="hover:text-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Preferred Locations Tag Manager */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Preferred Locations ({preferredLocations.length})
                </label>
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="text"
                    value={prefLocationInput}
                    onChange={(e) => setPrefLocationInput(e.target.value)}
                    placeholder="Add target location (e.g. Dubai, UAE, Lahore, Pakistan, Remote)"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddPrefLocation}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 font-semibold text-xs text-white rounded-xl shadow-md transition flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Location</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {preferredLocations.map((loc) => (
                    <span
                      key={loc}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/60 flex items-center space-x-1.5"
                    >
                      <span>{loc}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrefLocation(loc)}
                        className="hover:text-red-600 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Selectors Grid: Job Type, Notice Period, Expected Salary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Job Type Preference
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Full-Time">Full-Time</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Remote Only">Remote Only</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Notice Period
                  </label>
                  <select
                    value={noticePeriod}
                    onChange={(e) => setNoticePeriod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  >
                    <option value="Immediate">Immediate / Available Now</option>
                    <option value="15 Days">15 Days</option>
                    <option value="1 Month">1 Month</option>
                    <option value="2 Months">2 Months</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expected Salary Range
                  </label>
                  <input
                    type="text"
                    value={expectedSalary}
                    onChange={(e) => setExpectedSalary(e.target.value)}
                    placeholder="e.g. AED 10,000 - 15,000 / month"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Bottom Action Bar */}
        <div className="sticky bottom-4 z-40 bg-white/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-xl flex items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="hidden sm:inline">Profile entries indexed & ready for vector matching</span>
            <span className="sm:hidden font-semibold">Ready</span>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-bold text-xs text-white rounded-xl shadow-lg shadow-blue-500/20 transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Profile...' : 'Save Profile & Index CV'}</span>
          </button>
        </div>
      </form>

      {/* Upload Confirmation Modal */}
      {modalOpen && pendingUploadData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full border border-slate-200 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base">
                <CheckCircle2 className="w-5 h-5" />
                <span>CV Uploaded Successfully!</span>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Your file <strong className="text-slate-900">{pendingUploadData.filename}</strong> has been layout-parsed via pdfplumber and saved to your CV Gallery.
            </p>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <p><strong>Candidate Name:</strong> {pendingUploadData.parsed_data?.full_name || 'N/A'}</p>
              <p><strong>Headline:</strong> {pendingUploadData.parsed_data?.headline || 'N/A'}</p>
              <p><strong>Skills Extracted:</strong> {pendingUploadData.parsed_data?.skills?.length || 0} skills</p>
              <p><strong>Experience Entries:</strong> {pendingUploadData.parsed_data?.experience?.length || 0} positions</p>
              <p><strong>Target Roles:</strong> {pendingUploadData.parsed_data?.target_roles?.join(', ') || 'N/A'}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleApplyCvParsed(pendingUploadData.cv_id)}
                className="w-full sm:w-auto flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Auto-Fill Profile Fields</span>
              </button>

              <button
                onClick={() => setModalOpen(false)}
                className="w-full sm:w-auto py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Keep Current & Just Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
